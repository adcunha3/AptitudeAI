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
    this.profileService.getUserProfile('673e4b6d519c1c03238a141b'); // Call getUserProfile without passing userId, it will be fetched from AuthService
  }

  editProfile() {
    this.profileService.editProfile();
  }
}