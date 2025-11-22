from pathlib import Path
from analyzer import save_code_to_file, analyze_code_with_gemini
from help import run_help


def main():
    print("Type or paste your solution below.")
    print("Define one of: twoSum(nums, target), isValid(s), or maxSubArray(nums).")
    print("Commands:")
    print("  - Type 'help' on its own line to get AI feedback on your current code.")
    print("  - Press ENTER on an empty blank line to finish and get a final analysis.\n")

    submissions_dir = Path("submissions")
    code_path = submissions_dir / "user_code.txt"

    if code_path.exists():
        print(f"(Existing helper file found at {code_path}. New runs will overwrite it.)\n")

    lines = []

    while True:
        try:
            line = input()
        except EOFError:
            break

        stripped = line.strip().lower()

        if stripped == "help":
            code = "\n".join(lines).rstrip("\n")

            if not code.strip():
                print("No code entered yet. Type some code, then type 'help'.\n")
                continue

            analysis = run_help(code)
            print("===== Gemini Analysis (HELP) =====")
            print(analysis)

            print("\n===== Your Current Code =====")
            print(code)
            print("=================================\n")
            continue

        if stripped == "":
            break

        lines.append(line)

    code = "\n".join(lines).rstrip("\n")
    if not code.strip():
        print("No code entered. Exiting.")
        return

    path = save_code_to_file(code)
    print(f"\nSaved your final code to: {path}")

    print("\nSending code to Gemini for FINAL analysis...\n")
    analysis = analyze_code_with_gemini(code)

    print("===== Gemini Analysis (FINAL) =====")
    print(analysis)

if __name__ == "__main__":
    main()
