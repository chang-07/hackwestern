import re
from datetime import datetime
from collections import defaultdict
import os

class InterviewAnalyzer:
    def __init__(self, log_file='conversation_logs/conversation_log.txt', code_file='test.txt'):
        self.log_file = log_file
        self.code_file = code_file
        self.metrics = {
            'communication': 0,
            'charisma': 0,
            'responsiveness': 0,
            'technical_understanding': 0,
            'problem_solving': 0
        }
        self.weights = {
            'communication': 0.25,
            'charisma': 0.2,
            'responsiveness': 0.25,
            'technical_understanding': 0.2,
            'problem_solving': 0.1
        }
        
    def analyze_conversation(self):
        """Analyze the conversation log and update metrics
        
        Returns:
            bool: True if analysis was successful, False otherwise
        """
        try:
            if not os.path.exists(self.log_file):
                print(f"Error: Log file {self.log_file} not found")
                return False
                
            if os.path.getsize(self.log_file) == 0:
                print("Error: Log file is empty")
                return False
            
            with open(self.log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            user_messages = []
            response_times = []
            prev_time = None
        
            # Extract user messages and response times
            for line in lines:
                # Extract timestamp from the line if it exists
                if ']' in line and ':' in line.split(']')[0]:
                    timestamp_str = line.split(']')[0][1:]
                    try:
                        current_time = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                        
                        if 'User:' in line and prev_time is not None:
                            # Calculate time since last AI response
                            response_time = (current_time - prev_time).total_seconds()
                            response_times.append(response_time)
                        
                        if 'AI:' in line:
                            prev_time = current_time
                            
                    except ValueError as e:
                        print(f"Warning: Could not parse timestamp '{timestamp_str}': {str(e)}")
                
                # Always collect user messages for analysis
                if 'User:' in line:
                    user_messages.append(line.split('User: ')[1].strip())
            
            # Analyze communication metrics
            if not user_messages:
                print("Warning: No user messages found in the log")
                return False
                
            total_words = sum(len(msg.split()) for msg in user_messages)
            avg_words = total_words / max(len(user_messages), 1)
            
            # Calculate scores
            self.metrics['communication'] = min(10, avg_words * 0.5)  # More words = better communication
            
            # Calculate responsiveness (lower response times are better)
            if response_times:
                avg_response_time = sum(response_times) / len(response_times)
                self.metrics['responsiveness'] = max(0, 10 - (avg_response_time / 2))
            else:
                self.metrics['responsiveness'] = 5  # Default score if no response times available
            
            return True
            
        except Exception as e:
            print(f"Error analyzing conversation: {str(e)}")
            return False
        total_words = sum(len(msg.split()) for msg in user_messages)
        avg_words = total_words / max(len(user_messages), 1)
        
        # Calculate scores
        self.metrics['communication'] = min(10, avg_words * 0.5)  # More words = better communication
        
        # Calculate responsiveness (lower response times are better)
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            self.metrics['responsiveness'] = max(0, 10 - (avg_response_time / 2))  # 10s response = 5/10, 0s = 10/10
        
        # Analyze charisma (simple word-based analysis)
        positive_words = ['great', 'thanks', 'please', 'exciting', 'interesting', 'cool', 'awesome']
        positive_count = sum(1 for word in ' '.join(user_messages).lower().split() 
                           if word in positive_words)
        self.metrics['charisma'] = min(10, positive_count * 2)  # Up to 5 positive words = 10/10
        
    def analyze_code_quality(self):
        """Analyze the code quality in test.txt"""
        if not os.path.exists(self.code_file):
            print(f"Warning: Code file {self.code_file} not found"
                  " - Technical understanding score will be affected")
            return
            
        with open(self.code_file, 'r') as f:
            code = f.read()
            
        # Simple code quality checks
        has_comments = int('#' in code)
        has_functions = int('def ' in code)
        has_loops = int(any(loop in code for loop in ['for ', 'while ']))
        
        self.metrics['technical_understanding'] = (has_comments + has_functions + has_loops) * (10/3)
        
    def generate_report(self):
        """Generate a detailed analysis report"""
        self.analyze_conversation()
        self.analyze_code_quality()
        
        # Calculate overall score
        overall_score = sum(self.metrics[metric] * self.weights[metric] 
                          for metric in self.metrics)
        
        # Generate feedback
        feedback = {
            'overall_score': round(overall_score, 1),
            'detailed_scores': {k: round(v, 1) for k, v in self.metrics.items()},
            'strengths': [],
            'areas_for_improvement': []
        }
        
        # Add feedback based on scores
        if feedback['detailed_scores']['communication'] >= 7:
            feedback['strengths'].append("Good communication skills")
        else:
            feedback['areas_for_improvement'].append(
                "Try to provide more detailed explanations in your responses")
                
        if feedback['detailed_scores']['responsiveness'] >= 7:
            feedback['strengths'].append("Responsive during the conversation")
        else:
            feedback['areas_for_improvement'].append(
                "Try to respond more promptly to questions")
                
        if feedback['detailed_scores']['charisma'] >= 7:
            feedback['strengths'].append("Good interpersonal skills")
        else:
            feedback['areas_for_improvement'].append(
                "Try to engage more positively in the conversation")
                
        if not feedback['strengths']:
            feedback['strengths'].append("You completed the interview - well done!")
            
        return feedback

def analyze_interview():
    """Main function to analyze the interview"""
    analyzer = InterviewAnalyzer()
    return analyzer.generate_report()

if __name__ == "__main__":
    report = analyze_interview()
    print("\n=== Interview Analysis Report ===")
    print(f"Overall Score: {report['overall_score']}/10\n")
    
    print("Detailed Scores:")
    for metric, score in report['detailed_scores'].items():
        print(f"- {metric.replace('_', ' ').title()}: {score}/10")
    
    print("\nStrengths:")
    for strength in report['strengths']:
        print(f"- {strength}")
    
    if report['areas_for_improvement']:
        print("\nAreas for Improvement:")
        for area in report['areas_for_improvement']:
            print(f"- {area}")
