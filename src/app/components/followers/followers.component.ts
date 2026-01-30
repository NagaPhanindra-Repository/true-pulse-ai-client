import { Component, OnInit } from '@angular/core';
import { FollowersService } from '../../services/followers.service';
import { FollowerUser, FollowedUserQuestion } from '../../models/followers.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/security/auth.service';
import { LoggedInUserModel } from '../../models/logged-in-user.model';

import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-followers',
  templateUrl: './followers.component.html',
  styleUrls: ['./followers.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe],
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
  formTouched = false;
  loggedInUser: LoggedInUserModel | null = null;

  editingAnswerId: number | null = null;
  editAnswerContent: string = '';
  editSubmitting = false;
  editError = '';

  constructor(
    private followersService: FollowersService,
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.feedbackForm = this.fb.group({
      content: ['', []]
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

  startEditAnswer(q: FollowedUserQuestion) {
    if (!q.loggedInUserAnswer) return;
    this.editingAnswerId = q.loggedInUserAnswer.answerId;
    this.editAnswerContent = q.loggedInUserAnswer.answerContent;
    this.editError = '';
  }

  cancelEditAnswer() {
    this.editingAnswerId = null;
    this.editAnswerContent = '';
    this.editError = '';
  }

  saveEditAnswer(q: FollowedUserQuestion) {
    if (!q.loggedInUserAnswer) return;
    this.editSubmitting = true;
    this.editError = '';
    this.followersService.updateAnswer(q.loggedInUserAnswer.answerId, this.editAnswerContent, q.questionId).subscribe({
      next: () => {
        this.editSubmitting = false;
        this.editingAnswerId = null;
        this.editAnswerContent = '';
        this.loadData();
      },
      error: err => {
        this.editSubmitting = false;
        this.editError = 'Failed to update answer.';
      }
    });
  }

  closeModal() {
    this.showModal = false;
    this.selectedQuestion = null;
    this.submitError = '';
  }

  submitFeedback() {
    this.formTouched = true;
    this.submitError = '';
    // Always get the latest loggedInUser from AuthService
    this.loggedInUser = this.auth.user;
    if (!this.feedbackForm.valid || !this.feedbackForm.value.content?.trim()) {
      this.submitError = 'Please enter a response.';
      return;
    }
    if (!this.selectedQuestion || !this.loggedInUser?.id) {
      // Debug log for troubleshooting
      console.error('Submit error:', {
        selectedQuestion: this.selectedQuestion,
        loggedInUser: this.loggedInUser
      });
      this.submitError = 'Missing question or user information.';
      return;
    }
    this.submitting = true;
    this.followersService.createAnswer({
      content: this.feedbackForm.value.content.trim(),
      questionId: this.selectedQuestion.questionId,
      username: this.loggedInUser.userName,
      userId: this.loggedInUser.id
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.closeModal();
        this.loadData();
        this.formTouched = false;
      },
      error: err => {
        this.submitting = false;
        this.submitError = 'Failed to submit feedback.';
      }
    });
  }
}
