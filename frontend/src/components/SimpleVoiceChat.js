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

  return (
    <div className="simple-voice-chat">
      <div className="voice-controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`voice-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
        >
          {isProcessing ? 'Processing...' : isRecording ? '⏹️ Stop' : '🎤 Ask Question'}
        </button>
        {isRecording && <div className="recording-indicator">● Recording...</div>}
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
          margin: 1rem 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .voice-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .voice-button {
          padding: 0.5rem 1rem;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .voice-button.recording {
          background: #f44336;
        }
        
        .voice-button.processing {
          background: #ff9800;
        }
        
        .voice-button:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .recording-indicator {
          color: #f44336;
          font-size: 0.9em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .recording-indicator::before {
          content: '●';
          color: #f44336;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        
        .sound-wave {
          display: none; /* Hide the visualizer */
        }
      `}</style>
    </div>
  );
};

export default SimpleVoiceChat;
