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
  fieldErrors: Record<string, string> = {};

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
    // Set default to United States
    const usOption = this.countryOptions.find(opt => opt.code === '+1' && opt.name === 'United States');
    if (usOption) {
      this.selectedCountryKey = usOption.key;
      this.user.countryCode = usOption.code;
    }
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
    this.fieldErrors = {};
    if (this.verificationWindow && !this.verificationWindow.closed) {
      this.verificationWindow.close();
    }
    this.verificationWindow = null;
  }

  verifyAndCreate(form: any) {
    this.error = null;
    if (!this.validateForm()) {
      return;
    }

    if (this.isIDVerified) {
      this.onSubmit(form);
      return;
    }

    this.pendingSignupForm = form;
    this.openVerification();
  }

  validateForm(): boolean {
    this.fieldErrors = {};

    // Username: required, 3–30 chars, letters/numbers/underscores only
    const userName = (this.user.userName || '').trim();
    if (!userName) {
      this.fieldErrors['userName'] = 'Username is required.';
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(userName)) {
      this.fieldErrors['userName'] = 'Username must be 3–30 characters (letters, numbers, underscores only).';
    }

    // Email: required, must have @ and domain
    const email = (this.user.email || '').trim();
    if (!email) {
      this.fieldErrors['email'] = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      this.fieldErrors['email'] = 'Enter a valid email address (e.g. name@domain.com).';
    }

    // Password: required, min 8 characters
    const password = (this.user.password || '').trim();
    if (!password) {
      this.fieldErrors['password'] = 'Password is required.';
    } else if (password.length < 8) {
      this.fieldErrors['password'] = 'Password must be at least 8 characters.';
    }

    // First Name: required, no digits
    const firstName = (this.user.firstName || '').trim();
    if (!firstName) {
      this.fieldErrors['firstName'] = 'First name is required.';
    } else if (/\d/.test(firstName)) {
      this.fieldErrors['firstName'] = 'First name cannot contain numbers.';
    } else if (!/^[a-zA-Z\s\-''.]+$/.test(firstName)) {
      this.fieldErrors['firstName'] = 'First name can only contain letters.';
    }

    // Last Name: required, no digits
    const lastName = (this.user.lastName || '').trim();
    if (!lastName) {
      this.fieldErrors['lastName'] = 'Last name is required.';
    } else if (/\d/.test(lastName)) {
      this.fieldErrors['lastName'] = 'Last name cannot contain numbers.';
    } else if (!/^[a-zA-Z\s\-''.]+$/.test(lastName)) {
      this.fieldErrors['lastName'] = 'Last name can only contain letters.';
    }

    // Mobile Number: optional, but if provided must be exactly 10 digits
    const mobile = (this.user.mobileNumber || '').trim();
    if (mobile && !/^\d{10}$/.test(mobile)) {
      this.fieldErrors['mobileNumber'] = 'Mobile number must be exactly 10 digits.';
    }

    return Object.keys(this.fieldErrors).length === 0;
  }

  clearFieldError(field: string): void {
    if (this.fieldErrors[field]) {
      delete this.fieldErrors[field];
    }
    if (this.error) {
      this.error = null;
    }
  }

  validateField(field: string): void {
    switch (field) {
      case 'userName': {
        const v = (this.user.userName || '').trim();
        if (!v) this.fieldErrors['userName'] = 'Username is required.';
        else if (!/^[a-zA-Z0-9_]{3,30}$/.test(v)) this.fieldErrors['userName'] = 'Username must be 3\u201330 characters (letters, numbers, underscores only).';
        else delete this.fieldErrors['userName'];
        break;
      }
      case 'email': {
        const v = (this.user.email || '').trim();
        if (!v) this.fieldErrors['email'] = 'Email address is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) this.fieldErrors['email'] = 'Enter a valid email address (e.g. name@domain.com).';
        else delete this.fieldErrors['email'];
        break;
      }
      case 'password': {
        const v = (this.user.password || '').trim();
        if (!v) this.fieldErrors['password'] = 'Password is required.';
        else if (v.length < 8) this.fieldErrors['password'] = 'Password must be at least 8 characters.';
        else delete this.fieldErrors['password'];
        break;
      }
      case 'firstName': {
        const v = (this.user.firstName || '').trim();
        if (!v) this.fieldErrors['firstName'] = 'First name is required.';
        else if (/\d/.test(v)) this.fieldErrors['firstName'] = 'First name cannot contain numbers.';
        else if (!/^[a-zA-Z\s\-''.]+$/.test(v)) this.fieldErrors['firstName'] = 'First name can only contain letters.';
        else delete this.fieldErrors['firstName'];
        break;
      }
      case 'lastName': {
        const v = (this.user.lastName || '').trim();
        if (!v) this.fieldErrors['lastName'] = 'Last name is required.';
        else if (/\d/.test(v)) this.fieldErrors['lastName'] = 'Last name cannot contain numbers.';
        else if (!/^[a-zA-Z\s\-''.]+$/.test(v)) this.fieldErrors['lastName'] = 'Last name can only contain letters.';
        else delete this.fieldErrors['lastName'];
        break;
      }
      case 'mobileNumber': {
        const v = (this.user.mobileNumber || '').trim();
        if (v && !/^\d{10}$/.test(v)) this.fieldErrors['mobileNumber'] = 'Mobile number must be exactly 10 digits.';
        else delete this.fieldErrors['mobileNumber'];
        break;
      }
    }
  }

  onSubmit(form: any) {
    if (!this.validateForm()) {
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
