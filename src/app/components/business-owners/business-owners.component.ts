
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessDocumentService } from '../../services/business-document.service';

@Component({
  selector: 'app-business-owners',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule],
  templateUrl: './business-owners.component.html',
  styleUrls: ['./business-owners.component.scss']
})
export class BusinessOwnersComponent {
  // Dummy business data
  businesses = [
    {
      id: 1,
      name: 'Cafe Aroma',
      description: 'Cozy coffee shop with fresh pastries.',
      icon: 'local_cafe',
      followed: true
    },
    {
      id: 2,
      name: 'TechFix',
      description: 'Gadget repair and IT services.',
      icon: 'build',
      followed: true
    },
    {
      id: 3,
      name: 'Green Grocers',
      description: 'Organic fruits and vegetables.',
      icon: 'eco',
      followed: false
    }
  ];

  selectedBusiness: any = null;
  searchTerm = '';
  uploadStatus: string = '';
  searchQuery: string = '';
  searchResults: any[] = [];
  isUploading = false;
  isSearching = false;

  constructor(private docService: BusinessDocumentService) {}

  selectBusiness(business: any) {
    this.selectedBusiness = business;
    this.searchResults = [];
  }

  getJwtToken(): string {
    // Example: get JWT from localStorage or a service
    return localStorage.getItem('jwt_token') || '';
  }

  getBusinessId(): string {
    // Example: use username as businessId (customize as needed)
    return localStorage.getItem('username') || 'demo_business';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.isUploading = true;
    this.uploadStatus = 'Uploading...';
    this.docService.uploadDocument(file, this.getJwtToken()).subscribe({
      next: (res) => {
        this.uploadStatus = res.message || 'Upload successful!';
        this.isUploading = false;
      },
      error: (err) => {
        this.uploadStatus = 'Upload failed.';
        this.isUploading = false;
      }
    });
  }

  onSearch() {
    if (!this.selectedBusiness || !this.searchQuery.trim()) return;
    this.isSearching = true;
    this.searchResults = [];
    this.docService.searchDocuments(
      this.getBusinessId(),
      this.searchQuery,
      5,
      this.getJwtToken()
    ).subscribe({
      next: (res) => {
        this.searchResults = res.matches || [];
        this.isSearching = false;
      },
      error: (err) => {
        this.isSearching = false;
      }
    });
  }

  get filteredBusinesses() {
    if (!this.searchTerm.trim()) return this.businesses;
    return this.businesses.filter(b =>
      b.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
