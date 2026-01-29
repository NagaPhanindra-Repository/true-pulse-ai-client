import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiChatRequest, AiChatResponse } from '../../models/ai-chat.model';
import { SpecificFeedbackRequest } from '../../models/specific-feedback.model';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  createdAt?: number;
}

@Injectable({ providedIn: 'root' })
export class AiChatBotService {
  private apiUrl = 'http://localhost:8080/api/v1/chat/question/analyze';
  private specificFeedbackUrl = 'http://localhost:8080/api/v1/chat/specific-feedback/analyze';

  constructor(private http: HttpClient) {}

  analyzeQuestion(request: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(this.apiUrl, request);
  }

  analyzeSpecificFeedback(request: SpecificFeedbackRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(this.specificFeedbackUrl, request);
  }
}
