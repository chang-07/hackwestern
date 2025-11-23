import React, { useEffect, useState, useRef } from 'react';
import EmotionOverlay from './EmotionOverlay';
import SimpleVoiceChat from './SimpleVoiceChat';

const InterviewIntro = ({ question, onReady }) => {
  const videoRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [userName, setUserName] = useState('');
  const [isAskingName, setIsAskingName] = useState(true);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Handle transcript changes
  const handleTranscript = (text) => {
    console.log('Transcript received:', text);
    setTranscript(text);
    
    // If we're asking for the user's name and they provided it
    if (isAskingName && text.trim()) {
      setUserName(text.trim());
      setIsAskingName(false);
      
      // Continue with the introduction
      continueIntroduction(text.trim());
    }
    // If we're waiting for 'ready' and user said it
    else if (!isAskingName && text.toLowerCase().includes('ready')) {
      console.log('User is ready to start the interview');
      onReady();
    }
  };
  
  // Get available voices
  const getVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('Available voices:', voices);
    return voices;
  };
  
  // Play audio using the Web Speech API
  const speak = (text) => {
    console.log('Speaking:', text);
    return new Promise((resolve) => {
      const voices = getVoices();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Match the same voice selection logic as in App.js
      const targetVoices = [
        'Alex',
        'Samantha',
        'Google US English',
        'Microsoft David - English (United States)',
        'Microsoft Zira - English (United States)'
      ];
      
      // Try each target voice in order
      let selectedVoice = null;
      for (const target of targetVoices) {
        const voice = voices.find(v => v.name.includes(target));
        if (voice) {
          selectedVoice = voice;
          break;
        }
      }
      
      // If no target voice found, use default or first available
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.default) || voices[0];
      }
      
      if (selectedVoice) {
        console.log('=== InterviewIntro Selected Voice ===');
        console.log('Name:', selectedVoice.name);
        console.log('Language:', selectedVoice.lang);
        console.log('Voice URI:', selectedVoice.voiceURI);
        utterance.voice = selectedVoice;
      }
      
      utterance.onend = () => {
        console.log('Finished speaking:', text);
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('SpeechSynthesis error:', event);
        resolve(); // Always resolve to prevent hanging
      };
      
      window.speechSynthesis.speak(utterance);
    });
  };
  
  // Introduction sequence
  useEffect(() => {
    const handleVoicesChanged = () => {
      console.log('Voices changed, voices loaded');
      setVoicesLoaded(true);
      startIntroduction();
    };
    
    const startIntroduction = async () => {
      try {
        console.log('Starting introduction...');
        await speak("Hi there! I'm Potts, a senior software engineer at Scotiabank. What's your name?");
        console.log('Finished introduction');
      } catch (error) {
        console.error('Error in introduction:', error);
      }
    };
    
    // Check if voices are already loaded
    if (getVoices().length > 0) {
      setVoicesLoaded(true);
      startIntroduction();
    } else {
      // Wait for voices to be loaded
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    }
    
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  
  // Continue introduction after getting user's name
  const continueIntroduction = async (name) => {
    try {
      await speak(`Nice to meet you, ${name}!`);
      await speak(`Let me explain the problem we'll be working on today.`);
      
      // Explain the problem in simple terms
      const problemExplanation = question.description
        .replace(/`/g, '') // Remove backticks
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\*/g, '') // Remove markdown italics
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove markdown links
        
      await speak(problemExplanation);
      await speak("When you're ready to begin, just say 'ready'.");
    } catch (error) {
      console.error('Error in continueIntroduction:', error);
    }
  };

  return (
    <div className="interview-intro" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div className="camera-container" style={{ 
        width: '100%', 
        maxWidth: '640px', 
        margin: '0 auto 20px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
      }}>
        <EmotionOverlay />
      </div>
      
      <div style={{
        backgroundColor: '#1e1e1e',
        color: '#e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        marginTop: '20px',
        position: 'relative'
      }}>
        {!voicesLoaded ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <p>Loading voice synthesis... Please wait.</p>
          </div>
        ) : isAskingName ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            textAlign: 'center',
            padding: '20px'
          }}>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>Please say your name when prompted...</p>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              animation: 'pulse 1.5s infinite',
              marginBottom: '20px'
            }}>
              🎤
            </div>
            <SimpleVoiceChat onTranscript={handleTranscript} />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '200px',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>
              Hi {userName}! When you're ready, say "ready" to begin.
            </p>
            <SimpleVoiceChat onTranscript={handleTranscript} />
          </div>
        )}
        
        {transcript && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
            padding: '10px',
            backgroundColor: 'rgba(45, 45, 45, 0.9)',
            borderRadius: '4px',
            fontSize: '14px',
            textAlign: 'left',
            borderLeft: '3px solid #1890ff'
          }}>
            <span style={{ color: '#888' }}>You said: </span>
            <span style={{ color: '#fff' }}>{transcript}</span>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default InterviewIntro;
