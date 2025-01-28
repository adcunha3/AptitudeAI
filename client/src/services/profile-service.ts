import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { SignUpModel } from "../models/signup-model";
import { LoginModel } from "../models/login-model";

@Injectable({providedIn: "root"})
export class ProfileService{

    constructor(private http: HttpClient, private router: Router) {}


    editProfile() {

        this.router.navigate(['/profile']);

    }
}