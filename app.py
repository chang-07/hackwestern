from flask import Flask, request, jsonify
from flask_cors import CORS

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

if __name__ == '__main__':
    app.run(debug=True)