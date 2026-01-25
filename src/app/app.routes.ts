import { Routes } from '@angular/router';
import { AuthGuard } from './services/security/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginInComponent } from './components/login-in/login-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';

import { AppContentComponent } from './components/app-content/app-content.component';

export const routes: Routes = [
  { path: '', component: AppContentComponent },
  { path: 'login', component: LoginInComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];
