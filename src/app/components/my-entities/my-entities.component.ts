import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EntityService } from '../../services/entity.service';
import { CreateEntityResponse, EntityType } from '../../models/entity.model';
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
}
