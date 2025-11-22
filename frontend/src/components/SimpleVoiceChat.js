import React, { useEffect, useRef } from 'react';

// Waveform component with smooth animation
const Waveform = ({ audioData, isPlaying }) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef();
  const time = useRef(0);
  
  const drawWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform if we have audio data
    if (audioData && audioData.length > 0) {
      const barWidth = (width / audioData.length) * 2.5;
      let x = 0;
      
      for (let i = 0; i < audioData.length; i++) {
        const barHeight = (audioData[i] / 255) * height * 0.6;
        const hue = (i / audioData.length) * 120 + 200; // Blue to cyan gradient
        
        ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.8)`;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
        x += barWidth + 1;
      }
    } else {
      // Draw a straight line when no audio is playing
      ctx.strokeStyle = '#5f6368';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      // Draw a simple horizontal line in the center
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      
      ctx.stroke();
    }
  };
  
  // Set up the canvas and start animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * 2; // For better quality on high DPI displays
      canvas.height = rect.height * 2;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      drawWave();
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Start the animation
    const animate = () => {
      drawWave();
      if (isPlaying) {
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [audioData, isPlaying]);
  
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
};

const SimpleVoiceChat = ({ isPlaying, audioData }) => {
  return (
    <div style={{ width: '100%', height: '100%', padding: '0 20px' }}>
      <Waveform audioData={audioData} isPlaying={isPlaying} />
    </div>
  );
};

export default SimpleVoiceChat;
