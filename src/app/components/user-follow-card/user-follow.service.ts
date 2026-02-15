import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserFollow } from '../../models/user-follow.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserFollowService {
  private randomUsersUrl = environment.apiUrl + '/api/user/random';
  private followUrl = environment.apiUrl + '/api/followers/follow';

  constructor(private http: HttpClient) {}

  getRandomUsers(): Observable<UserFollow[]> {
    return this.http.get<UserFollow[]>(this.randomUsersUrl);
  }

  followUser(userUsernameToFollow: string): Observable<any> {
    return this.http.post(this.followUrl, { userUsernameToFollow });
  }
}
