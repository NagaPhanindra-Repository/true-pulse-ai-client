import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat-service.service';
import { ChatMessage } from '../../models/ChatMessage';

// Use the imported ChatMessage interface from models/ChatMessage

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss']
})
export class ChatWindowComponent implements AfterViewChecked {

    @ViewChild('chatWindow') chatWindow!: ElementRef<HTMLDivElement>;
    showChat = false;
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    try {
      if (this.chatWindow && this.chatWindow.nativeElement) {
        this.chatWindow.nativeElement.scrollTop = this.chatWindow.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }


  messages: ChatMessage[] = [];
  userInput: string = '';
  loading = false;

  constructor(private chatService: ChatService) {}

  sendMessage() {
    const input = this.userInput.trim();
    if (!input) return;

    // Add user message
    this.messages.push({
      role: 'user',
      content: input
    });

    // Clear input
    this.userInput = '';
    this.loading = true;

    this.chatService.sendMessage({
      message: input,
      history: this.messages
    }).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'assistant',
          content: res.reply,
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
}