import os
import cv2
import numpy as np
import time
import torch
from datetime import datetime
from typing import Dict, List, Optional
import threading
from collections import defaultdict

class HealthTracker:
    def __init__(self, camera_index: int = 0, update_interval: float = 2.0, log_file: str = "emotion_log.txt"):
        """
        Initialize the health tracker with logging to a file.
        
        Args:
            camera_index: Index of the camera to use (not used in this version)
            update_interval: Time in seconds between emotion updates (default: 2.0)
            log_file: Path to the log file where emotion stats will be saved
        """
        # Set device for PyTorch (MPS for Apple Silicon, fallback to CPU)
        self.device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
        print(f"Using device: {self.device}")
        
        # Initialize log file
        self.log_file = log_file
        self.log_interval = 5.0  # Log to file every 5 seconds
        self.last_log_time = time.time()
        
        # Create headers in the log file if it doesn't exist
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w') as f:
                f.write("timestamp,angry,disgust,fear,happy,sad,surprise,neutral,dominant_emotion,engagement\n")
        
        try:
            from deepface import DeepFace
            import numpy as np
            
            print("Initializing DeepFace...")
            self.emotion_detection_available = True
            print("Emotion detection initialized successfully with DeepFace")
                
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
    
    def _detect_emotions(self):
        """Detect emotions using DeepFace from the default camera"""
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
            from deepface import DeepFace
            import tempfile
            import os
            
            # Create a temporary directory if it doesn't exist
            temp_dir = "/tmp/emotion_frames"
            os.makedirs(temp_dir, exist_ok=True)
            
            # Capture a single frame from the default camera
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                print("Error: Could not open camera")
                return None
                
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                print("Error: Could not capture frame from camera")
                return None
                
            # Save frame to a temporary file
            temp_path = os.path.join(temp_dir, f"frame_{int(time.time())}.jpg")
            cv2.imwrite(temp_path, frame)
            
            # Analyze the captured frame
            result = DeepFace.analyze(
                img_path=temp_path,
                actions=['emotion'],
                enforce_detection=False,
                detector_backend='opencv',
                silent=True
            )
            
            # Clean up the temporary file
            try:
                os.remove(temp_path)
            except:
                pass
            
            if isinstance(result, list) and len(result) > 0:
                if 'emotion' in result[0]:
                    return result[0]['emotion']
                    
            return None
            
        except Exception as e:
            print(f"Error in emotion detection: {str(e)}")
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
    
    def _log_emotions(self, emotions, engagement):
        """Log emotion data to a CSV file"""
        if not emotions:
            return
            
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0] if emotions else 'unknown'
        
        # Format the data as a CSV line
        data_line = (
            f"{timestamp},"
            f"{emotions.get('angry', 0):.4f},"
            f"{emotions.get('disgust', 0):.6f},"
            f"{emotions.get('fear', 0):.4f},"
            f"{emotions.get('happy', 0):.4f},"
            f"{emotions.get('sad', 0):.4f},"
            f"{emotions.get('surprise', 0):.6f},"
            f"{emotions.get('neutral', 0):.4f},"
            f"{dominant_emotion},"
            f"{engagement:.4f}\n"
        )
        
        # Append to the log file
        with open(self.log_file, 'a') as f:
            f.write(data_line)
        
        print(f"Logged emotions at {timestamp}")
        print(f"Dominant emotion: {dominant_emotion} (Engagement: {engagement:.2f})")
    
    def update(self) -> Optional[Dict]:
        """Update tracking metrics and log to file."""
        current_time = time.time()
        
        # Check if it's time to update
        if current_time - self.last_update < self.update_interval:
            return None
            
        # Detect emotions
        emotions = self._detect_emotions()
        if not emotions:
            print("No emotions detected, skipping update")
            return None
            
        # Calculate engagement
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
            'average_engagement': float(np.mean(self.engagement_scores)) if self.engagement_scores else 0.0,
            'dominant_emotion': max(emotions.items(), key=lambda x: x[1])[0] if emotions else 'unknown'
        }
        
        # Log to file at regular intervals
        if current_time - self.last_log_time >= self.log_interval:
            self._log_emotions(emotions, engagement)
            self.last_log_time = current_time
        
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
        Get a black frame with emotion detection results.
        
        Returns:
            tuple: (success, frame) where success is a boolean and frame is the annotated image
        """
        # Create a black frame
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Get the latest emotion data
        emotions = self.latest_data.get('emotions', {})
        
        if not emotions:
            text = "No emotion data available"
            cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
            return True, frame
            
        # Draw emotion information on the frame
        dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0] if emotions else 'unknown'
        text = f"Dominant: {dominant_emotion}"
        cv2.putText(frame, text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        
        # Draw emotion probabilities (sorted by value, highest first)
        y_offset = 70
        for emotion, prob in sorted(emotions.items(), key=lambda x: -x[1]):
            text = f"{emotion}: {prob:.2f}"
            cv2.putText(frame, text, (20, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
            y_offset += 30
        
        # Add engagement score
        engagement = self.latest_data.get('engagement', 0)
        engagement_text = f"Engagement: {engagement:.2f}"
        cv2.putText(frame, engagement_text, (20, y_offset + 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        # Add timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (10, 470), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            
        return True, frame
    
    def get_latest_data(self) -> Dict:
        """Get the latest tracking data."""
        return self.latest_data
    
    def release(self):
        """Release resources."""
        self.stop()
        if hasattr(self, 'cap') and self.cap is not None and hasattr(self.cap, 'isOpened') and self.cap.isOpened():
            self.cap.release()
        cv2.destroyAllWindows()

# Simple logging to file
import os

def print_status(tracker):
    """Print current status to console"""
    if tracker:
        data = tracker.get_latest_data()
        print("\n=== Current Status ===")
        print(f"Log file: {os.path.abspath(tracker.log_file)}")
        print(f"Update interval: {tracker.update_interval} seconds")
        print(f"Last update: {data.get('timestamp', 'Never')}")
        if 'emotions' in data:
            print("\nCurrent Emotions:")
            for emotion, prob in sorted(data['emotions'].items(), key=lambda x: -x[1]):
                print(f"  {emotion}: {prob:.2f}")
            print(f"\nEngagement: {data.get('engagement', 0):.2f}")
        print("====================\n")

if __name__ == "__main__":
    print("Starting Emotion Detection Logger...")
    print("Press Ctrl+C to stop\n")
    
    # Initialize the tracker
    tracker = HealthTracker(update_interval=2.0)  # Update every 2 seconds
    tracker.start()
    
    try:
        # Print initial status
        print_status(tracker)
        
        # Main loop
        while True:
            time.sleep(5)  # Print status every 5 seconds
            print_status(tracker)
            
    except KeyboardInterrupt:
        print("\nStopping emotion detection...")
    finally:
        # Clean up
        tracker.stop()
        tracker.release()
        print(f"\nEmotion data has been logged to: {os.path.abspath(tracker.log_file)}")
        print("Done.")
