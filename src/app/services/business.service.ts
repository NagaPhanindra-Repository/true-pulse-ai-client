import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Business } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  // Dummy data for now
  private businesses: Business[] = [
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

  getBusinesses(): Observable<Business[]> {
    return of(this.businesses);
  }
}
