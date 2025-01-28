import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { SignUpModel } from "../models/signup-model";
import { LoginModel } from "../models/login-model";

@Injectable({ providedIn: "root" })
export class AuthService {
    private token = '';
    private isAuth = signal<boolean>(false);
    private logoutTimer: any = null;

    constructor(private http: HttpClient, private router: Router) {}

    getIsAuth(){
        return this.isAuth();
    }

    getToken(): string {
        return this.token;
    }

    signupUser(email: string, username: string, password: string, role: string) {
        const signUpData: SignUpModel = { email, username, password, role };
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
        const loginData: LoginModel = { username, password };
        this.http
        .post<{ token: string; expiresIn: number }>(
            'http://localhost:3000/api/auth/signin',
            loginData,
            { headers: { 'Content-Type': 'application/json' } }
        )
        .subscribe({
            next: (res) => {
            this.token = res.token;
            if (this.token) {
                this.isAuth.set(true);
                this.router.navigate(['/profile-main']);
                this.logoutTimer = setTimeout(() => {this.logout()}, res.expiresIn * 10000);
                const now = new Date();
                const expiresDate = new Date(now.getTime() + (res.expiresIn * 1000));
                this.storeLoginDetails(this.token, expiresDate);
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
                this.token = '';
                this.isAuth.set(false);
                this.router.navigate(['/']);
                clearTimeout(this.logoutTimer);
                this.clearLoginDetails();
            },
            error: (err) => console.error('Logout failed:', err),
        });
    }

    storeLoginDetails(token: string, expirationDate: Date){
        localStorage.setItem('token', token);
        localStorage.setItem('expiresIn', expirationDate.toISOString());
    }

    clearLoginDetails(){
        localStorage.removeItem('token');
        localStorage.removeItem('expiresIn');
    }

    getLocalStorageData(){
        const token = localStorage.getItem('token');
        const expiresIn = localStorage.getItem('expiresIn');

        if(!token || !expiresIn){
            return;
        }
        return {
            'token': token,
            'expiresIn': new Date(expiresIn)
        }
    }

    authenticateFromLocalStorage(){
        const localStorageData = this.getLocalStorageData();
        if(localStorageData){
            const now = new Date();
            const expiresIn = localStorageData.expiresIn.getTime() - now.getTime();

            if(expiresIn > 0){
                this.token = localStorageData.token;
                this.isAuth.set(true);
                this.logoutTimer.setTimeout(expiresIn / 1000);
            }
        }
    }
}   
