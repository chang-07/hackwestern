from analyzer import save_code_to_file, analyze_code_with_gemini

def run_help(code: str) -> str:
    path = save_code_to_file(code)
    print(f"\nSaved your code to helper file: {path}")
    print("Running AI helper...\n")

    analysis = analyze_code_with_gemini(code)
    return analysis