import React, { useState, useEffect, useRef } from 'react';
import { ReactMic } from 'react-mic';
import axios from 'axios';

const SimpleVoiceChat = ({ question }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const audioRef = useRef(null);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioContext) {
        audioContext.close();
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [audioContext]);

  // Set up audio analysis when source changes
  useEffect(() => {
    if (!audioSource || !audioContext) return;

    analyser.current = audioContext.createAnalyser();
    analyser.current.fftSize = 64;
    audioSource.connect(analyser.current);
    analyser.current.connect(audioContext.destination);
    
    const bufferLength = analyser.current.frequencyBinCount;
    dataArray.current = new Uint8Array(bufferLength);

    const updateVisualizer = () => {
      if (!analyser.current) return;
      
      analyser.current.getByteFrequencyData(dataArray.current);
      setAudioData(new Uint8Array(dataArray.current));
      animationFrameId.current = requestAnimationFrame(updateVisualizer);
    };
    
    animationFrameId.current = requestAnimationFrame(updateVisualizer);
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (analyser.current) {
        analyser.current.disconnect();
      }
    };
  }, [audioSource, audioContext]);

  const startRecording = () => {
    console.log('Start recording button clicked');
    // Reset any previous state
    setLastResponse(null);
    setIsRecording(true);
    // Auto-stop after 30 seconds to prevent infinite recording
    setTimeout(() => {
      if (isRecording) {
        console.log('Auto-stopping recording after 30 seconds');
        stopRecording();
      }
    }, 30000);
  };
  
  const stopRecording = () => {
    console.log('Stop recording button clicked');
    if (isRecording) {
      setIsRecording(false);
    }
  };
  
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const animationFrameId = useRef();
  const analyser = useRef();
  const dataArray = useRef();

  // Handle audio data during recording
  const onData = (recordedData) => {
    // Not used for visualization anymore
    console.log('Audio data received:', recordedData);
  };

  const onStop = async (recordedBlob) => {
    console.log('Recording stopped, processing audio...', recordedBlob);
    
    // Validate recording
    if (!recordedBlob || !recordedBlob.blob) {
      console.error('No audio data recorded');
      alert('No audio was recorded. Please check your microphone and try again.');
      setIsProcessing(false);
      return;
    }
    
    // Check minimum duration (2 seconds) and size (5KB)
    const minDuration = 2000; // 2 seconds
    const minSize = 5000; // 5KB
    
    if (recordedBlob.blob.size < minSize) {
      console.error('Recording is too short or too quiet:', recordedBlob.blob.size, 'bytes');
      alert(`Please record for at least 2 seconds and speak clearly.`);
      setIsProcessing(false);
      return;
    }
    
    // Create audio context to check duration
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioArrayBuffer = await recordedBlob.blob.arrayBuffer();
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
      const duration = audioBuffer.duration * 1000; // Convert to ms
      
      if (duration < minDuration) {
        console.error('Recording duration too short:', duration, 'ms');
        alert(`Recording is too short (${Math.round(duration/100)/10}s). Please speak for at least 2 seconds.`);
        setIsProcessing(false);
        return;
      }
    } catch (e) {
      console.error('Error analyzing audio:', e);
      // Continue even if we can't analyze the duration
    }
    
    console.log('Audio blob size:', recordedBlob.blob.size, 'bytes');
    console.log('Audio blob type:', recordedBlob.blob.type);
    
    // Log first 16 bytes of audio data for debugging
    const debugArrayBuffer = await recordedBlob.blob.arrayBuffer();
    console.log('First 16 bytes of audio data:', new Uint8Array(debugArrayBuffer).slice(0, 16));
    
    setIsProcessing(true);
    
    try {
      console.log('Creating FormData...');
      const formData = new FormData();
      
      // Create a new blob with explicit MIME type
      const audioBlob = new Blob([recordedBlob.blob], { type: 'audio/wav' });
      formData.append('audio', audioBlob, 'recording.wav');
      
      // Log form data entries
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
      }

      console.log('Sending request to server on port 5002...');
      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest'
        },
        responseType: 'blob',
        timeout: 30000 // 30 second timeout
      };
      
      console.log('Sending POST request to /process_audio');
      
      // Log the request details before sending
      console.log('Request config:', {
        url: 'http://localhost:5002/process_audio',
        method: 'post',
        headers: config.headers,
        hasData: !!formData,
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value: value instanceof Blob ? 
            `Blob { type: ${value.type}, size: ${value.size} bytes }` : 
            value
        }))
      });
      
      // Add request interceptor to log the request
      const requestInterceptor = axios.interceptors.request.use(request => {
        console.log('Axios Request:', {
          url: request.url,
          method: request.method,
          headers: request.headers,
          data: request.data
        });
        return request;
      });
      
      // Add response interceptor to log the response
      const responseInterceptor = axios.interceptors.response.use(
        response => {
          console.log('Axios Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
          });
          return response;
        },
        error => {
          if (error.response) {
            console.error('Axios Error Response:', {
              status: error.response.status,
              statusText: error.response.statusText,
              headers: error.response.headers,
              data: error.response.data
            });
          } else if (error.request) {
            console.error('Axios Error - No response received:', error.request);
          } else {
            console.error('Axios Error:', error.message);
          }
          return Promise.reject(error);
        }
      );
      
      try {
        const response = await axios.post('http://localhost:5008/process_audio', formData, config);
        
        console.log('Received response from server');
        // Create URL for the AI's audio response and play it
        const audioUrl = URL.createObjectURL(response.data);
        
        // Handle audio playback with visualization
        const playAudio = async (audioData) => {
          if (!audioData) return;
          
          try {
            // Create audio context if it doesn't exist
            let context = audioContext;
            if (!context) {
              const AudioContext = window.AudioContext || window.webkitAudioContext;
              context = new AudioContext();
              setAudioContext(context);
            }
            
            // Stop any currently playing audio
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
            }
            
            const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            
            // When audio starts playing
            const onPlay = async () => {
              if (!context) return;
              
              // Create a new audio source node
              const source = context.createMediaElementSource(audio);
              setAudioSource(source);
              
              // Connect to destination (for sound) and update state
              source.connect(context.destination);
              setIsPlaying(true);
            };
            
            // When audio ends
            const onEnded = () => {
              setIsPlaying(false);
              setAudioSource(null);
              audio.removeEventListener('play', onPlay);
              audio.removeEventListener('ended', onEnded);
            };
            
            audio.addEventListener('play', onPlay);
            audio.addEventListener('ended', onEnded);
            
            // Start playback
            await audio.play();
            
          } catch (error) {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
          }
        };
        
        await playAudio(response.data);
        
        setLastResponse(audioUrl);
        return response;
      } finally {
        // Clean up interceptors
        axios.interceptors.request.eject(requestInterceptor);
        axios.interceptors.response.eject(responseInterceptor);
      }
    } catch (error) {
      console.error('Error in voice chat:', error);
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Button styles
  const buttonStyles = {
    base: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      position: 'fixed',
      bottom: '32px',
      left: '32px',
      zIndex: 1000,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.18)',
      overflow: 'hidden',
      '::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '50%',
        padding: '1px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05))',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none'
      },
      ':hover:not(:disabled)': {
        transform: 'scale(1.08) translateY(-2px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)'
      },
      ':active:not(:disabled)': {
        transform: 'scale(0.98) translateY(1px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      },
      ':disabled': {
        opacity: 0.6,
        cursor: 'not-allowed',
        transform: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
      }
    },
    primary: {
      background: 'rgba(255, 255, 255, 0.08)',
      color: 'rgba(255, 255, 255, 0.95)',
      ':hover:not(:disabled)': {
        background: 'rgba(255, 255, 255, 0.12)'
      }
    },
    danger: {
      background: 'rgba(255, 69, 58, 0.15)',
      color: 'rgba(255, 69, 58, 0.95)',
      ':hover:not(:disabled)': {
        background: 'rgba(255, 69, 58, 0.2)'
      }
    }
  };

  return (
    <div className="voice-chat-container">
      {/* Wave Visualizer */}
      {isPlaying && (
        <div style={{
          position: 'fixed',
          bottom: '112px',
          left: '32px',
          width: '64px',
          height: '40px',
          borderRadius: '20px',
          backgroundColor: 'rgba(32, 33, 36, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          padding: '0 10px',
          zIndex: 999
        }}>
          {Array.from(audioData).slice(0, 4).map((value, index) => {
            const height = Math.max(4, (value / 255) * 20);
            return (
              <div 
                key={index}
                style={{
                  width: '6px',
                  height: `${height}px`,
                  backgroundColor: '#34a853',
                  borderRadius: '3px',
                  transition: 'height 0.1s ease-out',
                  animation: 'pulse 0.5s infinite alternate',
                  animationDelay: `${index * 0.1}s`,
                  animationPlayState: isPlaying ? 'running' : 'paused'
                }}
              />
            );
          })}
        </div>
      )}
      
      <div style={{
        position: 'fixed',
        bottom: '32px',
        left: '32px',
        zIndex: 9999
      }}>
        <button
          className={`submit-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isPlaying}
          style={{
            opacity: (isProcessing || isPlaying) ? 0.6 : 1,
            cursor: (isProcessing || isPlaying) ? 'not-allowed' : 'pointer',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: isRecording ? 'rgba(255, 59, 48, 0.15)' : 'rgba(0, 122, 255, 0.15)',
            color: isRecording ? 'rgba(255, 59, 48, 0.95)' : 'rgba(0, 122, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            position: 'relative',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.18)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            ':hover:not(:disabled)': {
              transform: 'scale(1.05)'
            },
            ':active:not(:disabled)': {
              transform: 'scale(0.95)'
            }
          }}
        >
          {isProcessing ? (
            <div className="spinner" style={{
              width: '24px',
              height: '24px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              borderTopColor: 'currentColor',
              animation: 'spin 1s ease-in-out infinite'
            }}></div>
          ) : isRecording ? (
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: 'currentColor',
              borderRadius: '4px'
            }}></div>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14C13.66 14 14.99 12.66 14.99 11L15 5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" />
              <path d="M17 11C17 14.31 14.31 17 11 17C7.69 17 5 14.31 5 11H3C3 15.42 6.58 19 11 19C15.42 19 19 15.42 19 11H17Z" />
            </svg>
          )}
        </button>
      </div>
      
      <ReactMic
        record={isRecording}
        className="sound-wave"
        onStop={onStop}
        onData={onData}
        strokeColor="#000000"
        backgroundColor="#FF4081"
        mimeType="audio/wav"
        echoCancellation={true}
        autoGainControl={true}
        noiseSuppression={true}
        channelCount={1}
        bufferSize={4096}
        sampleRate={16000}
        timeSlice={1000}
        minDecibels={-45}
        stopRecordingImmediately={false}
        audioBitsPerSecond={128000}
        visualSetting="sinewave"
      />

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SimpleVoiceChat;
