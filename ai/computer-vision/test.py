import cv2
import mediapipe as mp
import numpy as np
from deepface import DeepFace
import math
import json
import base64  # Import base64 module
# Suppress TensorFlow logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Suppress oneDNN logs
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

# Alternatively, configure TensorFlow logging directly
tf.get_logger().setLevel('ERROR')
# Initialize MediaPipe Face Mesh and Pose
mp_face_mesh = mp.solutions.face_mesh
mp_pose = mp.solutions.pose

# Function to calculate eye contact score
def calculate_eye_contact_score(face_landmarks):
    # Extract iris landmarks (indices based on MediaPipe's documentation)
    left_iris_indices = [474, 475, 476, 477]
    right_iris_indices = [469, 470, 471, 472]

    # Calculate the centers of the irises
    left_iris = np.array([(face_landmarks[i].x, face_landmarks[i].y, face_landmarks[i].z) for i in left_iris_indices])
    right_iris = np.array([(face_landmarks[i].x, face_landmarks[i].y, face_landmarks[i].z) for i in right_iris_indices])

    left_center = np.mean(left_iris, axis=0)
    right_center = np.mean(right_iris, axis=0)

    # Calculate depth (z-coordinate) difference to approximate gaze alignment
    left_eye_depth = left_center[2]
    right_eye_depth = right_center[2]

    # Score based on the proximity of both eyes' depth to being aligned
    depth_diff = abs(left_eye_depth - right_eye_depth)
    eye_contact_score = max(0, 100 - depth_diff * 4000)  # Normalize and scale

    # Horizontal and Vertical Gaze Direction Analysis
    # Define eye contour indices (based on MediaPipe)
    left_eye_indices = [33, 133, 160, 144, 145, 153, 154, 155]
    right_eye_indices = [362, 263, 387, 373, 374, 380, 381, 382]

    # Calculate bounding box for each eye
    left_eye = np.array([(face_landmarks[i].x, face_landmarks[i].y) for i in left_eye_indices])
    right_eye = np.array([(face_landmarks[i].x, face_landmarks[i].y) for i in right_eye_indices])

    left_eye_bbox = np.ptp(left_eye, axis=0)  # Width, Height of left eye
    right_eye_bbox = np.ptp(right_eye, axis=0)  # Width, Height of right eye

    # Normalize iris center positions within eye bounding boxes
    left_iris_normalized = (left_center[:2] - np.min(left_eye, axis=0)) / left_eye_bbox
    right_iris_normalized = (right_center[:2] - np.min(right_eye, axis=0)) / right_eye_bbox

    # Check if iris centers are near the center of their respective bounding boxes
    horizontal_score = max(0, 100 - abs(left_iris_normalized[0] - 0.5) * 200 - abs(right_iris_normalized[0] - 0.5) * 200)
    vertical_score = max(0, 100 - abs(left_iris_normalized[1] - 0.5) * 200 - abs(right_iris_normalized[1] - 0.5) * 200)

    #print(horizontal_score)
    #print(vertical_score)

    # Pupil Size Variability
    left_pupil_size = np.linalg.norm(left_iris[0] - left_iris[2])
    right_pupil_size = np.linalg.norm(right_iris[0] - right_iris[2])

    # Penalize based on pupil size discrepancy
    pupil_size_diff = abs(left_pupil_size - right_pupil_size)
    pupil_score = max(0, 100 - pupil_size_diff * 5000)

    #print(pupil_score)

    # Combine Depth, Gaze Alignment, Horizontal, Vertical, and Pupil Size Scores
    final_eye_contact_score = (
        0.8 * eye_contact_score +
        0.05 * horizontal_score +
        0.05 * vertical_score +
        0.1 * pupil_score
    )
    final_eye_contact_score = max(0, min(100, final_eye_contact_score*1.05))  # Clamp to 0-100 range

    return round(final_eye_contact_score, 2)


# Function to calculate body language score
def calculate_angle(a, b, c):
    angle = math.atan2(c.y - b.y, c.x - b.x) - math.atan2(a.y - b.y, a.x - b.x)
    return abs(math.degrees(angle)) % 360

