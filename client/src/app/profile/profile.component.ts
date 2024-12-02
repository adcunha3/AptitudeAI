import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {
  profileForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // Initialize the form with controls
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      profileImage: ['']
    });
  }

  // Handle form submission
  onSaveProfile() {
    console.log('Form Submitted:', this.profileForm.value);
    // Add logic to handle form data (e.g., send to a server)
  }

  // Handle file input change
  onFileSelected(event: any) {
    const file = event.target.files[0];
    console.log('File selected:', file);
    // Handle file selection logic here
  }
}
