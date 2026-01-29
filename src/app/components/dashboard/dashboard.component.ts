import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/security/auth.service';
import { LoggedInUserModel } from '../../models/logged-in-user.model';
import { CreateRetroComponent } from '../create-retro/create-retro.component';
import { QuestionService } from '../../services/question.service';
import { Router } from '@angular/router';
import { UserFollowCardComponent } from '../user-follow-card/user-follow-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateRetroComponent, UserFollowCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  dynamicColor: string = '#6ee7b7';
  user: LoggedInUserModel | null = null;
  questionTitle: string = '';
  questionDescription: string = '';
  creating = false;
  createError = '';

  constructor(
    private auth: AuthService,
    private questionService: QuestionService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.auth.isAuthenticated() && !this.auth.user) {
      this.auth.fetchUserDetails().subscribe();
    }
    this.auth.user$.subscribe((user: LoggedInUserModel | null) => {
      this.user = user;
    });
  }

  createQuestion() {
    if (!this.questionTitle.trim()) return;
    this.creating = true;
    this.createError = '';
    this.questionService.createQuestion({
      title: this.questionTitle,
      description: this.questionDescription
    }).subscribe({
      next: () => {
        this.questionTitle = '';
        this.questionDescription = '';
        this.creating = false;
        this.router.navigate(['/questions']);
      },
      error: (err) => {
        this.createError = err?.error?.message || 'Failed to create question.';
        this.creating = false;
      }
    });
  }
}
