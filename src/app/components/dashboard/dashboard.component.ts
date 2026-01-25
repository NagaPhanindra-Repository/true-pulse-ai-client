import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/security/auth.service';
import { LoggedInUserModel } from '../../models/logged-in-user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  dynamicColor: string = '#6ee7b7';
  user: LoggedInUserModel | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit() {
    if (this.auth.isAuthenticated() && !this.auth.user) {
      this.auth.fetchUserDetails().subscribe();
    }
    this.auth.user$.subscribe(user => {
      this.user = user;
    });
  }
}
