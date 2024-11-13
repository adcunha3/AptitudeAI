from cvzone.FaceMeshModule import FaceMeshDetector
import cv2
import numpy as np
import csv

# Initialize webcam and FaceMeshDetector
cap = cv2.VideoCapture(1)
FMD = FaceMeshDetector()
class_name = 'empathy'  # Specify emotion label

# Buffered data for efficient writing
buffer_data = []

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.resize(frame, (720, 480))
    img, faces = FMD.findFaceMesh(frame)

    if faces:
        face = faces[0]
        face_data = list(np.array(face).flatten())
        face_data.insert(0, class_name)
        buffer_data.append(face_data)

        # Write to CSV in batches
        if len(buffer_data) >= 50:  # Batch size of 50
            with open('data.csv', 'a', newline='') as f:
                csv_writer = csv.writer(f, delimiter=',')
                csv_writer.writerows(buffer_data)
                buffer_data = []  # Clear buffer after writing

    cv2.imshow('Data Collection', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Write remaining data in buffer
if buffer_data:
    with open('data.csv', 'a', newline='') as f:
        csv_writer = csv.writer(f, delimiter=',')
        csv_writer.writerows(buffer_data)

cap.release()
cv2.destroyAllWindows()
