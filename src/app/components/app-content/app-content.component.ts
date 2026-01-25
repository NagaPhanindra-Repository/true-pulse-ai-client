import { Component } from '@angular/core';
import { ChatWindowComponent } from "../chat-window/chat-window.component";

@Component({
  selector: 'app-app-content',
  standalone: true,
  imports: [ChatWindowComponent],
  templateUrl: './app-content.component.html',
  styleUrl: './app-content.component.scss'
})
export class AppContentComponent {
  
  openSignUpModal() {
    window.dispatchEvent(new CustomEvent('open-signup', { bubbles: true }));
  }

  scrollToFeatures() {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

}
