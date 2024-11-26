@Injectable({ providedIn: 'root' })
export class VideoRecordingService {
  private stream: MediaStream | null = null;
  private recorder: any;
  private canvas: HTMLCanvasElement | null = null;
  private canvasContext: CanvasRenderingContext2D | null = null;

  private _stream = signal<MediaStream>(new MediaStream());
  private _recorded = signal<RecordedVideoOutput>({ blob: new Blob(), url: '', title: '' });
  private _recordedUrl = signal<string>('');
  private _recordingFailed = signal<boolean>(false);
  private _base64Image = signal<string>('');

  getBase64Image(): Signal<string> {
    return this._base64Image.asReadonly();
  }

  startRecording(conf: any): Promise<any> {
    const browser = <any>navigator;
    if (this.recorder) {
      return Promise.reject('Recording is already in progress');
    }

    return browser.mediaDevices.getUserMedia(conf).then((stream: MediaStream) => {
      this.stream = stream;

      // Initialize canvas for frame extraction
      this.initCanvas(stream);

      this.record();
      this._stream.set(this.stream);
      return this.stream;
    }).catch((error: any) => {
      this._recordingFailed.set(true);
      throw error;
    });
  }

  private initCanvas(stream: MediaStream) {
    this.canvas = document.createElement('canvas');
    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    this.canvas.width = settings.width || 320;
    this.canvas.height = settings.height || 240;
    this.canvasContext = this.canvas.getContext('2d');
  }

  private record() {
    this.recorder = new RecordRTC(this.stream, {
      type: 'video',
      mimeType: 'video/webm',
      bitsPerSecond: 44000,
    });

    this.recorder.startRecording();
    this.captureFrames();
  }

  private captureFrames() {
    if (!this.stream || !this.canvas || !this.canvasContext) return;

    const videoElement = document.createElement('video');
    videoElement.srcObject = this.stream;
    videoElement.muted = true;
    videoElement.play();

    const capture = () => {
      if (!this.canvasContext || !videoElement) return;

      this.canvasContext.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const base64Image = this.canvas.toDataURL('image/jpeg'); // Convert frame to Base64
      this._base64Image.set(base64Image);

      requestAnimationFrame(capture); // Capture next frame
    };

    capture();
  }

  stopRecording() {
    if (this.recorder) {
      this.recorder.stopRecording((audioVideoWebMURL: string) => {
        const recordedBlob = this.recorder.getBlob();
        const recordedName = encodeURIComponent('video_' + new Date().getTime() + '.webm');
        this._recorded.set({ blob: recordedBlob, url: audioVideoWebMURL, title: recordedName });
        this.stopMedia();
      });
    }
  }

  private stopMedia() {
    if (this.recorder) {
      this.recorder = null;
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }
    }
  }
}
