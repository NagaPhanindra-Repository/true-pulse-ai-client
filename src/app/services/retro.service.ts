import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Retro } from '../models/retro.model';

@Injectable({
  providedIn: 'root'
})
export class RetroService {
  private readonly baseUrl = 'http://localhost:8080/api/retros';

  private readonly actionItemsUrl = 'http://localhost:8080/api/action-items';

  constructor(private http: HttpClient) { }

  createRetro(retro: Retro): Observable<Retro> {
    return this.http.post<Retro>(this.baseUrl, retro);
  }

  /**
   * Get all retro details (retro, feedbackPoints, discussions, actionItems, questions) by id
   */
  getRetroDetails(retroId: string | number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${retroId}/details`);
  }

  getMyRetros(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/my-retros`);
  }

  getActionItemsByRetroId(retroId: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.actionItemsUrl}/retro/${retroId}`);
  }

  createActionItem(actionItem: any): Observable<any> {
    return this.http.post<any>(this.actionItemsUrl, actionItem);
  }

  updateActionItem(actionItemId: string | number, actionItem: any): Observable<any> {
    return this.http.put<any>(`${this.actionItemsUrl}/${actionItemId}`, actionItem);
  }
}
