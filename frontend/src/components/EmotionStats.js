import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EmotionStats = ({ logData }) => {
  const [timeRange, setTimeRange] = useState('all');
  const [chartData, setChartData] = useState(null);

  // Process log data when component mounts or logData changes
  useEffect(() => {
    if (!logData || logData.length === 0) return;

    // Process data based on selected time range
    const now = new Date();
    let filteredData = [...logData];

    if (timeRange !== 'all') {
      const hours = parseInt(timeRange);
      const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
      filteredData = logData.filter(entry => new Date(entry.timestamp) >= cutoff);
    }

    // Group data by time intervals
    const timeLabels = [];
    const emotionData = {
      angry: [],
      disgust: [],
      fear: [],
      happy: [],
      sad: [],
      surprise: [],
      neutral: [],
      engagement: []
    };

    // Calculate averages for each time interval
    const interval = Math.max(1, Math.ceil(filteredData.length / 10)); // Aim for ~10 data points
    for (let i = 0; i < filteredData.length; i += interval) {
      const chunk = filteredData.slice(i, i + interval);
      const timestamp = new Date(chunk[0].timestamp).toLocaleTimeString();
      
      timeLabels.push(timestamp);
      
      // Calculate average for each emotion in this chunk
      const sums = {
        angry: 0,
        disgust: 0,
        fear: 0,
        happy: 0,
        sad: 0,
        surprise: 0,
        neutral: 0,
        engagement: 0
      };
      
      chunk.forEach(entry => {
        sums.angry += parseFloat(entry.angry) || 0;
        sums.disgust += parseFloat(entry.disgust) || 0;
        sums.fear += parseFloat(entry.fear) || 0;
        sums.happy += parseFloat(entry.happy) || 0;
        sums.sad += parseFloat(entry.sad) || 0;
        sums.surprise += parseFloat(entry.surprise) || 0;
        sums.neutral += parseFloat(entry.neutral) || 0;
        sums.engagement += parseFloat(entry.engagement) || 0;
      });
      
      // Push averages to the data arrays
      const count = chunk.length;
      Object.keys(sums).forEach(emotion => {
        emotionData[emotion].push(sums[emotion] / count);
      });
    }

    // Prepare chart data
    const chartData = {
      labels: timeLabels,
      datasets: [
        {
          label: 'Happiness',
          data: emotionData.happy,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.3,
        },
        {
          label: 'Neutral',
          data: emotionData.neutral,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.3,
        },
        {
          label: 'Engagement',
          data: emotionData.engagement,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.3,
        },
        {
          label: 'Negative (Avg)',
          data: emotionData.angry.map((val, i) => 
            (emotionData.angry[i] + emotionData.disgust[i] + emotionData.fear[i] + emotionData.sad[i]) / 4
          ),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.3,
        },
      ],
    };

    setChartData(chartData);
  }, [logData, timeRange]);

  // Calculate overall statistics
  const getOverallStats = () => {
    if (!logData || logData.length === 0) return null;
    
    const stats = {
      totalSamples: logData.length,
      avgEngagement: 0,
      dominantEmotions: {},
      timeRange: {
        start: new Date(logData[0].timestamp).toLocaleString(),
        end: new Date(logData[logData.length - 1].timestamp).toLocaleString(),
      },
    };

    // Calculate average engagement and count dominant emotions
    const emotionCounts = {};
    let totalEngagement = 0;

    logData.forEach(entry => {
      totalEngagement += parseFloat(entry.engagement) || 0;
      
      const dominant = entry.dominant_emotion;
      emotionCounts[dominant] = (emotionCounts[dominant] || 0) + 1;
    });

    stats.avgEngagement = (totalEngagement / logData.length).toFixed(2);
    
    // Sort emotions by frequency
    stats.dominantEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return stats;
  };

  const overallStats = getOverallStats();

  return (
    <div className="emotion-stats">
      <h2>Emotion Analysis</h2>
      
      {overallStats && (
        <div className="stats-summary">
          <div className="stat-box">
            <h3>Session Summary</h3>
            <p>Duration: {overallStats.timeRange.start} to {overallStats.timeRange.end}</p>
            <p>Total Samples: {overallStats.totalSamples}</p>
            <p>Average Engagement: {overallStats.avgEngagement}</p>
            <div>
              <h4>Most Frequent Emotions:</h4>
              <ol>
                {overallStats.dominantEmotions.map(([emotion, count]) => (
                  <li key={emotion}>
                    {emotion}: {count} samples ({(count / overallStats.totalSamples * 100).toFixed(1)}%)
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="time-range-selector">
        <label>Time Range: </label>
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-range-dropdown"
        >
          <option value="1">Last Hour</option>
          <option value="6">Last 6 Hours</option>
          <option value="24">Last 24 Hours</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {chartData ? (
        <div className="chart-container">
          <Line 
            data={chartData} 
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Emotion Trends Over Time',
                },
              },
              scales: {
                y: {
                  min: 0,
                  max: 1,
                  title: {
                    display: true,
                    text: 'Intensity',
                  },
                },
                x: {
                  title: {
                    display: true,
                    text: 'Time',
                  },
                },
              },
            }} 
          />
        </div>
      ) : (
        <p>No emotion data available for the selected time range.</p>
      )}

      <style jsx>{`
        .emotion-stats {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          margin: 20px 0;
        }
        .stats-summary {
          display: flex;
          margin-bottom: 20px;
          gap: 20px;
          flex-wrap: wrap;
        }
        .stat-box {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          flex: 1;
          min-width: 250px;
        }
        .time-range-selector {
          margin: 15px 0;
        }
        .time-range-dropdown {
          padding: 5px 10px;
          border-radius: 4px;
          border: 1px solid #ddd;
          background: white;
        }
        .chart-container {
          margin-top: 20px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h3 {
          margin-top: 0;
          color: #333;
        }
        h4 {
          margin-bottom: 8px;
        }
        ol {
          margin-top: 8px;
          padding-left: 20px;
        }
        li {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default EmotionStats;
