import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FollowerUser, FollowedUserQuestion, CreateAnswerRequest, CreateAnswerResponse } from '../models/followers.model';

@Injectable({ providedIn: 'root' })
export class FollowersService {
  private readonly baseUrl = environment.apiUrl + '/api';

  constructor(private http: HttpClient) {}

  getMyFollowingUsers(): Observable<FollowerUser[]> {
    return this.http.get<FollowerUser[]>(`${this.baseUrl}/followers/my-following-users`);
  }

  getFollowedUsersQuestions(): Observable<FollowedUserQuestion[]> {
    return this.http.get<FollowedUserQuestion[]>(`${this.baseUrl}/questions/feed/followed-users`);
  }

  createAnswer(request: CreateAnswerRequest): Observable<CreateAnswerResponse> {
    return this.http.post<CreateAnswerResponse>(`${this.baseUrl}/answers`, request);
  }

  updateAnswer(answerId: number, content: string, questionId: number): Observable<CreateAnswerResponse> {
    return this.http.put<CreateAnswerResponse>(`${this.baseUrl}/answers/${answerId}`, { content, questionId });
  }
}
