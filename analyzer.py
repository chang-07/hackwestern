import os
from pathlib import Path
import google.generativeai as genai

SUBMISSIONS_DIR = Path("submissions")
CODE_FILE = SUBMISSIONS_DIR / "user_code.txt"

QUESTIONS = {
    "Two Sum": "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.",
    "Valid Parentheses": "Given a string containing only '(', ')', '{', '}', '[' and ']', determine if the string is valid with correctly matched brackets.",
    "Maximum Subarray": "Given an integer array nums, return the maximum sum of any contiguous subarray (Kadane’s algorithm).",
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
    """Save the user's pasted code to submissions/user_code.txt."""
    SUBMISSIONS_DIR.mkdir(exist_ok=True)
    CODE_FILE.write_text(code, encoding="utf-8")
    return CODE_FILE


from typing import Optional, Tuple

def detect_question_and_func(ns: dict) -> Tuple[Optional[str], Optional[str]]:
    """
    Look at the executed namespace and infer which problem is being solved
    based on the function name.
    """
    if "twoSum" in ns and callable(ns["twoSum"]):
        return "Two Sum", "twoSum"
    if "isValid" in ns and callable(ns["isValid"]):
        return "Valid Parentheses", "isValid"
    if "maxSubArray" in ns and callable(ns["maxSubArray"]):
        return "Maximum Subarray", "maxSubArray"
    return None, None


def run_tests_with_ns(ns: dict, title: str, func_name: str) -> tuple[int, int]:
    """
    Run the test cases for the given title using the function from ns.
    Returns (passed, total).
    """
    tests = TEST_CASES.get(title, [])
    if not tests:
        return 0, 0

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


def analyze_code_with_gemini(code: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY environment variable.")

    client = genai.Client(api_key=api_key)

    try:
        compiled = compile(code, "<candidate_code>", "exec")
        syntax_result = "No syntax errors detected."
        has_syntax_error = False
    except SyntaxError as e:
        syntax_result = f"Syntax error on line {e.lineno}, column {e.offset}: {e.msg}"
        has_syntax_error = True
        compiled = None

    ns: dict = {}
    title: str | None = None
    func_name: str | None = None
    passed = 0
    total = 0

    if not has_syntax_error and compiled is not None:
        try:
            exec(compiled, ns)
        except Exception as e:
            syntax_result = f"Runtime error during execution: {type(e).__name__}: {e}"
            has_syntax_error = True
        else:
            title, func_name = detect_question_and_func(ns)
            if title is not None and func_name is not None:
                passed, total = run_tests_with_ns(ns, title, func_name)
            else:
                passed, total = 0, 0

    test_result_line = f"{passed}/{total} test cases passed" if total > 0 else "0/0 test cases passed"

    if title is not None:
        description = QUESTIONS[title]
    else:
        description = "Could not determine which problem this solution is for (no known function name like twoSum, isValid, or maxSubArray)."

    prompt = f"""
            You are evaluating a Python coding interview answer.

            Detected question:
            {title if title else "Unknown problem"}: {description}

            Syntax check:
            {syntax_result}

            Test results:
            {test_result_line}

            Start your answer with exactly this line:
            {test_result_line}

            Then write three short sections:

            Syntax:
            - Briefly restate the syntax / runtime result.

            Complexity:
            - Give time and space complexity in Big-O for the candidate's apparent approach.

            Logic:
            - Explain why the solution passed or failed tests, and what the candidate is doing logically.

            Keep it short, clear, and direct.

            Candidate's code:
            ```python
            {code}
            """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    return response.text