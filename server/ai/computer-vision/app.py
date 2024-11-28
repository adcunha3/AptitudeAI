from flask import Flask, request, jsonify
import cv2
import base64
import numpy as np
from test import process_frame  # Import your processing function

app = Flask(__name__)

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

@app.route('/process-frame', methods=['POST'])
def process_frame_route():
    try:
        # Get JSON data from request
        data = request.get_json()
        frame = data.get('frame')
        if not frame:
            return jsonify({'error': 'No frame provided'}), 400

        # Decode Base64 image
        image = decode_base64_image(frame)

        # Process the image using your model
        scores = process_frame(image)  # This should return a dictionary with the scores

        # Return the processed scores as JSON
        return jsonify(scores)

    except Exception as e:
        # Return error response in case of exceptions
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)