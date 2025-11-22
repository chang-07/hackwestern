import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import VoiceChat from './components/VoiceChat';
import SimpleVoiceChat from './components/SimpleVoiceChat';
import ReactMarkdown from 'react-markdown';
import './App.css';

const questions = [
  {
    id: 1,
    title: '1. Two Sum',
    description: 'Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.',
    details: 'You may assume that each input would have **exactly one solution**, and you may not use the *same* element twice. You can return the answer in any order.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
      },
    ],
  },
  {
    id: 2,
    title: '2. Add Two Numbers',
    description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    details: 'You may assume the two numbers do not contain any leading zero, except the number 0 itself.',
    examples: [
      {
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: '[7,0,8]',
        explanation: '342 + 465 = 807.',
      },
    ],
  },
];

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const navigate = useNavigate();

  const handleLogin = () => {
    setCurrentView('questionSelector');
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setCurrentView('interview');
  };

  const handleInterviewFinish = (data) => {
    setAnalysisData(data);
    setCurrentView('interviewReview');
  };

  // Add navigation to voice chat
  const goToVoiceChat = () => {
    navigate('/voice-chat');
  };

  return (
    <div className="App">
      {currentView === 'login' && <Login onLogin={handleLogin} />}
      {currentView === 'questionSelector' && (
        <>
          <button onClick={goToVoiceChat} className="voice-chat-button">
            🎤 Voice Chat
          </button>
          <QuestionSelector onQuestionSelect={handleQuestionSelect} />
        </>
      )}
      {currentView === 'interview' && (
        <Interview question={selectedQuestion} onInterviewFinish={handleInterviewFinish} />
      )}
      {currentView === 'interviewReview' && <InterviewReview analysis={analysisData} />}
    </div>
  );
}

function Login({ onLogin }) {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Log In</h2>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button onClick={onLogin}>Log In</button>
        <p className="signup-text">Don't have an account? <a href="#">Sign up</a></p>
      </div>
    </div>
  );
}

