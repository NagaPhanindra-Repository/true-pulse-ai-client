import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/security/auth.service';
import { FeedbackPoint } from '../../models/feedback-point.model';
import { Discussion } from '../../models/discussion.model';

@Component({
  selector: 'app-retro-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './retro-dashboard.component.html',
  styleUrl: './retro-dashboard.component.scss'
})
export class RetroDashboardComponent implements OnInit {
  retro: any = null;
  feedbackPoints: FeedbackPoint[] = [];
  discussions: Discussion[] = [];
  loading: boolean = false;

  // Feedback entry state per lane
  feedbackEntry = {
    LIKED: '',
    LEARNED: '',
    LACKED: '',
    LONGED_FOR: ''
  };
  feedbackEdit: { [id: number]: boolean } = {};
  feedbackEditValue: { [id: number]: string } = {};

  // Discussion entry/edit state
  discussionEntry: { [feedbackId: number]: string } = {};
  discussionEdit: { [id: number]: boolean } = {};
  discussionEditValue: { [id: number]: string } = {};

  get likedFeedbacks(): FeedbackPoint[] {
    return this.feedbackPoints.filter(f => f.type === 'LIKED' && f.id !== undefined);
  }
  get learnedFeedbacks(): FeedbackPoint[] {
    return this.feedbackPoints.filter(f => f.type === 'LEARNED' && f.id !== undefined);
  }
  get lackedFeedbacks(): FeedbackPoint[] {
    return this.feedbackPoints.filter(f => f.type === 'LACKED' && f.id !== undefined);
  }
  get longedFeedbacks(): FeedbackPoint[] {
    return this.feedbackPoints.filter(f => f.type === 'LONGED_FOR' && f.id !== undefined);
  }

  getDiscussionsFor(feedbackId: number | undefined): Discussion[] {
    if (!feedbackId) return [];
    return this.discussions.filter(d => d.feedbackPointId === feedbackId && d.id !== undefined);
  }

  constructor(
    private router: Router,
    private feedbackService: FeedbackService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    // Get retro details from navigation state
    if (history.state && history.state.retro) {
      this.retro = history.state.retro;
      this.loadFeedbackPoints();
      this.loadDiscussions();
    }
  }

  loadFeedbackPoints() {
    if (!this.retro?.id) return;
    this.loading = true;
    this.feedbackService.getFeedbackPoints().subscribe({
      next: (points) => {
        this.feedbackPoints = points.filter(p => p.retroId === this.retro.id);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  addFeedbackPoint(type: 'LIKED' | 'LEARNED' | 'LACKED' | 'LONGED_FOR') {
    const description = this.feedbackEntry[type].trim();
    if (!description || !this.retro?.id) return;
    const point: FeedbackPoint = {
      type,
      description,
      retroId: this.retro.id
    };
    this.feedbackService.createFeedbackPoint(point).subscribe({
      next: () => {
        this.feedbackEntry[type] = '';
        this.loadFeedbackPoints();
      }
    });
  }

  startEditFeedback(feedback: FeedbackPoint) {
    this.feedbackEdit[feedback.id!] = true;
    this.feedbackEditValue[feedback.id!] = feedback.description;
  }

  saveEditFeedback(feedback: FeedbackPoint) {
    const newDesc = this.feedbackEditValue[feedback.id!].trim();
    if (!newDesc) return;
    const updated: FeedbackPoint = {
      ...feedback,
      description: newDesc
    };
    this.feedbackService.updateFeedbackPoint(feedback.id!, updated).subscribe({
      next: () => {
        this.feedbackEdit[feedback.id!] = false;
        this.loadFeedbackPoints();
      }
    });
  }

  cancelEditFeedback(feedback: FeedbackPoint) {
    this.feedbackEdit[feedback.id!] = false;
    this.feedbackEditValue[feedback.id!] = '';
  }

  // Discussion logic
  addDiscussion(feedback: FeedbackPoint) {
    const note = this.discussionEntry[feedback.id!]?.trim();
    const user = this.auth.user;
    if (!note || !user?.id) return;
    const discussion: Discussion = {
      note,
      feedbackPointId: feedback.id!,
      userId: user.id
    };
    this.feedbackService.createDiscussion(discussion).subscribe({
      next: () => {
        this.discussionEntry[feedback.id!] = '';
        this.loadDiscussions();
      }
    });
  }

  startEditDiscussion(disc: Discussion) {
    this.discussionEdit[disc.id!] = true;
    this.discussionEditValue[disc.id!] = disc.note;
  }

  saveEditDiscussion(disc: Discussion) {
    const newNote = this.discussionEditValue[disc.id!].trim();
    const user = this.auth.user;
    if (!newNote || !user?.id) return;
    const updated: Discussion = {
      ...disc,
      note: newNote,
      userId: user.id
    };
    this.feedbackService.updateDiscussion(disc.id!, updated).subscribe({
      next: () => {
        this.discussionEdit[disc.id!] = false;
        this.loadDiscussions();
      }
    });
  }

  cancelEditDiscussion(disc: Discussion) {
    this.discussionEdit[disc.id!] = false;
    this.discussionEditValue[disc.id!] = '';
  }

  loadDiscussions() {
    this.feedbackService.getDiscussions().subscribe({
      next: (discs) => {
        this.discussions = discs;
      }
    });
  }
}
