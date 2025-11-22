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
    title: 'Two Sum',
    type: 'Array',
    description: 'Find two numbers that add up to a specific target',
    difficulty: 'Easy',
    details: 'Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ],
  },
  {
    id: 2,
    title: 'Add Two Numbers',
    type: 'Linked List',
    description: 'Add two numbers represented as linked lists',
    difficulty: 'Medium',
    details: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.',
    examples: [
      {
        input: 'l1 = [2,4,3], l2 = [5,6,4]',
        output: '[7,0,8]',
        explanation: '342 + 465 = 807.',
      },
    ],
  },
  {
    id: 3,
    title: 'Longest Substring Without Repeating Characters',
    type: 'String',
    description: 'Find the length of the longest substring without repeating characters',
    difficulty: 'Medium',
    details: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
    ],
  },
  {
    id: 4,
    title: 'Median of Two Sorted Arrays',
    type: 'Array',
    description: 'Find the median of two sorted arrays',
    difficulty: 'Hard',
    details: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.',
    examples: [
      {
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.0',
        explanation: 'Merged array = [1,2,3] and median is 2.',
      },
    ],
  },
  {
    id: 5,
    title: 'Valid Parentheses',
    type: 'Stack',
    description: 'Check if a string has valid parentheses',
    difficulty: 'Easy',
    details: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    examples: [
      {
        input: 's = "()[]{}"',
        output: 'true',
      },
    ],
  },
  {
    id: 6,
    title: 'Merge k Sorted Lists',
    type: 'Linked List',
    description: 'Merge k sorted linked lists into one sorted list',
    difficulty: 'Hard',
    details: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    examples: [
      {
        input: 'lists = [[1,4,5],[1,3,4],[2,6]]',
        output: '[1,1,2,3,4,4,5,6]',
      },
    ],
  },
  {
    id: 7,
    title: 'Container With Most Water',
    type: 'Array',
    description: 'Find two lines that together contain the most water',
    difficulty: 'Medium',
    details: 'Given n non-negative integers a1, a2, ..., an, where each represents a point at coordinate (i, ai). n vertical lines are drawn such that the two endpoints of the line i is at (i, ai) and (i, 0). Find two lines, which, together with the x-axis forms a container, such that the container contains the most water.',
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
      },
    ],
  },
  {
    id: 8,
    title: 'Longest Palindromic Substring',
    type: 'String',
    description: 'Find the longest palindromic substring in a string',
    difficulty: 'Medium',
    details: 'Given a string s, return the longest palindromic substring in s.',
    examples: [
      {
        input: 's = "babad"',
        output: '"bab"',
        explanation: '"aba" is also a valid answer.',
      },
    ],
  },
  {
    id: 9,
    title: '3Sum',
    type: 'Array',
    description: 'Find all unique triplets that sum to zero',
    difficulty: 'Medium',
    details: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.',
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '[[-1,-1,2],[-1,0,1]]',
      },
    ],
  },
  {
    id: 10,
    title: 'Merge Intervals',
    type: 'Array',
    description: 'Merge overlapping intervals',
    difficulty: 'Medium',
    details: 'Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
      },
    ],
  },
  {
    id: 11,
    title: 'Group Anagrams',
    type: 'Hash Table',
    description: 'Group anagrams together from a list of strings',
    difficulty: 'Medium',
    details: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      },
    ],
  },
  {
    id: 12,
    title: 'Maximum Subarray',
    type: 'Array',
    description: 'Find the contiguous subarray with the largest sum',
    difficulty: 'Easy',
    details: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: '[4,-1,2,1] has the largest sum = 6.',
      },
    ],
  },
  {
    id: 13,
    title: 'Word Search',
    type: 'Backtracking',
    description: 'Search for a word in a 2D grid of characters',
    difficulty: 'Medium',
    details: 'Given an m x n grid of characters board and a string word, return true if word exists in the grid.',
    examples: [
      {
        input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
        output: 'true',
      },
    ],
  },
  {
    id: 14,
    title: 'Best Time to Buy and Sell Stock',
    type: 'Array',
    description: 'Find the maximum profit from buying and selling a stock',
    difficulty: 'Easy',
    details: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
    examples: [
      {
        input: 'prices = [7,1,5,3,6,4]',
        output: '5',
        explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.',
      },
    ],
  },
  {
    id: 15,
    title: 'LRU Cache',
    type: 'Design',
    description: 'Design a Least Recently Used (LRU) cache',
    difficulty: 'Hard',
    details: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement the LRUCache class.',
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
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

  const handleBack = () => {
    if (window.confirm('Are you sure you want to leave the interview? Your progress will not be saved.')) {
      setCurrentView('questionSelector');
    }
  };

  return (
    <div className="App">
      {currentView === 'login' && <Login onLogin={handleLogin} />}
      {currentView === 'questionSelector' && (
        <QuestionSelector onQuestionSelect={handleQuestionSelect} />
      )}
      {currentView === 'interview' && (
        <Interview 
          question={selectedQuestion} 
          onInterviewFinish={handleInterviewFinish}
          onBack={handleBack}
        />
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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Get all unique question types for the filter dropdown
  const questionTypes = [...new Set(questions.map(q => q.type))];
  
  // Filter questions based on search term and category
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
                          question.type.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };
  
  const getDifficultyColor = (difficulty) => {
    switch(difficulty.toLowerCase()) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'hard': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="question-selector-container">
      <div className="question-header">
        <h2>Interview Questions</h2>
        <div className="question-filters">
          <input 
            type="text" 
            placeholder="Search questions..." 
            className="search-input"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select 
            className="filter-select"
            value={categoryFilter}
            onChange={handleCategoryChange}
          >
            <option value="all">All Categories</option>
            {questionTypes.map(type => (
              <option key={type} value={type.toLowerCase()}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="questions-table">
        <div className="table-header">
          <div className="table-row">
            <div className="table-cell">Title</div>
            <div className="table-cell">Type</div>
            <div className="table-cell">Description</div>
            <div className="table-cell">Difficulty</div>
          </div>
        </div>
        <div className="table-body">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q) => (
            <div 
              key={q.id} 
              className="table-row clickable"
              onClick={() => onQuestionSelect(q)}
            >
              <div className="table-cell title-cell">
                <span className="question-number">{q.id}.</span> {q.title}
              </div>
              <div className="table-cell">
                <span className="type-tag">{q.type}</span>
              </div>
              <div className="table-cell description-cell">
                {q.description}
              </div>
              <div className="table-cell">
                <span 
                  className="difficulty-tag"
                  style={{ backgroundColor: getDifficultyColor(q.difficulty) }}
                >
                  {q.difficulty}
                </span>
              </div>
            </div>
            ))
          ) : (
            <div className="no-results">
              No questions found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ children }) {
  return (
    <header className="app-header" style={{ position: 'relative' }}>
      {children}
      <h1 style={{ margin: 0 }}>InterviewerMock</h1>
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
  // Check if analysis is in the new format (object with analysis data)
  const isNewFormat = analysis && typeof analysis === 'object' && 'overall_score' in analysis;
  
  // For backward compatibility with old string format
  if (!isNewFormat) {
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

  // New format with structured data
  const { 
    overall_score, 
    detailed_scores = {},
    strengths = [],
    areas_for_improvement = [],
    detailed_summary = ''
  } = analysis;
  
  // Function to render a score bar
  const renderScoreBar = (score, label) => (
    <div key={label} className="score-item">
      <div className="score-label">{label}</div>
      <div className="score-bar-container">
        <div 
          className="score-bar" 
          style={{ width: `${(score / 10) * 100}%` }}
          aria-valuenow={score}
          aria-valuemin="0"
          aria-valuemax="10"
        >
          {score.toFixed(1)}/10
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="interview-review-container">
      <Header />
      <div className="interview-review-content">
        <h2>Interview Review</h2>
        
        <div className="overall-score">
          <h3>Overall Score: <span className="score">{overall_score.toFixed(1)}/10</span></h3>
        </div>
        
        <div className="scores-section">
          <h3>Detailed Scores</h3>
          {Object.entries(detailed_scores).map(([key, score]) => (
            renderScoreBar(score, key.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '))
          ))}
        </div>
        
        <div className="analysis-section">
          <h3>Strengths</h3>
          <ul className="strengths-list">
            {strengths.map((strength, index) => (
              <li key={index} className="strength-item">
                <span className="strength-icon">✓</span>
                {strength}
              </li>
            ))}
          </ul>
          
          {areas_for_improvement.length > 0 && (
            <>
              <h3>Areas for Improvement</h3>
              <ul className="improvements-list">
                {areas_for_improvement.map((item, index) => (
                  <li key={index} className="improvement-item">
                    <span className="improvement-icon">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </>
          )}
          
          {detailed_summary && (
            <div className="detailed-summary">
              <h3>Detailed Feedback</h3>
              <div className="markdown-content">
                <ReactMarkdown>{detailed_summary}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function Interview({ question, onInterviewFinish, onBack }) {
  const videoRef = useRef(null);
  const wrapperRef = useRef(null);
  const [code, setCode] = useState('');
  const navigate = useNavigate();
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
      // First save the code
      const saveResponse = await fetch('http://127.0.0.1:5008/save-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save code');
      }

      console.log('Code saved successfully, submitting interview for analysis...');
      
      // Then submit the interview for comprehensive analysis
      const submitResponse = await fetch('http://127.0.0.1:5008/submit-interview', {
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
      
      if (submitResponse.ok) {
        const result = await submitResponse.json();
        if (result.status === 'success' && result.analysis) {
          // Pass the complete analysis object to the InterviewReview component
          onInterviewFinish(result.analysis);
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        const error = await submitResponse.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to analyze interview');
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
    
    // Clean up the text to remove any problematic characters
    const cleanText = text
      .replace(/[\r\n]+/g, ' ')  // Replace newlines with spaces
      .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
      .trim();
    
    console.log('Sending text to ElevenLabs TTS (first 100 chars):', cleanText.substring(0, 100) + (cleanText.length > 100 ? '...' : ''));
    
    try {
      const response = await fetch('http://localhost:5008/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`TTS request failed: ${error}`);
      }
      
      // Get the audio data
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create a new audio context for better control
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
      
      return new Promise((resolve) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          console.log('Finished playing TTS audio');
          source.disconnect();
          URL.revokeObjectURL(audioUrl); // Clean up
          audioContext.close();
          resolve();
        };
        
        source.onerror = (error) => {
          console.error('Error playing TTS audio:', error);
          source.disconnect();
          URL.revokeObjectURL(audioUrl);
          audioContext.close();
          resolve();
        };
        
        try {
          source.start(0);
          console.log('Started playing TTS audio');
        } catch (error) {
          console.error('Error starting TTS playback:', error);
          source.disconnect();
          URL.revokeObjectURL(audioUrl);
          audioContext.close();
          resolve();
        }
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
      <Header>
          <button 
            onClick={onBack}
            className="back-button"
            title="Exit Interview"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '36px',
              width: '36px',
              transition: 'all 0.2s ease',
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transition: 'transform 0.2s ease',
              }}
              className="back-icon"
            >
              <path 
                d="M18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M10 12H16M10 12L13 9M10 12L13 15" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
      </Header>
      <div className="interview-container">
        <div className="main-content">
          <div className="editor-container">
            <div className="code-editor-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div>
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
