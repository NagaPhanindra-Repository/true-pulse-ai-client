import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BusinessDocumentService {
  private baseUrl = environment.apiUrl + '/api/business-documents';

  constructor(private http: HttpClient) {}

  uploadDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  uploadDocumentWithEntity(file: File, entityId: string, displayName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityId', entityId);
    formData.append('displayName', displayName);
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  searchDocuments(entityId: number, displayName: string, query: string, topK: number = 5): Observable<any> {
    return this.http.post(`${this.baseUrl}/search`, {
      entityId,
      displayName,
      query,
      topK
    });
  }
}
