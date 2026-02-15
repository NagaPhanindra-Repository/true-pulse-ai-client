import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RetroService } from '../../services/retro.service';
import { FeedbackService } from '../../services/feedback.service';
import { Discussion } from '../../models/discussion.model';
import { FeedbackPoint } from '../../models/feedback-point.model';
import { AuthService } from '../../services/security/auth.service';

@Component({
  selector: 'app-retro-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './retro-session.component.html',
  styleUrls: ['./retro-session.component.scss']
})
export class RetroSessionComponent implements OnInit {
  @Input() retroId!: number;
  @Input() retroTitle: string = '';
  @Input() lanes: string[] = ['LIKED', 'LEARNED', 'LACKED', 'LONGED_FOR'];
  @Input() initialStep: 'summary' | 'feedback' | 'done' = 'summary';
  @Input() initialFeedbackIndex: number = 0;
  @Output() sessionEnded = new EventEmitter<void>();
  @Output() sessionPaused = new EventEmitter<{ step: 'summary' | 'feedback' | 'done'; currentFeedbackIndex: number }>();

  retro: any = null;
  feedbackPoints: FeedbackPoint[] = []  ;
  discussions: Discussion[] = [];
  discussionEntry: { [feedbackId: number]: string } = {};
  discussionEdit: { [id: number]: boolean } = {};
  discussionEditValue: { [id: number]: string } = {};
  feedbackEdit: { [id: number]: boolean } = {};
  feedbackEditValue: { [id: number]: string } = {};

  // State for session flow
  step: 'summary' | 'feedback' | 'done' = 'summary';
  currentFeedbackIndex = 0;
  aiSummary: string = '';
  aiFeedbackAnalysis: string = '';
  loading = false;
  timer = 0;
  timerInterval: any;
  typingText: string = '';
  typingInterval: any;

  constructor(private retroService: RetroService,
     private feedbackService: FeedbackService,
    private auth: AuthService) {}

  ngOnInit() {
    this.step = this.initialStep || 'summary';
    this.currentFeedbackIndex = Math.max(0, this.initialFeedbackIndex || 0);
    this.startTimer();
    this.fetchRetroDetails(this.retroId);
    if (this.step === 'summary') {
      this.loadRetroSummary();
    }
  }

