import { Component, Input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { UserFollow } from '../../models/user-follow.model';
import { UserFollowService } from './user-follow.service';

@Component({
  selector: 'app-user-follow-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-follow-card.component.html',
  styleUrls: ['./user-follow-card.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
export class UserFollowCardComponent {
  users: UserFollow[] = [];
  following: Set<string> = new Set();
  loading = true;
  error = '';
  animating: Set<string> = new Set();

  constructor(private userFollowService: UserFollowService) {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userFollowService.getRandomUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load users.';
        this.loading = false;
      }
    });
  }

  follow(user: UserFollow) {
    if (this.following.has(user.userName)) return;
    this.animating.add(user.userName);
    this.userFollowService.followUser(user.userName).subscribe({
      next: () => {
        this.following.add(user.userName);
        setTimeout(() => this.animating.delete(user.userName), 800);
      },
      error: () => {
        this.animating.delete(user.userName);
      }
    });
  }
}
