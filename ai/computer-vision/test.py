import cv2
import mediapipe as mp
import numpy as np

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

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

# Mouse callback function
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

cv2.namedWindow('Eye Contact Detection')
cv2.setMouseCallback('Eye Contact Detection', mouse_callback)

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
    final_eye_contact_score = max(0, min(100, final_eye_contact_score))  # Clamp to 0-100 range

    return round(final_eye_contact_score, 2)

# Initialize MediaPipe Face Mesh
with mp_face_mesh.FaceMesh(refine_landmarks=True) as face_mesh:
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

                    # Accumulate scores for average calculation
                    final_overall_score += eye_contact_score
                    total_frames += 1

                    # Display scores
                    cv2.putText(frame, f"Eye Contact: {eye_contact_score}%", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

                # Draw face mesh and iris landmarks
                mp_drawing.draw_landmarks(
                    frame,
                    face_landmarks,
                    mp_face_mesh.FACEMESH_IRISES,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_iris_connections_style())

        # Draw "Start" and "End" buttons
        cv2.rectangle(frame, (10, 10), (110, 60), (0, 255, 0), -1)
        cv2.putText(frame, "Start", (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.rectangle(frame, (130, 10), (230, 60), (0, 0, 255), -1)
        cv2.putText(frame, "End", (140, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        if average_score is not None:
            cv2.putText(frame, f"Final Average Score: {average_score}%", (10, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        # Display the frame
        cv2.imshow('Eye Contact Detection', frame)

        # Maintain video playback speed
        if cv2.waitKey(frame_delay) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
