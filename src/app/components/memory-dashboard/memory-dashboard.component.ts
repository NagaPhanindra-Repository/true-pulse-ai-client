import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeatureMemoryService } from '../../services/feature-memory.service';
import { JiraIntegrationService } from '../../services/jira-integration.service';
import { FeatureMemory, MemoryStatus } from '../../models/feature-memory.model';
import { JiraIntegration, ConnectionTestResult } from '../../models/jira-integration.model';
import { HttpErrorResponse } from '@angular/common/http';
import { MemoryCreationWizardComponent } from '../memory-creation-wizard/memory-creation-wizard.component';

@Component({
  selector: 'app-memory-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MemoryCreationWizardComponent],
  templateUrl: './memory-dashboard.component.html',
  styleUrl: './memory-dashboard.component.scss'
})
export class MemoryDashboardComponent implements OnInit {
  memories: FeatureMemory[] = [];
  integrations: JiraIntegration[] = [];
  loading = false;
  error: string | null = null;
  
  // Filter state
  searchQuery = '';
  selectedStatus: MemoryStatus | 'all' = 'all';
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;

  // UI state
  showWizard = false;
  showIntegrationModal = false;
  activeTab: 'integrations' | 'memories' = 'integrations'; // Start with integrations section

  // Integration form
  integrationForm = {
    name: '',
    jiraUrl: '',
    jiraEmail: '',
    apiToken: ''
  };
  integrationLoading = false;
  testConnectionLoading = false;
  connectionTested = false;
  integrationError: string | null = null;
  connectionSuccess = false;

  constructor(
    private memoryService: FeatureMemoryService,
    private jiraIntegrationService: JiraIntegrationService
  ) {}

  ngOnInit() {
    this.loadIntegrations();
    this.loadMemories();
  }

  // ===== JIRA INTEGRATION METHODS =====
  loadIntegrations() {
    this.jiraIntegrationService.getIntegrations().subscribe({
      next: (data) => {
        this.integrations = data;
        // If no integrations, show integration tab
        if (this.integrations.length === 0) {
          this.activeTab = 'integrations';
        }
      },
      error: (err) => {
        console.error('Error loading integrations:', err);
        this.integrationError = 'Failed to load integrations';
      }
    });
  }

  openIntegrationModal() {
    this.showIntegrationModal = true;
    this.resetIntegrationForm();
  }

  closeIntegrationModal() {
    this.showIntegrationModal = false;
    this.resetIntegrationForm();
  }

  resetIntegrationForm() {
    this.integrationForm = {
      name: '',
      jiraUrl: '',
      jiraEmail: '',
      apiToken: ''
    };
    this.integrationError = null;
    this.connectionTested = false;
    this.connectionSuccess = false;
  }

  // Test connection before creating integration
  testIntegrationConnection() {
    if (!this.integrationForm.jiraUrl || !this.integrationForm.jiraEmail || !this.integrationForm.apiToken) {
      this.integrationError = 'Please fill in all required fields to test connection';
      return;
    }

    this.testConnectionLoading = true;
    this.integrationError = null;

    this.jiraIntegrationService.testConnectionBeforeCreate({
      jiraUrl: this.integrationForm.jiraUrl,
      jiraEmail: this.integrationForm.jiraEmail,
      apiToken: this.integrationForm.apiToken
    }).subscribe({
      next: (result: ConnectionTestResult) => {
        this.testConnectionLoading = false;
        if (result.success) {
          this.connectionTested = true;
          this.connectionSuccess = true;
          alert(`✓ Connection successful! Found ${result.availableProjects?.length || 0} projects`);
        } else {
          this.connectionTested = true;
          this.connectionSuccess = false;
          this.integrationError = result.error || 'Connection test failed';
        }
      },
      error: (err: HttpErrorResponse) => {
        this.testConnectionLoading = false;
        this.connectionTested = true;
        this.connectionSuccess = false;
        this.integrationError = err.error?.message || 'Failed to test connection. Check your credentials.';
        console.error('Error testing connection:', err);
      }
    });
  }

  createIntegration() {
    if (!this.connectionTested || !this.connectionSuccess) {
      this.integrationError = 'Please test connection first before creating integration';
      return;
    }

    if (!this.integrationForm.jiraUrl || !this.integrationForm.jiraEmail || !this.integrationForm.apiToken) {
      this.integrationError = 'Please fill in all required fields';
      return;
    }

    this.integrationLoading = true;
    this.integrationError = null;

    this.jiraIntegrationService.createIntegration(this.integrationForm).subscribe({
      next: () => {
        this.integrationLoading = false;
        this.closeIntegrationModal();
        this.loadIntegrations();
      },
      error: (err) => {
        this.integrationLoading = false;
        this.integrationError = err.error?.message || 'Failed to create integration. Check your Jira credentials.';
        console.error('Error creating integration:', err);
      }
    });
  }

  deleteIntegration(integrationId: string) {
    if (confirm('Are you sure you want to delete this integration?')) {
      this.jiraIntegrationService.deleteIntegration(integrationId).subscribe({
        next: () => {
          this.loadIntegrations();
        },
        error: (err) => {
          console.error('Error deleting integration:', err);
          this.integrationError = 'Failed to delete integration';
        }
      });
    }
  }

  testConnection(integrationId: string) {
    this.jiraIntegrationService.testConnection(integrationId).subscribe({
      next: (result) => {
        if (result.success) {
          alert(`✓ Connected to Jira! Found ${result.availableProjects?.length || 0} projects`);
        } else {
          alert('✗ Connection failed: ' + result.error);
        }
      },
      error: (err) => {
        alert('✗ Connection test failed');
        console.error('Error testing connection:', err);
      }
    });
  }

  // ===== MEMORY METHODS =====

  loadMemories() {
    this.loading = true;
    this.error = null;

    const filter = {
      status: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      search: this.searchQuery || undefined,
      page: this.currentPage,
      size: this.pageSize
    };

    this.memoryService.getMemories(filter).subscribe({
      next: (response) => {
        this.memories = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load memories. Please try again.';
        this.loading = false;
        console.error('Error loading memories:', err);
      }
    });
  }

  onSearch() {
    this.currentPage = 0;
    this.loadMemories();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadMemories();
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadMemories();
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadMemories();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadMemories();
  }

  onMemoryCreated() {
    this.closeWizard();
    this.loadMemories();
  }

  openWizard() {
    this.showWizard = true;
  }

  closeWizard() {
    this.showWizard = false;
  }

  onWizardSuccess(memoryId: string) {
    this.showWizard = false;
    this.loadMemories();
  }

  getStatusClass(status: MemoryStatus): string {
    const statusClasses: Record<MemoryStatus, string> = {
      'active': 'status-active',
      'completed': 'status-completed',
      'archived': 'status-archived'
    };
    return statusClasses[status] || '';
  }

  getStatusLabel(status: MemoryStatus): string {
    const labels: Record<MemoryStatus, string> = {
      'active': 'Active',
      'completed': 'Completed',
      'archived': 'Archived'
    };
    return labels[status] || status;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  get paginationRange(): number[] {
    const range: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible);
    
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }
    
    for (let i = start; i < end; i++) {
      range.push(i);
    }
    return range;
  }
}
