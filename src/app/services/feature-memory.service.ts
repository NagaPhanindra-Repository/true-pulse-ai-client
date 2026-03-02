import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  FeatureMemory,
  FeatureMemoryDetail,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  MemoryFilter,
  PagedResponse,
  MemoryDiscussion,
  AddDiscussionRequest
} from '../models/feature-memory.model';

@Injectable({
  providedIn: 'root'
})
export class FeatureMemoryService {
  private apiUrl = `${environment.apiUrl}/api/memories`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new feature memory
   */
  createMemory(data: CreateMemoryRequest): Observable<FeatureMemory> {
    return this.http.post<FeatureMemory>(this.apiUrl, data);
  }

  /**
   * Get paginated list of feature memories with optional filters
   */
  getMemories(filter?: MemoryFilter): Observable<PagedResponse<FeatureMemory>> {
    let params = new HttpParams();
    
    if (filter?.status) {
      params = params.set('status', filter.status);
    }
    if (filter?.search) {
      params = params.set('search', filter.search);
    }
    if (filter?.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    if (filter?.size) {
      params = params.set('size', filter.size.toString());
    }
    
    return this.http.get<PagedResponse<FeatureMemory>>(this.apiUrl, { params });
  }

  /**
   * Get detailed view of a specific memory with all discussions
   */
  getMemoryDetail(id: string): Observable<FeatureMemoryDetail> {
    return this.http.get<FeatureMemoryDetail>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update a feature memory
   */
  updateMemory(id: string, data: UpdateMemoryRequest): Observable<FeatureMemory> {
    return this.http.put<FeatureMemory>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Mark a memory as completed
   */
  completeMemory(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/complete`, {});
  }

  /**
   * Archive a memory
   */
  archiveMemory(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/archive`, {});
  }

  /**
   * Delete a memory
   */
  deleteMemory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Add a discussion note to a memory
   */
  addDiscussion(memoryId: string, discussion: AddDiscussionRequest): Observable<MemoryDiscussion> {
    return this.http.post<MemoryDiscussion>(
      `${this.apiUrl}/${memoryId}/discussions`,
      discussion
    );
  }

  /**
   * Get all discussions for a memory
   */
  getDiscussions(memoryId: string, type?: string): Observable<MemoryDiscussion[]> {
    let params = new HttpParams();
    if (type) {
      params = params.set('type', type);
    }
    
    return this.http.get<MemoryDiscussion[]>(
      `${this.apiUrl}/${memoryId}/discussions`,
      { params }
    );
  }

  /**
   * Update a discussion
   */
  updateDiscussion(memoryId: string, discussionId: string, data: Partial<AddDiscussionRequest>): Observable<MemoryDiscussion> {
    return this.http.put<MemoryDiscussion>(
      `${this.apiUrl}/${memoryId}/discussions/${discussionId}`,
      data
    );
  }

  /**
   * Delete a discussion
   */
  deleteDiscussion(memoryId: string, discussionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${memoryId}/discussions/${discussionId}`
    );
  }

  /**
   * Sync Jira data for a memory (refresh story details)
   */
  syncJiraData(id: string): Observable<FeatureMemory> {
    return this.http.post<FeatureMemory>(`${this.apiUrl}/${id}/sync-jira`, {});
  }
}
