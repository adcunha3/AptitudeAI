import { Component, OnInit } from '@angular/core';
import { ProfileService } from '../../services/profile-service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-main',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './profile-main.component.html',
  styleUrl: './profile-main.component.css'
})
export class ProfileMainComponent implements OnInit {

  constructor(public profileService: ProfileService) {}

  ngOnInit() {

    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      console.error('No token found. User is not logged in.');
      return;
    }
  
    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      console.log('Decoded Token Payload:', payload);
  
      const userId = payload?.id; 
  
      if (!userId) {
        console.error('User ID is missing in token.');
        return;
      }
  
      this.profileService.getUserProfile(userId);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    

  }

  editProfile() {
    this.profileService.editProfile();
  }
}