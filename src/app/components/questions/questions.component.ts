import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionService, Question } from '../../services/question.service';
import { AiChatBotComponent } from '../ai-chat-bot/ai-chat-bot.component';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, AiChatBotComponent],
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit {
  questions: Question[] = [];
  loading = true;
  error = '';
  editIndex: number | null = null;
  editTitle: string = '';
  editDescription: string = '';
  saving = false;
  showBot = false;
  botQuestion: Question | null = null;

  constructor(private questionService: QuestionService) {}

  ngOnInit() {
    this.loadQuestions();
  }

  openBot(q: Question) {
    this.botQuestion = q;
    this.showBot = true;
  }

  closeBot() {
    this.showBot = false;
    this.botQuestion = null;
  }

  loadQuestions() {
    this.loading = true;
    this.questionService.getMyQuestions().subscribe({
      next: (data) => {
        this.questions = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load questions.';
        this.loading = false;
      }
    });
  }

  startEdit(i: number) {
    this.editIndex = i;
    this.editTitle = this.questions[i].title;
    this.editDescription = this.questions[i].description;
  }

  cancelEdit() {
    this.editIndex = null;
    this.editTitle = '';
    this.editDescription = '';
  }

  saveEdit(i: number) {
    if (!this.editTitle.trim()) return;
    this.saving = true;
    const q = this.questions[i];
    this.questionService.updateQuestion(q.id!, {
      title: this.editTitle,
      description: this.editDescription
    }).subscribe({
      next: (updated) => {
        this.questions[i] = { ...q, ...updated };
        this.cancelEdit();
        this.saving = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update question.';
        this.saving = false;
      }
    });
  }
}
