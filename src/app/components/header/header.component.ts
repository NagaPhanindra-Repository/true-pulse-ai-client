import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignUpComponent } from '../sign-up/sign-up.component';
import { LoginInComponent } from '../login-in/login-in.component';

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
}
