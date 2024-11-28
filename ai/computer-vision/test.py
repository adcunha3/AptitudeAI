import os
# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Suppress oneDNN logs
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
import tensorflow as tf
# Alternatively, configure TensorFlow logging directly
tf.get_logger().setLevel('ERROR')
import sys
import traceback
import cv2
import mediapipe as mp
import numpy as np
from deepface import DeepFace
import json
import math
import logging

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG to capture all logs
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger()

# Suppress TensorFlow and MediaPipe logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
from absl import logging
logging.set_verbosity(logging.ERROR)

# Initialize MediaPipe Face Mesh and Pose
mp_face_mesh = mp.solutions.face_mesh
mp_pose = mp.solutions.pose

# Eye Contact Score Calculation
def calculate_eye_contact_score(face_landmarks):
    left_iris_indices = [474, 475, 476, 477]
    right_iris_indices = [469, 470, 471, 472]

    # Calculate iris centers
    left_iris = np.array([(face_landmarks[i].x, face_landmarks[i].y, face_landmarks[i].z) for i in left_iris_indices])
    right_iris = np.array([(face_landmarks[i].x, face_landmarks[i].y, face_landmarks[i].z) for i in right_iris_indices])

    left_center = np.mean(left_iris, axis=0)
    right_center = np.mean(right_iris, axis=0)

    left_eye_depth = left_center[2]
    right_eye_depth = right_center[2]
    depth_diff = abs(left_eye_depth - right_eye_depth)
    eye_contact_score = max(0, 100 - depth_diff * 4000)

    left_eye_indices = [33, 133, 160, 144, 145, 153, 154, 155]
    right_eye_indices = [362, 263, 387, 373, 374, 380, 381, 382]

    left_eye = np.array([(face_landmarks[i].x, face_landmarks[i].y) for i in left_eye_indices])
    right_eye = np.array([(face_landmarks[i].x, face_landmarks[i].y) for i in right_eye_indices])

    left_eye_bbox = np.ptp(left_eye, axis=0)
    right_eye_bbox = np.ptp(right_eye, axis=0)

    left_iris_normalized = (left_center[:2] - np.min(left_eye, axis=0)) / left_eye_bbox
    right_iris_normalized = (right_center[:2] - np.min(right_eye, axis=0)) / right_eye_bbox

    horizontal_score = max(0, 100 - abs(left_iris_normalized[0] - 0.5) * 200 - abs(right_iris_normalized[0] - 0.5) * 200)
    vertical_score = max(0, 100 - abs(left_iris_normalized[1] - 0.5) * 200 - abs(right_iris_normalized[1] - 0.5) * 200)

    left_pupil_size = np.linalg.norm(left_iris[0] - left_iris[2])
    right_pupil_size = np.linalg.norm(right_iris[0] - right_iris[2])
    pupil_size_diff = abs(left_pupil_size - right_pupil_size)
    pupil_score = max(0, 100 - pupil_size_diff * 5000)

    final_eye_contact_score = (
        0.8 * eye_contact_score +
        0.05 * horizontal_score +
        0.05 * vertical_score +
        0.1 * pupil_score
    )
    final_eye_contact_score = max(0, min(100, final_eye_contact_score * 1.05))
    return round(final_eye_contact_score, 2)

# Body Language Score Calculation
def calculate_angle(a, b, c):
    angle = math.atan2(c.y - b.y, c.x - b.x) - math.atan2(a.y - b.y, a.x - b.x)
    return abs(math.degrees(angle)) % 360

def calculate_body_language_score(pose_landmarks):
    if not pose_landmarks:
        return 0
    left_shoulder = pose_landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = pose_landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    left_hip = pose_landmarks[mp_pose.PoseLandmark.LEFT_HIP]
    right_hip = pose_landmarks[mp_pose.PoseLandmark.RIGHT_HIP]
    nose = pose_landmarks[mp_pose.PoseLandmark.NOSE]

    shoulder_alignment = abs(left_shoulder.y - right_shoulder.y)
    hip_alignment = abs(left_hip.y - right_hip.y)
    head_tilt_angle = calculate_angle(left_shoulder, nose, right_shoulder)

    head_tilt_score = max(0, min(100, 100 - abs(90 - head_tilt_angle)))
    shoulder_score = max(0, 100 - shoulder_alignment * 1000)
    hip_score = max(0, 100 - hip_alignment * 1000)

    total_score = (shoulder_score * 0.4) + (hip_score * 0.3) + (head_tilt_score * 0.3)
    return round(total_score, 2)

# Emotion Detection Using DeepFace
def detect_face_emotion(frame):
    emotion_grades = {
        'surprise': 75,
        'fear': 15,
        'happy': 100,
        'neutral': 60,
        'angry': 45,
        'sad': 30
    }
    try:
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        emotion_class = analysis[0]['dominant_emotion']  # Get the dominant emotion as a string
        emotion_score = emotion_grades.get(emotion_class, 0)  # Fetch score from the predefined dictionary
        return emotion_score
    except Exception as e:
        print(f"Emotion detection error: {e}")
        return 0

# Main Frame Processing
def process_frame(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    with mp_face_mesh.FaceMesh(refine_landmarks=True) as face_mesh, mp_pose.Pose() as pose:
        face_results = face_mesh.process(rgb_frame)
        pose_results = pose.process(rgb_frame)

        eye_contact_score = 0
        body_language_score = 0
        emotion_score = 0
        overall_score = 0

        if face_results.multi_face_landmarks:
            face_landmarks = face_results.multi_face_landmarks[0]
            eye_contact_score = calculate_eye_contact_score(face_landmarks.landmark)

        if pose_results.pose_landmarks:
            body_language_score = calculate_body_language_score(pose_results.pose_landmarks.landmark)

        emotion_score = detect_face_emotion(frame)

        overall_score = (0.4 * eye_contact_score + 0.4 * body_language_score + 0.2 * emotion_score)

        return {
            "eye_contact": round(eye_contact_score, 2),
            "body_language": round(body_language_score, 2),
            "emotion_score": round(emotion_score, 2),  # Only include the emotion score
            "overall_score": round(overall_score, 2),
        }

if __name__ == "__main__":
    try:
        # Log script start
        logger.debug("Python script started.")

        # Get the file path from command-line arguments
        if len(sys.argv) < 2:
            logger.error("No file path provided as an argument.")
            raise ValueError("Image file path is required.")
        file_path = sys.argv[1]
        logger.debug(f"Image file path: {file_path}")

        # Load and validate the image
        frame = cv2.imread(file_path)
        if frame is None:
            logger.error("Failed to read the image from the file.")
            raise ValueError("Failed to read the image from the file.")
        logger.debug("Image loaded successfully.")

        # Resize the frame
        frame = cv2.resize(frame, (640, 480))
        logger.debug("Image resized to 640x480.")

        # Process the frame
        logger.debug("Starting frame processing...")
        results = process_frame(frame)
        logger.debug(f"Processing results: {results}")

        # Print results in JSON format
        print(json.dumps(results))
        logger.debug("Results successfully printed as JSON.")

    except Exception as e:
        exc_type, exc_value, exc_tb = sys.exc_info()
        error_message = "".join(traceback.format_exception(exc_type, exc_value, exc_tb))
        logger.error(f"Error in Python script: {error_message}")
        # Return JSON error to ensure proper feedback
        print(json.dumps({"error": "Processing failed", "details": error_message}))
