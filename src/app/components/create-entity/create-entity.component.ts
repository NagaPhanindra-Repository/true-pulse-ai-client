import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/security/auth.service';
import { Router } from '@angular/router';
import { LoggedInUserModel } from '../../models/logged-in-user.model';
import { EntityService } from '../../services/entity.service';
import { CreateEntityRequest, EntityType } from '../../models/entity.model';

interface FieldConfig {
  key: keyof CreateEntityRequest;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  hint?: string;
}

@Component({
  selector: 'app-create-entity',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-entity.component.html',
  styleUrls: ['./create-entity.component.scss']
})
export class CreateEntityComponent implements OnInit {
  entityForm: FormGroup;
  loggedInUser: LoggedInUserModel | null = null;

  submitting = false;
  submitError = '';
  submitSuccess = '';
  formTouched = false;

  typeOptions: { value: EntityType; label: string; description: string }[] = [
    { value: 'BUSINESS', label: 'Business', description: 'Restaurants, shops, services and companies.' },
    { value: 'BUSINESS_LEADER', label: 'Business Leader', description: 'Leaders managing teams or projects.' },
    { value: 'POLITICIAN', label: 'Politician', description: 'Politicians, parties, and public officials.' },
    { value: 'CELEBRITY', label: 'Celebrity', description: 'Artists, influencers, athletes and creators.' }
  ];

  selectedType: EntityType = 'BUSINESS';

  commonFields: FieldConfig[] = [
    { key: 'displayName', label: 'Display Name', placeholder: 'Public-facing name', required: true },
  ];

  businessFields: FieldConfig[] = [
    { key: 'businessFullName', label: 'Business Full Name', placeholder: 'TruePulse Cafe', required: true },
    { key: 'businessAddress', label: 'Business Address', placeholder: '123 Main St', required: true },
    { key: 'businessType', label: 'Business Type', placeholder: 'Restaurant, Auto Parts, Sanitary', required: true },
    { key: 'businessMobileNumber', label: 'Business Mobile Number', placeholder: '5550100', required: true },
    { key: 'businessCountryCode', label: 'Business Country Code', placeholder: '+1', required: true },
    { key: 'businessEmail', label: 'Business Email', placeholder: 'contact@business.com', required: true },
    { key: 'businessContactHours', label: 'Contact Hours', placeholder: 'Mon-Fri 9am-6pm', required: true },
    { key: 'businessDescription', label: 'Business Description', placeholder: 'Optional short description', required: false }
  ];

  leaderFields: FieldConfig[] = [
    { key: 'leaderFullName', label: 'Leader Full Name', placeholder: 'Alex Leader', required: true },
    { key: 'leaderCompany', label: 'Company', placeholder: 'TruePulse Inc', required: true },
    { key: 'leaderProjectName', label: 'Project Name', placeholder: 'PulseOne', required: true },
    { key: 'leaderMobileNumber', label: 'Leader Mobile Number', placeholder: '5550200', required: true },
    { key: 'leaderCountryCode', label: 'Leader Country Code', placeholder: '+1', required: true },
    { key: 'leaderEmail', label: 'Leader Email', placeholder: 'leader@company.com', required: true },
    { key: 'leaderContactHours', label: 'Contact Hours', placeholder: 'Mon-Fri 10am-5pm', required: true },
    { key: 'leaderProjectDescription', label: 'Project Description', placeholder: 'Optional project description', required: false }
  ];

  politicianFields: FieldConfig[] = [
    { key: 'politicianFullName', label: 'Politician Full Name', placeholder: 'Jamie Politician', required: true },
    { key: 'politicianPartyName', label: 'Party Name', placeholder: 'People First', required: true },
    { key: 'politicianSegmentAddress', label: 'Segment Address', placeholder: 'District 9', required: true },
    { key: 'politicianContestingTo', label: 'Contesting To', placeholder: 'Mayor, Senator', required: true },
    { key: 'politicianMobileNumber', label: 'Mobile Number', placeholder: '5550300', required: true },
    { key: 'politicianCountryCode', label: 'Country Code', placeholder: '+1', required: true },
    { key: 'politicianEmail', label: 'Email', placeholder: 'politician@party.org', required: true },
    { key: 'politicianContactHours', label: 'Contact Hours', placeholder: 'Mon-Fri 9am-4pm', required: true },
    { key: 'politicianDescription', label: 'Description', placeholder: 'Optional description', required: false }
  ];

