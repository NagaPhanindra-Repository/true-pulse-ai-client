import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  JiraIntegration,
  JiraIntegrationRequest,
  ConnectionTestResult,
  JiraStory
} from '../models/jira-integration.model';

@Injectable({
  providedIn: 'root'
})
export class JiraIntegrationService {
  private apiUrl = `${environment.apiUrl}/api/jira`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new Jira integration
   */
  createIntegration(data: JiraIntegrationRequest): Observable<JiraIntegration> {
    return this.http.post<JiraIntegration>(`${this.apiUrl}/integrations`, data);
  }

  /**
   * Get all Jira integrations for the current user
   */
  getIntegrations(): Observable<JiraIntegration[]> {
    return this.http.get<JiraIntegration[]>(`${this.apiUrl}/integrations`);
  }

  /**
   * Get a specific Jira integration
   */
  getIntegration(id: string): Observable<JiraIntegration> {
    return this.http.get<JiraIntegration>(`${this.apiUrl}/integrations/${id}`);
  }

  /**
   * Test connection to a Jira integration
   */
  testConnection(integrationId: string): Observable<ConnectionTestResult> {
    return this.http.post<ConnectionTestResult>(
      `${this.apiUrl}/integrations/${integrationId}/test`,
      {}
    );
  }

  /**
   * Test Jira credentials before creating a new integration
   */
  testConnectionBeforeCreate(data: JiraIntegrationRequest): Observable<ConnectionTestResult> {
    return this.http.post<ConnectionTestResult>(
      `${this.apiUrl}/integrations/test-connection`,
      data
    );
  }

  /**
   * Fetch a story from Jira
   */
  fetchStory(integrationId: string, storyKey: string): Observable<JiraStory> {
    return this.http.get<JiraStory>(
      `${this.apiUrl}/integrations/${integrationId}/story/${storyKey}`
    );
  }

  /**
   * Delete a Jira integration
   */
  deleteIntegration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/integrations/${id}`);
  }
}
