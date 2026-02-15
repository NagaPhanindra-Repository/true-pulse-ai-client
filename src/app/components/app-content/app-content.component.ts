import { Component } from '@angular/core';
import { ChatWindowComponent } from "../chat-window/chat-window.component";
import { SignUpComponent } from '../sign-up/sign-up.component';
import { LoginInComponent } from '../login-in/login-in.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-app-content',
  standalone: true,
  imports: [CommonModule, SignUpComponent, LoginInComponent],
  templateUrl: './app-content.component.html',
  styleUrl: './app-content.component.scss'
})
export class AppContentComponent {
  showSignUp = false;
  showLogin = false;
  loginSuccessMessage: string | null = null;

  openSignUpModal() {
    this.showSignUp = true;
  }

  closeSignUpModal() {
    this.showSignUp = false;
  }

  onSignUpSuccess(message: string) {
    this.closeSignUpModal();
    this.loginSuccessMessage = message;
    this.showLogin = true;
  }

  closeLoginModal() {
    this.showLogin = false;
    this.loginSuccessMessage = null;
  }

  scrollToFeatures() {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}
