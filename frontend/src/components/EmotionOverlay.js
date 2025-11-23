import React, { useState, useEffect, useRef } from 'react';

const EmotionOverlay = () => {
  const [emotionData, setEmotionData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef();

  useEffect(() => {
    // Set up Server-Sent Events connection to get emotion data
    const eventSource = new EventSource('http://localhost:5012/api/health/status');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.data) {
          setEmotionData(data.data);
        }
      } catch (e) {
        console.error('Error parsing emotion data:', e);
      }
    };

    // Draw overlay on canvas
    const drawOverlay = () => {
      if (!canvasRef.current || !videoRef.current) {
        animationRef.current = requestAnimationFrame(drawOverlay);
        return;
      }
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions
      canvas.width = 640; // Fixed width to match the video feed
      canvas.height = 480; // Fixed height to match the video feed
      
      // Draw the video frame (this will be updated by the video element)
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Draw emotion data if available
        if (emotionData?.emotions) {
          // Draw a semi-transparent background for the text
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(10, 10, 250, 200);
          
          // Draw emotion text
          ctx.font = '16px Arial';
          ctx.fillStyle = '#00ff00';
          let y = 40;
          
          // Draw dominant emotion
          if (emotionData.dominant_emotion) {
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`Emotion: ${emotionData.dominant_emotion}`, 20, y);
            y += 30;
            ctx.font = '16px Arial';
          }
          
          // Draw engagement score if available
          if (emotionData.engagement !== undefined) {
            ctx.fillText(`Engagement: ${emotionData.engagement.toFixed(2)}`, 20, y);
            y += 25;
          }
          
          // Draw emotion probabilities
          y += 10;
          Object.entries(emotionData.emotions)
            .sort((a, b) => b[1] - a[1])
            .forEach(([emotion, score], index) => {
              ctx.fillText(`${emotion}: ${score.toFixed(2)}`, 20, y + (index * 20));
            });
        }
      }
      
      animationRef.current = requestAnimationFrame(drawOverlay);
    };
    
    animationRef.current = requestAnimationFrame(drawOverlay);
    
    // Cleanup function
    return () => {
      eventSource.close();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [emotionData]);

  return (
    <div style={{ 
      position: 'relative', 
      display: 'inline-block',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    }}>
      {/* Hidden video element that will display the Flask video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }}
        src="http://localhost:5012/api/health/video_feed"
        type="multipart/x-mixed-replace; boundary=frame"
      />
      {/* Canvas that will display the video feed with overlay */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maxWidth: '800px',
          borderRadius: '8px',
          backgroundColor: '#000' // Black background while loading
        }}
      />
    </div>
  );
};

export default EmotionOverlay;
