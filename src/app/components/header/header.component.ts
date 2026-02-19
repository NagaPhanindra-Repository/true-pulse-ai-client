import { Component, Inject, PLATFORM_ID, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SignUpComponent } from '../sign-up/sign-up.component';
import { LoginInComponent } from '../login-in/login-in.component';
import { AuthService } from '../../services/security/auth.service';
import { LoggedInUserModel } from '../../models/logged-in-user.model';
import { FollowersComponent } from '../followers/followers.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SignUpComponent, LoginInComponent, FollowersComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HeaderComponent {
  showSignUp = false;
  showLogin = false;
  showProfileDropdown = false;
  showMobileNav = false;
  loginSuccessMessage: string | null = null;
  userName: string | null = null;
  user: LoggedInUserModel | null = null;
  profilePic: string = 'assets/default-profile.svg';

  constructor(public auth: AuthService, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    // Only fetch user details in browser, not during SSR
    if (isPlatformBrowser(this.platformId) && this.auth.isAuthenticated() && !this.auth.user) {
      this.auth.fetchUserDetails().subscribe();
    }
    this.auth.user$.subscribe(user => {
      this.user = user;
      this.userName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.userName || null;
      this.profilePic = 'assets/default-profile.svg';
    });
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
    this.showProfileDropdown = show;
  }

  logout() {
    this.auth.logout();
    this.closeMobileNav();
  }

}
