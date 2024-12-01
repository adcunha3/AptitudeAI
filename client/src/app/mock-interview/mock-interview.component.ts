import { Component, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { VideoRecordingService } from '../../services/video-recording.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mock-interview.component.html',
  styleUrls: ['./mock-interview.component.css'],
})
export class MockInterviewComponent implements OnInit, AfterViewInit {
  @ViewChild('recordedVideo') recordVideoElementRef!: ElementRef;
  @ViewChild('video') videoElementRef!: ElementRef;
  @ViewChild('canvas') canvasElementRef!: ElementRef;

  videoElement!: HTMLVideoElement;
  recordVideoElement!: HTMLVideoElement;
  mediaRecorder!: any;
  recordedBlobs!: Blob[];
  isRecording: boolean = false;
  downloadUrl!: string;
  stream!: MediaStream;
  canvasElement!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D | null;
  intervalId!: any;

  constructor(private videoRecordingService: VideoRecordingService) {}

  ngOnInit(): void {
    navigator.mediaDevices
      .getUserMedia({
        video: { width: 360 }
      })
      .then(stream => {
        this.videoElement = this.videoElementRef.nativeElement;
        this.recordVideoElement = this.recordVideoElementRef.nativeElement;

        this.stream = stream;
        this.videoElement.srcObject = this.stream;
      })
      .catch(err => {
        console.error('Error accessing webcam:', err);
      });
  }

  ngAfterViewInit() {
    this.canvasElement = this.canvasElementRef.nativeElement;
    this.ctx = this.canvasElement.getContext('2d');
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

  playRecording() {
    if (!this.recordedBlobs || !this.recordedBlobs.length) {
      console.log('cannot play.');
      return;
    }
    this.recordVideoElement.play();
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
        this.recordVideoElement.src = this.downloadUrl;

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
            this.updateProgressBar('eye-contact-bar', 'eye-contact-score', res.eye_contact || 0);
            this.updateProgressBar('body-language-bar', 'body-language-score', res.body_language || 0);
            this.updateProgressBar('emotion-bar', 'emotion-score', res.emotion_score || 0);
            this.updateProgressBar('overall-score-bar', 'overall-score', res.overall_score || 0);
          },
          error: (err) => {
            console.error('Upload failed:', err);
          },
        });
      }
    }, 500);
  }
  
  updateProgressBar(barId: string, scoreId: string, value: number): void {
    const barElement = document.getElementById(barId);
    const scoreElement = document.getElementById(scoreId);
  
    if (barElement) {
      barElement.style.width = `${value}%`;
    }
    if (scoreElement) {
      scoreElement.textContent = `${value}%`;
    }
  }

  stopFrameCapture(): void {
    clearInterval(this.intervalId);
    console.log("stop frame campture");
  }
  
}