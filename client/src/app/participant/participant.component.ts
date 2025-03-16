import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, Input } from '@angular/core';
import { VideoCallService } from '../../services/video-call.service';
import { StreamVideoParticipant } from '@stream-io/video-client';

@Component({
  selector: 'app-participant',
  standalone: true,
  templateUrl: './participant.component.html',
  styleUrls: ['./participant.component.css']
})
export class ParticipantComponent implements AfterViewInit, OnDestroy {

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('audioElement') audioElement!: ElementRef<HTMLAudioElement>;

  @Input() participant!: StreamVideoParticipant;
  unbindVideoElement: (() => void) | undefined;
  unbindAudioElement: (() => void) | undefined;

  constructor(private videoCallService: VideoCallService) {}

  ngAfterViewInit(): void {
    this.unbindVideoElement = this.videoCallService
      .call()
      ?.bindVideoElement(
        this.videoElement.nativeElement,
        this.participant.sessionId,
        'videoTrack'
      );

    this.unbindAudioElement = this.videoCallService
      .call()
      ?.bindAudioElement(
        this.audioElement.nativeElement,
        this.participant.sessionId
      );
  }

  ngOnDestroy(): void {
    this.unbindAudioElement?.();
    this.unbindVideoElement?.();
  }
}
