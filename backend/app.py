from flask import Flask, jsonify
import os
from flask_cors import CORS
import requests
from dotenv import load_dotenv

app = Flask(__name__)

load_dotenv()

# Enable CORS for all routes
CORS(app)

# Permit API key and URL
PERMIT_API_KEY = os.getenv("PERMIT_API_KEY")
PERMIT_API_URL = "https://api.permit.io/v2/schema/default/dev/resources"

print(PERMIT_API_KEY)

# Route to get data from Permit API
@app.route('/api', methods=['GET'])
def get_permit_data():
    headers = {
        "Authorization": f"Bearer {PERMIT_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Sending request to Permit API
    response = requests.get(PERMIT_API_URL, headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"error": "Failed to fetch data from Permit API"}), response.status_code

# Basic route for testing
@app.route('/')
def hello():
    return '<h1>Hello, World!</h1>'

# Run the app
if __name__ == '__main__':
    app.run(use_reloader=True)
