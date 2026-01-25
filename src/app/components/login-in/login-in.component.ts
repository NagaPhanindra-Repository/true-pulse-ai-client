import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/security/auth.service';

@Component({
  selector: 'app-login-in',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-in.component.html',
  styleUrl: './login-in.component.scss'
})export class LoginInComponent {
  
  @Input() successMessage: string | null = null;
  @Output() closeLogin = new EventEmitter<void>();
  usernameOrEmail = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(form: any) {
    if (form.invalid) return;
    this.loading = true;
    this.error = null;
    this.auth.login(this.usernameOrEmail, this.password).subscribe({
      next: () => {
        this.loading = false;
        // Emit event to close login modal
        this.closeLogin.emit();
        // Redirect to dashboard or returnUrl
        const returnUrl = this.router.routerState.snapshot.root.queryParams['returnUrl'] || '/dashboard';
        this.router.navigate([returnUrl]);
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
