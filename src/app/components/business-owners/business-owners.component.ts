
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityService } from '../../services/entity.service';
import { CreateEntityResponse } from '../../models/entity.model';
import { BusinessDocumentService } from '../../services/business-document.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-business-owners',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  templateUrl: './business-owners.component.html',
  styleUrls: ['./business-owners.component.scss']
})
export class BusinessOwnersComponent implements OnInit {
  // Entity data from backend
  businesses: CreateEntityResponse[] = [];

  selectedBusiness: CreateEntityResponse | null = null;
  searchTerm = '';
  loading = true;
  userInput = '';
  aiThinking = false;
  aiTyping = false;
  revealText = '';
  private typingIntervalId: any = null;
  chatMessages: ChatMessage[] = [];

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  constructor(
    private entityService: EntityService,
    private docService: BusinessDocumentService
  ) {}

  ngOnInit(): void {
    this.loadRandomEntities();
  }

  loadRandomEntities(): void {
    this.loading = true;
    this.entityService.getRandomEntities(20).subscribe({
      next: entities => {
        this.businesses = entities;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectBusiness(business: CreateEntityResponse) {
    this.selectedBusiness = business;
    this.clearTyping();
    this.resetChat();
  }

  resetChat(): void {
    if (!this.selectedBusiness) return;
    this.clearTyping();
    this.chatMessages = [
      {
        role: 'assistant',
        text: `Welcome to ${this.getEntityName(this.selectedBusiness)}! Ask me anything you want to know.`,
        timestamp: Date.now()
      }
    ];
    this.scrollToBottom();
  }

  sendMessage(): void {
    if (!this.selectedBusiness) return;
    const query = this.userInput.trim();
    if (!query || this.aiThinking) return;

    this.chatMessages.push({ role: 'user', text: query, timestamp: Date.now() });
    this.userInput = '';
    this.aiThinking = true;
    this.scrollToBottom();

    this.docService.searchDocuments(
      this.selectedBusiness.id,
      this.selectedBusiness.displayName,
      query,
      5
    ).subscribe({
      next: (res) => {
        const answer = res?.answer || 'I could not find an answer in the documents.';
        this.aiThinking = false;
        this.startTyping(answer);
      },
      error: () => {
        this.aiThinking = false;
        this.chatMessages.push({
          role: 'assistant',
          text: 'Sorry, I had trouble answering that. Please try again.',
          timestamp: Date.now()
        });
        this.scrollToBottom();
      }
    });
  }

  onEnterSend(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private startTyping(answer: string): void {
    this.clearTyping();
    this.aiTyping = true;
    this.revealText = '';
    let index = 0;
    this.typingIntervalId = setInterval(() => {
      this.revealText += answer.charAt(index);
      index += 1;
      if (index % 4 === 0) {
        this.scrollToBottom();
      }
      if (index >= answer.length) {
        this.clearTyping();
        this.chatMessages.push({ role: 'assistant', text: answer, timestamp: Date.now() });
        this.scrollToBottom();
      }
    }, 18);
  }

  private clearTyping(): void {
    if (this.typingIntervalId) {
      clearInterval(this.typingIntervalId);
      this.typingIntervalId = null;
    }
    this.aiTyping = false;
    this.revealText = '';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }, 0);
  }

  onSearchTermChange(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      this.loadRandomEntities();
      return;
    }
    if (term.length < 2) return;
    this.loading = true;
    this.entityService.searchEntities(term).subscribe({
      next: entities => {
        this.businesses = entities;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getEntityIcon(entity: CreateEntityResponse): string {
    switch (entity.type) {
      case 'BUSINESS':
        return 'storefront';
      case 'BUSINESS_LEADER':
        return 'work';
      case 'POLITICIAN':
        return 'gavel';
      case 'CELEBRITY':
        return 'star';
      default:
        return 'business';
    }
  }

  getEntityName(entity: CreateEntityResponse): string {
    return entity.displayName;
  }

  get filteredBusinesses(): CreateEntityResponse[] {
    return this.businesses;
  }
}
