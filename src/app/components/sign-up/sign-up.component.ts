import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/security/auth.service';
import { VerificationService } from '../../services/verification.service';
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
  selectedCountryKey = '';
  loading = false;
  error: string | null = null;
  success: string | null = null;
  
  // Verification states
  isIDVerifying = false;
  isIDVerified = false;
  verificationUrl: string | null = null;
  verificationSessionId: string | null = null;
  verificationError: string | null = null;
  verificationWindow: Window | null = null;
  pendingSignupForm: any | null = null;
  
  // Step tracking
  currentStep: 'signup' | 'verification' | 'confirmed' = 'signup';

  countryOptions = [
    { key: 'IN:+91', code: '+91', name: 'India', flag: '🇮🇳' },
    { key: 'US:+1', code: '+1', name: 'United States', flag: '🇺🇸' },
    { key: 'GB:+44', code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { key: 'DE:+49', code: '+49', name: 'Germany', flag: '🇩🇪' },
    { key: 'FR:+33', code: '+33', name: 'France', flag: '🇫🇷' },
    { key: 'CA:+1', code: '+1', name: 'Canada', flag: '🇨🇦' },
    { key: 'AU:+61', code: '+61', name: 'Australia', flag: '🇦🇺' },
    { key: 'SG:+65', code: '+65', name: 'Singapore', flag: '🇸🇬' }
  ];

  constructor(
    private auth: AuthService,
    private verificationService: VerificationService,
    private router: Router
  ) {
    this.syncSelectedCountryFromCode();
  }

  get selectedCountry() {
    return this.countryOptions.find(option => option.key === this.selectedCountryKey) || null;
  }

  onCountryChange(selectedKey: string) {
    this.selectedCountryKey = selectedKey;
    const match = this.countryOptions.find(option => option.key === selectedKey);
    this.user.countryCode = match ? match.code : '';
  }

  private syncSelectedCountryFromCode() {
    if (!this.user.countryCode) {
      this.selectedCountryKey = '';
      return;
    }
    const match = this.countryOptions.find(option => option.code === this.user.countryCode);
    this.selectedCountryKey = match ? match.key : '';
  }

  /**
   * Open Trulioo verification modal
   * User clicks "Verify Identity" button
   */
  openVerification() {
    const countryCode = (this.user.countryCode || '').trim();
    const userName = (this.user.userName || '').trim();
    const email = (this.user.email || '').trim();

    if (!userName) {
      this.verificationError = 'Username is required for verification';
      return;
    }
    if (!email) {
      this.verificationError = 'Email is required for verification';
      return;
    }
    if (!countryCode) {
      this.verificationError = 'Please select Country Code for verification';
      return;
    }
    
    this.isIDVerifying = true;
    this.verificationError = null;
    
    this.verificationService.createPreSignupVerification({
      userName,
      email,
      countryCode
    }).subscribe({
      next: (response) => {
        this.verificationUrl = response.verificationUrl;
        this.verificationSessionId = response.sessionId || null;
        this.currentStep = 'verification';
        
        // Open verification in new window
        if (this.verificationUrl) {
          this.verificationWindow = window.open(
            this.verificationUrl,
            'trulioo-verification',
            'width=800,height=600,scrollbars=yes'
          );
        
          if (!this.verificationWindow) {
            this.verificationError = 'Unable to open verification. Please check popup blocker.';
          } else {
            // Poll for completion
            if (this.verificationSessionId) {
              this.pollVerificationStatus(this.verificationSessionId);
            } else {
              this.verificationError = 'Missing verification session. Please try again.';
            }
          }
        } else {
          this.verificationError = 'Failed to get verification URL';
        }
        
        this.isIDVerifying = false;
      },
      error: (err) => {
        this.isIDVerifying = false;
        this.verificationError = err?.error?.message || 'Failed to start verification. Please try again.';
      }
    });
  }
  
  /**
   * Poll backend to check if verification is complete
   * Called after user opens verification window
   */
  pollVerificationStatus(sessionId: string) {
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes with 1 second intervals
    
    const interval = setInterval(() => {
      pollCount++;
      
      // Stop polling after timeout
      if (pollCount > maxPolls) {
        clearInterval(interval);
        this.verificationError = 'Verification timeout. Please try again.';
        this.currentStep = 'signup';
        if (this.verificationWindow && !this.verificationWindow.closed) {
          this.verificationWindow.close();
        }
        return;
      }
      
      // Check if user has been verified
      this.verificationService.getPreSignupStatus(sessionId).subscribe({
        next: (response) => {
          const status = (response?.status || '').toString().toUpperCase();
          if (response?.isVerified || status === 'VERIFIED') {
            clearInterval(interval);
            this.isIDVerified = true;
            this.currentStep = 'confirmed';
            if (this.verificationWindow && !this.verificationWindow.closed) {
              this.verificationWindow.close();
            }
            if (this.pendingSignupForm) {
              const formRef = this.pendingSignupForm;
              this.pendingSignupForm = null;
              this.onSubmit(formRef);
            }
          }
        },
        error: () => {
          // Continue polling on error
        }
      });
    }, 1000);
  }
  
  /**
   * Reset verification (user wants to try different country)
   */
  resetVerification() {
    this.isIDVerified = false;
    this.verificationUrl = null;
    this.verificationSessionId = null;
    this.verificationError = null;
    this.currentStep = 'signup';
    this.pendingSignupForm = null;
    if (this.verificationWindow && !this.verificationWindow.closed) {
      this.verificationWindow.close();
    }
    this.verificationWindow = null;
  }

  verifyAndCreate(form: any) {
    if (this.isIDVerified) {
      this.onSubmit(form);
      return;
    }

    // Validate required fields
    const missingFields = this.validateRequiredFields();
    if (missingFields.length > 0) {
      this.error = `Please fill in required field: ${missingFields[0]}`;
      return;
    }

    this.pendingSignupForm = form;
    this.openVerification();
  }

  validateRequiredFields(): string[] {
    const missing: string[] = [];
    
    if (!this.user.userName?.trim()) missing.push('Username');
    if (!this.user.password?.trim()) missing.push('Password');
    if (!this.user.email?.trim()) missing.push('Email');
    if (!this.user.firstName?.trim()) missing.push('First Name');
    if (!this.user.lastName?.trim()) missing.push('Last Name');
    
    return missing;
  }

  onSubmit(form: any) {
    // Validate required fields
    const missingFields = this.validateRequiredFields();
    if (missingFields.length > 0) {
      this.error = `Please fill in required field: ${missingFields[0]}`;
      return;
    }
    
    // Check if ID verification is complete
    if (!this.isIDVerified) {
      this.error = 'Please complete identity verification first';
      return;
    }

    if (!this.verificationSessionId) {
      this.error = 'Missing verification session. Please verify again.';
      return;
    }
    
    this.loading = true;
    this.error = null;
    this.success = null;
    
    // Add verification status to user object
    this.user.isVerified = true;
    this.user.verificationSessionId = this.verificationSessionId;
    
    this.auth.signup(this.user).subscribe({
      next: () => {
        this.loading = false;
        // Emit event to parent to close signup and open login with message
        this.signupSuccess.emit('Sign up successful! Your identity is verified. Please login.');
      },
      error: err => {
        this.loading = false;
        this.error = err?.error?.message || 'Signup failed. Please try again.';
      }
    });
  }
  
  /**
   * Skip verification (testing only) - remove in production
   */
  skipVerificationTest() {
    this.isIDVerified = true;
    this.currentStep = 'confirmed';
  }
}
