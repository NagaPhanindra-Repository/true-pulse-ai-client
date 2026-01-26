import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FeedbackPoint } from '../models/feedback-point.model';
import { Discussion } from '../models/discussion.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly feedbackUrl = 'http://localhost:8080/api/feedback-points';
  private readonly discussionUrl = 'http://localhost:8080/api/discussions';

  constructor(private http: HttpClient) {}

  // Feedback Points
  createFeedbackPoint(point: FeedbackPoint): Observable<FeedbackPoint> {
    return this.http.post<FeedbackPoint>(this.feedbackUrl, point);
  }

  getFeedbackPoints(): Observable<FeedbackPoint[]> {
    return this.http.get<FeedbackPoint[]>(this.feedbackUrl);
  }

  getFeedbackPoint(id: number): Observable<FeedbackPoint> {
    return this.http.get<FeedbackPoint>(`${this.feedbackUrl}/${id}`);
  }

  updateFeedbackPoint(id: number, point: FeedbackPoint): Observable<FeedbackPoint> {
    return this.http.put<FeedbackPoint>(`${this.feedbackUrl}/${id}`, point);
  }

  // Discussions
  createDiscussion(discussion: Discussion): Observable<Discussion> {
    return this.http.post<Discussion>(this.discussionUrl, discussion);
  }

  getDiscussions(): Observable<Discussion[]> {
    return this.http.get<Discussion[]>(this.discussionUrl);
  }

  getDiscussion(id: number): Observable<Discussion> {
    return this.http.get<Discussion>(`${this.discussionUrl}/${id}`);
  }

  updateDiscussion(id: number, discussion: Discussion): Observable<Discussion> {
    return this.http.put<Discussion>(`${this.discussionUrl}/${id}`, discussion);
  }
}
