import cv2
import numpy as np
import os
import sys

# Add the python directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/python")

try:
    from tracker import HealthTracker
    print("Successfully imported HealthTracker")
except ImportError as e:
    print(f"Failed to import HealthTracker: {e}")
    sys.exit(1)

def test_tracker():
    # Create a test image (320x240 RGB)
    test_img = np.random.randint(0, 255, (240, 320, 3), dtype=np.uint8)
    
    # Initialize the tracker
    tracker = HealthTracker()
    
    # Process a few frames
    for i in range(5):
        # Add some variation to the test image
        test_img = (test_img + np.random.randint(0, 10, test_img.shape, dtype=np.uint8)) % 256
        
        # Process the frame
        tracker.add_frame(test_img)
        
        # Get the session data
        data = tracker.get_session_data()
        print(f"Frame {i+1}:")
        print(f"  Heart Rate: {data[-1].get('heart_rate', 'N/A')} bpm")
        print(f"  Breathing Rate: {data[-1].get('breathing_rate', 'N/A')} bpm")

if __name__ == "__main__":
    test_tracker()
