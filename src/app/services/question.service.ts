
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './security/auth.service';

export interface Question {
  id?: number;
  title: string;
  description: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private apiUrl = environment.apiUrl + '/api/questions';

  constructor(private http: HttpClient, private auth: AuthService) {}


  createQuestion(question: Partial<Question>): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question);
  }

  getMyQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/my-questions`);
  }



  updateQuestion(id: number, question: Partial<Question>): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${id}`, question);
  }

    /**
   * Fetches AI analysis objects for recent feedback/questions
   */
  getMyQuestionsAnalysis(): Observable<any[]> {
    return this.http.get<any[]>(
      environment.apiUrl + '/api/v1/chat/my-questions/analyze',
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

}
