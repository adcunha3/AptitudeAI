import { Component, computed } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {

  constructor(private authService: AuthService) { }

  userAuthenticated = computed(()=> this.authService.getIsAuth());

  logout(){
    this.authService.logout();
  }
}
