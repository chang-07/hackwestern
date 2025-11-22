import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="App">
      {!isLoggedIn ? <Login onLogin={handleLogin} /> : <Interview />}
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

function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
  };

  return (
    <div className="language-selector">
      <button
        className={selectedLanguage === 'c++' ? 'selected' : ''}
        onClick={() => handleLanguageSelect('c++')}
      >
        C++
      </button>
      <button
        className={selectedLanguage === 'python' ? 'selected' : ''}
        onClick={() => handleLanguageSelect('python')}
      >
        Python
      </button>
      <button
        className={selectedLanguage === 'java' ? 'selected' : ''}
        onClick={() => handleLanguageSelect('java')}
      >
        Java
      </button>
      <button
        className={selectedLanguage === 'javascript' ? 'selected' : ''}
        onClick={() => handleLanguageSelect('javascript')}
      >
        JavaScript
      </button>
      <button
        className={selectedLanguage === 'rust' ? 'selected' : ''}
        onClick={() => handleLanguageSelect('rust')}
      >
        Rust
      </button>
    </div>
  );
}

function ProblemDescription() {
  return (
    <div className="problem-description">
      <h2>1. Two Sum</h2>
      <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p>
      <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the <em>same</em> element twice.</p>
      <p>You can return the answer in any order.</p>
      <div className="example">
        <p><strong>Example 1:</strong></p>
        <pre>
          <strong>Input:</strong> nums = [2,7,11,15], target = 9<br />
          <strong>Output:</strong> [0,1]<br />
          <strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].
        </pre>
      </div>
      <div className="example">
        <p><strong>Example 2:</strong></p>
        <pre>
          <strong>Input:</strong> nums = [3,2,4], target = 6<br />
          <strong>Output:</strong> [1,2]
        </pre>
      </div>
    </div>
  );
}


function Interview() {
  const videoRef = useRef(null);

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

  return (
    <div className="interview-wrapper">
      <Header />
      <div className="interview-container">
        <div className="main-content">
          <textarea className="code-editor" placeholder=">_"></textarea>
        </div>
        <div className="sidebar">
          <video ref={videoRef} className="camera-view" autoPlay playsInline></video>
          <VoiceBox />
          <LanguageSelector />
          <ProblemDescription />
        </div>
      </div>
    </div>
  );
}

export default App;