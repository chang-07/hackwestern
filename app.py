from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from analyzer import analyze_code_with_gemini
import os

load_dotenv(dotenv_path='app.env')

app = Flask(__name__)
CORS(app)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/save-code', methods=['POST'])
def save_code():
    data = request.get_json()
    if 'code' not in data:
        return jsonify({'error': 'Missing code in request body'}), 400

    try:
        with open('test.txt', 'w') as f:
            f.write(data['code'])
        return jsonify({'message': 'Code saved successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        print("Received data:", data)  # Debug log
        
        if 'code' not in data or 'question' not in data:
            error_msg = f"Missing required fields. Got: {list(data.keys())}"
            print(error_msg)  # Debug log
            return jsonify({'error': error_msg}), 400

        # Convert the question string to a tuple with title and empty description
        question_title = data['question']
        question = (question_title, "")  # Empty string as description
        print(f"Calling analyze_code_with_gemini with code length: {len(data['code'])}, question: {question}")  # Debug log
        
        analysis_result = analyze_code_with_gemini(data['code'], question)
        return jsonify({'analysis': analysis_result})
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in /analyze endpoint: {error_trace}")  # Debug log
        return jsonify({'error': str(e), 'trace': error_trace}), 500

if __name__ == '__main__':
    app.run(debug=True)