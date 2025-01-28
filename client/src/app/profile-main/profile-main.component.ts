import { Component } from '@angular/core';
import {ProfileService} from '../../services/profile-service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-main',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './profile-main.component.html',
  styleUrl: './profile-main.component.css'
})
export class ProfileMainComponent {

  constructor(private profileService: ProfileService) {}
  
editProfile() {

  this.profileService.editProfile();

}

}
