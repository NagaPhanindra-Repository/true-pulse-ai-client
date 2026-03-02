import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddDiscussionRequest, DecisionType } from '../../../models/feature-memory.model';
import { DecisionTagComponent } from '../decision-tag/decision-tag.component';

@Component({
  selector: 'app-discussion-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecisionTagComponent],
  templateUrl: './discussion-form.component.html',
  styleUrl: './discussion-form.component.scss'
})
export class DiscussionFormComponent {
  @Output() onSubmit = new EventEmitter<AddDiscussionRequest>();
  @Output() onCancel = new EventEmitter<void>();
  @Input() isLoading = false;

  form: FormGroup;
  showAdvanced = false;
  tagsInput = '';

  decisionTypes: DecisionType[] = ['requirement', 'edge-case', 'change', 'conflict', 'clarification'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      discussionText: ['', [Validators.required, Validators.minLength(10)]],
      decisionType: ['requirement', Validators.required],
      meetingDate: ['']
    });
  }

  get tags(): string[] {
    return this.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  addTag(tag: string) {
    if (tag.trim() && !this.tags.includes(tag.trim())) {
      this.tagsInput = this.tagsInput ? `${this.tagsInput}, ${tag.trim()}` : tag.trim();
    }
  }

  removeTag(index: number) {
    const updatedTags = this.tags.filter((_, i) => i !== index);
    this.tagsInput = updatedTags.join(', ');
  }

  submit() {
    if (this.form.invalid) {
      return;
    }

    const request: AddDiscussionRequest = {
      discussionText: this.form.value.discussionText,
      decisionType: this.form.value.decisionType,
      tags: this.tags,
      meetingDate: this.form.value.meetingDate ? new Date(this.form.value.meetingDate) : undefined
    };

    this.onSubmit.emit(request);
  }

  cancel() {
    this.onCancel.emit();
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (control?.hasError('required')) {
      return `${field} is required`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.getError('minlength').requiredLength;
      return `${field} must be at least ${minLength} characters`;
    }
    return '';
  }
}
