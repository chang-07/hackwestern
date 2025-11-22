import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-rust';
import 'prismjs/themes/prism-okaidia.css';
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

  const handleLogin = () => {
    setCurrentView('questionSelector');
  };

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
    setCurrentView('interview');
  };

  return (
    <div className="App">
      {currentView === 'login' && <Login onLogin={handleLogin} />}
      {currentView === 'questionSelector' && <QuestionSelector onQuestionSelect={handleQuestionSelect} />}
      {currentView === 'interview' && <Interview question={selectedQuestion} />}
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

function VoiceBox() {
  return (
    <div className="voice-box">
      <div className="voice-bar"></div>
      <div className="voice-bar"></div>
      <div className="voice-bar"></div>
      <div className="voice-bar"></div>
      <div className="voice-bar"></div>
    </div>
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


function Interview({ question }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [fontSize, setFontSize] = useState(20); // Default font size

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

  return (
    <div className="interview-wrapper" ref={wrapperRef}>
      <Header />
      <div className="interview-container">
        <div className="main-content">
          <Editor
            value={code}
            onValueChange={code => setCode(code)}
            highlight={code => highlight(code, languages[selectedLanguage] || languages.clike)}
            padding={20}
            className="code-editor"
            style={{
              fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
              lineHeight: 1.5,
            }}
          />
        </div>
        <div className="sidebar">
          <video ref={videoRef} className="camera-view" autoPlay playsInline></video>
          <VoiceBox />
          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageSelect={handleLanguageSelect} />
          <ProblemDescription question={question} />
        </div>
      </div>
    </div>
  );
}

export default App;