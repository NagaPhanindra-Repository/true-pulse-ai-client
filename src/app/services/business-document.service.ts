import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BusinessDocumentService {
  private baseUrl = 'http://localhost:8080/api/business-documents';

  constructor(private http: HttpClient) {}

  uploadDocument(file: File, jwt: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${jwt}`
      })
    });
  }

  uploadDocumentWithEntity(file: File, entityId: string, displayName: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityId', entityId);
    formData.append('displayName', displayName);
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  searchDocuments(businessId: string, query: string, topK: number, jwt: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/search`, {
      businessId,
      query,
      topK
    }, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      })
    });
  }
}
