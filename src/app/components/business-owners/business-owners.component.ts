
import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityService } from '../../services/entity.service';
import { CreateEntityResponse, EntityType } from '../../models/entity.model';

@Component({
  selector: 'app-business-owners',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  templateUrl: './business-owners.component.html',
  styleUrls: ['./business-owners.component.scss']
})
export class BusinessOwnersComponent implements OnInit {
  // Entity data from backend
  businesses: CreateEntityResponse[] = [];

  selectedBusiness: CreateEntityResponse | null = null;
  searchTerm = '';
  loading = true;

  constructor(private entityService: EntityService) {}

  ngOnInit(): void {
    this.loadRandomEntities();
  }

  loadRandomEntities(): void {
    this.loading = true;
    this.entityService.getRandomEntities(20).subscribe({
      next: entities => {
        this.businesses = entities;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectBusiness(business: CreateEntityResponse) {
    this.selectedBusiness = business;
  }

  onSearchTermChange(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      this.loadRandomEntities();
      return;
    }
    if (term.length < 2) return;
    this.loading = true;
    this.entityService.searchEntities(term).subscribe({
      next: entities => {
        this.businesses = entities;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getEntityIcon(entity: CreateEntityResponse): string {
    switch (entity.type) {
      case 'BUSINESS':
        return 'storefront';
      case 'BUSINESS_LEADER':
        return 'work';
      case 'POLITICIAN':
        return 'gavel';
      case 'CELEBRITY':
        return 'star';
      default:
        return 'business';
    }
  }

  getEntityName(entity: CreateEntityResponse): string {
    return entity.displayName;
  }

  get filteredBusinesses(): CreateEntityResponse[] {
    return this.businesses;
  }
}
