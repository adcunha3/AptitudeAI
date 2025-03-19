import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile-service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string = '';
  passwordForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public profileService: ProfileService,
    private router: Router,
    private authService: AuthService, 
  ) {}

  ngOnInit() {
    this.profileForm = this.fb.group({
      name: [{ value: this.profileService.username()}],
      email: [{ value: this.profileService.email(), disabled: true }],
      role: [this.profileService.role(), Validators.required],
      interests: [this.profileService.interests()],
      bio: [this.profileService.bio()],
      profileImage: ['']
    });

        
        this.passwordForm = this.fb.group({
          currentPassword: ['', [Validators.required]],
          newPassword: ['', [Validators.required, Validators.minLength(6)]],
          confirmPassword: ['', [Validators.required]]
        });
    
        
        this.passwordForm.valueChanges.subscribe(values => {
          if (values.newPassword !== values.confirmPassword) {
            this.passwordForm.controls['confirmPassword'].setErrors({ mismatch: true });
          }
        });
    
  
    this.profileForm.valueChanges.subscribe(() => {
      this.profileForm.markAsDirty();
    });
  
    this.previewUrl = this.profileService.image() || 'assets/default-profile.png';
  }
  

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        this.profileForm.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  onSaveProfile() {
    console.log("Save button clicked!");
  
    if (!this.profileForm.dirty) {
      alert("No changes detected.");
      return;
    }
  
    const updatedProfile = this.profileForm.value;
    console.log("Form Data:", updatedProfile); 
  
    this.profileService.updateUserProfile(updatedProfile).subscribe({
      next: (res) => {
        console.log("Profile updated:", res);
        alert("Profile updated successfully!");
        this.router.navigate(['/profile-main']);
      },
      error: (err) => {
        console.error("Error updating profile:", err);
        alert("Failed to update profile. Check console for details.");
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      alert("Please fill in all fields correctly.");
      return;
    }
  
    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
  
    this.profileService.changePassword(
      this.passwordForm.value.currentPassword,
      this.passwordForm.value.newPassword
    ).subscribe({
      next: () => alert("Password changed successfully!"),
      error: (err) => {
        console.error("Backend error response:", err);
        alert("Error changing password: " + (err.error?.message || "Unknown error"));
      }
    });
  
    this.passwordForm.reset(); // Clear form after successful submission
  }

  
  
}
