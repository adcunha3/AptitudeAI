import cv2
import mediapipe as mp
import pickle
import time
import numpy as np

# Initialize MediaPipe FaceMesh
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

# Load emotion detection model
with open('model.pkl', 'rb') as f:
    emotion_model = pickle.load(f)

# Hardcoded emotion grades
emotion_grades = {
    'confidence': 100,
    'disinterest': 80,
    'empathy': 95,
    'frustration': 70,
    'happy': 100,
    'neutral': 85,
    'sad': 60,
}

# Initialize webcam
cap = cv2.VideoCapture('video.mp4')  
#cap = cv2.VideoCapture(1)

# Variables for control and scores
start_detection = False
final_overall_score = 0
total_frames = 0
average_score = None  # To store the final average score

# Mouse callback to detect button clicks
def mouse_callback(event, x, y, flags, param):
    global start_detection, final_overall_score, total_frames, average_score
    # Coordinates for "Start" button
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
                print(f"Detection stopped. Final Average Overall Score: {average_score}%")
            else:
                print("Detection stopped. No frames detected.")

# Set the mouse callback
cv2.namedWindow('Emotion Detection')
cv2.setMouseCallback('Emotion Detection', mouse_callback)

def calculate_eye_contact(face_landmarks):
    left_eye_points = [face_landmarks[i].y for i in [159, 145, 133, 153, 144, 163]]
    right_eye_points = [face_landmarks[i].y for i in [386, 374, 362, 382, 373, 390]]
    
    left_eye_openness = np.mean(np.abs(np.diff(left_eye_points)))
    right_eye_openness = np.mean(np.abs(np.diff(right_eye_points)))
    avg_openness = (left_eye_openness + right_eye_openness) / 2

    eye_contact_percentage = max(0, min(100, avg_openness * 20000))
    return round(eye_contact_percentage, 2)

def calculate_body_language(face_landmarks):
    nose_tip = face_landmarks[1].x
    left_ear = face_landmarks[234].x
    right_ear = face_landmarks[454].x
    left_shoulder = face_landmarks[287].x
    right_shoulder = face_landmarks[58].x

    head_tilt = np.abs(left_ear - right_ear)
    shoulder_alignment = np.abs(left_shoulder - right_shoulder)
    alignment_score = max(0, min(100, (100 - head_tilt * 100) * shoulder_alignment)) * 3

    if head_tilt < 0.05:
        engagement_score = 100
    elif head_tilt < 0.1:
        engagement_score = 85
    elif head_tilt < 0.15:
        engagement_score = 70
    elif head_tilt < 0.2:
        engagement_score = 55
    elif head_tilt < 0.3:
        engagement_score = 40
    else:
        engagement_score = 20

    body_language_score = max(0, min(100, round((engagement_score) + alignment_score, 2))) 
    return body_language_score

def get_emotion_score(emotion_name):
    return emotion_grades.get(emotion_name, 50)

def landmarks_to_features(landmarks):
    return [coord for landmark in landmarks for coord in (landmark.x, landmark.y)]

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    if start_detection:
        with mp_face_mesh.FaceMesh() as face_mesh:
            results = face_mesh.process(rgb_frame)

            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    # Eye contact and body language
                    eye_contact = calculate_eye_contact(face_landmarks.landmark)
                    body_language_score = calculate_body_language(face_landmarks.landmark)
                    
                    # Emotion prediction every 5 frames
                    if total_frames % 5 == 0:
                        features = landmarks_to_features(face_landmarks.landmark)
                        try:
                            current_emotion = emotion_model.predict([features])[0]
                            emotion_score = get_emotion_score(current_emotion)
                        except Exception as e:
                            current_emotion = 'neutral'
                            emotion_score = 50

                    # Overall score calculation
                    overall_score = (eye_contact * 0.4 + body_language_score * 0.3 + emotion_score * 0.3)
                    overall_score = round(min(100, overall_score), 2)
                    final_overall_score += overall_score
                    total_frames += 1

                    # Display results on frame
                    cv2.putText(frame, f"Eye Contact: {eye_contact}%", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    cv2.putText(frame, f"Body Language: {body_language_score}", (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    cv2.putText(frame, f"Emotion: {current_emotion} (Score: {emotion_score})", (10, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    cv2.putText(frame, f"Overall Score: {overall_score}%", (10, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    cv2.rectangle(frame, (10, 190), (10 + int(overall_score * 3), 220), (0, 0, 255), -1)

    # Draw "Start" and "End" buttons
    cv2.rectangle(frame, (10, 10), (110, 60), (0, 255, 0), -1)
    cv2.putText(frame, "Start", (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.rectangle(frame, (130, 10), (230, 60), (0, 0, 255), -1)
    cv2.putText(frame, "End", (140, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    # Show final average score if detection has ended
    if average_score is not None:
        cv2.putText(frame, f"Final Average Score: {average_score}%", (10, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    # Show frame
    cv2.imshow('Emotion Detection', frame)
    
    key = cv2.waitKey(1)
    if key & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
