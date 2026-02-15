
import { Routes } from '@angular/router';
import { AuthGuard } from './services/security/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BusinessOwnersComponent } from './components/business-owners/business-owners.component';
import { RetroDashboardComponent } from './components/retro-dashboard/retro-dashboard.component';
import { LoginInComponent } from './components/login-in/login-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { FollowersComponent } from './components/followers/followers.component';
import { AppContentComponent } from './components/app-content/app-content.component';
import { QuestionsComponent } from './components/questions/questions.component';
import { RetrosComponent } from './components/retros/retros.component';
import { CreateEntityComponent } from './components/create-entity/create-entity.component';
import { MyEntitiesComponent } from './components/my-entities/my-entities.component';
import { AboutFounderComponent } from './components/about-founder/about-founder.component';

export const routes: Routes = [
  { path: '', component: AppContentComponent },
  { path: 'about', component: AboutFounderComponent },
  { path: 'login', component: LoginInComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'retros', component: RetrosComponent, canActivate: [AuthGuard] },
  { path: 'retro-dashboard/:id', component: RetroDashboardComponent, canActivate: [AuthGuard] },
  { path: 'questions', component: QuestionsComponent, canActivate: [AuthGuard] },
  { path: 'followers', component: FollowersComponent, canActivate: [AuthGuard] },
  { path: 'business', component: BusinessOwnersComponent },
  { path: 'entities/create', component: CreateEntityComponent, canActivate: [AuthGuard] },
  { path: 'entities/my', component: MyEntitiesComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];
