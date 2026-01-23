import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatRequest } from '../models/ChatRequest';
import { ChatResponse } from '../models/ChatResponse';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly baseUrl = 'http://localhost:8080/api/v1/chat';

  constructor(private http: HttpClient) {}

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.baseUrl, request);
  }
}
