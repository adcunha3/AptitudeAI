import { Component, computed, signal } from '@angular/core';
import { Call, StreamVideoClient, User } from '@stream-io/video-client';
import { environment } from '../../environments/environment';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-conference-call',
  standalone: true,
  imports: [],
  templateUrl: './conference-call.component.html',
  styleUrl: './conference-call.component.css'
})
export class ConferenceCallComponent {
  callId = signal<string | undefined>(undefined);

  call = computed<Call | undefined>(() => {
    const currentCallId = this.callId();
    if(currentCallId !== undefined) {
      const call = this.client.call('default', currentCallId);

      call.join({ create: true }).then(async () => {
        call.camera.enable();
        call.microphone.enable();
      });
      return call;
    } else {
      return undefined;
    }
  });

  client : StreamVideoClient;

  constructor(private authService: AuthService) {
    const apiKey = environment.STREAM_API_KEY;
    const userId = this.authService.getUserId();
    const userToken = this.authService.getChatToken();

    this.client = new StreamVideoClient(apiKey);
    this.client.connectUser(
      { id: userId },
      userToken
    );
  }

  setCallId(callId: string | undefined) {
    if(callId === undefined) {
      this.call()?.leave();
    }
    this.callId.set(callId);
  }
}
