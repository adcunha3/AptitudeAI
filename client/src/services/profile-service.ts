import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from './auth-service';

@Injectable({ providedIn: "root" })
export class ProfileService {

  username = signal('N/A');
  role = signal('N/A');
  email = signal('N/A');
  bio = signal('N/A');
  interests = signal('N/A');
  image = signal('assets/default-profile.png');

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  getUserProfile(userId: string) {
    const token = this.getToken();

    if (!token) {
      console.error('No token found, user might not be authenticated.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`http://localhost:3000/api/profile/${userId}`, { headers }).subscribe(
      (data) => {
        this.username.set(data.username || 'N/A');
        this.role.set(data.role || 'N/A');
        this.email.set(data.email || 'N/A');
        this.bio.set(data.bio || 'N/A');
        this.interests.set(data.interests || 'N/A');
        this.image.set(data.image || 'assets/default-profile.png');
      },
      (error) => {
        console.error('Error fetching profile:', error);
      }
    );
  }

  editProfile() {
    this.router.navigate(['/profile']);
  }

  private getToken(): string {
    const token = this.authService.getLocalStorageData()?.token;

    if (!token) {
      console.error('No token found in localStorage.');
      return '';
    }

    return token;
  }
}