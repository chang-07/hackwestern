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
    print("\n=== Starting Speech-to-Text Conversion ===")
    print(f"Audio file path: {audio_path}")
    print(f"File exists: {os.path.exists(audio_path)}")
    print(f"File size: {os.path.getsize(audio_path)} bytes")
    
    if not os.path.exists(audio_path):
        print("Error: Audio file does not exist")
        return ""
        
    if os.path.getsize(audio_path) < 1000:  # 1KB minimum size
        print("Error: Audio file is too small")
        return ""
    
    url = "https://api.elevenlabs.io/v1/speech-to-text"
    headers = { 
        "xi-api-key": ELEVENLABS_API_KEY,
        "accept": "application/json"
    }
    
    # Verify API key is set
    if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY == "your-elevenlabs-api-key":
        print("Error: ElevenLabs API key not properly configured")
        return ""
    
    try:
        mime_type = get_file_mime_type(audio_path)
        print(f"1. Detected MIME type: {mime_type}")
        
        # Map MIME type to file extension
        ext_map = {
            'audio/wav': 'wav',
            'audio/webm': 'webm',
            'audio/ogg': 'ogg'
        }
        
        file_extension = ext_map.get(mime_type, 'wav')
        print(f"2. Using file extension: {file_extension}")
        
        with open(audio_path, "rb") as audio:
            audio_data = audio.read()
            print(f"3. Read {len(audio_data)} bytes of audio data")
            
            files = {
                'file': (f'audio.{file_extension}', 
                        audio_data, 
                        mime_type)
            }
            
            # Try different model IDs if needed
            model_ids = ['scribe_v2', 'scribe_v1', 'whisper-1']
            
            for model_id in model_ids:
                print(f"4. Trying model: {model_id}")
                data = {'model_id': model_id}
                
                try:
                    print("5. Sending request to ElevenLabs API...")
                    resp = requests.post(url, headers=headers, files=files, data=data, timeout=30)
                    print(f"6. Response status: {resp.status_code}")
                    
                    if resp.status_code == 200:
                        result = resp.json().get("text", "").strip()
                        print(f"7. Success! Transcribed text: {result}")
                        return result
                    else:
                        print(f"8. Error with model {model_id}: {resp.status_code} - {resp.text}")
                        
                except Exception as e:
                    print(f"9. Exception with model {model_id}: {str(e)}")
                    continue
            
            print("10. All models failed. Last response:", resp.text if 'resp' in locals() else 'No response')
            return ""
            
    except Exception as e:
        print(f"Error in speech_to_text: {str(e)}")
        import traceback
        traceback.print_exc()
        return ""

def run_gemini(prompt):
    """Generate text using Gemini API"""
    if not prompt or not prompt.strip():
        print("Error: Empty prompt provided for Gemini")
        return None
        
    # List of models to try in order of preference
    models_to_try = [
        "gemini-2.0-flash",  # Fallback to 2.0 if needed
        "gemini-2.0-pro"     # Last resort
    ]
    
    # First, list all available models to help with debugging
    try:
        available_models = [model.name for model in genai.list_models()]
        print("Available models:", available_models)
        
        # Filter to only include text generation models that support generateContent
        text_models = [m for m in available_models if 'generateContent' in m.supported_generation_methods]
        print(f"Available text generation models: {text_models}")
        
        # If we found any text generation models, use those instead
        if text_models:
            models_to_try = [m.split('/')[-1] for m in text_models if 'gemini' in m.lower()]
            print(f"Using available Gemini models: {models_to_try}")
            
    except Exception as e:
        print(f"Error listing models: {str(e)}")
        print("Will proceed with default model list")
        
    last_error = None
    
    for model_name in models_to_try:
        full_model_name = f"models/{model_name}"
        try:
            print(f"Trying model: {full_model_name}")
            model = genai.GenerativeModel(full_model_name)
            
            # Generate content with the correct parameters
            response = model.generate_content(
                f"You are a helpful AI assistant. The user said: {prompt}",
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 200,
                },
            )
            
            if hasattr(response, 'text'):
                return response.text
            elif hasattr(response, 'candidates') and response.candidates:
                return response.candidates[0].content.parts[0].text
            else:
                print(f"Unexpected response format from model {full_model_name}")
                continue
                
        except Exception as e:
            last_error = str(e)
            print(f"Error with model {full_model_name}: {last_error}")
            if "not found" in str(e).lower() or "not supported" in str(e).lower():
                print(f"Model {full_model_name} not found or not supported, trying next...")
                continue
            print(f"Error details: {str(e)}")
            continue
    
    # If we get here, all models failed
    error_msg = f"All models failed. Last error: {last_error}"
    print(error_msg)
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later."

def text_to_speech(text):
    """Convert text to speech using ElevenLabs API"""
    if not text or not text.strip():
        print("Error: Empty text provided for TTS")
        return None
        
    # Verify API key is set
    if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY == "your-elevenlabs-api-key":
        print("Error: ElevenLabs API key not properly configured")
        return None
        
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "accept": "audio/mpeg"
    }
    
    # Try different models
    model_configs = [
        {
            "model_id": "eleven_turbo_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.5,
                "use_speaker_boost": True
            }
        },
        {
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        },
        {
            "model_id": "eleven_multilingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
    ]

    last_error = None
    
    for config in model_configs:
        try:
            print(f"Trying TTS with model: {config['model_id']}")
            data = {
                "text": text,
                "model_id": config['model_id'],
                "voice_settings": config['voice_settings']
            }
            
            print(f"Sending TTS request to ElevenLabs with text: {text[:100]}...")
            resp = requests.post(url, json=data, headers=headers, timeout=30)
            resp.raise_for_status()
            
            output_path = "response.mp3"
            with open(output_path, "wb") as f:
                f.write(resp.content)
                
            file_size = os.path.getsize(output_path)
            print(f"TTS audio saved to {output_path} (size: {file_size} bytes)")
            
            # Verify the audio file is valid
            if file_size < 1000:  # 1KB minimum size for audio
                print("Warning: Generated audio file is too small, trying next model...")
                os.remove(output_path)
                continue
                
            return output_path
            
        except requests.exceptions.RequestException as e:
            last_error = str(e)
            print(f"Error with model {config['model_id']}: {last_error}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            continue
            
    print(f"All TTS models failed. Last error: {last_error}")
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