  fetchRetroDetails(retroId: number) {
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
        const typeOrder = ['LIKED', 'LEARNED', 'LACKED', 'LONGED_FOR'];
        const typeRank = new Map(typeOrder.map((type, index) => [type, index]));
        this.feedbackPoints = (data.feedbackPoints || [])
          .map((fp: any, index: number) => ({ ...fp, discussions: undefined, __orderIndex: index }))
          .sort((a: any, b: any) => {
            const rankA = typeRank.get(a.type) ?? Number.MAX_SAFE_INTEGER;
            const rankB = typeRank.get(b.type) ?? Number.MAX_SAFE_INTEGER;
            if (rankA !== rankB) return rankA - rankB;
            return (a.__orderIndex ?? 0) - (b.__orderIndex ?? 0);
          })
          .map(({ __orderIndex, ...fp }: any) => fp);
        this.discussions = (data.feedbackPoints || []).flatMap((fp: any) =>
          (fp.discussions || []).map((d: any) => ({ ...d, feedbackPointId: fp.id }))
        );
        if (this.step === 'feedback') {
          const maxIndex = Math.max(0, this.feedbackPoints.length - 1);
          this.currentFeedbackIndex = Math.min(this.currentFeedbackIndex, maxIndex);
          this.loadFeedbackAnalysis();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  startEditFeedback(feedback: FeedbackPoint) {
    this.feedbackEdit[feedback.id!] = true;
    this.feedbackEditValue[feedback.id!] = feedback.description;
  }

  saveEditFeedback(feedback: FeedbackPoint) {
    const newDesc = this.feedbackEditValue[feedback.id!]?.trim();
    if (!newDesc) return;
    const updated: FeedbackPoint = {
      ...feedback,
      description: newDesc
    };
    this.feedbackService.updateFeedbackPoint(feedback.id!, updated).subscribe(() => {
      this.feedbackEdit[feedback.id!] = false;
      this.fetchRetroDetails(this.retroId);
    });
  }

  cancelEditFeedback(feedback: FeedbackPoint) {
    this.feedbackEdit[feedback.id!] = false;
    this.feedbackEditValue[feedback.id!] = '';
  }

  deleteFeedback(feedback: FeedbackPoint) {
    if (!feedback.id) return;
    if (!confirm('Are you sure you want to delete this feedback point?')) return;
    this.feedbackService.deleteFeedbackPoint(feedback.id).subscribe(() => {
      this.fetchRetroDetails(this.retroId);
    });
  }

  getDiscussionsFor(feedbackId: number | undefined): Discussion[] {
    if (!feedbackId) return [];
    return this.discussions.filter(d => d.feedbackPointId === feedbackId && d.id !== undefined);
  }

  deleteDiscussion(disc: Discussion) {
    if (!disc.id) return;
    if (!confirm('Are you sure you want to delete this discussion?')) return;
    this.feedbackService.deleteDiscussion(disc.id).subscribe(() => {
      this.fetchRetroDetails(this.retroId);
    });
  }

  startTimer() {
    this.timer = 0;
    this.timerInterval = setInterval(() => this.timer++, 1000);
  }

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  endSession() {
    this.stopTimer();
    this.sessionEnded.emit();
  }

  pauseSession() {
    this.stopTimer();
    this.sessionPaused.emit({
      step: this.step,
      currentFeedbackIndex: this.currentFeedbackIndex
    });
  }

  get sessionStatusLabel(): string {
    if (this.step === 'summary') return 'Summary';
    if (this.step === 'feedback') {
      const total = this.feedbackPoints.length;
      if (total === 0) return 'Feedback';
      const current = Math.min(this.currentFeedbackIndex + 1, total);
      return `Feedback ${current} of ${total}`;
    }
    return 'Wrap up';
  }

  getFeedbackTypeLabel(type: FeedbackPoint['type']): string {
    switch (type) {
      case 'LIKED':
        return 'Liked';
      case 'LEARNED':
        return 'Learned';
      case 'LACKED':
        return 'Lacked';
      case 'LONGED_FOR':
        return 'Longed For';
      default:
        return type;
    }
  }

  loadRetroSummary() {
    this.loading = true;
    this.retroService.getRetroAnalysis(this.retroId).subscribe({
      next: (res) => {
        this.animateTyping(res.summary, 'summary');
        this.loading = false;
      },
      error: () => {
        this.aiSummary = 'Failed to load summary.';
        this.loading = false;
      }
    });
  }

  onNextStep() {
    if (this.step === 'summary') {
      this.step = 'feedback';
      this.currentFeedbackIndex = 0;
      this.loadFeedbackAnalysis();
    } else if (this.step === 'feedback') {
      if (this.currentFeedbackIndex < this.feedbackPoints.length - 1) {
        this.currentFeedbackIndex++;
        this.loadFeedbackAnalysis();
      } else {
        this.step = 'done';
      }
    }
  }

  onPrevStep() {
    if (this.step !== 'feedback') return;
    if (this.currentFeedbackIndex > 0) {
      this.currentFeedbackIndex--;
      this.loadFeedbackAnalysis();
    }
  }

  canSaveAndNext(): boolean {
    const fp = this.feedbackPoints[this.currentFeedbackIndex];
    return this.getDiscussionsFor(fp.id!).length > 0;
  }

  addDiscussion(feedback: FeedbackPoint) {
    const note = this.discussionEntry[feedback.id!]?.trim();
     const user = this.auth.user;
    if (!note || !user?.id) return;
    const discussion: Discussion = {
      note,
      feedbackPointId: feedback.id!,
      userId: user.id
    };
    this.feedbackService.createDiscussion(discussion).subscribe(() => {
      this.fetchRetroDetails(this.retroId);
      this.discussionEntry[feedback.id!] = '';
    });
  }


  startEditDiscussion(disc: Discussion) {
    this.discussionEdit[disc.id!] = true;
    this.discussionEditValue[disc.id!] = disc.note;
  }

  saveEditDiscussion(disc: Discussion) {
    const newNote = this.discussionEditValue[disc.id!]?.trim();
    if (!newNote) return;
    const updated: Discussion = {
      ...disc,
      note: newNote
    };
    this.feedbackService.updateDiscussion(disc.id!, updated).subscribe(() => {
      this.discussionEdit[disc.id!] = false;
      this.fetchRetroDetails(this.retroId);
    });
  }

  cancelEditDiscussion(disc: Discussion) {
    this.discussionEdit[disc.id!] = false;
    this.discussionEditValue[disc.id!] = '';
  }

  loadFeedbackAnalysis() {
    this.loading = true;
    const feedback = this.feedbackPoints[this.currentFeedbackIndex];
    if (!feedback) {
      this.aiFeedbackAnalysis = 'No feedback point.';
      this.loading = false;
      return;
    }
    this.retroService.getFeedbackPointAnalysis(this.retroId, feedback.id!).subscribe({
      next: (res) => {
        this.animateTyping(res.analysis, 'feedback');
        this.loading = false;
      },
      error: () => {
        this.aiFeedbackAnalysis = 'Failed to load analysis.';
        this.loading = false;
      }
    });
  }

  animateTyping(text: string, type: 'summary' | 'feedback') {
    if (this.typingInterval) clearInterval(this.typingInterval);
    let i = 0;
    this.typingText = '';
    const setText = (val: string) => {
      if (type === 'summary') this.aiSummary = val;
      else this.aiFeedbackAnalysis = val;
    };
    setText('');
    this.typingInterval = setInterval(() => {
      if (i < text.length) {
        this.typingText += text.charAt(i);
        setText(this.typingText);
        i++;
      } else {
        clearInterval(this.typingInterval);
      }
    }, 18);
  }
}
