import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../../services/auth-service';
import { TranslateModule } from '@ngx-translate/core';
import {
  ChatClientService,
  ChannelService,
  StreamI18nService,
  StreamAutocompleteTextareaModule,
  StreamChatModule,
} from 'stream-chat-angular';
import { CommonModule } from '@angular/common';
import { VideoCallService } from '../../services/video-call.service';
import { CallComponent } from '../call/call.component';

@Component({
  selector: 'app-conference-chat',
  standalone: true,
  imports: [TranslateModule, StreamAutocompleteTextareaModule, StreamChatModule, CommonModule, CallComponent],
  templateUrl: './conference-chat.component.html',
  styleUrl: './conference-chat.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ConferenceChatComponent implements OnInit {

  videoCallService: VideoCallService;

  constructor(
    private chatService: ChatClientService, 
    private channelService: ChannelService, 
    private streamI18nService: StreamI18nService,
    private authService: AuthService,
    videoCallService: VideoCallService
  ) {
    this.videoCallService = videoCallService;
    const apiKey = environment.STREAM_API_KEY;
    const userId = this.authService.getUserId();
    const userToken = this.authService.getChatToken();

    if (userId && userToken) {
        this.chatService.init(apiKey, userId, userToken)
            .then(() => {
                this.streamI18nService.setTranslation();
            })
            .catch(err => console.error("Error connecting user to Stream Chat:", err));
    } else {
        console.error("Missing user ID or token");
    }
  }

  async ngOnInit() {
    if (!this.chatService.chatClient.user) {
        console.error("Stream Chat client is not connected yet. Waiting...");
        return;
    }

    try {
        const channel = this.chatService.chatClient.channel('messaging', 'talking-about-angular', {
            image: "",
            name: ""
        });
        await channel.create();
        this.channelService.init({
            type: 'messaging',
            id: {$eq: 'talking-about-angular'}
        });
        console.log("Channel successfully created!");
    } catch (error) {
        console.error("Error creating channel:", error);
    }
  }

  startCall() {
    const channelId = this.channelService.activeChannel?.id;
    this.videoCallService.setCallId(channelId);
  }
}
