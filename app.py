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

# Track if user is currently solving a problem
is_solving_problem = False

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

def run_gemini(prompt: str) -> str:
    """Send a prompt to the Gemini model and return the response.
    
    Args:
        prompt: The prompt to send to the model
        
    Returns:
        The model's response as a string
    """
    try:
        # Use the Gemini 2.5 Flash model (exact name from available models list)
        model_name = 'models/gemini-2.5-flash'  # This is the exact name from the available models list
        print(f"Using model: {model_name}")
        
        # Initialize the model
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error in run_gemini: {str(e)}")
        return "I'm sorry, I encountered an error processing your request."

class HealthTracker:
    def __init__(self, camera_index: int = 0, update_interval: float = 2.0):
        self.camera_index = camera_index
        self.update_interval = update_interval
        self.detector = None
        self.cap = None
        self.emotion_detection_available = False
        self.last_update = 0
        self.emotion_history = []
        self.engagement_scores = []
        self.session_start = datetime.now()
        self.latest_data = {}
        self.running = False
        self.thread = None
        self.initialized = False
    
    def initialize(self):
        """Initialize the detector and camera only when needed"""
        if self.initialized:
            return True
            
        try:
            from emotiefflib import HSEmotionDetector
            self.detector = HSEmotionDetector()
            self.emotion_detection_available = True
            print("Emotion detection initialized")
        except ImportError:
            print("EmotiEffLib not found. Using mock emotion detection.")
            self.emotion_detection_available = False
        
        # Initialize video capture
        self.cap = cv2.VideoCapture(self.camera_index)
        if not self.cap.isOpened():
            print("Warning: Could not open camera. Health tracking will be limited.")
            return False
            
        self.initialized = True
        return True
        
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
        """Start the background update thread."""
        if not self.initialize():
            print("Failed to initialize health tracker")
            return False
            
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._update_loop)
            self.thread.daemon = True
            self.thread.start()
            print("Health tracking started")
        return True
    
    def stop(self):
        """Stop the background update thread."""
        self.running = False
        if self.thread is not None:
            self.thread.join(timeout=1.0)
        print("Health tracking stopped")
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

# Initialize health tracker (but don't start it yet)
health_tracker = HealthTracker()

@app.route('/start_problem', methods=['POST'])
def start_problem():
    """Start health tracking when user starts a problem"""
    global is_solving_problem
    if not is_solving_problem:
        is_solving_problem = True
        if not health_tracker.running:
            health_tracker.start()
    return jsonify({"status": "started" if is_solving_problem else "error"})

@app.route('/end_problem', methods=['POST'])
def end_problem():
    """Stop health tracking when user finishes a problem"""
    global is_solving_problem
    if is_solving_problem:
        is_solving_problem = False
        if health_tracker.running:
            health_tracker.stop()
    return jsonify({"status": "stopped" if not is_solving_problem else "error"})

def speech_to_text(audio_path):
    """Convert speech to text using ElevenLabs API"""
    try:
        if not os.path.exists(audio_path):
            print(f"Audio file not found: {audio_path}")
            return None
            
        # Read the audio file
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
            
        # Prepare the request
        url = "https://api.elevenlabs.io/v1/speech-to-text"
        
        # Set the model ID for speech-to-text
        model_id = "scribe_v2"  # Using the latest available model
        
        # Prepare the request data as multipart form data
        files = {
            'model_id': (None, model_id, 'text/plain'),
            'file': ('audio.wav', audio_data, 'audio/wav')
        }
        
        headers = {
            "Accept": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        response = requests.post(url, headers=headers, files=files)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('text', '').strip()
        else:
            print(f"Error in speech-to-text API: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error in speech_to_text: {str(e)}")
        return None

@app.route('/process_audio', methods=['POST'])
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

def text_to_speech(text, output_file='output.mp3'):
    """Convert text to speech using ElevenLabs API"""
    try:
        if not text or not ELEVENLABS_API_KEY or not VOICE_ID:
            print("Missing required parameters for TTS")
            return None
            
        # Prepare the request
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        data = {
            "text": text,
            "model_id": "eleven_turbo_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.5,
                "use_speaker_boost": True
            }
        }
        
        # Make the API request
        response = requests.post(url, json=data, headers=headers)
        
        # Check if the request was successful
        if response.status_code == 200:
            # Save the audio file
            with open(output_file, 'wb') as f:
                f.write(response.content)
            print(f"TTS audio saved to {output_file}")
            return output_file
        else:
            print(f"Error in TTS API request: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Error in text_to_speech: {str(e)}")
        return None

@app.route('/text-to-speech', methods=['POST'])
def handle_text_to_speech():
    """Endpoint to handle text-to-speech conversion"""
    audio_path = None
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({
                'status': 'error',
                'message': 'No text provided'
            }), 400
            
        text = data['text'].strip()
        
        # Log the TTS request
        print(f"Received TTS request for text: {text[:50]}...")
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