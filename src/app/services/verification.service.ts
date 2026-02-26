import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Create a pre-signup verification session (public, no auth)
   * @param payload userName, email, countryCode
   * @returns Observable with verification URL and session ID
   */
  createPreSignupVerification(payload: {
    userName: string;
    email: string;
    countryCode: string;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/api/verification/pre-signup/create`,
      payload,
      { headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }
    );
  }

  /**
   * Get pre-signup verification result by session ID (public, no auth)
   * @param sessionId Mock session ID
   * @returns Observable with verification result details
   */
  getPreSignupStatus(sessionId: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/api/verification/pre-signup/status/${sessionId}`,
      { headers: { 'Accept': 'application/json' } }
    );
  }
}
