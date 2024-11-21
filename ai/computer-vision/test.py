import cv2
import mediapipe as mp
import numpy as np
from deepface import DeepFace  # DeepFace for emotion detection
import threading
import time
from queue import Queue
import math

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose

# Initialize video
cap = cv2.VideoCapture('review.mp4')  # Replace with 0 for webcam
if not cap.isOpened():
    print("Error: Could not open video file or webcam.")
    exit()

# Get video FPS to match playback speed
fps = cap.get(cv2.CAP_PROP_FPS)
frame_delay = int(1000 / fps)  # Milliseconds per frame

# Variables for control
start_detection = False
final_overall_score = 0
total_frames = 0
average_score = None
frame_counter = 0  # Frame counter to control emotion detection frequency

# Variables to store the current emotion and its score
current_emotion = None
current_emotion_score = None

# Thread-safe Queue to store emotion data
emotion_queue = Queue()

# Mouse callback function for controlling the detection
def mouse_callback(event, x, y, flags, param):
    global start_detection, final_overall_score, total_frames, average_score
    if event == cv2.EVENT_LBUTTONDOWN:
        if 10 <= x <= 110 and 10 <= y <= 60:  # Start button
            start_detection = True
            final_overall_score = 0
            total_frames = 0
            average_score = None
            print("Detection started...")
        elif 130 <= x <= 230 and 10 <= y <= 60:  # End button
            start_detection = False
            if total_frames > 0:
                average_score = round(final_overall_score / total_frames, 2)
                print(f"Detection stopped. Final Average Score: {average_score}%")
            else:
                print("Detection stopped. No frames detected.")

cv2.namedWindow('AI Interview Detection')
cv2.setMouseCallback('AI Interview Detection', mouse_callback)

# Detect face emotion function using DeepFace
def detect_face_emotion(frame):
    """
    Detects emotion using DeepFace library.
    """
    try:
        # DeepFace analyzes the frame and returns the dominant emotion
        analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
        emotion_class = analysis[0]['dominant_emotion']  # Get the dominant emotion
        emotion_score = analysis[0]['emotion'][emotion_class]  # Emotion score
        return emotion_class, emotion_score
    except Exception as e:
        print(f"Emotion prediction error: {e}")
        return None, None

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

# Function to calculate the angle between three points
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


# Hardcoded emotion grades
emotion_grades = {
    'surprise': 75,
    'fear': 15,
    'happy': 100,
    'neutral': 60,
    'angry': 45,
    'sad': 30
}

# Emotion thread function to process emotion detection in background
def emotion_thread(frame):
    global current_emotion, current_emotion_score
    emotion_class, emotion_score = detect_face_emotion(frame)

    if emotion_class:
        # Check if the emotion has a hardcoded grade
        if emotion_class in emotion_grades:
            emotion_score = emotion_grades[emotion_class]  # Normalize to 0-100 range

        # Update emotion only if it's different from the current one
        if emotion_class != current_emotion:
            current_emotion = emotion_class
            current_emotion_score = emotion_score


# Initialize MediaPipe Face Mesh and Pose
with mp_face_mesh.FaceMesh(refine_landmarks=True) as face_mesh, mp_pose.Pose() as pose:
    last_emotion_time = time.time()
    emotion_cooldown = 1.5
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("End of video or cannot read frame.")
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        if start_detection:
            face_results = face_mesh.process(rgb_frame)
            pose_results = pose.process(rgb_frame)

            if face_results.multi_face_landmarks:
                for face_landmarks in face_results.multi_face_landmarks:
                    # Calculate eye contact score
                    eye_contact_score = calculate_eye_contact_score(face_landmarks.landmark)
                    
                    # Calculate body language score
                    if pose_results.pose_landmarks:
                        body_language_score = calculate_body_language_score(pose_results.pose_landmarks.landmark)

                    # Only perform emotion detection if cooldown period has passed
                    if time.time() - last_emotion_time > emotion_cooldown:
                        threading.Thread(target=emotion_thread, args=(frame,)).start()
                        last_emotion_time = time.time()

                    # Combine metrics
                    combined_score = eye_contact_score
                    if current_emotion_score is not None:
                        combined_score = (eye_contact_score + current_emotion_score + body_language_score)/3

                    final_overall_score += combined_score
                    total_frames += 1

                    # Display metrics
                    cv2.putText(frame, f"Eye Contact: {eye_contact_score}%", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    if current_emotion:
                        cv2.putText(frame, f"Emotion: {current_emotion} ({round(current_emotion_score, 2)}%)", (10, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                    if body_language_score:
                        cv2.putText(frame, f"Body Language: {body_language_score}%", (10, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                    if combined_score > 0:
                        cv2.putText(frame, f"Combined Score: {round(combined_score, 2)}%", (10, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                    # Draw face mesh and iris landmarks
                    mp_drawing.draw_landmarks(
                        frame,
                        face_landmarks,
                        mp_face_mesh.FACEMESH_IRISES,
                        landmark_drawing_spec=None,
                        connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_iris_connections_style()
                    )

                    if pose_results.pose_landmarks:
                        mp_drawing.draw_landmarks(
                        frame,
                        pose_results.pose_landmarks,
                        mp_pose.POSE_CONNECTIONS
                    )

                    # Draw a status bar
                    bar_width = int(combined_score * 2)  # Scale for visualization
                    cv2.rectangle(frame, (10, 250), (10 + bar_width, 300), (0, 255, 0), -1)  # Filled bar
                    cv2.rectangle(frame, (10, 250), (210, 300), (255, 255, 255), 2)  # Border

        # Draw "Start" and "End" buttons
        cv2.rectangle(frame, (10, 10), (110, 60), (0, 255, 0), -1)
        cv2.putText(frame, "Start", (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.rectangle(frame, (130, 10), (230, 60), (0, 0, 255), -1)
        cv2.putText(frame, "End", (140, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        if average_score is not None:
            cv2.putText(frame, f"Final Average Score: {average_score}%", (10, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        # Display the frame
        cv2.imshow('AI Interview Detection', frame)

        # Maintain video playback speed
        if cv2.waitKey(frame_delay) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
