import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  token = signal<string>("");
  chatToken = signal<string>("");
  userId = signal<string>("");
  private isAuth = signal<boolean>(false);
  private logoutTimer: any = null;
  constructor(private http: HttpClient, private router: Router) {}

  getIsAuth() {
    return this.isAuth();
  }

  getToken(): string {
    return this.token();
  }

  getUserId(): string {
    return this.userId();
  }

  getChatToken(): string {
    return this.chatToken();
  }

  signupUser(email: string, username: string, password: string, role: string) {
    const signUpData = { email, username, password, role };
    this.http
      .post('http://localhost:3000/api/auth/signup', signUpData, {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe({
        next: (res) => console.log('Signup successful:', res),
        error: (err) => console.error('Signup failed:', err),
      });
  }

  loginUser(username: string, password: string) {
    const loginData = { username, password };
    this.http
      .post<{ token: string; expiresIn: number; userId: string; chatToken: string }>(
        'http://localhost:3000/api/auth/signin',
        loginData,
        { headers: { 'Content-Type': 'application/json' } }
      )
      .subscribe({
        next: (res) => {
          if (res.token) {
            this.isAuth.set(true);
            this.router.navigate(['/profile']);
            this.logoutTimer = setTimeout(() => this.logout(), res.expiresIn * 1000);
            const now = new Date();
            const expiresDate = new Date(now.getTime() + res.expiresIn * 1000);
            this.storeLoginDetails(res.token, expiresDate, res.userId, res.chatToken);
          } else {
            console.error('Token is missing or invalid');
          }
        },
        error: (err) => console.error('Login failed:', err),
      });
  }

  logout() {
    this.http
      .post(
        'http://localhost:3000/api/auth/signout',
        {},
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      )
      .subscribe({
        next: (res) => {
          console.log('User logged out:', res);
          this.token.set("");
          this.isAuth.set(false);
          this.router.navigate(['/']);
          clearTimeout(this.logoutTimer);
          this.clearLoginDetails();
        },
        error: (err) => console.error('Logout failed:', err),
      });
  }

  storeLoginDetails(token: string, expirationDate: Date, userId: string, chatToken: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiresIn', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
    localStorage.setItem('chatToken', chatToken);
  }

  clearLoginDetails() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('chatToken');
  }

  getLocalStorageData() {
    const token = localStorage.getItem('token');
    const expiresIn = localStorage.getItem('expiresIn');

    if (!token || !expiresIn) {
      return;
    }
    return {
      token: token,
      expiresIn: new Date(expiresIn),
    };
  }

  authenticateFromLocalStorage() {
    const localStorageData = this.getLocalStorageData();
    if (localStorageData) {
      const now = new Date();
      const expiresIn = localStorageData.expiresIn.getTime() - now.getTime();

      if (expiresIn > 0) {
        this.token.set(localStorageData.token); // Set the token signal from localStorage
        this.chatToken.set(localStorage.getItem('chatToken') || ''); // Set chatToken from localStorage
        this.userId.set(localStorage.getItem('userId') || ''); 
        this.isAuth.set(true); // Mark as authenticated
        this.logoutTimer = setTimeout(() => this.logout(), expiresIn); // Set the logout timer based on expiration
      }
    }
  }
}