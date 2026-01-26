
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RetroService } from '../../services/retro.service';
import { AuthService } from '../../services/security/auth.service';
import { Retro } from '../../models/retro.model';

@Component({
  selector: 'app-create-retro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-retro.component.html',
  styleUrl: './create-retro.component.scss'
})
export class CreateRetroComponent {
  title: string = '';
  description: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private retroService: RetroService,
    private auth: AuthService,
    private router: Router
  ) {}

  createRetro() {
    this.error = '';
    if (!this.title.trim() || !this.description.trim()) {
      this.error = 'Title and description are required.';
      return;
    }
    const user = this.auth.user;
    if (!user || !user.id) {
      this.error = 'User not found.';
      return;
    }
    this.loading = true;
    const retro: Retro = {
      title: this.title,
      description: this.description,
      userId: user.id
    };
    this.retroService.createRetro(retro).subscribe({
      next: (createdRetro) => {
        this.loading = false;
        // Navigate to retro dashboard with retro id
        this.router.navigate(['/retro-dashboard', createdRetro.id], { state: { retro: createdRetro } });
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to create retro.';
      }
    });
  }
}
