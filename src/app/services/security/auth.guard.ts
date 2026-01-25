import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> {
    // Allow access to home page ('/') without authentication
    if (state.url === '/' || state.url === '/home') {
      return true;
    }
    if (this.auth.isAuthenticated()) {
      return true;
    }
    return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
}
