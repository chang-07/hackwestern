from flask import Flask, request, jsonify, send_file, Response, render_template_string
from flask_cors import CORS
from dotenv import load_dotenv
from analyzer import analyze_code_with_gemini
from interview_analyzer import analyze_interview
import os
import re
import time
import json
import requests
import traceback
import mimetypes
import cv2
import numpy as np
from pydub import AudioSegment
from pydub.silence import split_on_silence
from pydub.playback import play
import google.generativeai as genai
from datetime import datetime
import threading
from typing import Dict, Optional

# Load environment variables
load_dotenv(dotenv_path='app.env')

# API Keys and Config
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
VOICE_ID = os.getenv("VOICE_ID")

# Ensure logs directory exists
os.makedirs('conversation_logs', exist_ok=True)

# Track if this is a new session
session_started = False

def log_conversation(speaker, text):
    """Log conversation to a single file with timestamp"""
    global session_started
    
    try:
        # Ensure logs directory exists
        os.makedirs('conversation_logs', exist_ok=True)
        
        log_file = 'conversation_logs/conversation_log.txt'
        
        # If this is the first message from the user in a new session, clear the file
        if speaker == "User" and not session_started:
            mode = 'w'  # Overwrite existing file
            session_started = True
        else:
            mode = 'a'  # Append to existing file
        
        with open(log_file, mode, encoding='utf-8') as f:
            f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {speaker}: {text}\n\n")
            
        return log_file
    except Exception as e:
        print(f"Error logging conversation: {str(e)}")
        return None

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

