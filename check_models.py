import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('app.env')

print("Checking available models...")
try:
    # Configure with your API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set")
    else:
        print("API Key found. Checking models...")
        genai.configure(api_key=api_key)
        
        # List available models
        print("\n=== Available Models ===")
        models = genai.list_models()
        
        found_models = False
        for m in models:
            if hasattr(m, 'supported_generation_methods'):
                if 'generateContent' in m.supported_generation_methods:
                    print(f"- {m.name} (supports generateContent)")
                    found_models = True
        
        if not found_models:
            print("No models found that support generateContent")
            print("\nAll available models:")
            for m in models:
                print(f"- {m.name}")
                
except Exception as e:
    print(f"Error: {e}")
    print("\nTroubleshooting steps:")
    print("1. Make sure you have the latest version: pip install --upgrade google-generativeai")
    print("2. Verify your API key is correct and has the right permissions")
    print("3. Check https://ai.google.dev/ for API status and documentation")
