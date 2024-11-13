import cv2
import mediapipe as mp
import pickle
import time
import numpy as np

# Initialize MediaPipe FaceMesh
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

# Load emotion detection model (replace with actual model path)
with open('model.pkl', 'rb') as f:
    emotion_model = pickle.load(f)

# Initialize webcam
#cap = cv2.VideoCapture('video.mp4')
cap = cv2.VideoCapture(1)

# Variables for emotion grading
emotion_grade = 0
start_time = time.time()

def calculate_eye_contact(face_landmarks):
    left_eye_openness = np.abs(face_landmarks[159].y - face_landmarks[145].y)
    right_eye_openness = np.abs(face_landmarks[386].y - face_landmarks[374].y)
    avg_openness = (left_eye_openness + right_eye_openness) / 2
    eye_contact_percentage = max(0, min(100, avg_openness * 6700))
    return round(eye_contact_percentage, 2)

def calculate_body_language(face_landmarks):
    nose_tip = face_landmarks[1].x
    left_ear = face_landmarks[234].x
    right_ear = face_landmarks[454].x
    head_tilt = np.abs(left_ear - right_ear)
    body_language_score = 100 if head_tilt < 0.1 else 70 if head_tilt < 0.2 else 40
    return body_language_score

def landmarks_to_features(landmarks):
    return [coord for landmark in landmarks for coord in (landmark.x, landmark.y)]

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    with mp_face_mesh.FaceMesh() as face_mesh:
        results = face_mesh.process(rgb_frame)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                mp_drawing.draw_landmarks(frame, face_landmarks, mp_face_mesh.FACEMESH_CONTOURS)

                # Eye contact and body language
                eye_contact = calculate_eye_contact(face_landmarks.landmark)
                body_language_score = calculate_body_language(face_landmarks.landmark)

                # Predict emotion and grade it
                features = landmarks_to_features(face_landmarks.landmark)
                current_emotion = emotion_model.predict([features])[0]
                emotion_score = min(100, (time.time() - start_time) * 10)

                # Overall score calculation
                overall_score = (eye_contact * 0.4 + body_language_score * 0.3 + emotion_score * 0.3)
                overall_score = round(min(100, overall_score), 2)

                # Display results
                cv2.putText(frame, f"Eye Contact: {eye_contact}%", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, f"Body Language: {body_language_score}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, f"Emotion: {current_emotion}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.putText(frame, f"Overall Score: {overall_score}%", (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                cv2.rectangle(frame, (10, 150), (10 + int(overall_score * 3), 180), (0, 255, 0), -1)

    cv2.imshow('Emotion Detection', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
