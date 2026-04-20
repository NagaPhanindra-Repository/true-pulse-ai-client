import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactFormRequest {
  entityId: string;
  displayName: string;
  name: string;
  email: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
  data: number | null;
}

@Injectable({ providedIn: 'root' })
export class WebsiteBlocksService {
    private readonly baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  submitContactForm(payload: ContactFormRequest): Observable<ContactFormResponse> {
    return this.http.post<ContactFormResponse>(`${this.baseUrl}/api/contact-form/public/submit`, payload);
  }
}
