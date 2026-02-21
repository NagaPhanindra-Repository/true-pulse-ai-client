import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Retro } from '../models/retro.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RetroService {
  private readonly baseUrl = environment.apiUrl + '/api/retros';

  private readonly actionItemsUrl = environment.apiUrl + '/api/public/action-items';
  private readonly justBaseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  createRetro(retro: Retro): Observable<Retro> {
    return this.http.post<Retro>(this.baseUrl, retro);
  }

  /**
   * Get all retro details (retro, feedbackPoints, discussions, actionItems, questions) by id
   */
  getRetroDetails(retroId: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/public/${retroId}/details`);
  }

  getMyRetros(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my-retros`);
  }

  getActionItemsByRetroId(retroId: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.actionItemsUrl}/retro/${retroId}`);
  }

  getActionItemsWithPast(retroId: string | number): Observable<{currentRetroActionItems: any[], pastRetroActionItems: any[]}> {
    return this.http.get<{currentRetroActionItems: any[], pastRetroActionItems: any[]}>(`${this.actionItemsUrl}/retro/${retroId}/with-past`);
  }

  createActionItem(actionItem: any): Observable<any> {
    return this.http.post<any>(this.actionItemsUrl, actionItem);
  }

  updateActionItem(actionItemId: string | number, actionItem: any): Observable<any> {
    return this.http.put<any>(`${this.actionItemsUrl}/${actionItemId}`, actionItem);
  }
    deleteActionItem(actionItemId: string | number): Observable<any> {
    return this.http.delete(`${this.actionItemsUrl}/${actionItemId}`);
  }

    getRetroAnalysis(retroId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/public/${retroId}/analysis`);
  }

  getFeedbackPointAnalysis(retroId: number, feedbackPointId: number): Observable<any> {
    return this.http.post(`${this.justBaseUrl}/api/public/feedback-points/analysis`, { retroId, feedbackPointId });
  }
}
