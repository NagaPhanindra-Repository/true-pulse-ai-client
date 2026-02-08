import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EntityService } from '../../services/entity.service';
import {
  BusinessLeaderProfile,
  BusinessProfile,
  CelebrityProfile,
  CreateEntityResponse,
  EntityType,
  PoliticianProfile
} from '../../models/entity.model';
import { BusinessDocumentService } from '../../services/business-document.service';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-my-entities',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, DatePipe],
  templateUrl: './my-entities.component.html',
  styleUrls: ['./my-entities.component.scss']
})
export class MyEntitiesComponent implements OnInit {
  entities: CreateEntityResponse[] = [];
  selectedEntity: CreateEntityResponse | null = null;
  loading = true;
  error = '';
  searchTerm = '';
  uploadStatus = '';
  isUploading = false;
  isEditing = false;
  isSaving = false;
  isDeleting = false;
  profileLoading = false;
  saveStatus = '';
  deleteStatus = '';
  editForm: any = {};

  constructor(
    private entityService: EntityService,
    private docService: BusinessDocumentService
  ) {}

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities(): void {
    this.loading = true;
    this.error = '';
    this.entityService.getMyEntities().subscribe({
      next: entities => {
        this.entities = entities || [];
        this.selectedEntity = this.entities[0] || null;
        if (this.selectedEntity) {
          this.loadProfile(this.selectedEntity);
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load your entities.';
        this.loading = false;
      }
    });
  }

  selectEntity(entity: CreateEntityResponse): void {
    this.selectedEntity = entity;
    this.uploadStatus = '';
    this.saveStatus = '';
    this.deleteStatus = '';
    this.isEditing = false;
    this.loadProfile(entity);
  }

  loadProfile(entity: CreateEntityResponse): void {
    this.profileLoading = true;
    const onDone = () => {
      this.profileLoading = false;
      this.syncEntity(entity);
    };

    if (entity.type === 'BUSINESS') {
      this.entityService.getBusinessProfile(entity.id).subscribe({
        next: profile => {
          entity.businessProfile = profile;
          onDone();
        },
        error: () => onDone()
      });
      return;
    }

    if (entity.type === 'BUSINESS_LEADER') {
      this.entityService.getBusinessLeaderProfile(entity.id).subscribe({
        next: profile => {
          entity.businessLeaderProfile = profile;
          onDone();
        },
        error: () => onDone()
      });
      return;
    }

    if (entity.type === 'POLITICIAN') {
      this.entityService.getPoliticianProfile(entity.id).subscribe({
        next: profile => {
          entity.politicianProfile = profile;
          onDone();
        },
        error: () => onDone()
      });
      return;
    }

    this.entityService.getCelebrityProfile(entity.id).subscribe({
      next: profile => {
        entity.celebrityProfile = profile;
        onDone();
      },
      error: () => onDone()
    });
  }

  syncEntity(entity: CreateEntityResponse): void {
    const index = this.entities.findIndex(e => e.id === entity.id);
    if (index >= 0) {
      this.entities = this.entities.map((item, i) => (i === index ? { ...item, ...entity } : item));
    }
    if (this.selectedEntity?.id === entity.id) {
      this.selectedEntity = { ...this.selectedEntity, ...entity };
    }
  }

  startEdit(): void {
    if (!this.selectedEntity) return;
    this.isEditing = true;
    this.saveStatus = '';
    this.editForm = this.buildEditForm(this.selectedEntity);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.saveStatus = '';
    this.editForm = {};
  }

  saveEdit(): void {
    if (!this.selectedEntity) return;
    this.isSaving = true;
    this.saveStatus = 'Saving changes...';
    const entity = this.selectedEntity;

    const onSuccess = (profile: any) => {
      if (entity.type === 'BUSINESS') entity.businessProfile = profile;
      if (entity.type === 'BUSINESS_LEADER') entity.businessLeaderProfile = profile;
      if (entity.type === 'POLITICIAN') entity.politicianProfile = profile;
      if (entity.type === 'CELEBRITY') entity.celebrityProfile = profile;
      this.syncEntity(entity);
      this.isSaving = false;
      this.isEditing = false;
      this.saveStatus = 'Profile updated successfully.';
    };

    const onError = () => {
      this.isSaving = false;
      this.saveStatus = 'Update failed. Please try again.';
    };

    if (entity.type === 'BUSINESS') {
      const payload: BusinessProfile = {
        fullName: this.editForm.fullName,
        address: this.editForm.address,
        description: this.editForm.description,
        businessType: this.editForm.businessType,
        mobileNumber: this.editForm.mobileNumber,
        countryCode: this.editForm.countryCode,
        email: this.editForm.email,
        contactHours: this.editForm.contactHours
      };
      this.entityService.upsertBusinessProfile(entity.id, payload).subscribe({ next: onSuccess, error: onError });
      return;
    }

    if (entity.type === 'BUSINESS_LEADER') {
      const payload: BusinessLeaderProfile = {
        fullName: this.editForm.fullName,
        company: this.editForm.company,
        projectName: this.editForm.projectName,
        projectDescription: this.editForm.projectDescription,
        mobileNumber: this.editForm.mobileNumber,
        countryCode: this.editForm.countryCode,
        email: this.editForm.email,
        contactHours: this.editForm.contactHours
      };
      this.entityService.upsertBusinessLeaderProfile(entity.id, payload).subscribe({ next: onSuccess, error: onError });
      return;
    }

    if (entity.type === 'POLITICIAN') {
      const payload: PoliticianProfile = {
        fullName: this.editForm.fullName,
        partyName: this.editForm.partyName,
        segmentAddress: this.editForm.segmentAddress,
        contestingTo: this.editForm.contestingTo,
        description: this.editForm.description,
        mobileNumber: this.editForm.mobileNumber,
        countryCode: this.editForm.countryCode,
        email: this.editForm.email,
        contactHours: this.editForm.contactHours
      };
      this.entityService.upsertPoliticianProfile(entity.id, payload).subscribe({ next: onSuccess, error: onError });
      return;
    }

    const payload: CelebrityProfile = {
      realName: this.editForm.realName,
      artistName: this.editForm.artistName,
      artistType: this.editForm.artistType,
      description: this.editForm.description,
      mobileNumber: this.editForm.mobileNumber,
      countryCode: this.editForm.countryCode,
      email: this.editForm.email,
      contactHours: this.editForm.contactHours
    };
    this.entityService.upsertCelebrityProfile(entity.id, payload).subscribe({ next: onSuccess, error: onError });
  }

  deleteEntity(): void {
    if (!this.selectedEntity || this.isDeleting) return;
    const entity = this.selectedEntity;
    if (!confirm(`Delete ${entity.displayName}? This will remove the profile details.`)) return;
    this.isDeleting = true;
    this.deleteStatus = 'Deleting profile...';

    const onSuccess = () => {
      this.isDeleting = false;
      this.deleteStatus = 'Profile deleted.';
      this.isEditing = false;
      this.loadEntities();
    };

    const onError = () => {
      this.isDeleting = false;
      this.deleteStatus = 'Delete failed. Please try again.';
    };

    if (entity.type === 'BUSINESS') {
      this.entityService.deleteBusinessProfile(entity.id).subscribe({ next: onSuccess, error: onError });
      return;
    }

    if (entity.type === 'BUSINESS_LEADER') {
      this.entityService.deleteBusinessLeaderProfile(entity.id).subscribe({ next: onSuccess, error: onError });
      return;
    }

    if (entity.type === 'POLITICIAN') {
      this.entityService.deletePoliticianProfile(entity.id).subscribe({ next: onSuccess, error: onError });
      return;
    }

    this.entityService.deleteCelebrityProfile(entity.id).subscribe({ next: onSuccess, error: onError });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedEntity) return;
    
    this.isUploading = true;
    this.uploadStatus = 'Uploading...';
    
    this.docService.uploadDocumentWithEntity(
      file,
      this.selectedEntity.id.toString(),
      this.selectedEntity.displayName
    ).subscribe({
      next: (res) => {
        this.uploadStatus = res.message || 'Document uploaded successfully!';
        this.isUploading = false;
      },
      error: () => {
        this.uploadStatus = 'Upload failed. Please try again.';
        this.isUploading = false;
      }
    });
  }

