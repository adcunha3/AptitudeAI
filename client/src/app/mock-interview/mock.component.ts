import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [],
  templateUrl: './mock.component.html',
  styleUrls: ['./mock.component.css']
})
export class InterviewComponent implements OnInit {
  videoElement!: HTMLVideoElement;
  canvasElement!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D | null;
  intervalId!: any;

  ngOnInit(): void {
    // Initialize video and canvas elements on component load
    this.videoElement = document.getElementById('video') as HTMLVideoElement;
    this.canvasElement = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvasElement.getContext('2d');
    this.initializeWebcam();
  }

  initializeWebcam(): void {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        this.videoElement.srcObject = stream;
        this.videoElement.play();
      })
      .catch((err) => {
        console.error('Error accessing webcam:', err);
      });
  }

  sendFrameToBackend(): void {
    if (this.ctx) {
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
      const frameData = this.canvasElement.toDataURL('image/jpeg'); // Convert frame to Base64

      // Send frame to backend
      fetch('/api/interview/process-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frame: frameData }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Response from backend:', data);

          // Update progress bars dynamically
          this.updateProgressBar('eye-contact-bar', 'eye-contact-score', data.eye_contact || 0);
          this.updateProgressBar('body-language-bar', 'body-language-score', data.body_language || 0);
          this.updateProgressBar('emotion-bar', 'emotion-score', data.emotion_score || 0);
          this.updateProgressBar('overall-score-bar', 'overall-score', data.overall_score || 0);
        })
        .catch((err) => {
          console.error('Error sending frame:', err);
        });
    }
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


  startFrameCapture(): void {
    // Capture frames periodically (e.g., every second)
    this.intervalId = setInterval(() => this.sendFrameToBackend(), 1000);
  }

  stopFrameCapture(): void {
    // Stop periodic frame capture
    clearInterval(this.intervalId);
  }
}
