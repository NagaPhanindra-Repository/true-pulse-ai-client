

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { UserModel } from '../../models/user-model';
import { LoggedInUserModel } from '../../models/logged-in-user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private userSubject = new BehaviorSubject<LoggedInUserModel | null>(null);
  user$ = this.userSubject.asObservable();
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(usernameOrEmail: string, password: string): Observable<string> {
    return this.http.post<{ accessToken: string; tokenType: string }>(`${this.baseUrl}/api/auth/login`, { usernameOrEmail, password },
      { headers: { 'Content-Type': 'application/json', "Accept": "application/json" } })
      .pipe(
        tap(resp => this.setToken(resp.accessToken)),
        map(resp => resp.accessToken)
      );
  }

  signup(user: UserModel): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/signup`, user, { headers: { 'Content-Type': 'application/json', "Accept": "application/json" } });
  }


  fetchUserDetails(): Observable<LoggedInUserModel> {
    console.log('[AuthService] Fetching user details from ' + `${this.baseUrl}/api/user/me`);
    return this.http.get<LoggedInUserModel>(`${this.baseUrl}/api/user/me`,
      { headers: { 'Content-Type': 'application/json', "Accept": "application/json" } }).pipe(
      tap(user => this.userSubject.next(user))
    );
  }

  get user(): LoggedInUserModel | null {
    return this.userSubject.value;
  }

  logout(): void {
    this.clearToken();
    this.userSubject.next(null);
    this.router.navigate(['/']);
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(this.tokenKey);
    }
    return null;
  }

  clearToken(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(this.tokenKey);
    }
  }

  isAuthenticated(): boolean {
    // Return false during SSR
    if (typeof window === 'undefined') return false;
    
    const token = this.getToken();
    if (!token) return false;
    // Check token expiry (JWT)
    const payload = this.decodeToken(token);
    if (!payload) return false;
    const exp = payload.exp;
    if (!exp) return false;
    return Date.now() < exp * 1000;
  }

  private decodeToken(token: string): any {
    // Return null during SSR since atob is not available
    if (typeof window === 'undefined') return null;
    
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}
