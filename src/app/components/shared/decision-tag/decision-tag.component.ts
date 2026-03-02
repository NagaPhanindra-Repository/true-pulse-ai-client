import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DecisionType, DecisionTypeLabels, DecisionTypeColors } from '../../../models/feature-memory.model';

@Component({
  selector: 'app-decision-tag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './decision-tag.component.html',
  styleUrl: './decision-tag.component.scss'
})
export class DecisionTagComponent {
  @Input() decisionType: DecisionType = 'requirement';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get label(): string {
    return DecisionTypeLabels[this.decisionType];
  }

  get iconSvg(): string {
    const icons: Record<DecisionType, string> = {
      'requirement': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      'edge-case': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/>
        <path d="M8 5v3M8 11v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
      'change': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 14l5-5M9 4l5-5M14 2v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
      'conflict': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2"/>
        <path d="M5 5l6 6M11 5L5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      'clarification': `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 6c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5m-9 0H1m8 0h1.5M8 9.5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`
    };
    return icons[this.decisionType];
  }

  getColor(): string {
    return DecisionTypeColors[this.decisionType];
  }
}
