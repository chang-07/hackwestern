import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ audioContext, source, width = 300, height = 80 }) => {
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const analyser = useRef(null);
  const dataArray = useRef(null);
  const bufferLength = useRef(0);

  useEffect(() => {
    if (!audioContext || !source) return;

    // Create an analyser node
    analyser.current = audioContext.createAnalyser();
    analyser.current.fftSize = 256;
    source.connect(analyser.current);
    
    // Connect the analyser to the destination to hear the audio
    analyser.current.connect(audioContext.destination);
    
    // Create a data array to store the frequency data
    bufferLength.current = analyser.current.frequencyBinCount;
    dataArray.current = new Uint8Array(bufferLength.current);
    
    // Start the animation loop
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    const draw = () => {
      if (!analyser.current) return;
      
      animationFrameId.current = requestAnimationFrame(draw);
      
      // Get the frequency data
      analyser.current.getByteFrequencyData(dataArray.current);
      
      // Clear the canvas
      canvasCtx.fillStyle = 'rgba(32, 33, 36, 0.5)';
      canvasCtx.fillRect(0, 0, width, height);
      
      // Draw the frequency bars
      const barWidth = (width / bufferLength.current) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength.current; i++) {
        const barHeight = (dataArray.current[i] / 255) * height;
        
        canvasCtx.fillStyle = `rgb(52, 168, 83)`; // Green color for the bars
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
    };
    
    draw();
    
    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (analyser.current) {
        analyser.current.disconnect();
      }
    };
  }, [audioContext, source, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      style={{
        width: '100%',
        height: `${height}px`,
        background: 'rgba(32, 33, 36, 0.5)',
        borderRadius: '4px',
        marginTop: '10px'
      }}
    />
  );
};

export default AudioVisualizer;