function QuestionSelector({ onQuestionSelect }) {
  return (
    <div className="question-selector-container">
      <h2>Select a Question</h2>
      <div className="question-list">
        {questions.map(q => (
          <div key={q.id} className="question-item" onClick={() => onQuestionSelect(q)}>
            <h3>{q.title}</h3>
            <p>{q.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="app-header">
      <h1>InterviewerMock</h1>
    </header>
  );
}

function LanguageSelector({ selectedLanguage, onLanguageSelect }) {
  return (
    <div className="language-selector">
      <button
        className={selectedLanguage === 'cpp' ? 'selected' : ''}
        onClick={() => onLanguageSelect('cpp')}
      >
        C++
      </button>
      <button
        className={selectedLanguage === 'python' ? 'selected' : ''}
        onClick={() => onLanguageSelect('python')}
      >
        Python
      </button>
      <button
        className={selectedLanguage === 'java' ? 'selected' : ''}
        onClick={() => onLanguageSelect('java')}
      >
        Java
      </button>
      <button
        className={selectedLanguage === 'javascript' ? 'selected' : ''}
        onClick={() => onLanguageSelect('javascript')}
      >
        JavaScript
      </button>
    </div>
  );
}

function ProblemDescription({ question }) {
  return (
    <div className="problem-description">
      <h2>{question.title}</h2>
      <p>{question.description}</p>
      <p>{question.details}</p>
      {question.examples.map((ex, index) => (
        <div className="example" key={index}>
          <p><strong>Example {index + 1}:</strong></p>
          <pre>
            <strong>Input:</strong> {ex.input}<br />
            <strong>Output:</strong> {ex.output}
            {ex.explanation && <><br /><strong>Explanation:</strong> {ex.explanation}</>}
          </pre>
        </div>
      ))}
    </div>
  );
}

function InterviewReview({ analysis }) {
  // Remove the markdown code block markers if they exist
  const cleanAnalysis = analysis ? 
    analysis.replace(/^```markdown\n|```$/g, '') : 
    'No analysis available';
    
  return (
    <div className="interview-review-container">
      <Header />
      <div className="interview-review-content">
        <h2>Interview Review</h2>
        <div className="analysis-section">
          <h3>Code Analysis</h3>
          <div className="markdown-content">
            <ReactMarkdown>{cleanAnalysis}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}


function Interview({ question, onInterviewFinish }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [fontSize, setFontSize] = useState(20); // Default font size
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameId = useRef(null);
  
  // Handle interview start when user is ready
  const handleReady = () => {
    setInterviewStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === '=') {
          event.preventDefault();
          setFontSize(size => size + 1);
        } else if (event.key === '-') {
          event.preventDefault();
          setFontSize(size => Math.max(8, size - 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--code-font-size', `${fontSize}px`);
    }
  }, [fontSize]);

  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
      }
    };

    getCamera();
  }, []);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
  };
  
  // Initialize audio context and analyser
  const initAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64; // Smaller FFT size for smoother visualization
      
      // Start the visualization loop
      const visualize = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        if (isPlaying || isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          // Only update state if there's actual audio data
          if (dataArray.some(level => level > 0)) {
            setAudioData([...dataArray]); // Create a new array to trigger re-render
          }
          animationFrameId.current = requestAnimationFrame(visualize);
        }
      };
      
      // Start the visualization loop
      animationFrameId.current = requestAnimationFrame(visualize);
    } catch (err) {
      console.error('Error initializing audio context:', err);
    }
  };
  
  // Set up audio context on mount and clean up on unmount
  useEffect(() => {
    initAudioContext();
    
    // Cleanup function
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isPlaying, isRecording]); // Re-run when recording/playback state changes
  
  // Function to save editor content to test.txt
  const saveEditorContent = async () => {
    try {
      console.log('Saving code to test.txt...');
      console.log('Code content:', code);
      
      const response = await fetch('http://localhost:5008/save-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: code || '// No code to save',
          language: selectedLanguage 
        }),
      });
      
      const responseData = await response.json();
      console.log('Save response:', responseData);
      
      if (!response.ok) {
        throw new Error(`Failed to save code: ${responseData.error || response.statusText}`);
      }
      
      console.log('Code saved to test.txt successfully');
      return true;
    } catch (error) {
      console.error('Error saving code:', error);
      return false;
    }
  };
  
  // Start recording audio
  const startRecording = async () => {
    try {
      // Save current editor content to test.txt
      await saveEditorContent();
      
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      // Set up media recorder with specific MIME type
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      // Check if the MIME type is supported
      let mediaRecorder;
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        mediaRecorder = new MediaRecorder(stream, options);
        console.log(`Using MIME type: ${options.mimeType}`);
      } else {
        console.warn(`MIME type ${options.mimeType} not supported, using default`);
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up audio processing
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Create a new analyser for the recording stream
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);
      
      // Start the visualization
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      const visualize = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Update the visualizer with new data
        setAudioData([...dataArray]);
        
        // Continue the animation loop
        animationFrameId.current = requestAnimationFrame(visualize);
      };
      
      // Start the visualization loop
      animationFrameId.current = requestAnimationFrame(visualize);
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`Collected audio chunk: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100); // Request data every 100ms
      console.log('Recording started with MIME type:', mediaRecorder.mimeType);
      setIsRecording(true);
      setIsPlaying(false);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please ensure you have granted microphone permissions.');
    }
  };
  
  // Function to send audio to backend for processing
  const sendToElevenLabs = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Show loading state
      setIsProcessing(true);
      
      // Send to backend
      const response = await fetch('http://localhost:5008/process_audio', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the correct boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process audio');
      }
      
      // Get the audio response as a blob
      const audioData = await response.blob();
      
      if (audioData.size === 0) {
        throw new Error('Received empty audio response');
      }
      
      // Create a URL for the audio blob
      const audioUrl = URL.createObjectURL(audioData);
      const audio = new Audio(audioUrl);
      
      // Set up event handlers
      audio.onended = () => {
        console.log('Playback finished');
        setIsPlaying(false);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
      };
      
      console.log('Starting playback...');
      setIsPlaying(true);
      await audio.play().catch(e => {
        console.error('Error playing audio:', e);
        setIsPlaying(false);
        throw e;
      });
      
    } catch (err) {
      console.error('Error processing audio:', err);
      alert(`Error: ${err.message || 'Failed to process audio'}`);
      throw err; // Re-throw to be caught by the caller
    } finally {
      setIsProcessing(false);
      setIsRecording(false);
    }
  };
  
  // Stop recording and process audio
  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    
    // Process the recorded audio
    mediaRecorderRef.current.onstop = async () => {
      try {
        // Use the actual MIME type that the MediaRecorder was using
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log(`Sending audio to backend (${audioBlob.size} bytes, type: ${mimeType})`);
        
        // Send audio to backend for processing
        await sendToElevenLabs(audioBlob);
        
      } catch (err) {
        console.error('Error in recording processing:', err);
        // Error is already handled in sendToElevenLabs
      }
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://127.0.0.1:5008/save-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        console.log('Code saved successfully, starting analysis...');
        const analysisResponse = await fetch('http://127.0.0.1:5008/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code, 
            question: {
              title: question.title,
              description: question.description || ''
            }
          }),
        });
        if(analysisResponse.ok) {
          const analysisResult = await analysisResponse.json();
          onInterviewFinish(analysisResult.analysis);
        } else {
          console.error('Failed to get analysis.');
          onInterviewFinish('Failed to retrieve analysis.');
        }
      } else {
        console.error('Failed to save code');
        onInterviewFinish('Failed to save code before analysis.');
      }
    } catch (error) {
      console.error('Error during submit process:', error);
      onInterviewFinish('An error occurred during the submission process.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get voices with detailed logging
  const getVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('=== Available Voices ===');
    voices.forEach((voice, index) => {
      console.log(`[${index}] ${voice.name} (${voice.lang}) - Default: ${voice.default ? 'Yes' : 'No'}`);
      console.log('   Voice URI:', voice.voiceURI);
      console.log('   Local Service:', voice.localService);
      console.log('   Default:', voice.default);
    });
    return voices;
  };

  // Function to speak using ElevenLabs through our backend
  const speak = async (text) => {
    if (!text || !text.trim()) {
      console.warn('Empty text provided to speak');
      return;
    }
    
    console.log('Sending text to ElevenLabs TTS:', text);
    
    try {
      const response = await fetch('http://localhost:5008/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`TTS request failed: ${error}`);
      }
      
      // Get the audio data
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play the audio
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          console.log('Finished playing TTS audio');
          URL.revokeObjectURL(audioUrl); // Clean up
          resolve();
        };
        audio.onerror = (error) => {
          console.error('Error playing TTS audio:', error);
          URL.revokeObjectURL(audioUrl); // Clean up
          resolve();
        };
        audio.play().catch(error => {
          console.error('Error starting TTS playback:', error);
          resolve();
        });
      });
    } catch (error) {
      console.error('Error in TTS:', error);
      // Fall back to Web Speech API if ElevenLabs fails
      console.warn('Falling back to Web Speech API');
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = resolve;
        utterance.onerror = resolve; // Always resolve to prevent hanging
        window.speechSynthesis.speak(utterance);
      });
    }
  };

  // Handle when user provides their name
  const handleNameResponse = async (name) => {
    try {
      // First, explain the problem in detail in a natural flow
      const problemExplanation = question.description
        .replace(/`/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Create a more natural flow in a single speech call
      const introText = [
        `Great to meet you, ${name}.`,
        `Let's work on today's problem: ${question.title}.`,
        problemExplanation,
        "I'm curious, how would you approach solving this problem?"
      ].join(' ');
      
      await speak(introText);
      
    } catch (error) {
      console.error('Error in name response:', error);
    }
  };

  // Play intro audio when component mounts
  useEffect(() => {
    const speakIntro = async () => {
      try {
        // Single, natural-sounding introduction
        await speak("Hi there! I'm Potts, a senior software engineer at Scotiabank. I'll be conducting your technical interview today. Could you please tell me your name?");
      } catch (error) {
        console.error('Error in introduction:', error);
      }
    };

    // Small delay to ensure voices are loaded
    const timer = setTimeout(() => {
      speakIntro();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const [userName, setUserName] = useState('');
  const [isAskingName, setIsAskingName] = useState(true);

  // Handle voice transcript
  const handleTranscript = async (text) => {
    console.log('User said:', text);
    
    if (isAskingName && text.trim()) {
      // User provided their name
      const name = text.trim();
      setUserName(name);
      setIsAskingName(false);
      
      // Handle the name response and continue with problem explanation
      handleNameResponse(name);
    }
  };

  return (
    <div className="interview-wrapper" ref={wrapperRef}>
      <Header />
      <div className="interview-container">
        <div className="main-content">
          <div className="editor-container">
            <div className="code-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Code Editor</h2>
              <div style={{ marginLeft: '20px' }}>
                <SimpleVoiceChat onTranscript={handleTranscript} />
              </div>
            </div>
            <Editor
              height="100%"
              language={selectedLanguage}
              theme="vs-dark"
              value={code}
              onChange={setCode}
              options={{
                fontSize: fontSize,
                bracketPairColorization: { enabled: true },
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10
                }
              }}
            />
          </div>
          
          {/* Visualizer and record button at the bottom of the editor */}
          <div className="visualizer-container">
            <div style={{ 
              flex: 1, 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              marginRight: '20px'
            }}>
              <SimpleVoiceChat isPlaying={isPlaying} />
            </div>
            
            {/* Record button */}
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isPlaying}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isRecording ? 'rgba(255, 69, 58, 0.15)' : 'rgba(0, 122, 255, 0.15)',
                color: isRecording ? '#ff453a' : 'rgba(0, 122, 255, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isProcessing || isPlaying) ? 'not-allowed' : 'pointer',
                opacity: (isProcessing || isPlaying) ? 0.6 : 1,
                transition: 'all 0.3s ease',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                outline: 'none',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isProcessing ? (
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'currentColor',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : isRecording ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  backgroundColor: 'currentColor'
                }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Submit button in bottom right of code editor */}
          <div style={{
            position: 'absolute',
            bottom: '90px',
            right: '24px',
            zIndex: 10
          }}>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(40, 167, 69, 0.2)',
                color: 'rgba(40, 167, 69, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.3s ease',
                outline: 'none',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              title="Submit code"
            >
              {isSubmitting ? (
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'currentColor',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : '✓'}
            </button>
          </div>
        </div>
        <div className="sidebar">
          <video ref={videoRef} className="camera-view" autoPlay playsInline></video>
          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageSelect={handleLanguageSelect} />
          <ProblemDescription question={question} />
        </div>
      </div>
    </div>
  );
}

// Wrap the App with Router
function AppWrapper() {
  return (
    <Router>
      <Routes>
        <Route path="/voice-chat" element={<VoiceChat />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </Router>
  );
}

export default AppWrapper;
