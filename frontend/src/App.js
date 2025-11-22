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
      <button
        className={selectedLanguage === 'rust' ? 'selected' : ''}
        onClick={() => onLanguageSelect('rust')}
      >
        Rust
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
          <div className="submit-button-container">
            <button onClick={handleSubmit} className="submit-button" disabled={isSubmitting}>
              <span className="submit-button-text">{isSubmitting ? '...' : '✓'}</span>
            </button>
          </div>
        </div>
        <div className="sidebar">
          <video ref={videoRef} className="camera-view" autoPlay playsInline></video>
          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageSelect={handleLanguageSelect} />
          <ProblemDescription question={question} />
          <SimpleVoiceChat question={question} />
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
