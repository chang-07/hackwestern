import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ReactMic } from 'react-mic';

const VoiceChat = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const conversationEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const startRecording = () => {
    setError(null);
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const onStop = async (recordedBlob) => {
    setIsProcessing(true);
    
    // Add user's audio to conversation
    const userAudioUrl = URL.createObjectURL(recordedBlob.blob);
    const userMessage = { 
      id: Date.now(),
      speaker: 'You', 
      audioUrl: userAudioUrl, 
      text: '...',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setConversation(prev => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('audio', recordedBlob.blob, 'recording.wav');

      const response = await axios.post('http://localhost:5000/process_audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      // Create URL for the AI's audio response
      const aiAudioUrl = URL.createObjectURL(response.data);
      
      // Create an audio element and play it
      const audio = new Audio(aiAudioUrl);
      audio.play();

      // Add AI's response to conversation
      const aiMessage = { 
        id: Date.now() + 1,
        speaker: 'AI', 
        audioUrl: aiAudioUrl, 
        text: 'AI Response',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setConversation(prev => [
        ...prev.slice(0, -1),
        { ...prev[prev.length - 1], text: 'Voice message' },
        aiMessage
      ]);

    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Failed to process audio. Please try again.');
      
      setConversation(prev => [
        ...prev,
        { 
          id: Date.now(),
          speaker: 'System', 
          text: 'Error: Could not process audio. Please try again.',
          isError: true,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="voice-chat-container">
      <div className="header">
        <button onClick={() => navigate(-1)} className="back-button"> {/* Updated here */}
          ← Back to Interview
        </button>
        <h2>Voice Assistant</h2>
        <div className="spacer"></div> {/* For flex alignment */}
      </div>
      
      <div className="conversation">
        {conversation.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🎙️</div>
            <h3>Start a conversation</h3>
            <p>Click the microphone button below to begin speaking</p>
          </div>
        ) : (
          conversation.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.speaker.toLowerCase()} ${msg.isError ? 'error' : ''}`}
            >
              <div className="message-content">
                <div className="message-header">
                  <span className="speaker">{msg.speaker}</span>
                  <span className="timestamp">{msg.timestamp}</span>
                </div>
                
                {msg.audioUrl ? (
                  <div className="audio-message">
                    <audio 
                      src={msg.audioUrl} 
                      controls 
                      className="audio-player"
                      onPlay={(e) => {
                        // Pause other audio players when one is playing
                        document.querySelectorAll('audio').forEach(audio => {
                          if (audio !== e.target) audio.pause();
                        });
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-message">{msg.text}</div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={conversationEndRef} />
      </div>

      <div className="controls">
        <div className="recording-indicator" style={{ 
          opacity: isRecording ? 1 : 0,
          visibility: isRecording ? 'visible' : 'hidden'
        }}>
          <span className="pulse"></span>
          <span>Listening...</span>
        </div>
        
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`record-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
        >
          {isRecording ? (
            <span className="button-content">
              <span className="pulse"></span>
              <span>Stop Recording</span>
            </span>
          ) : isProcessing ? (
            <span className="button-content">
              <span className="spinner"></span>
              <span>Processing...</span>
            </span>
          ) : (
            <span className="button-content">
              <span className="mic-icon">🎤</span>
              <span>Start Speaking</span>
            </span>
          )}
        </button>
        
        <ReactMic
          record={isRecording}
          className="sound-wave"
          onStop={onStop}
          mimeType="audio/wav"
          strokeColor="#4CAF50"
          backgroundColor="#f8f9fa"
          visualSetting="sinewave"
          echoCancellation={true}
          autoGainControl={true}
          noiseSuppression={true}
        />
      </div>

      <style jsx>{`
        .voice-chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #4CAF50;
          color: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header h2 {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .spacer {
          width: 40px; /* Same as back button for centering */
        }
        
        .back-button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .back-button:hover {
          background: rgba(255,255,255,0.3);
        }
        
        .conversation {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c757d;
          text-align: center;
          padding: 2rem;
        }
        
        .empty-state .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .empty-state h3 {
          margin: 0.5rem 0;
          color: #343a40;
        }
        
        .empty-state p {
          margin: 0;
          color: #6c757d;
        }
        
        .message {
          max-width: 80%;
          width: fit-content;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message.you {
          align-self: flex-end;
        }
        
        .message.ai {
          align-self: flex-start;
        }
        
        .message.system {
          align-self: center;
          max-width: 90%;
          text-align: center;
        }
        
        .message-content {
          background: white;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .message.you .message-content {
          background: #4CAF50;
          color: white;
          border-bottom-right-radius: 0.25rem;
        }
        
        .message.ai .message-content {
          background: white;
          border-bottom-left-radius: 0.25rem;
        }
        
        .message.system .message-content {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          color: #6c757d;
        }
        
        .message.error .message-content {
          background: #fff3f3;
          border: 1px solid #ffcdd2;
          color: #d32f2f;
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
          font-size: 0.75rem;
        }
        
        .message.you .message-header {
          color: rgba(255,255,255,0.8);
        }
        
        .message.ai .message-header {
          color: #6c757d;
        }
        
        .speaker {
          font-weight: 600;
          text-transform: capitalize;
        }
        
        .timestamp {
          opacity: 0.8;
          font-size: 0.7rem;
        }
        
        .audio-message {
          margin-top: 0.5rem;
        }
        
        .audio-player {
          width: 100%;
          height: 36px;
          border-radius: 18px;
          outline: none;
        }
        
        .controls {
          padding: 1rem;
          background: white;
          border-top: 1px solid #e9ecef;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .recording-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #dc3545;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s;
        }
        
        .pulse {
          width: 12px;
          height: 12px;
          background: #dc3545;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(0.95); opacity: 1; }
        }
        
        .record-button {
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 30px;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin: 0 auto;
          min-width: 200px;
          position: relative;
          overflow: hidden;
        }
        
        .record-button:hover:not(:disabled) {
          background: #43a047;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .record-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        
        .record-button.recording {
          background: #f44336;
          animation: pulse 1.5s infinite;
        }
        
        .record-button.processing {
          background: #ff9800;
        }
        
        .record-button:disabled {
          background: #e0e0e0;
          color: #9e9e9e;
          cursor: not-allowed;
        }
        
        .button-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .mic-icon {
          font-size: 1.2em;
        }
        
        .sound-wave {
          width: 100%;
          height: 60px;
          border-radius: 10px;
          background: #f8f9fa;
          margin-top: 0.5rem;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default VoiceChat;
