from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from analyzer import analyze_code_with_gemini
import os
import requests
import google.generativeai as genai

# Load environment variables
load_dotenv(dotenv_path='app.env')

# API Keys and Config
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
VOICE_ID = os.getenv("VOICE_ID")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

app = Flask(__name__)
CORS(app)

def get_file_mime_type(file_path):
    """Get MIME type based on file signature"""
    with open(file_path, 'rb') as f:
        header = f.read(12)
    
    # Check for WebM (starts with \x1aE\xdf\xa3)
    if len(header) >= 4 and header[0:4] == b'\x1aE\xdf\xa3':
        return 'audio/webm'
    # Check for WAV (starts with 'RIFF' and has 'WAVE' at offset 8)
    elif len(header) >= 12 and header.startswith(b'RIFF') and header[8:12] == b'WAVE':
        return 'audio/wav'
    # Check for Ogg (starts with 'OggS')
    elif len(header) >= 4 and header.startswith(b'OggS'):
        return 'audio/ogg'
    
    print(f"Unknown file format. Header: {header.hex()}")
    return 'audio/wav'  # Default to wav

def speech_to_text(audio_path):
    """Convert speech to text using ElevenLabs API"""
    url = "https://api.elevenlabs.io/v1/speech-to-text"
    headers = { "xi-api-key": ELEVENLABS_API_KEY }
    
    try:
        mime_type = get_file_mime_type(audio_path)
        print(f"Detected MIME type: {mime_type}")
        
        # Map MIME type to file extension
        ext_map = {
            'audio/wav': 'wav',
            'audio/webm': 'webm',
            'audio/ogg': 'ogg'
        }
        
        with open(audio_path, "rb") as audio:
            files = {
                'file': (f'audio.{ext_map.get(mime_type, "wav")}', 
                        audio, 
                        mime_type)
            }
            # Add required model_id parameter
            data = {
                'model_id': 'scribe_v2'  # Using the correct model ID for ElevenLabs API
            }
            resp = requests.post(url, headers=headers, files=files, data=data)
            
        if resp.status_code != 200:
            print(f"Error in speech_to_text API: {resp.status_code} - {resp.text}")
            return ""
            
        return resp.json().get("text", "")
    except Exception as e:
        print(f"Error in speech_to_text: {str(e)}")
        import traceback
        traceback.print_exc()
        return ""

def run_gemini(text):
    """Process text with Gemini"""
    try:
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(f"User said: {text}")
        return response.text
    except Exception as e:
        print(f"Error in run_gemini: {str(e)}")
        return "I encountered an error processing your request."

