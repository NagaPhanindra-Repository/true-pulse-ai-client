import { Routes } from '@angular/router';
import { AuthGuard } from './services/security/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RetroDashboardComponent } from './components/retro-dashboard/retro-dashboard.component';
import { LoginInComponent } from './components/login-in/login-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';

import { AppContentComponent } from './components/app-content/app-content.component';

import { RetrosComponent } from './components/retros/retros.component';

export const routes: Routes = [
  { path: '', component: AppContentComponent },
  { path: 'login', component: LoginInComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'retros', component: RetrosComponent, canActivate: [AuthGuard] },
  { path: 'retro-dashboard/:id', component: RetroDashboardComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];
