import cv2
import speech_recognition as sr
import threading

def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source)
        while True:
            print("Listening...")
            try:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=5)  # Increase timeout if needed
                text = recognizer.recognize_google(audio)
                print(f"You said: {text}")
            except sr.WaitTimeoutError:
                print("No speech detected, retrying...")
            except sr.UnknownValueError:
                print("Could not understand the audio.")
            except sr.RequestError:
                print("Could not request results. Check your internet connection.")

def capture_webcam():
    cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        cv2.imshow("Webcam Feed", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    speech_thread = threading.Thread(target=recognize_speech, daemon=True)
    speech_thread.start()
    capture_webcam()