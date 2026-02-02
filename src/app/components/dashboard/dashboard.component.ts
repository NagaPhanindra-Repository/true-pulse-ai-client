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

  // Recent Feedback AI Analysis Section
  recentAnalysis: any[] | null = null;
  currentSlide = 0;
  currentField = 0;
  typingText = '';
  typingInterval: any;
  autoSlideTimeout: any;
  // Define the fields to show per question (slide)
  fieldKeys = [
    { key: 'questionTitle', label: 'Question' },
    { key: 'generalSentiment', label: 'General Sentiment' },
    { key: 'mostLikedAspects', label: 'Most Liked Aspects' },
    { key: 'mostDislikedAspects', label: 'Most Disliked Aspects' },
    { key: 'futureExpectations', label: 'Future Expectations' },
    { key: 'recommendations', label: 'AI Recommendations' }
  ];

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

    // Fetch recent AI analysis for feedback/questions
    this.questionService.getMyQuestionsAnalysis().subscribe({
      next: (data) => {
        this.recentAnalysis = data || [];
        this.currentSlide = 0;
        this.currentField = 0;
        this.startTypingAnimation();
      },
      error: () => {
        this.recentAnalysis = [];
      }
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

  get currentQuestion() {
    if (!this.recentAnalysis || this.recentAnalysis.length === 0) return null;
    return this.recentAnalysis[this.currentSlide];
  }

  get currentFieldLabel() {
    return this.fieldKeys[this.currentField]?.label || '';
  }

  get totalSlides() {
    return this.recentAnalysis ? this.recentAnalysis.length : 0;
  }

  get totalFields() {
    return this.fieldKeys.length;
  }

  get isFirstSlide() {
    return this.currentSlide === 0;
  }

  get isLastSlide() {
    return this.recentAnalysis && this.currentSlide === this.recentAnalysis.length - 1;
  }

  get isFirstField() {
    return this.currentField === 0;
  }

  get isLastField() {
    return this.currentField === this.fieldKeys.length - 1;
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.currentField = 0;
      this.startTypingAnimation();
    }
  }

  nextSlide() {
    if (this.recentAnalysis && this.currentSlide < this.recentAnalysis.length - 1) {
      this.currentSlide++;
      this.currentField = 0;
      this.startTypingAnimation();
    }
  }

  prevField() {
    if (this.currentField > 0) {
      this.currentField--;
      this.startTypingAnimation();
    } else if (this.currentSlide > 0) {
      this.prevSlide();
    }
  }

  nextField() {
    if (this.currentField < this.fieldKeys.length - 1) {
      this.currentField++;
      this.startTypingAnimation();
    } else if (this.recentAnalysis && this.currentSlide < this.recentAnalysis.length - 1) {
      this.nextSlide();
    }
  }

  startTypingAnimation() {
    if (this.typingInterval) clearInterval(this.typingInterval);
    if (this.autoSlideTimeout) clearTimeout(this.autoSlideTimeout);
    if (!this.currentQuestion) {
      this.typingText = '';
      return;
    }
    const fieldKey = this.fieldKeys[this.currentField].key;
    const fullText = this.currentQuestion[fieldKey] || '';
    this.typingText = '';
    let i = 0;
    this.typingInterval = setInterval(() => {
      if (i < fullText.length) {
        this.typingText += fullText[i];
        i++;
      } else {
        clearInterval(this.typingInterval);
        // After typing, auto-advance to next field/slide after a pause
        this.autoSlideTimeout = setTimeout(() => {
          if (this.currentField < this.fieldKeys.length - 1) {
            this.currentField++;
            this.startTypingAnimation();
          } else if (this.recentAnalysis && this.currentSlide < this.recentAnalysis.length - 1) {
            this.currentSlide++;
            this.currentField = 0;
            this.startTypingAnimation();
          }
        }, 1800); // Pause before auto-advance
      }
    }, 18); // Typing speed (ms per char)
  }
}
