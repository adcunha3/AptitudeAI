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

    // Computed call object that gets the current active call if the callId is set
    call = computed<Call | undefined>(() => {
        const currentCallId = this.callId();
        if (currentCallId !== undefined) {
            const call = this.client.call('default', currentCallId);

            // Try to join the call and enable the camera and microphone
            call.join({ create: true }).then(async () => {
                call.camera.enable();
                call.microphone.enable();
            }).catch((error) => {
                console.error("Error joining the call:", error);
            });
            return call;
        } else {
            return undefined;
        }
    });

    // Computed signal to track if the user is currently in a call
    isInCall = computed<boolean>(() => {
        return this.callId() !== undefined && this.call() !== undefined;
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

    // Method to set the current call ID and leave the call if undefined
    setCallId(callId: string | undefined) {
        if (callId === undefined) {
            // If leaving, make sure the active call is properly handled
            this.call()?.leave().then(() => {
                console.log("Successfully left the call.");
            }).catch((error) => {
                console.error("Error leaving the call:", error);
            });
        }
        this.callId.set(callId);
    }

    // Method to get the selected user
    getSelectedUser() {
        return this.selectedUser();
    }
}
