import os
import random
from pathlib import Path
import google.generativeai as genai

SUBMISSIONS_DIR = Path("submissions")
CODE_FILE = SUBMISSIONS_DIR / "user_code.txt"

QUESTIONS = {
    "Two Sum": "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.",
    "Valid Parentheses": "Given a string containing only '(', ')', '{', '}', '[' and ']', determine if the string is valid with correctly matched brackets.",
    "Maximum Subarray": "Given an integer array nums, return the maximum sum of any contiguous subarray."
}

TEST_CASES = {
    "Two Sum": [
        {"nums": [2, 7, 11, 15], "target": 9,  "expected": [0, 1]},
        {"nums": [3, 2, 4],      "target": 6,  "expected": [1, 2]},
        {"nums": [3, 3],         "target": 6,  "expected": [0, 1]},
        {"nums": [1, 2, 3, 4],   "target": 7,  "expected": [2, 3]},
        {"nums": [0, 4, 3, 0],   "target": 0,  "expected": [0, 3]},
    ],
    "Valid Parentheses": [
        {"s": "()",       "expected": True},
        {"s": "()[]{}",   "expected": True},
        {"s": "(]",       "expected": False},
        {"s": "([)]",     "expected": False},
        {"s": "{[]}",     "expected": True},
    ],
    "Maximum Subarray": [
        {"nums": [-2, 1, -3, 4, -1, 2, 1, -5, 4], "expected": 6},
        {"nums": [1],                             "expected": 1},
        {"nums": [5, 4, -1, 7, 8],               "expected": 23},
        {"nums": [-1, -2, -3],                   "expected": -1},
        {"nums": [0, -3, 1, 1],                  "expected": 2},
    ],
}

def save_code_to_file(code):
    SUBMISSIONS_DIR.mkdir(exist_ok=True)
    CODE_FILE.write_text(code, encoding="utf-8")
    return CODE_FILE

def get_random_question():
    title = random.choice(list(QUESTIONS.keys()))
    description = QUESTIONS[title]

    print(f"\n=== RANDOMLY SELECTED QUESTION: {title} ===\n")

    return title, description

def run_tests(code, title):
    # Ensure we're using a string key to access TEST_CASES
    test_key = title.get('title', title) if isinstance(title, dict) else title
    tests = TEST_CASES.get(test_key, [])

    if title == "Two Sum":
        func_name = "twoSum"
    elif title == "Valid Parentheses":
        func_name = "isValid"
    elif title == "Maximum Subarray":
        func_name = "maxSubArray"
    else:
        return 0, 0

    ns = {}
    try:
        compiled = compile(code, "<candidate_code>", "exec")
        exec(compiled, ns)
    except Exception:
        return 0, len(tests)

    func = ns.get(func_name)
    if not callable(func):
        return 0, len(tests)

    passed = 0
    total = len(tests)

    for case in tests:
        try:
            if title == "Two Sum":
                nums = case["nums"]
                target = case["target"]
                expected = case["expected"]
                result = func(nums, target)
                if isinstance(result, list) and (result == expected or result == expected[::-1]):
                    passed += 1
            elif title == "Valid Parentheses":
                s = case["s"]
                expected = case["expected"]
                result = func(s)
                if result == expected:
                    passed += 1
            elif title == "Maximum Subarray":
                nums = case["nums"]
                expected = case["expected"]
                result = func(nums)
                if result == expected:
                    passed += 1
        except Exception:
            continue

    return passed, total

def analyze_code_with_gemini(code, question):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY environment variable.")

    # Configure with the correct API key
    genai.configure(api_key=api_key)
    
    # Use the latest stable model
    model_name = 'gemini-pro-latest'
    print(f"Using model: {model_name}")
    model = genai.GenerativeModel(model_name)

    # Handle different question formats
    if isinstance(question, (list, tuple)) and len(question) == 2:
        title, description = question
    elif isinstance(question, dict):
        title = question.get('title', 'Coding Question')
        description = question.get('description', '')
    else:
        # If question is just a string, use it as the title
        title = str(question) if question is not None else 'Coding Question'
        description = ''

    try:
        compile(code, "<candidate_code>", "exec")
        syntax_result = "No syntax errors detected."
        has_syntax_error = False
    except SyntaxError as e:
        syntax_result = f"Syntax error on line {e.lineno}, column {e.offset}: {e.msg}"
        has_syntax_error = True

    # Get the test cases using the question title as a string
    test_cases_key = title
    if isinstance(title, dict):
        test_cases_key = title.get('title', '')  # Extract just the title string if it's a dict
    
    if has_syntax_error:
        passed, total = 0, len(TEST_CASES.get(test_cases_key, []))
    else:
        passed, total = run_tests(code, test_cases_key)

    if total == 0:
        result_line = "0/0 test cases passed."
    else:
        result_line = f"{passed}/{total} test cases passed."

    prompt = f"""
            You are evaluating a Python coding interview answer.

            Interview question:
            {title}: {description}

            Syntax check:
            {syntax_result}

            Test results:
            {result_line}

            Start your answer with exactly this word: {result_line}

            After that, in three short sections:

            Syntax:
            - Briefly restate the syntax result (one line).

            Complexity:
            - Give time and space complexity in Big-O for the candidate's approach.

            Logic:
            - Explain why some tests failed or why the solution is correct.
            - Focus on main mistakes or main strengths.
            - Keep it short and direct. No greetings, no fluff.

            Candidate's code:
            ```python
            {code}
            """
    
    response = model.generate_content(prompt)

    return response.text
