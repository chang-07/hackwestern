import React, { useEffect, useRef, useState } from 'react';

// Waveform component with smooth animation
const Waveform = ({ isPlaying = false }) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef();
  const timeRef = useRef(0);
  
  // Generate a smooth wave pattern
  const generateWave = (time) => {
    const canvas = canvasRef.current;
    if (!canvas) return [];
    
    const width = canvas.width;
    const barCount = 20; // Number of bars in the wave
    const data = [];
    
    for (let i = 0; i < barCount; i++) {
      // Create a smooth wave pattern
      const t = time * 0.002 + i * 0.2;
      const value = Math.sin(t) * 0.5 + 0.5; // Normalize to 0-1
      
      // Add some variation to make it look more natural
      const variation = 0.3 * Math.sin(time * 0.001 + i * 0.5) + 0.7;
      data.push(value * variation);
    }
    
    return data;
  };
  
  const drawWave = (time) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (isPlaying) {
      // Generate wave data based on time
      const waveData = generateWave(time);
      const barWidth = Math.max(2, (width / waveData.length) * 1.2);
      let x = 0;
      
      for (let i = 0; i < waveData.length; i++) {
        const value = waveData[i];
        const barHeight = value * height * 0.7;
        const hue = 200 + (i / waveData.length) * 60; // Blue to cyan gradient
        
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.3 + value * 0.7})`;
        const barY = centerY - barHeight / 2;
        const barX = x + (width - (waveData.length * barWidth)) / 2; // Center the wave
        
        // Draw a rounded rectangle for each bar
        const radius = barWidth * 0.4;
        ctx.beginPath();
        ctx.moveTo(barX + radius, barY);
        ctx.lineTo(barX + barWidth - radius, barY);
        ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + radius);
        ctx.lineTo(barX + barWidth, barY + barHeight - radius);
        ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - radius, barY + barHeight);
        ctx.lineTo(barX + radius, barY + barHeight);
        ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - radius);
        ctx.lineTo(barX, barY + radius);
        ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
        ctx.closePath();
        ctx.fill();
        
        x += barWidth;
      }
    } else {
      // Draw a subtle pulse when not playing
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
      const lineWidth = 1 + pulse * 0.5;
      const opacity = 0.3 + pulse * 0.2;
      
      ctx.strokeStyle = `rgba(95, 99, 104, ${opacity})`;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(width * 0.2, centerY);
      ctx.lineTo(width * 0.8, centerY);
      ctx.stroke();
    }
  };
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const minHeight = 40;
      const displayHeight = Math.max(rect.height, minHeight);
      
      canvas.width = rect.width * 2;
      canvas.height = displayHeight * 2;
      canvas.style.width = '100%';
      canvas.style.height = `${displayHeight}px`;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    // Animation function
    const animate = (time) => {
      timeRef.current = time;
      drawWave(time);
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameId.current = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying]);
  
  return (
    <div style={{ 
      width: '100%', 
      height: '40px',
      padding: '5px 15px',
      boxSizing: 'border-box'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: 'rgba(30, 30, 30, 0.2)',
          borderRadius: '6px',
          transition: 'all 0.3s ease'
        }}
      />
    </div>
  );
};

const SimpleVoiceChat = ({ isPlaying = false }) => {
  return (
    <div style={{ 
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '5px 0'
    }}>
      <Waveform isPlaying={isPlaying} />
    </div>
  );
};

export default SimpleVoiceChat;
