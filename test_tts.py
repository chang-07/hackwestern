import os
from dotenv import load_dotenv
from app import text_to_speech

def test_tts():
    # Load environment variables
    load_dotenv('app.env')
    
    # Test text
    test_text = "Hello, this is a test of the ElevenLabs text-to-speech service."
    
    print("Testing TTS with text:", test_text)
    
    # Call the function
    output_file = text_to_speech(test_text)
    
    if output_file and os.path.exists(output_file):
        print(f"Success! Audio file saved to: {os.path.abspath(output_file)}")
        print(f"File size: {os.path.getsize(output_file)} bytes")
    else:
        print("Failed to generate audio file")

if __name__ == "__main__":
    test_tts()
