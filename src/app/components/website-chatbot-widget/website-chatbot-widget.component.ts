import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-website-chatbot-widget',
  templateUrl: './website-chatbot-widget.component.html',
  styleUrls: ['./website-chatbot-widget.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class WebsiteChatbotWidgetComponent {
  @Input() entityId!: string;
  @Input() entityName: string = 'Business Chatbot';
  @Input() icon: string = 'chat';

  chatMessages: { role: 'user' | 'assistant', text: string }[] = [];
  userInput = '';
  aiThinking = false;
  aiTyping = false;
  revealText = '';

  sendMessage() {
    if (!this.userInput.trim()) return;
    this.chatMessages.push({ role: 'user', text: this.userInput });
    this.userInput = '';
    this.aiThinking = true;
    // Simulate AI response (replace with backend call)
    setTimeout(() => {
      this.aiThinking = false;
      this.aiTyping = true;
      this.revealText = '';
      const response = 'Thank you for your question! Our team will get back to you soon.';
      let i = 0;
      const typeInterval = setInterval(() => {
        this.revealText += response[i];
        i++;
        if (i >= response.length) {
          clearInterval(typeInterval);
          this.chatMessages.push({ role: 'assistant', text: response });
          this.aiTyping = false;
          this.revealText = '';
        }
      }, 30);
    }, 1000);
  }

  onEnterSend(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
