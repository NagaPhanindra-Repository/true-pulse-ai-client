import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetroService } from '../../services/retro.service';
import { FeedbackService } from '../../services/feedback.service';
import { Discussion } from '../../models/discussion.model';

@Component({
  selector: 'app-retro-session',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './retro-session.component.html',
  styleUrls: ['./retro-session.component.scss']
})
export class RetroSessionComponent implements OnInit {
  @Input() retroId!: number;
  @Input() feedbackPoints: any[] = [];
  @Input() lanes: string[] = ['LIKED', 'LEARNED', 'LACKED', 'LONGED_FOR'];
  @Output() sessionEnded = new EventEmitter<void>();

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

  constructor(private retroService: RetroService, private feedbackService: FeedbackService) {}

  ngOnInit() {
    this.startTimer();
    this.loadRetroSummary();
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

  loadFeedbackAnalysis() {
    this.loading = true;
    const feedback = this.feedbackPoints[this.currentFeedbackIndex];
    if (!feedback) {
      this.aiFeedbackAnalysis = 'No feedback point.';
      this.loading = false;
      return;
    }
    this.retroService.getFeedbackPointAnalysis(this.retroId, feedback.id).subscribe({
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