  get filteredEntities(): CreateEntityResponse[] {
    if (!this.searchTerm.trim()) return this.entities;
    return this.entities.filter(e => e.displayName.toLowerCase().includes(this.searchTerm.toLowerCase()));
  }

  getTypeMeta(type: EntityType): { label: string; icon: string; color: string; accent: string } {
    switch (type) {
      case 'BUSINESS_LEADER':
        return { label: 'Business Leader', icon: 'work', color: '#a78bfa', accent: '#c4b5fd' };
      case 'POLITICIAN':
        return { label: 'Politician', icon: 'gavel', color: '#3b82f6', accent: '#93c5fd' };
      case 'CELEBRITY':
        return { label: 'Celebrity', icon: 'star', color: '#f59e0b', accent: '#fcd34d' };
      default:
        return { label: 'Business', icon: 'storefront', color: '#6ee7b7', accent: '#a7f3d0' };
    }
  }

  getDetailRows(entity: CreateEntityResponse | null): DetailRow[] {
    if (!entity) return [];
    const rows: DetailRow[] = [
      { label: 'Display Name', value: entity.displayName },
      { label: 'Entity Type', value: this.getTypeMeta(entity.type).label },
      { label: 'Created At', value: entity.createdAt ? new Date(entity.createdAt).toLocaleString() : '-' },
      { label: 'Updated At', value: entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : '-' }
    ];

    const profile: any = entity.businessProfile || entity.businessLeaderProfile || entity.politicianProfile || entity.celebrityProfile;
    if (!profile) return rows;

    const mapEntries = (label: string, value: any) => ({ label, value: value || '-' });

    if (entity.type === 'BUSINESS') {
      rows.push(
        mapEntries('Full Name', profile.fullName),
        mapEntries('Address', profile.address),
        mapEntries('Business Type', profile.businessType),
        mapEntries('Description', profile.description),
        mapEntries('Phone', `${profile.countryCode || ''} ${profile.mobileNumber || ''}`.trim()),
        mapEntries('Email', profile.email),
        mapEntries('Contact Hours', profile.contactHours)
      );
    }

    if (entity.type === 'BUSINESS_LEADER') {
      rows.push(
        mapEntries('Full Name', profile.fullName),
        mapEntries('Company', profile.company),
        mapEntries('Project Name', profile.projectName),
        mapEntries('Project Description', profile.projectDescription),
        mapEntries('Phone', `${profile.countryCode || ''} ${profile.mobileNumber || ''}`.trim()),
        mapEntries('Email', profile.email),
        mapEntries('Contact Hours', profile.contactHours)
      );
    }

    if (entity.type === 'POLITICIAN') {
      rows.push(
        mapEntries('Full Name', profile.fullName),
        mapEntries('Party Name', profile.partyName),
        mapEntries('Segment Address', profile.segmentAddress),
        mapEntries('Contesting To', profile.contestingTo),
        mapEntries('Description', profile.description),
        mapEntries('Phone', `${profile.countryCode || ''} ${profile.mobileNumber || ''}`.trim()),
        mapEntries('Email', profile.email),
        mapEntries('Contact Hours', profile.contactHours)
      );
    }

    if (entity.type === 'CELEBRITY') {
      rows.push(
        mapEntries('Real Name', profile.realName),
        mapEntries('Artist Name', profile.artistName),
        mapEntries('Artist Type', profile.artistType),
        mapEntries('Description', profile.description),
        mapEntries('Phone', `${profile.countryCode || ''} ${profile.mobileNumber || ''}`.trim()),
        mapEntries('Email', profile.email),
        mapEntries('Contact Hours', profile.contactHours)
      );
    }

    return rows;
  }

