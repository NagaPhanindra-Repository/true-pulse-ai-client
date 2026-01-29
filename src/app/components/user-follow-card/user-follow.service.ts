import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserFollow } from '../../models/user-follow.model';

@Injectable({ providedIn: 'root' })
export class UserFollowService {
  private randomUsersUrl = 'http://localhost:8080/api/user/random';
  private followUrl = 'http://localhost:8080/api/followers/follow';

  constructor(private http: HttpClient) {}

  getRandomUsers(): Observable<UserFollow[]> {
    return this.http.get<UserFollow[]>(this.randomUsersUrl);
  }

  followUser(userUsernameToFollow: string): Observable<any> {
    return this.http.post(this.followUrl, { userUsernameToFollow });
  }
}