# Calculate body language score using Pose landmarks
def calculate_body_language_score(pose_landmarks):
    if not pose_landmarks:
        return 0

    # Define body parts for calculation
    left_shoulder = pose_landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = pose_landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    left_hip = pose_landmarks[mp_pose.PoseLandmark.LEFT_HIP]
    right_hip = pose_landmarks[mp_pose.PoseLandmark.RIGHT_HIP]
    nose = pose_landmarks[mp_pose.PoseLandmark.NOSE]
    left_ear = pose_landmarks[mp_pose.PoseLandmark.LEFT_EAR]
    right_ear = pose_landmarks[mp_pose.PoseLandmark.RIGHT_EAR]

    # Calculate shoulder alignment (vertical difference)
    shoulder_alignment = abs(left_shoulder.y - right_shoulder.y)

    # Calculate hip alignment (vertical difference)
    hip_alignment = abs(left_hip.y - right_hip.y)

    # Calculate head tilt (angle between nose and shoulders)
    head_tilt_angle = calculate_angle(left_shoulder, nose, right_shoulder)

    # Normalize head tilt to a 0-100 scale (closer to 90 degrees is considered "ideal")
    head_tilt_score = max(0, min(100, 100 - abs(90 - head_tilt_angle)))

    # Penalize if shoulders or hips are misaligned
    shoulder_score = max(0, 100 - shoulder_alignment * 1000)
    hip_score = max(0, 100 - hip_alignment * 1000)

    # Combine scores: weight each component
    total_score = (shoulder_score * 0.4) + (hip_score * 0.3) + (head_tilt_score * 0.3)

    return round(total_score, 2)

# Function to detect emotion using DeepFace
def detect_face_emotion(frame):
    try:
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        emotion_class = analysis[0]['dominant_emotion']
        emotion_score = analysis[0]['emotion'][emotion_class]
        return emotion_class, emotion_score
    except Exception as e:
        print(f"Emotion detection error: {e}")
        return None, None

# Process single frame
def process_frame(frame):
    # Convert the frame to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Initialize MediaPipe solutions
    with mp_face_mesh.FaceMesh(refine_landmarks=True) as face_mesh, mp_pose.Pose() as pose:
        face_results = face_mesh.process(rgb_frame)
        pose_results = pose.process(rgb_frame)

        # Initialize scores
        eye_contact_score = 0
        body_language_score = 0
        emotion_score = 0
        overall_score = 0

        # Calculate eye contact score if face landmarks are detected
        if face_results.multi_face_landmarks:
            for face_landmarks in face_results.multi_face_landmarks:
                eye_contact_score = calculate_eye_contact_score(face_landmarks.landmark)
                break  # Only process the first face for simplicity

        # Calculate body language score if pose landmarks are detected
        if pose_results.pose_landmarks:
            body_language_score = calculate_body_language_score(pose_results.pose_landmarks.landmark)

        # Perform emotion detection
        emotion_class, detected_emotion_score = detect_face_emotion(frame)
        if detected_emotion_score:
            emotion_score = detected_emotion_score

        # Calculate overall score as a weighted average
        overall_score = (0.4 * eye_contact_score + 0.4 * body_language_score + 0.2 * emotion_score)

        # Return all calculated metrics
        return {
            "eye_contact": round(eye_contact_score, 2),
            "body_language": round(body_language_score, 2),
            "emotion_score": round(emotion_score, 2),
            "overall_score": round(overall_score, 2),
        }

# Entry point to process a frame and output JSON result
if __name__ == "__main__":
    import sys

    # Read input JSON from stdin
    input_data = sys.stdin.read()
    input_frame_data = json.loads(input_data).get("frame")

    # Decode Base64 frame (ensure input is Base64 encoded)
    nparr = np.frombuffer(base64.b64decode(input_frame_data), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Process the frame and calculate scores
    results = process_frame(frame)

    # Print results as JSON
    print(json.dumps(results))