  celebrityFields: FieldConfig[] = [
    { key: 'celebrityRealName', label: 'Real Name', placeholder: 'Taylor Artist', required: true },
    { key: 'celebrityArtistName', label: 'Stage/Artist Name', placeholder: 'T-Ace', required: true },
    { key: 'celebrityArtistType', label: 'Artist Type', placeholder: 'Singer, Actor, Influencer', required: true },
    { key: 'celebrityMobileNumber', label: 'Mobile Number', placeholder: '5550400', required: true },
    { key: 'celebrityCountryCode', label: 'Country Code', placeholder: '+1', required: true },
    { key: 'celebrityEmail', label: 'Email', placeholder: 'artist@musicworld.com', required: true },
    { key: 'celebrityContactHours', label: 'Contact Hours', placeholder: 'Mon-Fri 10am-7pm', required: true },
    { key: 'celebrityDescription', label: 'Description', placeholder: 'Optional description', required: false }
  ];

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private entityService: EntityService,
    private router: Router
  ) {
    this.entityForm = this.fb.group({
      type: ['BUSINESS', [Validators.required]],
      displayName: ['', [Validators.required, Validators.minLength(2)]],

      businessFullName: [''],
      businessAddress: [''],
      businessDescription: [''],
      businessType: [''],
      businessMobileNumber: [''],
      businessCountryCode: [''],
      businessEmail: ['', [Validators.email]],
      businessContactHours: [''],

      leaderFullName: [''],
      leaderCompany: [''],
      leaderProjectName: [''],
      leaderProjectDescription: [''],
      leaderMobileNumber: [''],
      leaderCountryCode: [''],
      leaderEmail: ['', [Validators.email]],
      leaderContactHours: [''],

      politicianFullName: [''],
      politicianPartyName: [''],
      politicianSegmentAddress: [''],
      politicianContestingTo: [''],
      politicianDescription: [''],
      politicianMobileNumber: [''],
      politicianCountryCode: [''],
      politicianEmail: ['', [Validators.email]],
      politicianContactHours: [''],

      celebrityRealName: [''],
      celebrityArtistName: [''],
      celebrityArtistType: [''],
      celebrityDescription: [''],
      celebrityMobileNumber: [''],
      celebrityCountryCode: [''],
      celebrityEmail: ['', [Validators.email]],
      celebrityContactHours: ['']
    });
  }

  ngOnInit(): void {
    this.loggedInUser = this.auth.user;
    if (!this.loggedInUser) {
      this.auth.fetchUserDetails().subscribe({
        next: user => this.loggedInUser = user,
        error: () => {}
      });
    }
    this.setType('BUSINESS');
  }

  get fieldsForSelectedType(): FieldConfig[] {
    switch (this.selectedType) {
      case 'BUSINESS_LEADER':
        return this.leaderFields;
      case 'POLITICIAN':
        return this.politicianFields;
      case 'CELEBRITY':
        return this.celebrityFields;
      default:
        return this.businessFields;
    }
  }

  setType(type: EntityType): void {
    this.selectedType = type;
    this.entityForm.patchValue({ type });
    this.applyTypeValidators(type);
  }

  applyTypeValidators(type: EntityType): void {
    const allTypeFields = [
      ...this.businessFields,
      ...this.leaderFields,
      ...this.politicianFields,
      ...this.celebrityFields
    ];

    allTypeFields.forEach(field => {
      const control = this.entityForm.get(field.key as string);
      if (!control) return;
      control.clearValidators();
      if (field.required && this.fieldBelongsToType(field.key, type)) {
        control.setValidators([Validators.required]);
      }
      if (String(field.key).toLowerCase().includes('email')) {
        control.addValidators([Validators.email]);
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  fieldBelongsToType(key: keyof CreateEntityRequest, type: EntityType): boolean {
    const map: Record<EntityType, Array<keyof CreateEntityRequest>> = {
      BUSINESS: this.businessFields.map(f => f.key),
      BUSINESS_LEADER: this.leaderFields.map(f => f.key),
      POLITICIAN: this.politicianFields.map(f => f.key),
      CELEBRITY: this.celebrityFields.map(f => f.key)
    };
    return map[type].includes(key);
  }

  isInvalid(key: keyof CreateEntityRequest): boolean {
    const control = this.entityForm.get(key as string);
    return !!control && control.invalid && (control.touched || this.formTouched);
  }

  submit(): void {
    this.formTouched = true;
    this.submitError = '';
    this.submitSuccess = '';

    if (!this.loggedInUser?.id) {
      this.submitError = 'Please log in to create an entity.';
      return;
    }

    if (this.entityForm.invalid) {
      this.submitError = 'Please complete all required fields.';
      return;
    }

    const payload: CreateEntityRequest = {
      ...this.entityForm.value,
      type: this.selectedType,
      createdByUserId: this.loggedInUser.id
    };

    this.submitting = true;
    this.entityService.createEntity(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.submitSuccess = 'Entity created successfully.';
        this.entityForm.reset({ type: this.selectedType });
        this.formTouched = false;
        this.router.navigate(['/entities/my']);
      },
      error: () => {
        this.submitting = false;
        this.submitError = 'Failed to create entity. Please try again.';
      }
    });
  }
}
