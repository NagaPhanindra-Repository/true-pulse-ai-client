import { Component, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SignUpComponent } from '../sign-up/sign-up.component';
import { LoginInComponent } from '../login-in/login-in.component';
import { AuthService } from '../../services/security/auth.service';
import { LoggedInUserModel } from '../../models/logged-in-user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SignUpComponent, LoginInComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  showSignUp = false;
  showLogin = false;
  showProfileDropdown = false;
  showMobileNav = false;
  loginSuccessMessage: string | null = null;
  userName: string | null = null;
  user: LoggedInUserModel | null = null;
  profilePic: string | null = null;
  profilePicError = false;
  userInitials: string = '?';
  avatarColor: string = '#3b82f6';
  private dropdownCloseTimer: any = null;

  constructor(public auth: AuthService, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Only run in browser, not during SSR
    if (isPlatformBrowser(this.platformId)) {
      if (this.auth.isAuthenticated() && !this.auth.user) {
        this.auth.fetchUserDetails().subscribe();
      }
      this.auth.user$.subscribe(user => {
        this.user = user;
        this.userName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.userName || null;
        this.updateProfileAvatar(user);
      });
    }
  }

  get isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  toggleMobileNav() {
    this.showMobileNav = !this.showMobileNav;
  }

  closeMobileNav() {
    this.showMobileNav = false;
  }

  toggleProfileDropdown(show: boolean) {
    // Clear any pending close timer
    if (this.dropdownCloseTimer) {
      clearTimeout(this.dropdownCloseTimer);
      this.dropdownCloseTimer = null;
    }

    if (show) {
      // Show immediately
      this.showProfileDropdown = true;
    } else {
      // Delay closing to allow user to move to dropdown
      this.dropdownCloseTimer = setTimeout(() => {
        this.showProfileDropdown = false;
      }, 200);
    }
  }

  toggleProfileClick() {
    // For click/tap on mobile and tablet
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  closeProfileDropdown() {
    if (this.dropdownCloseTimer) {
      clearTimeout(this.dropdownCloseTimer);
      this.dropdownCloseTimer = null;
    }
    this.showProfileDropdown = false;
  }

  logout() {
    this.auth.logout();
    this.closeMobileNav();
    this.closeProfileDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const profileMenu = target.closest('.profile-menu-wrapper');
    
    // Close dropdown if clicking outside
    if (!profileMenu && this.showProfileDropdown) {
      this.closeProfileDropdown();
    }
  }

  /**
   * Update profile avatar with intelligent fallback
   */
  private updateProfileAvatar(user: LoggedInUserModel | null) {
    this.profilePicError = false;
    
    // Profile picture upload not yet implemented - use initials avatar
    this.profilePic = null;
    
    // Generate initials and color
    this.userInitials = this.generateInitials(user);
    this.avatarColor = this.generateAvatarColor(user);
  }

  /**
   * Generate user initials for avatar
   */
  private generateInitials(user: LoggedInUserModel | null): string {
    if (!user) return '?';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    if (user.userName) {
      return user.userName.slice(0, 2).toUpperCase();
    }
    
    return '?';
  }

  /**
   * Generate deterministic avatar color based on user name
   * This ensures each user gets a consistent, unique color
   */
  private generateAvatarColor(user: LoggedInUserModel | null): string {
    if (!user) return '#3b82f6';
    
    // Use user's name or username to generate a consistent hash
    const str = user.firstName || user.userName || 'default';
    
    // Modern, professional color palette
    const colors = [
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#06b6d4', // Cyan
      '#6366f1', // Indigo
      '#84cc16', // Lime
      '#f97316', // Orange
      '#14b8a6', // Teal
    ];
    
    // Simple hash function for consistent color selection
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  /**
   * Handle profile picture load error
   */
  onProfilePicError() {
    this.profilePicError = true;
    this.profilePic = null;
  }

  /**
   * Check if should show initials avatar
   */
  get showInitialsAvatar(): boolean {
    return !this.profilePic || this.profilePicError;
  }

}
