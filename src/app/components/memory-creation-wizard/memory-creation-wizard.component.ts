import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatureMemoryService } from '../../services/feature-memory.service';
import { JiraIntegrationService } from '../../services/jira-integration.service';
import { JiraIntegration, JiraStory } from '../../models/jira-integration.model';
import { CreateMemoryRequest } from '../../models/feature-memory.model';

export type WizardStep = 'integration' | 'story' | 'fetch' | 'context' | 'branch' | 'review' | 'submit';

@Component({
  selector: 'app-memory-creation-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './memory-creation-wizard.component.html',
  styleUrls: ['./memory-creation-wizard.component.scss']
})
export class MemoryCreationWizardComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  @Output() onSuccess = new EventEmitter<string>();

  currentStep: WizardStep = 'integration';
  stepProgress = 0;

  // Forms
  integrationForm: FormGroup;
  storyForm: FormGroup;
  contextForm: FormGroup;
  branchForm: FormGroup;

  // Data
  jiraIntegrations: JiraIntegration[] = [];
  selectedIntegration: JiraIntegration | null = null;
  jiraStory: JiraStory | null = null;
  initialContext = '';
  selectedBranch = '';

  // State
  isLoading = false;
  isFetching = false;
  error: string | null = null;
  steps: { id: WizardStep; label: string; icon: string }[] = [
    { id: 'integration', label: 'Jira Integration', icon: '🔗' },
    { id: 'story', label: 'Story Details', icon: '📋' },
    { id: 'fetch', label: 'Fetch & Verify', icon: '✓' },
    { id: 'context', label: 'Initial Context', icon: '📝' },
    { id: 'branch', label: 'Git Branch', icon: '🌿' },
    { id: 'review', label: 'Review', icon: '👁️' },
  ];

  constructor(
    private fb: FormBuilder,
    private memoryService: FeatureMemoryService,
    private jiraService: JiraIntegrationService
  ) {
    this.integrationForm = this.fb.group({
      integrationId: ['', Validators.required]
    });

    this.storyForm = this.fb.group({
      storyKey: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+-\d+$/)]],
      projectKey: ['', Validators.required]
    });

    this.contextForm = this.fb.group({
      context: ['', [Validators.required, Validators.minLength(20)]]
    });

    this.branchForm = this.fb.group({
      branch: [''],
      linkBranch: [false]
    });
  }

  ngOnInit() {
    this.loadJiraIntegrations();
  }

  // Step 1: Load Jira Integrations
  loadJiraIntegrations() {
    this.isLoading = true;
    this.error = null;
    this.jiraService.getIntegrations().subscribe({
      next: (integrations) => {
        this.jiraIntegrations = integrations;
        this.isLoading = false;
        if (integrations.length === 0) {
          this.error = 'No Jira integrations found. Please set up a Jira integration first.';
        }
      },
      error: (err) => {
        this.error = 'Failed to load Jira integrations';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  selectIntegration(integration: JiraIntegration) {
    this.selectedIntegration = integration;
    this.integrationForm.patchValue({ integrationId: integration.id });
  }

  proceedToStory() {
    if (this.integrationForm.valid && this.selectedIntegration) {
      this.currentStep = 'story';
      this.stepProgress = 1;
      this.error = null;
    }
  }

  // Step 2: Enter Story Key
  goBackToIntegration() {
    this.currentStep = 'integration';
    this.stepProgress = 0;
  }

  proceedToFetch() {
    if (this.storyForm.valid) {
      this.currentStep = 'fetch';
      this.stepProgress = 2;
      this.error = null;
    }
  }

  // Step 3: Fetch Story from Jira
  fetchStoryFromJira() {
    if (!this.selectedIntegration) {
      this.error = 'No integration selected';
      return;
    }

    const storyKey = this.storyForm.get('storyKey')?.value;
    if (!storyKey) {
      this.error = 'Please enter a valid story key';
      return;
    }

    this.isFetching = true;
    this.error = null;

    this.jiraService.fetchStory(this.selectedIntegration.id, storyKey).subscribe({
      next: (story) => {
        this.jiraStory = story;
        this.isFetching = false;
        console.log('Story fetched:', story);
      },
      error: (err) => {
        this.error = 'Failed to fetch story from Jira. Please check the story key and try again.';
        this.isFetching = false;
        console.error(err);
      }
    });
  }

  proceedToContext() {
    if (this.jiraStory) {
      this.currentStep = 'context';
      this.stepProgress = 3;
      this.error = null;
    }
  }

  goBackToStory() {
    this.currentStep = 'story';
    this.stepProgress = 1;
  }

  // Step 4: Add Initial Context
  proceedToBranch() {
    if (this.contextForm.valid) {
      this.initialContext = this.contextForm.get('context')?.value;
      this.currentStep = 'branch';
      this.stepProgress = 4;
      this.error = null;
    }
  }

  goBackToContext() {
    this.currentStep = 'context';
    this.stepProgress = 3;
  }

  // Step 5: Link Git Branch (Optional)
  proceedToReview() {
    this.currentStep = 'review';
    this.stepProgress = 5;
    this.error = null;
  }

  goBackToBranch() {
    this.currentStep = 'branch';
    this.stepProgress = 4;
  }

  skipToReview() {
    this.proceedToReview();
  }

  // Step 6: Review & Confirm
  goBackToReview() {
    this.currentStep = 'review';
    this.stepProgress = 5;
  }

  submitMemory() {
    if (!this.selectedIntegration || !this.jiraStory || !this.initialContext) {
      this.error = 'Missing required information';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const createRequest: CreateMemoryRequest = {
      title: this.jiraStory.summary,
      description: this.initialContext,
      jiraStoryKey: this.jiraStory.key,
      jiraStoryUrl: this.jiraStory.url,
      project: this.jiraStory.project,
      assignee: this.jiraStory.assignee,
      linkedBranch: this.branchForm.get('branch')?.value || undefined,
      status: 'active'
    };

    this.memoryService.createMemory(createRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.onSuccess.emit(response.id);
      },
      error: (err) => {
        this.error = 'Failed to create memory. Please try again.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  // Utilities
  getStepNumber(stepId: WizardStep): number {
    return this.steps.findIndex(s => s.id === stepId) + 1;
  }

  isStepCompleted(stepId: WizardStep): boolean {
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    return stepIndex < this.stepProgress;
  }

  isStepActive(stepId: WizardStep): boolean {
    return this.currentStep === stepId;
  }

  close() {
    this.onClose.emit();
  }

  // Get available project keys from integrations
  getProjectKeys(): string[] {
    if (this.selectedIntegration?.projects) {
      return this.selectedIntegration.projects.map(p => p.key);
    }
    if (this.selectedIntegration?.projectKeys) {
      return this.selectedIntegration.projectKeys;
    }
    return [];
  }

  // Update story key when project changes
  onProjectChange() {
    const projectKey = this.storyForm.get('projectKey')?.value;
    if (projectKey) {
      this.storyForm.patchValue({
        storyKey: projectKey + '-'
      });
    }
  }
}
