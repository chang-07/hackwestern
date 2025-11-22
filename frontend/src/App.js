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
      analyserRef.current.fftSize = 256;
      
      // Start the visualization loop
      const visualize = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        setAudioData(dataArray);
        
        if (isPlaying || isRecording) {
          animationFrameId.current = requestAnimationFrame(visualize);
        }
      };
      
      visualize();
    } catch (err) {
      console.error('Error initializing audio context:', err);
    }
  };
  
  // Set up audio context on mount
  useEffect(() => {
    initAudioContext();
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Start recording audio
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Set up audio processing
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Handle data available event
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPlaying(false);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Could not access microphone. Please ensure you have granted microphone permissions.');
    }
  };
  
  // Stop recording and process audio
  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    
    // Process the recorded audio
    mediaRecorderRef.current.onstop = async () => {
      setIsProcessing(true);
      
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Here you would typically send the audio to your backend for processing
        // For now, we'll just simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate playing back the recorded audio
        setIsPlaying(true);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsPlaying(false);
        };
        await audio.play();
        
      } catch (err) {
        console.error('Error processing audio:', err);
      } finally {
        setIsProcessing(false);
        setIsRecording(false);
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

  return (
    <div className="interview-wrapper" ref={wrapperRef}>
      <Header />
      <div className="interview-container">
        <div className="main-content">
          <div className="editor-container">
            <div className="code-editor-header">
              {/* Header content if needed */}
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
            <SimpleVoiceChat audioData={audioData} isPlaying={isPlaying} />
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isPlaying}
              style={{
                position: 'absolute',
                right: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: isRecording ? 'rgba(255, 69, 58, 0.15)' : 'rgba(0, 122, 255, 0.15)',
                color: isRecording ? 'rgba(255, 69, 58, 0.95)' : 'rgba(0, 122, 255, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (isProcessing || isPlaying) ? 'not-allowed' : 'pointer',
                opacity: (isProcessing || isPlaying) ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {isProcessing ? (
                <div className="spinner" style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'currentColor',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : isRecording ? (
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: 'currentColor'
                }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              )}
            </button>
          </div>
          
          {/* Submit button at bottom right */}
          <div style={{
            position: 'absolute',
            bottom: '90px',
            right: '24px',
            zIndex: 1000
          }}>
            <button 
              onClick={handleSubmit} 
              className="submit-button" 
              disabled={isSubmitting}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(0, 122, 255, 0.15)',
                color: 'rgba(0, 122, 255, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {isSubmitting ? '...' : '✓'}
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
