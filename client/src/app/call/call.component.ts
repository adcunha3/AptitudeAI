import { Component, Input, Signal } from '@angular/core';
import { VideoCallService } from '../../services/video-call.service';
import { CommonModule } from '@angular/common';
import { Call, StreamVideoParticipant } from '@stream-io/video-client';
import { ParticipantComponent } from '../participant/participant.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule, ParticipantComponent],
  templateUrl: './call.component.html',
  styleUrl: './call.component.css'
})
export class CallComponent {

  @Input({ required: true }) call!: Call;

  participants: Signal<StreamVideoParticipant[]>;

  constructor(private videoCallService : VideoCallService) {
    this.participants = toSignal(
      this.videoCallService.call()!.state.participants$,
      {requireSync : true}
    );
  }

  toggleMicrophone() {
    this.call.microphone.toggle();
  }

  toggleCamera() {
    this.call.camera.toggle();
  }

  trackSessionId(_: number, participant: StreamVideoParticipant) {
    return participant.sessionId;
  }

  leaveCall() {
    this.videoCallService.setCallId(undefined);
  }
}
