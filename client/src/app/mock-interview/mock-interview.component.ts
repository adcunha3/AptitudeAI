import { Component, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { VideoRecordingService } from '../../services/video-recording.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // <-- Import FormsModule here

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- Add FormsModule here
  templateUrl: './mock-interview.component.html',
  styleUrls: ['./mock-interview.component.css'],
})
export class MockInterviewComponent implements OnInit, AfterViewInit {
  @ViewChild('video') videoElementRef!: ElementRef;
  @ViewChild('canvas') canvasElementRef!: ElementRef;

  videoElement!: HTMLVideoElement;
  mediaRecorder!: any;
  recordedBlobs!: Blob[];
  isRecording: boolean = false;
  question: string = "Loading question..."; // Placeholder for AI-generated question
  userResponse: string = "";  // Stores user response
  aiFeedback: string = "";  // Stores AI feedback
  exampleResponse: string = "";
  downloadUrl!: string;
  stream!: MediaStream;
  canvasElement!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D | null;
  intervalId!: any;
  eyeContactPercent = 0;
  bodyLanguagePercent = 0;
  emotionPercent = 0;
  overallPercent = 0;
  sentimentScore = 0;
  spokenText: string = "";
  recognition: any;

  constructor(private videoRecordingService: VideoRecordingService, private http: HttpClient) {}

