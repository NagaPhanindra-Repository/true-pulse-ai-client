import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemoryDiscussion } from '../../../models/feature-memory.model';
import { DecisionTagComponent } from '../decision-tag/decision-tag.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, DecisionTagComponent],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent {
  @Input() discussions: MemoryDiscussion[] = [];
  @Input() title: string = 'Timeline';
  @Input() showDecisionTypeBadges = true;

  formatDate(date: Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMeetingDate(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(name?: string): string {
    if (!name) return '#64748b';
    const colors = ['#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getTagColor(discussionType: string): string {
    const colors: Record<string, string> = {
      'requirement': '#3b82f6',
      'edge-case': '#f59e0b',
      'change': '#8b5cf6',
      'conflict': '#ef4444',
      'clarification': '#10b981'
    };
    return colors[discussionType] || '#64748b';
  }
}
