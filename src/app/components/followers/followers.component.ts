import { Component, OnInit } from '@angular/core';
import { FollowersService } from '../../services/followers.service';
import { FollowerUser, FollowedUserQuestion } from '../../models/followers.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/security/auth.service';
import { LoggedInUserModel } from '../../models/logged-in-user.model';

import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-followers',
  templateUrl: './followers.component.html',
  styleUrls: ['./followers.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  providers: [DatePipe],
})
export class FollowersComponent implements OnInit {
  followingUsers: FollowerUser[] = [];
  questions: FollowedUserQuestion[] = [];
  loading = true;
  error = '';
  showModal = false;
  selectedQuestion: FollowedUserQuestion | null = null;
  feedbackForm: FormGroup;
  submitting = false;
  submitError = '';
  loggedInUser: LoggedInUserModel | null = null;

  constructor(
    private followersService: FollowersService,
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.feedbackForm = this.fb.group({
      content: ['']
    });
  }

  ngOnInit() {
    this.loggedInUser = this.auth.user;
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.followersService.getMyFollowingUsers().subscribe({
      next: users => this.followingUsers = users,
      error: err => this.error = 'Failed to load following users.'
    });
    this.followersService.getFollowedUsersQuestions().subscribe({
      next: questions => {
        this.questions = questions;
        this.loading = false;
      },
      error: err => {
        this.error = 'Failed to load questions.';
        this.loading = false;
      }
    });
  }

  openRespondModal(q: FollowedUserQuestion) {
    this.selectedQuestion = q;
    this.feedbackForm.reset();
    this.showModal = true;
    this.submitError = '';
  }

  closeModal() {
    this.showModal = false;
    this.selectedQuestion = null;
    this.submitError = '';
  }

  submitFeedback() {
    if (!this.selectedQuestion || !this.loggedInUser?.id) return;
    this.submitting = true;
    this.submitError = '';
    this.followersService.createAnswer({
      content: this.feedbackForm.value.content,
      questionId: this.selectedQuestion.questionId,
      username: this.loggedInUser.userName,
      userId: this.loggedInUser.id
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
        this.loadData();
      },
      error: err => {
        this.submitting = false;
        this.submitError = 'Failed to submit feedback.';
      }
    });
  }
}
