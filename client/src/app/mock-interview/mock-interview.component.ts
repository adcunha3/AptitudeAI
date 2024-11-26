import { Component, OnInit, ChangeDetectorRef, ViewChild, effect, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { VideoRecordingService } from '../../services/video-recording.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mock-interview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mock-interview.component.html',
  styleUrl: './mock-interview.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MockInterviewComponent {


  @ViewChild('videoElement', { static: true }) videoElement: any;

  video: any;
  isVideoRecording = false;
  videoBlobUrl: any;
  videoBlob: any;
  videoName = '';
  videoStream: MediaStream | null = null;
  videoConf = { video: { facingMode: "user", width: 320 }, audio: true }

  constructor(
    private ref: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private videoRecordingService: VideoRecordingService,
  ) {
    effect(() => {
      const failed = this.videoRecordingService.getRecordingFailed()();
      if (failed) {
        this.isVideoRecording = false;
        this.ref.detectChanges();
      }
    });

    effect(() => {
      const stream = this.videoRecordingService.getStream()();
      this.videoStream = stream;
      this.ref.detectChanges();
    });

    effect(() => {
      const data = this.videoRecordingService.getRecordedBlob();
      if (data) {
        const blobData = data();
        if (blobData) {
          this.videoBlob = blobData.blob;
          this.videoName = blobData.title;
          this.videoBlobUrl = this.sanitizer.bypassSecurityTrustUrl(blobData.url);
        }
      }
    });
    effect(() => {
      const base64Image = this.videoRecordingService.getBase64Image()();
      if (base64Image) {
        console.log('Base64 Frame:', base64Image);
      }
    });    
  }

  ngOnInit() {
    this.video = this.videoElement.nativeElement;
  }

  startVideoRecording() {
    if (!this.isVideoRecording) {
      this.video.controls = false;
      this.isVideoRecording = true;
      this.videoRecordingService.startRecording(this.videoConf)
        .then(stream => {
          this.video.srcObject = stream;
          this.video.play();
        })
        .catch(function (err) {
          console.log(err.name + ": " + err.message);
        });
    }
  }

  clearVideoRecordedData() {
    this.videoBlobUrl = null;
    this.video.srcObject = null;
    this.video.controls = false;
    this.isVideoRecording = false;
    this.ref.detectChanges();
  }

  _downloadFile(data: any, type: string, filename: string): any {
    const blob = new Blob([data], { type: type });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  downloadAndClearVideo() {
    this._downloadFile(this.videoBlob, 'video/mp4', this.videoName);
    this.clearVideoRecordedData();
    console.log(this.videoBlobUrl);
  }

}
