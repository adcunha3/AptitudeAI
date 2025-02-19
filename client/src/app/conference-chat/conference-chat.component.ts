import { Component, OnInit } from '@angular/core';
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


@Component({
  selector: 'app-conference-chat',
  standalone: true,
  imports: [TranslateModule, StreamAutocompleteTextareaModule, StreamChatModule],
  templateUrl: './conference-chat.component.html',
  styleUrl: './conference-chat.component.css'
})
export class ConferenceChatComponent implements OnInit {

  constructor(
    private chatService: ChatClientService, 
    private channelService: ChannelService, 
    private streamI18nService: StreamI18nService,
    private authService: AuthService
  ) {
    const apiKey = environment.STREAM_API_KEY;
    const userId = this.authService.getUserId();
    const userToken = this.authService.getToken();
    this.chatService.init(apiKey, userId, userToken);
    this.streamI18nService.setTranslation();
  }

  async ngOnInit() {
      const channel = this.chatService.chatClient.channel('messaging', 'talking-about-angular', {
        image: "",
        name: ""
      });
      await channel.create();
      this.channelService.init({
        type: 'messaging',
        id: {$eq: 'talking-about-angular'}
      })
  }
}
