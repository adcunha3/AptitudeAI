import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../../services/auth-service';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

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
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-conference-chat',
  standalone: true,
  imports: [TranslateModule, StreamAutocompleteTextareaModule, StreamChatModule, CommonModule, CallComponent, FormsModule],
  templateUrl: './conference-chat.component.html',
  styleUrl: './conference-chat.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ConferenceChatComponent implements OnInit {
  searchUserId: string = '';
  searchedUser: { id: string; username: string } | null = null;
  addedParticipants: { id: string; username: string }[] = [];

  constructor(
    private chatService: ChatClientService,
    private channelService: ChannelService,
    private streamI18nService: StreamI18nService,
    private authService: AuthService,
    public videoCallService: VideoCallService,
    private http: HttpClient
  ) {
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
        id: { $eq: 'talking-about-angular' }
      });
      console.log("Channel successfully created!");
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  }

  // Search for a user by ID and create a chat channel with them
  searchUser() {
    const token = this.authService.getToken();  // Get the token
    this.http.get<any>(`http://localhost:3000/api/profile/${this.searchUserId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe(
      async (user) => {
        // Check if the user exists in Stream, create them if not
        try {
          const response = await this.chatService.chatClient.queryUsers({ id: { $eq: this.searchUserId } });
  
          // Check the length of the 'users' array inside the response
          if (response.users.length === 0) {
            await this.chatService.chatClient.upsertUser({
              id: this.searchUserId,
              name: user.username,  // Assuming 'username' exists in your response
              image: user.profilePicture || "",  // Optional, if you have a profile picture
            });
          }
  
          // Now create the channel
          const channel = this.chatService.chatClient.channel('messaging', `chat-${this.searchUserId}`, {
            image: user.profilePicture || '',
            name: `Chat with ${user.username}`
          });
          await channel.create();
  
          // Update the active channel
          this.channelService.init({
            type: 'messaging',
            id: { $eq: `chat-${this.searchUserId}` }
          });
  
          console.log('Channel created and users upserted!');
        } catch (error) {
          console.error('Error fetching or creating user/channel:', error);
        }
      },
      (error) => {
        console.error('Error fetching user:', error);
      }
    );
  }

  startCall() {
    const channelId = this.channelService.activeChannel?.id;
    this.videoCallService.setCallId(channelId);
  }
}