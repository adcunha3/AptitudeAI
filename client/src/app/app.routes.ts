import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { RouteGuard } from '../guards/route-guard';
import { ProfileComponent } from './profile/profile.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { MockInterviewComponent } from './mock-interview/mock-interview.component';
import { ProfileMainComponent } from './profile-main/profile-main.component';

export const routes: Routes = [
    {path: '', component:LandingPageComponent},
    {path: 'login', component:LoginComponent},
    {path: 'sign-up', component:SignupComponent},
    {path: 'profile', component:ProfileComponent, canActivate:[RouteGuard]},
    {path: 'mock-interview', component:MockInterviewComponent, canActivate: [RouteGuard]},
    {path: 'profile-main', component:ProfileMainComponent, canActivate: [RouteGuard]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [RouteGuard]
})

export class AppRoutingModule { }
