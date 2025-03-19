import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
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
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-conference-chat',
  standalone: true,
  imports: [
    TranslateModule,
    StreamAutocompleteTextareaModule,
    StreamChatModule,
    CommonModule,
    CallComponent,
    FormsModule
  ],
  templateUrl: './conference-chat.component.html',
  styleUrls: ['./conference-chat.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ConferenceChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContent') private chatContent: ElementRef | undefined;

  public rating: number = 5;
  public searchUserId: string = '';
  public searchedUser: { id: string; username: string } | null = null;
  public addedParticipants: { id: string; username: string }[] = [];

  constructor(
    public chatService: ChatClientService,
    public channelService: ChannelService,
    private streamI18nService: StreamI18nService,
    private authService: AuthService,
    public videoCallService: VideoCallService,
    private http: HttpClient
  ) {
    const apiKey = environment.STREAM_API_KEY;
    const userId = this.authService.getUserId();
    const userToken = this.authService.getChatToken();

    if (userId && userToken) {
      this.chatService
        .init(apiKey, userId, userToken)
        .then(() => {
          this.streamI18nService.setTranslation();
        })
        .catch((err) =>
          console.error('Error connecting user to Stream Chat:', err)
        );
    } else {
      console.error('Missing user ID or token');
    }
  }

  async ngOnInit() {
    try {
      const userId = this.authService.getUserId();
  
      this.channelService.reset();
  
      await this.channelService.init(
        { type: "messaging", members: { $in: [userId] } },
        { name: 1 },
        { limit: 30 }
      );
  
      this.channelService.channels$.subscribe((channels) => {
        console.log('Loaded Channels:', channels);
      });
  
      this.channelService.channelQueryState$.subscribe((state) => {
        console.log('Channel Query State:', state);
      });
  
      await this.loadMoreChannels();
    } catch (error) {
      console.error('Error initializing channels:', error);
    }
  }
  
  async loadMoreChannels() {
    this.channelService.hasMoreChannels$.subscribe(async (hasMoreChannels) => {
      if (hasMoreChannels) {
        console.log('Loading more channels...');
        await this.channelService.loadMoreChannels();
      } else {
        console.log('No more channels to load');
      }
    });
  }

  searchUser() {
    const token = this.authService.getToken();
    this.http.get<any>(`http://localhost:3000/api/profile/username/${this.searchUserId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).subscribe(
      async (user) => {
        try {
          const response = await this.chatService.chatClient.queryUsers({ id: { $eq: this.searchUserId } });
  
          if (response.users.length === 0) {
            await this.chatService.chatClient.upsertUser({
              id: this.searchUserId,
              name: user.username,
              image: user.profilePicture || "",
            });
          }
  
          const channel = this.chatService.chatClient.channel('messaging', `chat-${this.searchUserId}`, {
            image: user.profilePicture || '',
            name: `Chat with ${user.username}`
          });
          await channel.create();
  
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

  submitReview() {
    const activeChannel = this.channelService.activeChannel;

    if (!activeChannel) {
      alert('No active chat detected.');
      return;
    }

    // Find the other user in the chat
    const members = Object.values(activeChannel.state.members);
    const otherUser = members.find(member => member.user_id !== this.authService.getUserId());

    if (!otherUser) {
      alert('Could not determine the user you are chatting with.');
      return;
    }

    const payload = {
      userId: otherUser.user_id,
      reviewerId: localStorage.getItem('userId'),
      rating: this.rating
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post('http://localhost:3000/api/leaderboard', payload, { headers })
      .subscribe(
        () => alert("Review submitted successfully!"),
        (error) => console.error("Error submitting review:", error)
      );
  }

  startCall() {
    const channelId = this.channelService.activeChannel?.id;
    this.videoCallService.setCallId(channelId);
  }

  ngAfterViewChecked() {
    if (this.chatContent) {
      this.chatContent.nativeElement.scrollTop = this.chatContent.nativeElement.scrollHeight;
    }
  }
}
