import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
// Removed AuthService to break circular dependency
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {
    console.log('[AuthInterceptor] Constructor called');
  }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('[AuthInterceptor] Intercepting request to add auth token if available');
    const token = typeof window !== 'undefined' && window.sessionStorage
      ? sessionStorage.getItem('auth_token')
      : null;
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionStorage.removeItem('auth_token');
          }
          // Only redirect to login if not on home page
          const currentUrl = this.router.url;
          if (currentUrl !== '/' && currentUrl !== '/home') {
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}
