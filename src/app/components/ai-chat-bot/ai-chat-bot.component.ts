import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Question } from '../../services/question.service';
import { AiChatBotService } from './ai-chat-bot.service';
import { AiChatRequest, AiChatResponse, ChatMessage } from '../../models/ai-chat.model';

@Component({
  selector: 'app-ai-chat-bot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat-bot.component.html',
  styleUrls: ['./ai-chat-bot.component.scss']
})
export class AiChatBotComponent implements AfterViewChecked, OnInit, OnChanges {
  @Input() question: Question | null = null;
  @Output() close = new EventEmitter<void>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  userInput: string = '';
  aiTyping = false;
  aiThinking = false;
  revealText = '';
  revealIndex = 0;
  revealTimer: any;

  constructor(private aiService: AiChatBotService) {}

  ngOnInit() {
    this.initBot();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      this.initBot();
    }
  }

  initBot() {
    this.messages = [];
    this.userInput = '';
    this.aiThinking = true;
    this.aiTyping = false;
    this.revealText = '';
    this.revealIndex = 0;
    if (this.question && this.question.id) {
      const req: AiChatRequest = { questionId: this.question.id, message: '' };
      this.aiService.analyzeQuestion(req).subscribe({
        next: (res: AiChatResponse) => {
          this.aiThinking = false;
          this.aiTyping = true;
          this.typeAiReply(res.analysis);
        },
        error: () => {
          this.aiThinking = false;
          this.messages.push({ role: 'ai', text: 'Sorry, something went wrong. Please try again.' });
        }
      });
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch {}
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || !this.question?.id) return;
    this.messages.push({ role: 'user', text });
    this.userInput = '';
    this.aiThinking = true;
    this.aiTyping = false;
    this.revealText = '';
    this.revealIndex = 0;
    const req: AiChatRequest = { questionId: this.question.id, message: text };
    this.aiService.analyzeQuestion(req).subscribe({
      next: (res: AiChatResponse) => {
        this.aiThinking = false;
        this.aiTyping = true;
        this.typeAiReply(res.analysis);
      },
      error: () => {
        this.aiThinking = false;
        this.messages.push({ role: 'ai', text: 'Sorry, something went wrong. Please try again.' });
      }
    });
  }

  typeAiReply(reply: string) {
    this.revealText = '';
    this.revealIndex = 0;
    if (this.revealTimer) clearInterval(this.revealTimer);
    this.revealTimer = setInterval(() => {
      this.revealText += reply[this.revealIndex];
      this.revealIndex++;
      if (this.revealIndex >= reply.length) {
        clearInterval(this.revealTimer);
        this.aiTyping = false;
        this.messages.push({ role: 'ai', text: reply });
        this.revealText = '';
      }
    }, 22 + Math.random() * 30);
  }

  trackByIdx(i: number) { return i; }
}
