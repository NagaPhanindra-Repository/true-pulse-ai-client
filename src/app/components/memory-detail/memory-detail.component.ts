import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatureMemoryService } from '../../services/feature-memory.service';
import { FeatureMemoryDetail, MemoryStatus } from '../../models/feature-memory.model';
import { TimelineComponent } from '../shared/timeline/timeline.component';
import { DiscussionFormComponent } from '../shared/discussion-form/discussion-form.component';
import { MemoryCreationWizardComponent } from '../memory-creation-wizard/memory-creation-wizard.component';

@Component({
  selector: 'app-memory-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TimelineComponent,
    DiscussionFormComponent,
    MemoryCreationWizardComponent
  ],
  templateUrl: './memory-detail.component.html',
  styleUrl: './memory-detail.component.scss'
})
export class MemoryDetailComponent implements OnInit {
  memory: FeatureMemoryDetail | null = null;
  loading = true;
  error: string | null = null;

  // UI State
  activeTab: 'overview' | 'timeline' | 'requirements' | 'edgecases' | 'conflicts' = 'overview';
  showAddDiscussion = false;
  showWizard = false;
  savingDiscussion = false;
  editingMemory = false;
  editDescription = '';

  // Filtering
  diskussionSearch = '';

  constructor(
    private route: ActivatedRoute,
    private memoryService: FeatureMemoryService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadMemory(id);
      }
    });
  }

  loadMemory(id: string) {
    this.loading = true;
    this.error = null;

    this.memoryService.getMemoryDetail(id).subscribe({
      next: (memory) => {
        this.memory = memory;
        this.editDescription = memory.initialDescription;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load memory. Please try again.';
        this.loading = false;
        console.error('Error loading memory:', err);
      }
    });
  }

  switchTab(tab: 'overview' | 'timeline' | 'requirements' | 'edgecases' | 'conflicts') {
    this.activeTab = tab;
  }

  startEditingMemory() {
    this.editingMemory = true;
  }

  saveMemory() {
    if (!this.memory) return;

    this.memoryService.updateMemory(this.memory.id, {
      initialDescription: this.editDescription
    }).subscribe({
      next: () => {
        this.memory!.initialDescription = this.editDescription;
        this.editingMemory = false;
      },
      error: (err) => {
        console.error('Error updating memory:', err);
      }
    });
  }

  cancelEditingMemory() {
    this.editDescription = this.memory?.initialDescription || '';
    this.editingMemory = false;
  }

  completeMemory() {
    if (!this.memory) return;

    if (confirm('Mark this memory as completed?')) {
      this.memoryService.completeMemory(this.memory.id).subscribe({
        next: () => {
          this.memory!.status = 'completed';
        },
        error: (err) => console.error('Error completing memory:', err)
      });
    }
  }

  archiveMemory() {
    if (!this.memory) return;

    if (confirm('Archive this memory?')) {
      this.memoryService.archiveMemory(this.memory.id).subscribe({
        next: () => {
          this.memory!.status = 'archived';
        },
        error: (err) => console.error('Error archiving memory:', err)
      });
    }
  }

  deleteMemory() {
    if (!this.memory) return;

    if (confirm('Are you sure you want to delete this memory? This cannot be undone.')) {
      this.memoryService.deleteMemory(this.memory.id).subscribe({
        next: () => {
          // Redirect to memories list
          window.location.href = '/memories';
        },
        error: (err) => console.error('Error deleting memory:', err)
      });
    }
  }

  addDiscussionHandler() {
    this.savingDiscussion = true;
    this.showAddDiscussion = true;
  }

  onDiscussionSubmit(formData: any) {
    if (!this.memory) return;

    this.memoryService.addDiscussion(this.memory.id, formData).subscribe({
      next: () => {
        this.showAddDiscussion = false;
        this.loadMemory(this.memory!.id);
      },
      error: (err) => {
        console.error('Error adding discussion:', err);
      },
      complete: () => {
        this.savingDiscussion = false;
      }
    });
  }

  onDiscussionCancel() {
    this.showAddDiscussion = false;
  }

  get filteredDiscussions() {
    if (!this.memory || !this.diskussionSearch) {
      return this.memory?.discussions || [];
    }

    const query = this.diskussionSearch.toLowerCase();
    return this.memory.discussions.filter(d =>
      d.discussionText.toLowerCase().includes(query) ||
      d.authorName?.toLowerCase().includes(query)
    );
  }

  get requirementDiscussions() {
    return this.memory?.discussions.filter(d => d.decisionType === 'requirement') || [];
  }

  get edgeCaseDiscussions() {
    return this.memory?.discussions.filter(d => d.decisionType === 'edge-case') || [];
  }

  get conflictDiscussions() {
    return this.memory?.discussions.filter(d => d.decisionType === 'conflict') || [];
  }

  getStatusColor(status: MemoryStatus): string {
    const colors: Record<MemoryStatus, string> = {
      'active': '#10b981',
      'completed': '#3b82f6',
      'archived': '#64748b'
    };
    return colors[status];
  }

  getStatusLabel(status: MemoryStatus): string {
    const labels: Record<MemoryStatus, string> = {
      'active': 'Active',
      'completed': 'Completed',
      'archived': 'Archived'
    };
    return labels[status];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Wizard handlers
  openWizard() {
    this.showWizard = true;
  }

  closeWizard() {
    this.showWizard = false;
  }

  onWizardSuccess(memoryId: string) {
    this.showWizard = false;
    // Navigate to the new memory detail page
    if (memoryId && this.memory && this.memory.id !== memoryId) {
      window.location.href = `/memories/${memoryId}`;
    }
  }
  
}
