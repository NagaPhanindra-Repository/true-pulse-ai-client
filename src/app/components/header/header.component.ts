import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignUpComponent } from '../sign-up/sign-up.component';
import { LoginInComponent } from '../login-in/login-in.component';
import { AuthService } from '../../services/security/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SignUpComponent, LoginInComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  showSignUp = false;
  showLogin = false;
  showProfileDropdown = false;
  loginSuccessMessage: string | null = null;

  constructor(public auth: AuthService) {}

  get isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  // Placeholder for user profile picture
  get profilePic(): string {
    // Replace with actual user profile image logic if available
    return 'assets/default-profile.png';
  }

  toggleProfileDropdown(state: boolean) {
    this.showProfileDropdown = state;
  }

  logout() {
    this.auth.logout();
    this.showProfileDropdown = false;
  }
}
