import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Router } from "@angular/router";
import { SignUpModel } from "../models/signup-model";
import { LoginModel } from "../models/login-model";

@Injectable({providedIn:"root"})
export class AuthService {

    private token!: string;
    private authenticatedSub = new Subject<boolean>();
    private isAuthenticated = false;

    getIsAuthenticated(){
        return this.isAuthenticated;
    }

    getAuthenticatedSub() {
        return this.authenticatedSub.asObservable();
    }

    getToken() {
        return this.token;
    }

    constructor(private http: HttpClient,  private router: Router){}

    signupUser(email: string, username: string, password: string, role: string) {

        const signUpData: SignUpModel = {email: email, username: username, password: password, role: role}
        this.http.post('http://localhost:3000/api/auth/signup', signUpData, {headers: { 'Content-Type': 'application/json'}})
            .subscribe(res => {
                console.log(res);
            },
            error => {
              console.error('Error:', error);
            });
    }

    loginUser(username: string, password: string) {

        const loginData: LoginModel = {username: username, password: password}
        this.http.post<{token: string}>('http://localhost:3000/api/auth/signin', loginData, {headers: { 'Content-Type': 'application/json'}})
        .subscribe(res => {
            this.token = res.token;
            if(this.token) {
                this.authenticatedSub.next(true);
                this.isAuthenticated = true;
                this.router.navigate(['/profile']);
            } else {
                console.error('Token is missing or invalid');
            }
        })
    }
}
