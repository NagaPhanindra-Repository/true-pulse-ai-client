import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FeedbackPoint } from '../models/feedback-point.model';
import { Discussion } from '../models/discussion.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private readonly feedbackUrl = environment.apiUrl + '/api/public/feedback-points';
  private readonly discussionUrl = environment.apiUrl + '/api/public/discussions';

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
    deleteFeedbackPoint(id: number): Observable<any> {
    return this.http.delete(`${this.feedbackUrl}/${id}`);
  }

  deleteDiscussion(id: number): Observable<any> {
    return this.http.delete(`${this.discussionUrl}/${id}`);
  }
  // Polling (Like/Dislike) - Voting API (contract: voteType, userVote: 'LIKE' | 'DISLIKE' | null)
  voteFeedback(feedbackId: number, voteType: 'LIKE' | 'DISLIKE') {
    // POST /api/feedback-points/:id/vote
    return this.http.post<{ likes: number, dislikes: number, userVote: 'LIKE' | 'DISLIKE' | null }>(
      `${environment.apiUrl}/api/feedback-points/${feedbackId}/vote`,
      { voteType }
    );
  }

  // Remove current user's vote
  removeVote(feedbackId: number) {
    // DELETE /api/feedback-points/:id/vote
    return this.http.delete<{ likes: number, dislikes: number, userVote: null }>(
      `${environment.apiUrl}/api/feedback-points/${feedbackId}/vote`
    );
  }

  // Get vote counts and user vote for a feedback point
  getFeedbackVotes(feedbackId: number) {
    // GET /api/feedback-points/:id/votes
    return this.http.get<{ likes: number, dislikes: number, userVote: 'LIKE' | 'DISLIKE' | null }>(
      `${environment.apiUrl}/api/feedback-points/${feedbackId}/votes`
    );
  }
}
