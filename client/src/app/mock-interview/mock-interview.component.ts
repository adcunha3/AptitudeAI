import { Component, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { VideoRecordingService } from '../../services/video-recording.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule],
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
  }

  ngAfterViewInit() {
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
    this.http.post<{ analysis: string, example_response: string, follow_up: string }>("http://localhost:8080/evaluate-response", { response: this.userResponse })
      .subscribe({
        next: (res) => { this.aiFeedback = res.analysis; this.exampleResponse = res.example_response; this.question = res.follow_up;
         },
        error: (err) => { console.error("Error fetching feedback:", err); }
      });
  }
  /** Handles user text input */
  handleResponseInput(event: any) {
    this.userResponse = event.target.value;
  }

  startRecording() {
    this.recordedBlobs = [];
    let options: any = { mimeType: 'video/webm' };

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch (err) {
      console.log(err);
    }

    this.mediaRecorder.start();
    this.isRecording = !this.isRecording;

    this.startFrameCapture();
    this.onDataAvailableEvent();
    this.onStopRecordingEvent();
  }

  stopRecording() {
    this.mediaRecorder.stop();
    this.isRecording = !this.isRecording;
    console.log('Recorded Blobs: ', this.recordedBlobs);
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.uploadRecording();
    this.stopFrameCapture();
  }

  onDataAvailableEvent() {
    try {
      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
          this.recordedBlobs.push(event.data);
        }
      };
    } catch (error) {
      console.log(error);
    }
  }

  onStopRecordingEvent() {
    try {
      this.mediaRecorder.onstop = async (event: Event) => {
        const videoBuffer = new Blob(this.recordedBlobs, {
          type: 'video/webm'
        });
        this.downloadUrl = window.URL.createObjectURL(videoBuffer);
      };
    } catch (error) {
      console.log(error);
    }
  }

  uploadRecording() {
    const videoBuffer = new Blob(this.recordedBlobs, { type: 'video/webm' });
    const file = new File([videoBuffer], 'recording.webm', { type: 'video/webm' });
    this.videoRecordingService.uploadFile(file);
    console.log(file, "uploaded file");
  }

  startFrameCapture(): void {
    this.intervalId = setInterval(() => {
      if (this.ctx) {
        this.ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        const frameData = this.canvasElement.toDataURL('image/jpeg');
        this.videoRecordingService.uploadBase64Image(frameData).subscribe({
          next: (res) => {
            console.log('Upload successful:', res);
            this.updateProgressBar('eye-contact-bar', res.eye_contact);
            this.updateProgressBar('body-contact-bar', res.body_language);
            this.updateProgressBar('emotion-bar', res.emotion_score);
            this.updateProgressBar('overall-score-bar', res.overall_score);
          },
          error: (err) => {
            console.error('Upload failed:', err);
          },
        });
      }
    }, 500);
  }
  
  updateProgressBar(barId: string, value: number): void {
    switch (barId) {
      case 'eye-contact-bar':
        this.eyeContactPercent = value;
        break;
      case 'body-contact-bar':
        this.bodyLanguagePercent = value;
        break;
      case 'emotion-bar':
        this.emotionPercent = value;
        break;
      case 'overall-score-bar':
        this.overallPercent = value;
        break;
    }
  }

  stopFrameCapture(): void {
    clearInterval(this.intervalId);
    console.log("stop frame campture");
  }
  
}