  ngOnInit(): void {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 360 }
      })
      .then(stream => {
        this.videoElement = this.videoElementRef.nativeElement;

        this.stream = stream;
        this.videoElement.srcObject = this.stream;
      })
      .catch(err => {
        console.error('Error accessing webcam:', err);
      });
    this.fetchQuestion();
    this.initializeVideoStream();
  }

  ngAfterViewInit(): void {
    this.canvasElement = this.canvasElementRef.nativeElement;
    this.ctx = this.canvasElement.getContext('2d');
  }

  /** Fetches the AI-generated interview question */
  fetchQuestion() {
    this.http.get<{ question: string }>("http://localhost:8080/get_question").subscribe({
      next: (res) => { this.question = res.question; },
      error: (err) => { console.error("Error fetching question:", err); }
    });
  }

  /** Submits user response to AI backend for evaluation */
  submitResponse() {


    const studentId = localStorage.getItem("userId");

    console.log("🟢 Retrieved User ID from Local Storage:", studentId, typeof studentId);
    if (!studentId) {
      console.error("❌ No student ID found. User might not be logged in.");
      alert("Error: You must be logged in to submit a response.");
      return;
  }


    if (!this.spokenText.trim()) {
      console.error("No spoken text to submit.");
      return;
    }

    const currentQuestion = this.question;

    this.http.post<{ analysis: string, example_response: string, follow_up: string }>("http://localhost:8080/evaluate-response", { response: this.spokenText })
      .subscribe({
        next: (res) => { this.aiFeedback = res.analysis; this.exampleResponse = res.example_response; this.question = res.follow_up;
          

          const currentResponse = this.spokenText; 
          this.spokenText = "";

          this.uploadFeedback(studentId!, currentQuestion, currentResponse, res.analysis, res.example_response);
         },
        error: (err) => { console.error("Error fetching feedback:", err); }
      });
  }

  uploadFeedback(studentId: string, questionText: string, response: string, feedback: string, exampleResponse: string) {
    this.http.post<{ message: string }>(
      "http://localhost:3000/api/feedback/evaluate-response", // ✅ Save directly to DB
      { user_id: studentId, questionText, response, feedback, example_response: exampleResponse }
    ).subscribe({
        next: (res) => {
            console.log("✅ Feedback saved to MongoDB:", res.message);
        },
        error: (err) => console.error("❌ Error saving feedback:", err)
    });
}
  /** Handles user text input */
  handleResponseInput(event: any) {
    this.userResponse = event.target.value;
  }

  private initializeVideoStream(): void {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 360 } })
      .then((stream) => {
        this.videoElement = this.videoElementRef.nativeElement;
        this.stream = stream;
        this.videoElement.srcObject = this.stream;
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
      });
  }

  toggleRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
      this.startSpeechRecognition();
    }
  }

  private startRecording(): void {
    // Check if the browser supports media recording
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      console.error('Your browser does not support media recording.');
      return;
    }

    // Get the media stream (e.g., from camera)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream: MediaStream) => {
        this.stream = stream;

        const options = { mimeType: 'video/webm' };
        this.mediaRecorder = new MediaRecorder(this.stream, options);

        // Reset recorded blobs before starting a new recording
        this.recordedBlobs = [];

        // Handle data available event
        this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
          console.log('Data available event fired');
          if (event.data.size > 0) {
            this.recordedBlobs.push(event.data);
          }
        };

        // Handle the stop event (after recording ends)
        this.mediaRecorder.onstop = () => {
          console.log('Recording stopped');
          this.uploadRecording();
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        console.log('Recording started');
      })
      .catch((err) => {
        console.error('Error accessing media devices:', err);
      });
  }


  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.log('Stopping recording');
      this.mediaRecorder.stop();
      this.isRecording = false;
    }

    // Stop all media tracks to release the resources
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    console.log('Recording stopped');
  }


  private startFrameCapture(): void {
    this.intervalId = setInterval(() => {
      if (this.ctx) {
        this.ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        const frameData = this.canvasElement.toDataURL('image/jpeg');

        this.videoRecordingService.uploadBase64Image(frameData).subscribe({
          next: (res) => {
            this.updateScores(res);
          },
          error: (err) => console.error('Upload failed:', err),
        });
      }
    }, 500); // Capture every 500ms
  }

  private stopFrameCapture(): void {
    clearInterval(this.intervalId);
  }

  private updateScores(res: any): void {
    this.eyeContactPercent = res.eye_contact || 0;
    this.bodyLanguagePercent = res.body_language || 0;
    this.emotionPercent = res.emotion_score || 0;
    this.overallPercent = res.overall_score || 0;
  }

  private uploadRecording(): void {
    console.log('Recorded Blobs:', this.recordedBlobs);

    // Check if recordedBlobs is empty
    if (this.recordedBlobs.length === 0) {
      console.error('No recorded blobs to upload.');
      return;
    }

    // Create a unique filename for the video
    const uniqueFilename = `recording_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webm`;

    // Create a Blob from the recorded blobs
    const videoBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });

    // Create a File object from the Blob
    const file = new File([videoBuffer], uniqueFilename, { type: 'video/webm' });

    console.log('Uploading file:', file);

    // Upload the file using the videoRecordingService (ensure the service is set up to handle file uploads)
    this.videoRecordingService.uploadFile(file);
  }

  private onDataAvailableEvent(event: BlobEvent): void {
    this.recordedBlobs.push(event.data);
  }

  private onStopRecordingEvent(): void {
    console.log('Recording stopped');
  }

  startSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = true;  // Keep recognizing until manually stopped
      this.recognition.interimResults = true;  // Get real-time results
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        console.log('Speech recognition started...');
        this.spokenText = "";
      };

      this.recognition.onresult = (event: any) => {
        this.spokenText = event.results[event.resultIndex][0].transcript;
        console.log('Recognized text:', this.spokenText);
        this.analyzeSentiment(this.spokenText);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
      };

      this.recognition.onend = () => {
        console.log('Speech recognition ended.');
      };

      this.recognition.start();
    } else {
      console.error('Speech recognition is not supported in this browser.');
    }
  }

  private analyzeSentiment(text: string): void {
    this.videoRecordingService.analyzeSentiment(text).subscribe({
      next: (res: { sentiment_score: number }) => {
        this.sentimentScore = res.sentiment_score;
        console.log('Sentiment Score:', this.sentimentScore);
      },
      error: (err) => console.error('Sentiment analysis failed:', err),
    });
  }
}
