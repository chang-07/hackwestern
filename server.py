from analyzer import save_code_to_file, analyze_code_with_gemini, get_random_question

def main():
    title, description = get_random_question()

    print("===== Interview Question =====")
    print(f"Title: {title}")
    print(f"Description: {description}")
    print("\nPaste your solution to THIS question below.")
    print("When you're done, press ENTER on an empty line to send it to Gemini.\n")

    lines = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if line.strip() == "":
            break
        lines.append(line)

    code = "\n".join(lines)
    if not code.strip():
        print("No code entered. Exiting.")
        return

    path = save_code_to_file(code)
    print(f"\nSaved your code to: {path}")

    print("\nSending code to Gemini for analysis...\n")
    analysis = analyze_code_with_gemini(code, question=(title, description))

    print("===== Gemini Analysis =====")
    print(analysis)


if __name__ == "__main__":
    main()
