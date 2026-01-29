import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FollowerUser, FollowedUserQuestion, CreateAnswerRequest, CreateAnswerResponse } from '../models/followers.model';

@Injectable({ providedIn: 'root' })
export class FollowersService {
  private readonly baseUrl = 'http://localhost:8080/api';

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
}
