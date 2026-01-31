import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/security/auth.service';
import { RetroService } from '../../services/retro.service';
import { FeedbackPoint } from '../../models/feedback-point.model';
import { Discussion } from '../../models/discussion.model';
import { RetroSessionComponent } from '../retro-session/retro-session.component';

@Component({
  selector: 'app-retro-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RetroSessionComponent],
  templateUrl: './retro-dashboard.component.html',
  styleUrl: './retro-dashboard.component.scss'
})
export class RetroDashboardComponent implements OnInit {
  retro: any = null;
  feedbackPoints: FeedbackPoint[] = [];
  discussions: Discussion[] = [];
  actionItems: any[] = [];
  questions: any[] = [];
  loading: boolean = false;

  // Action item entry/edit state
  actionEntry: { description: string; dueDate: string; assignedUserName: string } = { description: '', dueDate: '', assignedUserName: '' };
  actionEdit: { [id: number]: boolean } = {};
  actionEditValue: { [id: number]: any } = {};

  showSession = false;

  startRetroSession() {
    this.showSession = true;
  }

  onSessionEnded() {
    this.showSession = false;
    if (this.retro && this.retro.id) {
      this.fetchRetroDetails(this.retro.id);
    }
  }

  loadActionItems(): void {
    if (!this.retro || !this.retro.id) return;
    this.retroService.getActionItemsByRetroId(this.retro.id).subscribe({
      next: (items: any[]) => {
        this.actionItems = items || [];
      }
    });
  }

  addActionItem(): void {
    if (!this.actionEntry.description || !this.actionEntry.dueDate || !this.actionEntry.assignedUserName || !this.retro || !this.retro.id) return;
    const payload = {
      description: this.actionEntry.description,
      dueDate: this.actionEntry.dueDate,
      retroId: this.retro.id,
      assignedUserName: this.actionEntry.assignedUserName
    };
    this.retroService.createActionItem(payload).subscribe({
      next: () => {
        this.actionEntry = { description: '', dueDate: '', assignedUserName: '' };
        this.loadActionItems();
      }
    });
  }

  startEditAction(item: any): void {
    this.actionEdit[item.id] = true;
    this.actionEditValue[item.id] = { ...item };
  }

  saveEditAction(item: any): void {
    const updated = this.actionEditValue[item.id];
    this.retroService.updateActionItem(item.id, updated).subscribe({
      next: () => {
        this.actionEdit[item.id] = false;
        this.loadActionItems();
      }
    });
  }

  cancelEditAction(item: any): void {
    this.actionEdit[item.id] = false;
    this.actionEditValue[item.id] = {};
  }

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
    private route: ActivatedRoute,
    private feedbackService: FeedbackService,
    private retroService: RetroService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    // Try to get retro id from route params
    this.route.paramMap.subscribe(params => {
      const retroId = params.get('id');
      if (retroId) {
        this.fetchRetroDetails(retroId);
      } else if (history.state && history.state.retro) {
        // fallback for navigation state (e.g. after create)
        this.retro = history.state.retro;
        this.loadFeedbackPoints();
        this.loadDiscussions();
      }
    });
  }



  fetchRetroDetails(retroId: string) {
    this.loading = true;
    this.retroService.getRetroDetails(retroId).subscribe({
      next: (data) => {
        this.retro = {
          id: data.id,
          title: data.title,
          description: data.description,
          userId: data.userId,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
        this.feedbackPoints = (data.feedbackPoints || []).map((fp: any) => {
          // Flatten discussions for each feedback point
          return {
            ...fp,
            discussions: undefined // discussions handled separately
          };
        });
        // Flatten all discussions for easy access
        this.discussions = (data.feedbackPoints || []).flatMap((fp: any) =>
          (fp.discussions || []).map((d: any) => ({
            ...d,
            feedbackPointId: fp.id
          }))
        );
        this.questions = data.questions || [];
        this.loadActionItems();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
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

    deleteFeedback(feedback: FeedbackPoint) {
    if (!feedback.id) return;
    if (!confirm('Are you sure you want to delete this feedback point?')) return;
    this.feedbackService.deleteFeedbackPoint(feedback.id).subscribe({
      next: () => {
        this.loadFeedbackPoints();
      }
    });
  }

  deleteDiscussion(disc: Discussion) {
    if (!disc.id) return;
    if (!confirm('Are you sure you want to delete this discussion?')) return;
    this.feedbackService.deleteDiscussion(disc.id).subscribe({
      next: () => {
        this.loadDiscussions();
      }
    });
  }

    deleteActionItem(item: any): void {
    if (!item.id) return;
    if (!confirm('Are you sure you want to delete this action item?')) return;
    this.retroService.deleteActionItem(item.id).subscribe({
      next: () => {
        this.loadActionItems();
      }
    });
  }
}
