import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/security/auth.service';
import { UserModel } from '../../models/user-model';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  @Output() signupSuccess = new EventEmitter<string>();
  user: UserModel = new UserModel();
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(form: any) {
    if (form.invalid) return;
    this.loading = true;
    this.error = null;
    this.success = null;
    this.auth.signup(this.user).subscribe({
      next: () => {
        this.loading = false;
        // Emit event to parent to close signup and open login with message
        this.signupSuccess.emit('Sign up successful! Please login.');
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'Signup failed. Please try again.';
      }
    });
  }
}
