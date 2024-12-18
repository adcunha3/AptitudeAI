from flask import Flask, request, jsonify
import cv2
import base64
import numpy as np
from test import process_frame
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:4200"}})

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
    
@app.route('/test-cors', methods=['GET', 'OPTIONS'])
def test_cors():
    return jsonify({"message": "CORS is working!"})

if __name__ == '__main__':
    app.run(debug=True, port=8080)