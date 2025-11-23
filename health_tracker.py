import cv2
import numpy as np
import time
import torch
from datetime import datetime
from typing import Dict, List, Optional
import threading
from collections import defaultdict

class HealthTracker:
    def __init__(self, camera_index: int = 0, update_interval: float = 2.0):
        """
        Initialize the health tracker with Mac-optimized settings.
        Automatically detects and uses MPS (Metal Performance Shaders) on Apple Silicon.
        
        Args:
            camera_index: Index of the camera to use (default: 0 for default camera)
            update_interval: Time in seconds between emotion updates (default: 2.0)
        """
        # Set device for PyTorch (MPS for Apple Silicon, fallback to CPU)
        self.device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
        print(f"Using device: {self.device}")
        
        try:
            from deepface import DeepFace
            import numpy as np
            import os
            
            # Create test images directory if it doesn't exist
            test_dir = os.path.join(os.path.dirname(__file__), "test_images")
            os.makedirs(test_dir, exist_ok=True)
            
            # Create test images if they don't exist
            img1_path = os.path.join(test_dir, "test1.jpg")
            img2_path = os.path.join(test_dir, "test2.jpg")
            
            if not os.path.exists(img1_path):
                # Create a simple black image
                cv2.imwrite(img1_path, np.zeros((100, 100, 3), dtype=np.uint8))
            if not os.path.exists(img2_path):
                # Create a simple white image
                cv2.imwrite(img2_path, np.ones((100, 100, 3), dtype=np.uint8) * 255)
            
            print("Testing DeepFace with test images...")
            # Test if DeepFace works with enforce_detection=False
            try:
                result = DeepFace.verify(img1_path, img2_path, enforce_detection=False)
                print("DeepFace verification successful")
                self.emotion_detection_available = True
                print("Emotion detection initialized successfully with DeepFace")
                
                # Test emotion detection
                print("Testing emotion detection...")
                emotions = DeepFace.analyze(img1_path, actions=['emotion'], enforce_detection=False)
                print(f"Emotion detection test result: {emotions}")
                
            except Exception as e:
                print(f"DeepFace verification failed: {str(e)}")
                print("Falling back to mock emotion detection")
                self.emotion_detection_available = False
                
        except ImportError as ie:
            print(f"Error importing DeepFace: {ie}")
            print("Please install it with: pip install deepface")
            print("Falling back to mock emotion detection")
            self.emotion_detection_available = False
        except Exception as e:
            print(f"Unexpected error initializing DeepFace: {str(e)}")
            import traceback
            print("Full traceback:")
            traceback.print_exc()
            print("Falling back to mock emotion detection")
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
        
        # Engagement weights (customize based on your needs)
        self.engagement_weights = {
            'happy': 0.9,
            'neutral': 0.7,
            'surprise': 0.8,
            'sad': 0.3,
            'angry': 0.2,
            'fear': 0.1,
            'disgust': 0.1
        }
    
    def _detect_emotions(self, frame):
        """Detect emotions in a frame using DeepFace"""
        if not self.emotion_detection_available:
            print("Emotion detection not available, using mock data")
            return {
                'angry': 0.1,
                'disgust': 0.01,
                'fear': 0.1,
                'happy': 0.7,
                'sad': 0.05,
                'surprise': 0.02,
                'neutral': 0.12
            }
            
        try:
            print("Attempting to save frame for DeepFace analysis...")
            # Save frame to a temporary file
            import tempfile
            import os
            
            # Create a temporary directory if it doesn't exist
            temp_dir = "/tmp/emotion_frames"
            os.makedirs(temp_dir, exist_ok=True)
            
            # Create a unique filename
            import uuid
            temp_filename = f"frame_{uuid.uuid4()}.jpg"
            temp_path = os.path.join(temp_dir, temp_filename)
            
            print(f"Saving frame to {temp_path}")
            success = cv2.imwrite(temp_path, frame)
            if not success:
                print("Error: Failed to save frame to temporary file")
                return None
                
            print("Frame saved successfully. Starting DeepFace analysis...")
            
            # Import DeepFace here to get better error messages
            try:
                from deepface import DeepFace
                print("DeepFace imported successfully")
            except ImportError as ie:
                print(f"Error importing DeepFace: {ie}")
                print("Please install it with: pip install deepface")
                return None
                
            try:
                # Try a simple DeepFace operation to test
                print("Testing DeepFace with verify...")
                try:
                    # This is just a test - we use dummy files to check if DeepFace works
                    test_img1 = os.path.join(os.path.dirname(__file__), "test1.jpg")
                    test_img2 = os.path.join(os.path.dirname(__file__), "test2.jpg")
                    
                    # Create dummy files if they don't exist
                    if not os.path.exists(test_img1):
                        import numpy as np
                        cv2.imwrite(test_img1, np.zeros((100, 100, 3), dtype=np.uint8))
                    if not os.path.exists(test_img2):
                        import numpy as np
                        cv2.imwrite(test_img2, np.ones((100, 100, 3), dtype=np.uint8))
                    
                    print(f"Testing with files: {test_img1} and {test_img2}")
                    result = DeepFace.verify(test_img1, test_img2, enforce_detection=False)
                    print("DeepFace verify test successful")
                except Exception as e:
                    print(f"DeepFace verify test failed: {e}")
                    print("This suggests there might be an issue with the DeepFace installation or its dependencies.")
                    return None
                
                print(f"Analyzing frame with DeepFace: {temp_path}")
                result = DeepFace.analyze(
                    img_path=temp_path,
                    actions=['emotion'],
                    enforce_detection=False,  # Don't fail if no face is detected
                    detector_backend='opencv',
                    silent=False  # Show more detailed output
                )
                
                print(f"DeepFace analysis result: {result}")
                
                if isinstance(result, list) and len(result) > 0:
                    # Get the first face detected
                    face = result[0]
                    print(f"Face detected with emotions: {face.get('emotion', 'No emotion data')}")
                    if 'emotion' in face:
                        return face['emotion']
                else:
                    print("No faces detected in the result")
                    
            except Exception as e:
                print(f"Error during DeepFace analysis: {str(e)}")
                import traceback
                print("Full traceback:")
                traceback.print_exc()
                return None
            finally:
                # Clean up the temporary file
                try:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
                except Exception as e:
                    print(f"Error cleaning up temporary file: {e}")
                    
        except Exception as e:
            print(f"Unexpected error in _detect_emotions: {str(e)}")
            import traceback
            print("Full traceback:")
            traceback.print_exc()
            
        return None
    
    def calculate_engagement(self, emotions: Dict) -> float:
        """Calculate engagement score from emotion probabilities."""
        if not emotions:
            return 0.0
            
        # Calculate weighted engagement score
        engagement = 0.0
        total_weight = 0.0
        
        for emotion, prob in emotions.items():
            weight = self.engagement_weights.get(emotion.lower(), 0.5)
            engagement += prob * weight
            total_weight += weight
            
        return min(max(engagement / max(total_weight, 0.001), 0.0), 1.0)
    
    def update(self) -> Optional[Dict]:
        """Capture a frame and update tracking metrics."""
        current_time = time.time()
        if current_time - self.last_update < self.update_interval:
            return None
            
        ret, frame = self.cap.read()
        if not ret:
            print("Failed to capture frame")
            return None
            
        # Detect emotions
        emotions = self._detect_emotions(frame)
        if not emotions:
            return None
            
        # Calculate metrics
        engagement = self.calculate_engagement(emotions)
        timestamp = datetime.now()
        
        # Update history
        self.emotion_history.append({
            'timestamp': timestamp,
            'emotions': emotions,
            'engagement': engagement
        })
        
        self.engagement_scores.append(engagement)
        self.last_update = current_time
        
        # Keep only the last 100 entries to prevent memory issues
        if len(self.emotion_history) > 100:
            self.emotion_history.pop(0)
        if len(self.engagement_scores) > 100:
            self.engagement_scores.pop(0)
        
        # Update latest data
        self.latest_data = {
            'timestamp': timestamp.isoformat(),
            'emotions': emotions,
            'engagement': engagement,
            'average_engagement': np.mean(self.engagement_scores) if self.engagement_scores else 0,
            'dominant_emotion': max(emotions.items(), key=lambda x: x[1])[0] if emotions else 'unknown'
        }
        
        return self.latest_data
    
    def get_summary(self) -> Dict:
        """Get a summary of the tracking session."""
        if not self.emotion_history:
            return {}
            
        # Convert numpy types to native Python types for JSON serialization
        def convert_to_python_type(value):
            if isinstance(value, (np.floating, np.integer)):
                return float(value) if isinstance(value, np.floating) else int(value)
            elif isinstance(value, (list, tuple)):
                return [convert_to_python_type(x) for x in value]
            elif isinstance(value, dict):
                return {k: convert_to_python_type(v) for k, v in value.items()}
            elif isinstance(value, (str, bool)) or value is None:
                return value
            else:
                return str(value)  # Fallback for other types
            
        # Calculate average emotions
        avg_emotions = {}
        for emotion in self.emotion_history[0]['emotions'].keys():
            avg_emotions[emotion] = float(np.mean([e['emotions'][emotion] for e in self.emotion_history]))
            
        # Prepare the summary with explicit type conversion
        summary = {
            'session_start': self.session_start.isoformat(),
            'session_duration_seconds': float((datetime.now() - self.session_start).total_seconds()),
            'total_updates': len(self.emotion_history),
            'average_engagement': float(np.mean(self.engagement_scores)) if self.engagement_scores else 0.0,
            'recent_emotions': [
                {k: float(v) for k, v in e['emotions'].items()} 
                for e in self.emotion_history[-10:]
            ],
            'recent_engagement': [float(x) for x in self.engagement_scores[-10:]]
        }
        
        # Convert all numpy types to native Python types
        return convert_to_python_type(summary)
    
    def start(self):
        """Start the background update thread."""
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._update_loop, daemon=True)
        self.thread.start()
    
    def stop(self):
        """Stop the background update thread."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
            self.thread = None
    
    def _update_loop(self):
        """Background update loop."""
        while self.running:
            try:
                self.update()
                time.sleep(0.1)  # Small sleep to prevent high CPU usage
            except Exception as e:
                print(f"Error in update loop: {e}")
                time.sleep(1)
    
    def get_annotated_frame(self):
        """
        Get the current camera frame with emotion detection overlay.
        
        Returns:
            tuple: (success, frame) where success is a boolean and frame is the annotated image
        """
        if not hasattr(self, 'cap') or self.cap is None:
            print("Error: Video capture not initialized")
            return False, None
            
        if not self.cap.isOpened():
            print("Error: Camera not opened")
            return False, None
            
        ret, frame = self.cap.read()
        if not ret:
            print("Error: Failed to read frame from camera")
            return False, None
            
        print(f"Successfully read frame: {frame.shape if frame is not None else 'None'}")
            
        # Get the latest emotion data
        emotions = self._detect_emotions(frame)
        
        if not emotions:
            print("No emotions detected, using mock data")
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
        
        # Draw engagement score
        engagement = self.calculate_engagement(emotions)
        engagement_text = f"Engagement: {engagement:.2f}"
        cv2.putText(frame, engagement_text, (20, y + 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        return True, frame
    
    def get_latest_data(self) -> Dict:
        """Get the latest tracking data."""
        return self.latest_data
    
    def release(self):
        """Release resources."""
        self.stop()
        if self.cap.isOpened():
            self.cap.release()
        cv2.destroyAllWindows()

# Flask application
from flask import Flask, Response, jsonify, request
import json

app = Flask(__name__)
tracker = None

@app.route('/')
def index():
    return "Emotion Detection Server is running!"

@app.route('/api/health/status')
def status():
    if tracker:
        data = tracker.get_latest_data()
        return jsonify({
            'status': 'success',
            'data': data
        })
    return jsonify({'status': 'error', 'message': 'Tracker not initialized'})

@app.route('/api/health/video_feed')
def video_feed():
    def generate():
        while True:
            if tracker:
                success, frame = tracker.get_annotated_frame()
                if success:
                    ret, jpeg = cv2.imencode('.jpg', frame)
                    if ret:
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
            time.sleep(0.1)
    
    return Response(generate(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# Example usage
if __name__ == "__main__":
    # Test PyTorch device detection
    print("Testing PyTorch installation...")
    print(f"PyTorch version: {torch.__version__}")
    print(f"MPS (Metal Performance Shaders) available: {torch.backends.mps.is_available()}")
    
    print("\nStarting Health Tracker with Mac optimizations...")
    tracker = HealthTracker()
    tracker.start()
    
    try:
        # Start Flask server
        port = 5012  # Changed to 5012 to avoid port conflicts
        print(f"Starting Flask server on http://localhost:{port}")
        print(f"Video feed available at: http://localhost:{port}/api/health/video_feed")
        print(f"Status available at: http://localhost:{port}/api/health/status")
        app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
        print("Starting tracking (press 'q' to quit)...")
        tracker.start()
        
        while True:
            # Get and display the latest data
            data = tracker.get_latest_data()
            if data:
                print(f"\rEngagement: {data.get('engagement', 0):.2f} | "
                      f"Dominant: {data.get('dominant_emotion', 'N/A')} | "
                      f"FPS: {1/(time.time() - tracker.last_update):.1f}" if tracker.last_update else "", 
                      end='')
            
            # Check for 'q' key to quit
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        tracker.stop()
        print("\nSession Summary:")
        print(json.dumps(tracker.get_summary(), indent=2))
        tracker.release()
