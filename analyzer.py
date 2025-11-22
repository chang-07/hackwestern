import os
import random
from pathlib import Path
from google import genai

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

def save_code_to_file(code: str) -> Path:
    SUBMISSIONS_DIR.mkdir(exist_ok=True)
    CODE_FILE.write_text(code, encoding="utf-8")
    return CODE_FILE

def get_random_question() -> tuple[str, str]:
    title = random.choice(list(QUESTIONS.keys()))
    description = QUESTIONS[title]

    print(f"Title picked: {title}")
    print(f"\n=== RANDOMLY SELECTED QUESTION: {title} ===\n")

    return title, description

def run_tests(code: str, title: str) -> tuple[int, int]:
    tests = TEST_CASES.get(title)

    if title == "Two Sum":
        func_name = "twoSum"
    elif title == "Valid Parentheses":
        func_name = "isValid"
    elif title == "Maximum Subarray":
        func_name = "maxSubArray"
    else:
        return 0, 0

    ns: dict = {}
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

def analyze_code_with_gemini(code: str, question: tuple[str, str] | None = None) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY environment variable.")

    client = genai.Client(api_key=api_key)

    title, description = question or get_random_question()

    try:
        compile(code, "<candidate_code>", "exec")
        syntax_result = "No syntax errors detected."
        has_syntax_error = False
    except SyntaxError as e:
        syntax_result = f"Syntax error on line {e.lineno}, column {e.offset}: {e.msg}"
        has_syntax_error = True

    if has_syntax_error:
        passed, total = 0, len(TEST_CASES.get(title, []))
    else:
        passed, total = run_tests(code, title)

    if total == 0:
        test_result_line = "0/0 test cases passed."
    else:
        test_result_line = f"{passed}/{total} test cases passed."

    prompt = f"""
            You are evaluating a Python coding interview answer.

            Interview question:
            {title}: {description}

            Syntax check:
            {syntax_result}

            Test results:
            {test_result_line}

            Start your answer with exactly this word: {test_result_line}

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
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    return response.text
