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

    if (!this.spokenText.trim()) {
      console.error("No spoken text to submit.");
      return;
    }

    this.http.post<{ analysis: string, example_response: string, follow_up: string }>("http://localhost:8080/evaluate-response", { response: this.spokenText })
      .subscribe({
        next: (res) => { this.aiFeedback = res.analysis; this.exampleResponse = res.example_response; this.question = res.follow_up;

          this.spokenText = "";
         },
        error: (err) => { console.error("Error fetching feedback:", err); }
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

  startRecording(): void {
    // Reset the recorded blobs array to start fresh
    this.recordedBlobs = [];

    // Ensure that the stream is available before proceeding
    if (!this.stream) {
      console.error("Stream not available.");
      return;
    }

    const options: MediaRecorderOptions = { mimeType: 'video/webm' };

    // Check if MediaRecorder is supported in the browser
    if (!window.MediaRecorder) {
      console.error("MediaRecorder is not supported in this browser.");
      return;
    }

    try {
      // Create a new MediaRecorder instance
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      // Attach event listeners for data and stop events
      this.mediaRecorder.ondataavailable = this.onDataAvailableEvent.bind(this);
      this.mediaRecorder.onstop = this.onStopRecordingEvent.bind(this);

      // Check if the MediaRecorder is in an invalid state
      if (this.mediaRecorder.state === "inactive") {
        // Start recording if it's in the inactive state
        this.mediaRecorder.start();
        this.isRecording = true;

        // Log the start of the recording
        console.log("Recording started...");

        // Start frame capture and speech recognition
        this.startFrameCapture();
        this.startSpeechRecognition(); // Start speech recognition when recording starts
      } else {
        console.warn("MediaRecorder is already in use. Please stop the previous recording.");
      }
    } catch (err) {
      console.error("Error initializing media recorder:", err);
    }
  }


  stopRecording(): void {
    // Ensure that mediaRecorder is in a recording or paused state before stopping it
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }

    // Stop the video stream tracks if they exist
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    // Upload the recording if applicable
    this.uploadRecording();

    // Stop the frame capture if it exists
    this.stopFrameCapture();

    // Stop speech recognition if applicable
    if (this.recognition) {
      this.recognition.stop();  // Stop speech recognition when recording stops
    }

    console.log("Recording stopped, resources cleaned up.");
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
    const uniqueFilename = `recording_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.webm`;
    const videoBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
    const file = new File([videoBuffer], uniqueFilename, { type: 'video/webm' });
  
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
