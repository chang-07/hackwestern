from flask import Flask, jsonify, Response, request
from health_tracker import HealthTracker
import threading
import time
import json

app = Flask(__name__)

# Initialize the health tracker
tracker = HealthTracker(update_interval=2.0)

# Start the tracker in a background thread
tracker_thread = threading.Thread(target=tracker.start, daemon=True)
tracker_thread.start()

@app.route('/api/health/start', methods=['POST'])
def start_tracking():
    """Start the health tracking."""
    try:
        tracker.start()
        return jsonify({"status": "success", "message": "Health tracking started"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/health/stop', methods=['POST'])
def stop_tracking():
    """Stop the health tracking."""
    try:
        tracker.stop()
        return jsonify({"status": "success", "message": "Health tracking stopped"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/health/status', methods=['GET'])
def get_status():
    """Get the current health status."""
    try:
        data = tracker.get_latest_data()
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/health/summary', methods=['GET'])
def get_summary():
    """Get the tracking session summary."""
    try:
        summary = tracker.get_summary()
        return jsonify({"status": "success", "data": summary})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/health/stream')
def stream():
    """Stream real-time health data using Server-Sent Events (SSE)."""
    def generate():
        try:
            while True:
                data = tracker.get_latest_data()
                if data:
                    yield f"data: {json.dumps(data)}\n\n"
                time.sleep(1)  # Update every second
        except GeneratorExit:
            print("Client disconnected")
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )

def generate_frames():
    """Generate camera frames with emotion detection overlay."""
    while True:
        success, frame = tracker.get_annotated_frame()
        if not success:
            break
            
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

@app.route('/api/health/show_camera')
def show_camera():
    """Simple HTML page to display the camera feed with emotion detection."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Emotion Detection Camera</title>
        <style>
            body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background: #000;
            }
            .container { 
                position: relative; 
                max-width: 100%; 
            }
            #videoFeed { 
                max-width: 100%; 
                max-height: 90vh; 
            }
            .controls {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10;
            }
            button {
                padding: 10px 20px;
                font-size: 16px;
                margin: 0 10px;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <img id="videoFeed" src="/api/health/video_feed">
        </div>
        
        <script>
            // Auto-reconnect if connection is lost
            function setupVideoFeed() {
                const img = document.getElementById('videoFeed');
                img.onerror = function() {
                    console.log('Connection lost, reconnecting...');
                    setTimeout(() => {
                        img.src = '/api/health/video_feed?' + new Date().getTime();
                    }, 1000);
                };
            }
            
            // Initialize when page loads
            window.onload = setupVideoFeed;
        </script>
    </body>
    </html>
    """

if __name__ == '__main__':
    try:
        print("Starting Health Tracker API on http://localhost:5000")
        print("Available endpoints:")
        print("  GET  /api/health/status  - Get current health status")
        print("  GET  /api/health/summary - Get session summary")
        print("  POST /api/health/start   - Start tracking")
        print("  POST /api/health/stop    - Stop tracking")
        print("  GET  /api/health/stream  - Stream real-time data")
        
        app.run(debug=True, threaded=True, port=5000)
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        tracker.stop()
        tracker.release()
        print("Health Tracker API stopped")
