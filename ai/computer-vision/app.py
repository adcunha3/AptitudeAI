from flask import Flask, render_template, Response, request, jsonify
import cv2
import numpy as np
import base64
from test import process_frame
import speech_recognition as sr
from textblob import TextBlob
import time
import threading
from flask_cors import CORS
import sys
import os

# Get the absolute path of the project root
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)

# Now import AI function
from language.generate_question.question import evaluate_response
from language.generate_question.question import FIRST_QUESTION
from language.generate_question.question import generate_follow_up_question
from language.generate_question.question import generate_example_response

app = Flask(__name__)

# Initialize webcam
cap = cv2.VideoCapture(0)

def decode_base64_image(base64_image):
    """Decode a Base64-encoded image into a NumPy array."""
    try:
        image_data = base64.b64decode(base64_image)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None or image.size == 0:
            raise ValueError("Decoded image is empty.")
        return image
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")
    
@app.after_request
def add_cors_headers(response):
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:4200")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    return response

@app.route('/process-frame', methods=['POST'])
def process_frame_route():
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data or 'frame' not in data:
            app.logger.error("Request JSON is missing or 'frame' key is not provided.")
            return jsonify({'error': 'Invalid request. Frame data is required.'}), 400

        frame = data['frame']
        if not isinstance(frame, str) or not frame.startswith("data:image/"):
            app.logger.error("Invalid frame format. Expected a Base64-encoded image.")
            return jsonify({'error': 'Invalid frame format. Expected a Base64-encoded image.'}), 400

        # Extract and decode Base64 image
        base64_image = frame.split(",", 1)[-1]  # Extract the Base64 data
        image = decode_base64_image(base64_image)

        # Process the image using your model
        scores = process_frame(image)  # Ensure this function returns a serializable dictionary
        if not isinstance(scores, dict):
            raise ValueError("Processing function must return a dictionary.")

        # Return the processed scores as JSON
        return jsonify(scores), 200

    except ValueError as ve:
        app.logger.error(f"ValueError: {ve}")
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        app.logger.exception("An unexpected error occurred.")
        return jsonify({'error': 'An unexpected error occurred. Please try again later.'}), 500
    
@app.route("/get_question", methods=["GET"])
def get_question():
    return jsonify({"question": FIRST_QUESTION})


@app.route("/evaluate-response", methods=["POST"])
def evaluate():
    data = request.get_json()  # Get JSON from frontend
    user_response = data.get("response")  # Extract user's response

    if not user_response:
        return jsonify({"error": "No response provided"}), 400

    feedback = evaluate_response(user_response)  # Call AI function
    example_response = generate_example_response(user_response)
    follow_up_question = generate_follow_up_question(user_response)

    return jsonify({"analysis": feedback, "example_response": example_response, "follow_up": follow_up_question})  # Return AI feedback to frontend

@app.route('/test-cors', methods=['GET', 'OPTIONS'])
def test_cors():
    return jsonify({"message": "CORS is working!"})

def analyze_sentiment(text):
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    sentiment = "Positive" if polarity > 0 else "Negative" if polarity < 0 else "Neutral"
    
    # Normalize polarity to be between 0 and 100 for better presentation
    polarity_percentage = (polarity + 1) * 50  # Scale to 0 - 100 range
    
    # Round the polarity to a reasonable number of decimal places
    polarity_percentage = round(polarity_percentage, 2)
    
    return sentiment, polarity_percentage

# Function to recognize speech
def recognize_speech():
    recognizer = sr.Recognizer()
    mic = sr.Microphone()
    with mic as source:
        recognizer.adjust_for_ambient_noise(source)
        print("Listening...")
        audio = recognizer.listen(source)
    try:
        text = recognizer.recognize_google(audio)
        sentiment, score = analyze_sentiment(text)
        return {"text": text, "sentiment": sentiment, "score": score}
    except Exception as e:
        return {"text": "", "sentiment": "Neutral", "score": 0.0}

# Background thread for speech analysis
def speech_thread():
    while True:
        speech_result = recognize_speech()
        print(f"Speech: {speech_result['text']}, Sentiment: {speech_result['sentiment']}, Score: {speech_result['score']}")
        time.sleep(5)

# Start speech analysis thread
threading.Thread(target=speech_thread, daemon=True).start()

def decode_base64_image(base64_image):
    """Decode a Base64-encoded image into a NumPy array."""
    try:
        image_data = base64.b64decode(base64_image)
        np_arr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if image is None or image.size == 0:
            raise ValueError("Decoded image is empty.")
        return image
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")
    
# Video feed function
def generate_frames():
    while True:
        success, frame = cap.read()
        if not success:
            break
        else:
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# Route to serve index page
@app.route('/')
def index():
    return render_template('index.html')

# Route to stream video
@app.route('/video-stream')
def video_stream():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Route to handle audio analysis
@app.route('/process-audio', methods=['POST'])
def process_audio():
    speech_result = recognize_speech()
    return jsonify(speech_result)
# Route for analyzing sentiment of text
@app.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment_route():
    data = request.get_json()
    text = data.get('text', '')
    
    sentiment, score = analyze_sentiment(text)
    
    response = {
        'sentiment_score': score,
        'sentiment': sentiment
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=8080)