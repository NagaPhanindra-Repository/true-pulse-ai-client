import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent {
  features = [
    {
      icon: '🧠',
      title: 'Verified Signal Engine',
      description: 'Advanced feedback collection that ensures authentic, uncontaminated input signals for accurate decision-making.'
    },
    {
      icon: '📚',
      title: 'Memory Architecture',
      description: 'MCP-integrated requirements memory that keeps your team context complete during implementation cycles.'
    },
    {
      icon: '🎯',
      title: 'RAG-Powered Synthesis',
      description: 'Retrieval-Augmented Generation ensures decisions are grounded in truth, not guesses.'
    },
    {
      icon: '⚡',
      title: 'Enterprise Scale',
      description: 'Built by architects who scaled billion-dollar systems handling millions of concurrent users.'
    }
  ];

  values = [
    { title: 'Authenticity', description: 'We believe verified reality outperforms intuition. Every signal matters.' },
    { title: 'Context Preservation', description: 'Complete context during development eliminates cascading failures.' },
    { title: 'Evidence-Based', description: 'Decisions grounded in truth, backed by RAG synthesis and historical data.' },
    { title: 'Enterprise Ready', description: 'Production-grade security, compliance, and scalability from day one.' }
  ];

  timeline = [
    { year: '2024', event: 'TruePulse AI Founded', detail: 'Solving the signal contamination problem in enterprise software.' },
    { year: '2025', event: 'Retrospective & Memory Platform Launch', detail: 'Teams worldwide gain access to verified feedback & context preservation.' },
    { year: '2026', event: 'AI Integration & Expansion', detail: 'RAG, MCP, and advanced analytics for enterprise intelligence.' }
  ];
}
