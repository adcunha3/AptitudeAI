import { Component } from '@angular/core';
import { MockInterviewComponent } from '../mock-interview/mock-interview.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MockInterviewComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

}
