import cv2
import mediapipe as mp
import numpy as np
from deepface import DeepFace  # DeepFace for emotion detection
import threading
import time
from queue import Queue

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Initialize video
cap = cv2.VideoCapture('low-eye.mp4')  # Replace with 0 for webcam
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

# Calculate eye contact score using 3D iris landmarks
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
    depth_diff = abs(left_center[2] - right_center[2])
    eye_contact_score = max(0, 100 - depth_diff * 4000)  # Normalize and scale
    return round(eye_contact_score, 2)

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


# Initialize MediaPipe Face Mesh
with mp_face_mesh.FaceMesh(refine_landmarks=True) as face_mesh:
    last_emotion_time = time.time()
    emotion_cooldown = 1.5  # Wait 1.5 seconds between emotion detections
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("End of video or cannot read frame.")
            break

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        if start_detection:
            face_results = face_mesh.process(rgb_frame)

            if face_results.multi_face_landmarks:
                for face_landmarks in face_results.multi_face_landmarks:
                    # Calculate eye contact score
                    eye_contact_score = calculate_eye_contact_score(face_landmarks.landmark)

                    # Only perform emotion detection if cooldown period has passed
                    if time.time() - last_emotion_time > emotion_cooldown:
                        threading.Thread(target=emotion_thread, args=(frame,)).start()
                        last_emotion_time = time.time()

                    # Combine scores if both are available
                    combined_score = 0
                    if current_emotion_score is not None:
                        combined_score = (eye_contact_score + current_emotion_score) / 2
                        final_overall_score += combined_score
                        total_frames += 1

                    # Display scores on the frame
                    cv2.putText(frame, f"Eye Contact: {eye_contact_score}%", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    if current_emotion:
                        cv2.putText(frame, f"Emotion: {current_emotion} ({round(current_emotion_score, 2)}%)", (10, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
                    if combined_score > 0:
                        cv2.putText(frame, f"Combined Score: {round(combined_score, 2)}%", (10, 170), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    # Draw face mesh and iris landmarks
                    mp_drawing.draw_landmarks(
                        frame,
                        face_landmarks,
                        mp_face_mesh.FACEMESH_IRISES,
                        landmark_drawing_spec=None,
                        connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_iris_connections_style()
                    )
                    # Draw a status bar
                    bar_width = int(combined_score * 2)  # Scale for visualization
                    cv2.rectangle(frame, (10, 200), (10 + bar_width, 230), (0, 255, 0), -1)  # Filled bar
                    cv2.rectangle(frame, (10, 200), (210, 230), (255, 255, 255), 2)  # Border

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
