import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat-service.service';
import { ChatMessage } from '../../models/ChatMessage';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent {

  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  messages: ChatMessage[] = [];
  inputText = '';
  loading = false;

  constructor(private chatService: ChatService) {}

  send() {
    const trimmed = this.inputText.trim();
    if (!trimmed || this.loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed
    };

    this.messages.push(userMessage);
    this.inputText = '';
    this.messageInput.nativeElement.value = '';
    this.loading = true;

    this.chatService.sendMessage({
      message: trimmed,
      history: this.messages
    }).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          content: res.reply
        });
        this.loading = false;
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, something went wrong.'
        });
        this.loading = false;
      }
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}