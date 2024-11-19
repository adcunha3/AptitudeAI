import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {

  signupForm!: FormGroup;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.signupForm = new FormGroup({
      'email': new FormControl('', [Validators.required]),
      'username': new FormControl('', [Validators.required]),
      'password': new FormControl('', [Validators.required]),
      'roles': new FormControl('', [Validators.required])
    })
  }

  setRole(role: string) {
    this.signupForm.controls['role'].setValue(role);
  }

  onSubmit( ){
    this.authService.signupUser(this.signupForm.value.email, this.signupForm.value.username, this.signupForm.value.password, this.signupForm.value.roles);
  }

}
