import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { Call, StreamVideoClient } from '@stream-io/video-client';
import { environment } from '../environments/environment';
import { AuthService } from '../services/auth-service';

@Injectable({ providedIn: "root" })
export class VideoCallService {
    selectedUser = signal<{ id: string; username: string; email: string } | null>(null);
    callId = signal<string | undefined>(undefined);

    call = computed<Call | undefined>(() => {
      const currentCallId = this.callId();
      if (currentCallId !== undefined) {
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

    client: StreamVideoClient;

    constructor(
      private authService: AuthService,
      private http: HttpClient
    ) {
      const apiKey = environment.STREAM_API_KEY;
      const userId = this.authService.getUserId();
      const userToken = this.authService.getChatToken();

      this.client = new StreamVideoClient(apiKey);
      this.client.connectUser({ id: userId }, userToken);
    }

    setCallId(callId: string | undefined) {
      if (callId === undefined) {
        this.call()?.leave();
      }
      this.callId.set(callId);
    }

    searchUser(userId: string) {
      const token = this.authService.getToken();
      this.http.get<any>(`http://localhost:3000/api/profile/${userId}`, {
          headers: {
              Authorization: `Bearer ${token}`
          }
      }).subscribe({
          next: (user) => {
              if (user && user._id) {
                  this.selectedUser.set({
                      id: user._id,
                      username: user.username,
                      email: user.email,
                  });
                  console.log('User found and set:', this.selectedUser());
              } else {
                  console.warn('User not found');
                  this.selectedUser.set(null);
              }
          },
          error: (error) => {
              console.error('Error fetching user:', error);
              this.selectedUser.set(null);
          },
      });
  }

    getSelectedUser() {
        return this.selectedUser();
    }
}