  buildEditForm(entity: CreateEntityResponse): any {
    const profile: any = entity.businessProfile || entity.businessLeaderProfile || entity.politicianProfile || entity.celebrityProfile || {};

    if (entity.type === 'BUSINESS') {
      return {
        fullName: profile.fullName || entity.displayName || '',
        address: profile.address || '',
        description: profile.description || '',
        businessType: profile.businessType || '',
        mobileNumber: profile.mobileNumber || '',
        countryCode: profile.countryCode || '',
        email: profile.email || '',
        contactHours: profile.contactHours || ''
      };
    }

    if (entity.type === 'BUSINESS_LEADER') {
      return {
        fullName: profile.fullName || entity.displayName || '',
        company: profile.company || '',
        projectName: profile.projectName || '',
        projectDescription: profile.projectDescription || '',
        mobileNumber: profile.mobileNumber || '',
        countryCode: profile.countryCode || '',
        email: profile.email || '',
        contactHours: profile.contactHours || ''
      };
    }

    if (entity.type === 'POLITICIAN') {
      return {
        fullName: profile.fullName || entity.displayName || '',
        partyName: profile.partyName || '',
        segmentAddress: profile.segmentAddress || '',
        contestingTo: profile.contestingTo || '',
        description: profile.description || '',
        mobileNumber: profile.mobileNumber || '',
        countryCode: profile.countryCode || '',
        email: profile.email || '',
        contactHours: profile.contactHours || ''
      };
    }

    return {
      realName: profile.realName || '',
      artistName: profile.artistName || entity.displayName || '',
      artistType: profile.artistType || '',
      description: profile.description || '',
      mobileNumber: profile.mobileNumber || '',
      countryCode: profile.countryCode || '',
      email: profile.email || '',
      contactHours: profile.contactHours || ''
    };
  }
}
