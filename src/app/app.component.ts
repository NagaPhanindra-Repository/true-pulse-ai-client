import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ChatWindowComponent } from "./components/chat-window/chat-window.component";
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { isHostedWebsiteHostname } from './utils/hosted-website.util';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatWindowComponent,
      FooterComponent,
       HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'true-pulse-ai-client';

  get isHostedPublicWebsite(): boolean {
    if (typeof window === 'undefined') return false;
    const isHostedBySubdomain = isHostedWebsiteHostname(window.location.hostname);
    const isHostedByAliasRoute = /^\/h\/[^/]+/i.test(window.location.pathname || '');
    return isHostedBySubdomain || isHostedByAliasRoute;
  }
}
