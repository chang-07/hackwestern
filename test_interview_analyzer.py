import os
from interview_analyzer import InterviewAnalyzer, analyze_interview

def create_test_log():
    """Create a test conversation log file"""
    test_log = """[2025-11-22 15:00:00] TTS Input: Hi there! I'll be your interviewer today.
[2025-11-22 15:00:01] TTS Output: Generated audio: response_chunk_0.mp3
[2025-11-22 15:00:10] User: Hello, I'm ready to start the interview
[2025-11-22 15:00:11] AI: Great! Let's begin with the Two Sum problem.
[2025-11-22 15:01:30] User: I think I can use a hash map to solve this
[2025-11-22 15:01:31] AI: That's a good approach. Can you explain why?
[2025-11-22 15:02:00] User: Because it gives us O(1) lookups and we can find the complement in linear time.
"""
    os.makedirs('conversation_logs', exist_ok=True)
    with open('conversation_logs/conversation_log.txt', 'w') as f:
        f.write(test_log)
    
    # Create a simple test code file
    with open('test.txt', 'w') as f:
        f.write("""def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []""")

def test_analyzer():
    """Test the interview analyzer with the test log"""
    print("=== Starting Interview Analysis Test ===\n")
    
    # Initialize analyzer with test files
    analyzer = InterviewAnalyzer(
        log_file='conversation_logs/conversation_log.txt',
        code_file='test.txt'
    )
    
    # Generate report
    report = analyzer.generate_report()
    
    # Print results
    print("=== Analysis Results ===")
    print(f"Overall Score: {report['overall_score']}/10\n")
    
    print("Detailed Scores:")
    for metric, score in report['detailed_scores'].items():
        print(f"- {metric.replace('_', ' ').title()}: {score:.1f}/10")
    
    print("\nStrengths:")
    for strength in report['strengths']:
        print(f"- {strength}")
    
    if report['areas_for_improvement']:
        print("\nAreas for Improvement:")
        for area in report['areas_for_improvement']:
            print(f"- {area}")
    
    print(f"\nDetailed Summary:\n{report.get('detailed_summary', 'No summary available')}")

if __name__ == "__main__":
    # Create test data
    create_test_log()
    
    # Run the test
    test_analyzer()
    
    # Clean up (optional)
    # os.remove('conversation_logs/conversation_log.txt')
    # os.remove('test.txt')
