import React, { useState, useEffect } from 'react';
import { ReactMic } from 'react-mic';
import axios from 'axios';

const SimpleVoiceChat = ({ question }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);

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
  
  // Handle audio data during recording
  const onData = (recordedData) => {
    // You can use this for real-time visualization if needed
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
        console.log('Created audio URL:', audioUrl);
        
        const audio = new Audio(audioUrl);
        console.log('Playing audio...');
        audio.play()
          .then(() => console.log('Audio playback started'))
          .catch(e => console.error('Error playing audio:', e));
          
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
    <div className="simple-voice-chat">
      <div className="voice-controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          style={{
            ...buttonStyles.base,
            ...(isRecording ? buttonStyles.danger : buttonStyles.primary),
            ...(isProcessing && { opacity: 0.7, cursor: 'not-allowed' })
          }}
        >
          {isProcessing ? (
            <span className="spinner"></span>
          ) : isRecording ? (
            <>
              <span className="recording-dot"></span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/>
                <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>
              </svg>
            </>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
              <path d="M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12H5C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12H17Z" fill="currentColor"/>
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

      <style jsx>{`
        .simple-voice-chat {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 1000;
          margin: 0;
          padding: 0;
          background: transparent;
          border: none;
          width: auto;
          min-width: 0;
        }
        
        .voice-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          margin: 0;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(255, 69, 58, 0.7);
          }
          70% {
            opacity: 0.8;
            box-shadow: 0 0 0 10px rgba(255, 69, 58, 0);
          }
          100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(255, 69, 58, 0);
          }
        }
        
        .spinner {
          display: block;
          width: 28px;
          height: 28px;
          border: 2.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          border-top-color: rgba(255, 255, 255, 0.9);
          animation: spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
        
        .recording-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 10px;
          height: 10px;
          background-color: #ff453a;
          border: 2px solid rgba(29, 29, 31, 0.8);
          border-radius: 50%;
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          box-shadow: 0 0 0 0 rgba(255, 69, 58, 0.7);
        }
        
        .sound-wave {
          display: none; /* Hide the visualizer */
        }
      `}</style>
    </div>
  );
};

export default SimpleVoiceChat;