def text_to_speech(text):
    """Convert text to speech using ElevenLabs API"""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2"
    }

    try:
        resp = requests.post(url, json=data, headers=headers)
        resp.raise_for_status()
        
        output_path = "response.mp3"
        with open(output_path, "wb") as f:
            f.write(resp.content)
        return output_path
    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        return None

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/save-code', methods=['POST'])
def save_code():
    data = request.get_json()
    if 'code' not in data:
        return jsonify({'error': 'Missing code in request body'}), 400

    try:
        with open('test.txt', 'w') as f:
            f.write(data['code'])
        return jsonify({'message': 'Code saved successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug log
        
        if 'code' not in data or 'question' not in data:
            error_msg = f"Missing required fields. Got: {list(data.keys())}"
            print(error_msg)  # Debug log
            return jsonify({'error': error_msg}), 400

        # Convert the question string to a tuple with title and empty description
        question_title = data['question']
        question = (question_title, "")  # Empty string as description
        print(f"Calling analyze_code_with_gemini with code length: {len(data['code'])}, question: {question}")  # Debug log
        
        analysis_result = analyze_code_with_gemini(data['code'], question)
        return jsonify({'analysis': analysis_result})
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in /analyze endpoint: {error_trace}")  # Debug log
        return jsonify({'error': str(e), 'trace': error_trace}), 500

@app.route("/process_audio", methods=["POST"])
def process_audio():
    print("\n=== New Audio Processing Request ===")
    print(f"1. Request Headers: {dict(request.headers)}")
    print(f"2. Request Content-Type: {request.content_type}")
    print(f"3. Request Content-Length: {request.content_length} bytes")
    print(f"4. Request Method: {request.method}")
    print(f"5. Request URL: {request.url}")
    print(f"6. Request Form: {request.form}")
    print(f"7. Request Files: {request.files}")
    print("8. Checking for audio file in request...")
    
    if "audio" not in request.files:
        print("ERROR: No audio file found in request")
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files["audio"]
    if not file or file.filename == '':
        print("ERROR: Empty file provided")
        return jsonify({"error": "Empty file provided"}), 400
        
    input_path = "uploads/input.wav"
    print(f"2. Received audio file: {file.filename} (content type: {file.content_type}, content length: {request.content_length} bytes)")
    
    try:
        # Ensure uploads directory exists
        os.makedirs('uploads', exist_ok=True)
        print("3. Saving uploaded file...")
        
        # Save the uploaded file
        file.save(input_path)
        file_size = os.path.getsize(input_path)
        print(f"4. File saved to {input_path} (size: {file_size} bytes)")
        
        # Check if file is too small to be a valid audio file
        if file_size < 100:  # Arbitrary small size threshold
            print(f"ERROR: File is too small to be a valid audio file (size: {file_size} bytes)")
            return jsonify({"error": "Audio file is too small"}), 400
            
        # Read first few bytes to check file signature
        with open(input_path, 'rb') as f:
            header = f.read(12)  # Read 12 bytes for both WAV and WebM headers
            
        # Check for supported audio formats
        is_wav = len(header) >= 12 and header.startswith(b'RIFF') and header[8:12] == b'WAVE'
        is_webm = len(header) >= 4 and header[0:4] == b'\x1aE\xdf\xa3'
        is_ogg = len(header) >= 4 and header.startswith(b'OggS')
        
        if not (is_wav or is_webm or is_ogg):
            print(f"ERROR: Unsupported audio format. Header: {header.hex()}")
            return jsonify({
                "error": "Unsupported audio format. Please use WAV, WebM, or Ogg format.",
                "header": header.hex(),
                "supported_formats": ["WAV", "WebM", "Ogg"]
            }), 400
            
        print(f"Detected audio format: {'WAV' if is_wav else 'WebM' if is_webm else 'Ogg'}")

        # 1. Speech-to-text
        print("5. Converting speech to text...")
        try:
            text = speech_to_text(input_path)
            print(f"6. Speech-to-Text Result: {text}")
            
            if not text:
                print("ERROR: Speech-to-text returned empty result")
                return jsonify({"error": "Could not transcribe audio. Please try speaking more clearly."}), 400
        except Exception as e:
            print(f"ERROR in speech_to_text: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Error processing audio: {str(e)}"}), 500

        # 2. Process with Gemini
        print("7. Processing with Gemini...")
        gemini_output = run_gemini(text)
        print(f"8. Gemini Response: {gemini_output[:200]}...")  # Print first 200 chars

        # 3. Text-to-speech
        print("9. Converting response to speech...")
        audio_path = text_to_speech(gemini_output)
        
        if not audio_path or not os.path.exists(audio_path):
            print(f"ERROR: Failed to generate speech. Audio path: {audio_path}")
            return jsonify({"error": "Failed to generate speech"}), 500
            
        print(f"10. Audio generated successfully at {audio_path} (size: {os.path.getsize(audio_path)} bytes)")
        return send_file(audio_path, mimetype="audio/mpeg")
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"\n=== ERROR in process_audio ===")
        print(error_trace)
        print(f"Error details: {str(e)}")
        print("==========================\n")
        return jsonify({
            "error": "Audio processing failed",
            "details": str(e),
            "trace": error_trace
        }), 500

if __name__ == '__main__':
    # Ensure the uploads directory exists
    os.makedirs('uploads', exist_ok=True)
    port = int(os.environ.get('PORT', 5008))  # Use port from environment variable or default to 5008
    print(f"Starting server on port {port}...")
    app.run(debug=True, port=port, host='0.0.0.0')