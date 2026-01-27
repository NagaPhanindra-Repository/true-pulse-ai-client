import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RetroService } from '../../services/retro.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-retros',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './retros.component.html',
  styleUrl: './retros.component.scss'
})
export class RetrosComponent implements OnInit, AfterViewInit {
  retros: any[] = [];
  loading = false;
  expanded: { [id: number]: boolean } = {};

  constructor(private retroService: RetroService) {}

  ngOnInit() {
    this.loading = true;
    this.retroService.getMyRetros().subscribe({
      next: (data) => {
        this.retros = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  ngAfterViewInit() {
    this.animateNeuralNetwork();
  }

  toggleExpand(id: number) {
    this.expanded[id] = !this.expanded[id];
  }

  animateNeuralNetwork() {
    const canvas = document.getElementById('nn-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Responsive canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Simple neural network animation
    const nodes = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 16 + Math.random() * 10,
      color: `rgba(174,139,250,${0.5 + Math.random() * 0.5})`
    }));
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (!ctx) continue;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = 'rgba(110,231,183,0.18)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      // Draw nodes
      for (const node of nodes) {
        if (!ctx) continue;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.shadowColor = '#6ee7b7';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    function animate() {
      for (const node of nodes) {
        node.x += (Math.random() - 0.5) * 1.2;
        node.y += (Math.random() - 0.5) * 1.2;
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      }
      draw();
      requestAnimationFrame(animate);
    }
    animate();
  }
}