class HealthTracker:
    def __init__(self, camera_index: int = 0, update_interval: float = 2.0):
        try:
            from emotiefflib import HSEmotionDetector
            self.detector = HSEmotionDetector()
            self.emotion_detection_available = True
        except ImportError:
            print("EmotiEffLib not found. Using mock emotion detection.")
            self.emotion_detection_available = False
            
        # Initialize video capture
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            print("Warning: Could not open camera. Health tracking will be limited.")
            
        # Tracking state
        self.last_update = 0
        self.update_interval = update_interval
        self.emotion_history = []
        self.engagement_scores = []
        self.session_start = datetime.now()
        self.latest_data = {}
        self.running = False
        self.thread = None
        
        # Engagement weights
        self.engagement_weights = {
            'happy': 0.9,
            'neutral': 0.7,
            'surprise': 0.8,
            'sad': 0.3,
            'angry': 0.2,
            'fear': 0.1,
            'disgust': 0.1
        }
    
    def get_emotion(self, frame: np.ndarray) -> Dict:
        if not self.emotion_detection_available:
            return {'happy': 0.5, 'neutral': 0.3, 'sad': 0.2}
            
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.detector.predict_emotions([rgb_frame])
            return results[0] if results else {}
        except Exception as e:
            print(f"Error detecting emotions: {e}")
            return {}
    
    def calculate_engagement(self, emotions: Dict) -> float:
        if not emotions:
            return 0.0
            
        engagement = 0.0
        total_weight = 0.0
        
        for emotion, prob in emotions.items():
            weight = self.engagement_weights.get(emotion.lower(), 0.5)
            engagement += prob * weight
            total_weight += weight
            
        return min(max(engagement / max(total_weight, 0.001), 0.0), 1.0)
    
    def get_annotated_frame(self):
        if not self.cap or not self.cap.isOpened():
            return False, None
            
        ret, frame = self.cap.read()
        if not ret:
            return False, None
            
        emotions = self.get_emotion(frame)
        
        if not emotions:
            return True, frame
        
        # Draw emotion information on the frame
        height, width = frame.shape[:2]
        
        # Draw a semi-transparent background for the text
        overlay = frame.copy()
        cv2.rectangle(overlay, (10, 10), (300, 100 + (len(emotions) * 30)), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
        
        # Draw emotion probabilities
        y = 40
        cv2.putText(frame, "Emotion Detection:", (20, y), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        for emotion, prob in sorted(emotions.items(), key=lambda x: -x[1]):
            y += 30
            text = f"{emotion}: {prob:.2f}"
            cv2.putText(frame, text, (20, y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
        
        # Calculate and draw engagement score
        engagement = self.calculate_engagement(emotions)
        engagement_text = f"Engagement: {engagement:.2f}"
        cv2.putText(frame, engagement_text, (20, y + 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Update latest data
        self.latest_data = {
            'timestamp': datetime.now().isoformat(),
            'emotions': emotions,
            'engagement': engagement,
            'dominant_emotion': max(emotions.items(), key=lambda x: x[1])[0] if emotions else 'unknown'
        }
        
        # Keep history limited
        self.emotion_history.append(self.latest_data)
        if len(self.emotion_history) > 100:
            self.emotion_history.pop(0)
            
        self.engagement_scores.append(engagement)
        if len(self.engagement_scores) > 100:
            self.engagement_scores.pop(0)
        
        return True, frame
    
    def get_summary(self) -> Dict:
        if not self.emotion_history:
            return {}
            
        return {
            'session_start': self.session_start.isoformat(),
            'session_duration_seconds': (datetime.now() - self.session_start).total_seconds(),
            'total_updates': len(self.emotion_history),
            'average_engagement': float(np.mean(self.engagement_scores)) if self.engagement_scores else 0,
            'recent_emotions': [e['emotions'] for e in self.emotion_history[-10:]],
            'recent_engagement': [float(e) for e in self.engagement_scores[-10:]]
        }
    
    def start(self):
        if self.running or not self.cap.isOpened():
            return False
            
        self.running = True
        self.thread = threading.Thread(target=self._update_loop, daemon=True)
        self.thread.start()
        return True
    
    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
            self.thread = None
    
    def _update_loop(self):
        while self.running:
            try:
                self.get_annotated_frame()
                time.sleep(0.1)
            except Exception as e:
                print(f"Error in update loop: {e}")
                time.sleep(1)
    
    def release(self):
        self.stop()
        if hasattr(self, 'cap') and self.cap.isOpened():
            self.cap.release()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize health tracker
tracker = HealthTracker()
tracker.start()  # Start tracking automatically
CORS(app)

def analyze_code_with_gemini(code, question):
    """Analyze code using Gemini API with error handling and Markdown formatting."""
    try:
        # Initialize the Gemini model with a known working model
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Read the current content of test.txt
        test_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test.txt')
        try:
            with open(test_file_path, 'r') as f:
                test_code = f.read()
        except FileNotFoundError:
            test_code = "No test file found"
        
        # Create a prompt for code analysis with Markdown formatting
        prompt = f"""
        You are analyzing a solution to the Two Sum problem. The user's current code is stored in test.txt and is shown below.
        
        ## Problem: Two Sum
        Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.
        
        You may assume that each input would have exactly one solution, and you may not use the same element twice.
        
        ### Current Code in test.txt:
        ```cpp
        {test_code}
        ```
        
        ### User's Question:
        {question[0] if isinstance(question, (list, tuple)) else question}
        
        ## Code Analysis
        
        ### 1. Code Correctness
        - [ ] Code compiles/runs without errors
        - [ ] Correctly solves the Two Sum problem
        - [ ] Handles edge cases (empty array, no solution, multiple solutions)
        
        ### 2. Time and Space Complexity
        - **Time Complexity:** 
        - **Space Complexity:**
        
        ### 3. Implementation Analysis
        - [ ] Uses an optimal approach (O(n) time with hash map)
        - [ ] Handles edge cases (negative numbers, zero, etc.)
        - [ ] Properly returns the indices or appropriate result
        
        ### 4. Potential Issues
        - [ ] Bugs found
        - [ ] Edge cases not handled
        - [ ] Potential improvements
        
        ### 5. Suggestions for Improvement
        - 
        ### 6. Final Verdict
        
        ---
        *Analysis generated by Gemini AI for Two Sum problem*
        """
        
        # Generate the analysis with error handling for the response format
        try:
            response = model.generate_content(prompt)
            
            # Extract the response text
            if hasattr(response, 'text'):
                result = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                result = response.candidates[0].content.parts[0].text
            elif hasattr(response, 'result'):
                result = response.result
            else:
                result = str(response)
            
            # Ensure the response is properly formatted as Markdown
            return f"```markdown\n{result}\n```"
                
        except Exception as gen_error:
            error_msg = f"Error generating analysis: {str(gen_error)}"
            return f"```markdown\n# Error\n{error_msg}\n```"
            
    except Exception as e:
        error_msg = f"Error in analyze_code_with_gemini: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return f"```markdown\n# Error\n{error_msg}\n```"

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

def split_text_into_chunks(text, max_length=300):
    """Split text into chunks that are small enough for the TTS API"""
    if len(text) <= max_length:
        return [text]
        
    # Try to split at sentence boundaries
    sentences = []
    current_chunk = ""
    
    # Split into sentences while preserving punctuation
    for sentence in re.split(r'(?<=[.!?])\s+', text):
        if len(current_chunk) + len(sentence) + 1 <= max_length:
            current_chunk += (" " + sentence).strip()
        else:
            if current_chunk:
                sentences.append(current_chunk)
            current_chunk = sentence
    
    if current_chunk:
        sentences.append(current_chunk)
        
    return sentences

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
    
    # Split text into chunks if it's too long
    text_chunks = split_text_into_chunks(text)
    output_files = []
    
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
            
            # Process each chunk
            for i, chunk in enumerate(text_chunks):
                print(f"Processing chunk {i+1}/{len(text_chunks)}: {chunk[:50]}...")
                
                data = {
                    "text": chunk,
                    "model_id": config['model_id'],
                    "voice_settings": config['voice_settings']
                }
                
                # Increased timeout to 60 seconds
                resp = requests.post(url, json=data, headers=headers, timeout=60)
                resp.raise_for_status()
                
                chunk_file = f"response_chunk_{i}.mp3"
                with open(chunk_file, "wb") as f:
                    f.write(resp.content)
                output_files.append(chunk_file)
                
                # Small delay between chunks to avoid rate limiting
                if i < len(text_chunks) - 1:
                    time.sleep(0.5)
            
            # Combine all chunks into a single file
            if len(output_files) > 1:
                combined = AudioSegment.empty()
                for chunk_file in output_files:
                    sound = AudioSegment.from_mp3(chunk_file)
                    combined += sound
                    # Add a small pause between chunks
                    combined += AudioSegment.silent(duration=200)  # 200ms pause
                
                output_path = "response_combined.mp3"
                combined.export(output_path, format="mp3")
                
                # Clean up chunk files
                for chunk_file in output_files:
                    try:
                        os.remove(chunk_file)
                    except:
                        pass
                
                output_files = [output_path]
            
            output_path = output_files[0]
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
    print("\n=== Save Code Request ===")
    print(f"Request data: {request.data}")
    
    try:
        data = request.get_json()
        print(f"Parsed JSON data: {data}")
        
        if not data or 'code' not in data:
            error_msg = 'Missing code in request body'
            print(f"Error: {error_msg}")
            return jsonify({'error': error_msg}), 400

        # Get the absolute path to save the file
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test.txt')
        print(f"Saving to file: {file_path}")
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Write the code to the file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(data['code'])
            
        print(f"Successfully wrote {len(data['code'])} characters to {file_path}")
        return jsonify({'message': 'Code saved successfully', 'path': file_path}), 200
        
    except Exception as e:
        error_msg = f"Error saving code: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        return jsonify({'error': error_msg}), 500

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
    """Process audio input and return a response"""
    print("\n=== New Audio Processing Request ===")
    
    try:
        # Log request details for debugging
        print(f"1. Request Headers: {dict(request.headers)}")
        print(f"2. Request Content-Type: {request.content_type}")
        print(f"3. Request Content-Length: {request.content_length} bytes")
        print(f"4. Request Method: {request.method}")
        print(f"5. Request URL: {request.url}")
        print(f"6. Request Form: {request.form}")
        print(f"7. Request Files: {request.files}")
        
        # Check if the post request has the file part
        if 'audio' not in request.files:
            print("8. No audio file part in the request")
            return jsonify({"error": "No audio file provided"}), 400
            
        audio_file = request.files['audio']
        
        # If user does not select file, browser also
        # submit an empty part without filename
        if audio_file.filename == '':
            print("8. No selected file")
            return jsonify({"error": "No selected file"}), 400
            
        if audio_file:
            print(f"8. Received audio file: {audio_file.filename} (content type: {audio_file.content_type}, content length: {audio_file.content_length} bytes)")
            
            # Save the uploaded file
            audio_path = os.path.join('uploads', 'input.wav')
            audio_file.save(audio_path)
            print(f"9. File saved to {audio_path} (size: {os.path.getsize(audio_path)} bytes)")
            
            # Convert speech to text
            print("10. Converting speech to text...")
            text = speech_to_text(audio_path)
            
            if not text:
                return jsonify({"error": "Failed to transcribe audio"}), 500
                
            print(f"11. Speech-to-Text Result: {text}")
            
            # Log user's input
            log_conversation("User", text)
            
            # Process with Gemini
            print("12. Processing with Gemini...")
            
            # Read the current content of test.txt
            test_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test.txt')
            try:
                with open(test_file_path, 'r') as f:
                    test_code = f.read()
                print(f"Current code in test.txt ({len(test_code)} chars):\n{test_code[:200]}{'...' if len(test_code) > 200 else ''}")
                
                # Get the current question title from the frontend or use a default
                question_title = request.args.get('question_title', 'the coding problem')
                
                # Add the code context to the user's question with an interviewer-style prompt
                context = f"""You are a technical interviewer. The candidate has shared this code for {question_title}:
```python
{test_code}
```

Candidate's question: {text}

Respond concisely (1-2 sentences max) in an interview-appropriate way. Be helpful but don't give away the solution. Ask guiding questions if needed."""
                gemini_output = run_gemini(context)
            except FileNotFoundError:
                print("test.txt not found, processing without code context")
                gemini_output = run_gemini(text)
                
            print(f"13. Gemini Response: {gemini_output[:200]}...")  # Print first 200 chars
            
            # Log AI's response
            log_conversation("AI", gemini_output)
            
            # 3. Text-to-speech
            print("14. Converting response to speech...")
            audio_path = text_to_speech(gemini_output)
            
            if not audio_path or not os.path.exists(audio_path):
                error_msg = f"Failed to generate speech. Audio path: {audio_path}"
                print(f"ERROR: {error_msg}")
                log_conversation("Error", error_msg)
                return jsonify({"error": "Failed to generate speech"}), 500
                
            print(f"15. Audio generated successfully at {audio_path} (size: {os.path.getsize(audio_path)} bytes)")
            
            # 4. Send the audio file back
            response = send_file(
                audio_path,
                mimetype='audio/mpeg',
                as_attachment=True,
                download_name='response.mp3'
            )
            
            # Clean up the audio file after sending
            response.call_on_close(lambda: os.remove(audio_path) if audio_path and os.path.exists(audio_path) else None)
            return response
            
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

@app.route('/text-to-speech', methods=['POST'])
def handle_text_to_speech():
    """Endpoint to handle text-to-speech conversion"""
    audio_path = None
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
            
        print(f"Received TTS request for text: {text[:100]}...")
        
        # Log the text that will be converted to speech
        log_conversation("TTS Input", text)
        
        # Generate speech using ElevenLabs
        audio_path = text_to_speech(text)
        
        if not audio_path or not os.path.exists(audio_path):
            error_msg = f"Failed to generate speech for text: {text[:200]}..."
            log_conversation("TTS Error", error_msg)
            return jsonify({'error': 'Failed to generate speech'}), 500
            
        # Log successful TTS generation
        log_conversation("TTS Output", f"Generated audio: {os.path.basename(audio_path)} ({os.path.getsize(audio_path)} bytes)")
            
        # Return the audio file
        response = send_file(
            audio_path,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3',
            conditional=True
        )
        
        # Clean up the audio file after sending
        response.call_on_close(lambda: os.remove(audio_path) if audio_path and os.path.exists(audio_path) else None)
        return response
        
    except Exception as e:
        error_msg = f"Error in text-to-speech endpoint: {str(e)}"
        print(error_msg)
        log_conversation("TTS Error", error_msg)
        
        # Clean up in case of error
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception as cleanup_error:
                log_conversation("Cleanup Error", f"Failed to remove audio file: {str(cleanup_error)}")
        return jsonify({'error': str(e)}), 500

@app.route('/submit-interview', methods=['POST'])
def submit_interview():
    """Endpoint to handle interview submission and generate analysis"""
    try:
        # Generate the analysis report
        analysis = analyze_interview()
        
        # Log the analysis for reference
        log_conversation("System", f"Interview analysis completed. Overall score: {analysis['overall_score']}/10")
        
        # Generate a more detailed summary with Gemini
        strengths = '\n- '.join(analysis['strengths'])
        improvements = '\n- '.join(analysis['areas_for_improvement']) if analysis['areas_for_improvement'] else 'None'
        
        summary_prompt = (
            "You are an experienced technical interviewer. Below is an analysis of a coding interview:\n\n"
            f"Scores:\n"
            f"- Communication: {analysis['detailed_scores']['communication']}/10\n"
            f"- Charisma: {analysis['detailed_scores']['charisma']}/10\n"
            f"- Responsiveness: {analysis['detailed_scores']['responsiveness']}/10\n"
            f"- Technical Understanding: {analysis['detailed_scores']['technical_understanding']}/10\n"
            f"- Problem Solving: {analysis['detailed_scores']['problem_solving']}/10\n\n"
            f"Strengths:\n- {strengths}\n\n"
            f"Areas for Improvement:\n- {improvements}\n\n"
            "Please provide a concise, constructive summary of the candidate's performance that would be helpful "
            "for both the interviewer and the candidate. Focus on specific, actionable feedback."
        )

        # Get a more detailed analysis from Gemini
        try:
            # Use the latest available model for text generation
            try:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(summary_prompt)
                detailed_summary = response.text if hasattr(response, 'text') else "Detailed analysis not available."
            except Exception as e:
                print(f"Error with gemini-2.5-flash: {str(e)}")
                # Fallback to another model if the first one fails
                try:
                    model = genai.GenerativeModel('gemini-2.0-flash-latest')
                    response = model.generate_content(summary_prompt)
                    detailed_summary = response.text if hasattr(response, 'text') else "Detailed analysis not available."
                except Exception as e2:
                    print(f"Error with fallback model: {str(e2)}")
                    detailed_summary = "Detailed analysis could not be generated due to model errors."
        except Exception as e:
            print(f"Error generating detailed analysis: {str(e)}")
            detailed_summary = "Detailed analysis could not be generated."
        
        # Add the detailed summary to the response
        analysis['detailed_summary'] = detailed_summary
        
        return jsonify({
            'status': 'success',
            'analysis': analysis
        })
        
    except Exception as e:
        print(f"Error in submit_interview: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Health Tracker Routes
@app.route('/api/health/status')
def health_status():
    """Get current health status."""
    return jsonify({
        'status': 'success',
        'data': tracker.latest_data if hasattr(tracker, 'latest_data') else {}
    })

@app.route('/api/health/summary')
def health_summary():
    """Get session summary."""
    return jsonify({
        'status': 'success',
        'data': tracker.get_summary() if hasattr(tracker, 'get_summary') else {}
    })

def generate_frames():
    """Generate camera frames with emotion detection overlay."""
    while True:
        if not hasattr(tracker, 'get_annotated_frame'):
            time.sleep(1)
            continue
            
        success, frame = tracker.get_annotated_frame()
        if not success:
            time.sleep(0.1)
            continue
            
        # Encode the frame in JPEG format
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
            
        # Convert to bytes and yield for streaming
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/api/health/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    return Response(generate_frames(),
                   mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/health-monitor')
def health_monitor():
    """Simple HTML page to monitor health metrics."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Interview Health Monitor</title>
        <style>
            body { 
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
            }
            .container { 
                max-width: 1200px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 20px;
            }
            .video-container {
                background: #000;
                border-radius: 8px;
                overflow: hidden;
            }
            #videoFeed {
                width: 100%;
                display: block;
            }
            .metrics {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .metric {
                margin-bottom: 15px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            .metric h3 {
                margin-top: 0;
                color: #333;
            }
            .metric-value {
                font-size: 24px;
                font-weight: bold;
                color: #2c3e50;
            }
            .engagement-bar {
                height: 20px;
                background: #ecf0f1;
                border-radius: 10px;
                margin-top: 10px;
                overflow: hidden;
            }
            .engagement-level {
                height: 100%;
                background: #3498db;
                width: 0%;
                transition: width 0.5s ease;
            }
            .emotion-list {
                margin-top: 10px;
            }
            .emotion-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            .emotion-name {
                flex: 1;
            }
            .emotion-value {
                width: 60px;
                text-align: right;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="video-container">
                <img id="videoFeed" src="/api/health/video_feed">
            </div>
            <div class="metrics">
                <div class="metric">
                    <h3>Engagement Level</h3>
                    <div class="metric-value" id="engagement">0.00</div>
                    <div class="engagement-bar">
                        <div class="engagement-level" id="engagementBar"></div>
                    </div>
                </div>
                <div class="metric">
                    <h3>Dominant Emotion</h3>
                    <div class="metric-value" id="dominantEmotion">-</div>
                </div>
                <div class="metric">
                    <h3>Emotion Breakdown</h3>
                    <div class="emotion-list" id="emotionList">
                        <div class="emotion-item">
                            <span class="emotion-name">Loading...</span>
                            <span class="emotion-value">-</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Update metrics in real-time
            function updateMetrics() {
                fetch('/api/health/status')
                    .then(response => response.json())
                    .then(data => {
                        if (data.data) {
                            // Update engagement
                            const engagement = (data.data.engagement || 0).toFixed(2);
                            document.getElementById('engagement').textContent = engagement;
                            document.getElementById('engagementBar').style.width = `${engagement * 100}%`;
                            
                            // Update dominant emotion
                            document.getElementById('dominantEmotion').textContent = 
                                data.data.dominant_emotion || '-';
                            
                            // Update emotion list
                            const emotions = data.data.emotions || {};
                            const emotionList = document.getElementById('emotionList');
                            
                            if (Object.keys(emotions).length > 0) {
                                emotionList.innerHTML = '';
                                
                                // Sort emotions by value (highest first)
                                const sortedEmotions = Object.entries(emotions)
                                    .sort((a, b) => b[1] - a[1]);
                                
                                sortedEmotions.forEach(([emotion, value]) => {
                                    const item = document.createElement('div');
                                    item.className = 'emotion-item';
                                    item.innerHTML = `
                                        <span class="emotion-name">${emotion}</span>
                                        <span class="emotion-value">${(value * 100).toFixed(1)}%</span>
                                    `;
                                    emotionList.appendChild(item);
                                });
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching health data:', error);
                    });
            }
            
            // Update metrics every second
            setInterval(updateMetrics, 1000);
            updateMetrics();
            
            // Auto-reconnect if video feed is lost
            const videoFeed = document.getElementById('videoFeed');
            videoFeed.onerror = function() {
                console.log('Video feed error, reconnecting...');
                setTimeout(() => {
                    videoFeed.src = '/api/health/video_feed?' + new Date().getTime();
                }, 1000);
            };
        </script>
    </body>
    </html>
    """

if __name__ == '__main__':
    # Ensure upload directory exists
    os.makedirs('uploads', exist_ok=True)
    port = int(os.environ.get('PORT', 5008))  # Use port from environment variable or default to 5008
    print(f"Starting server on port {port}...")
    app.run(debug=True, port=port, host='0.0.0.0')