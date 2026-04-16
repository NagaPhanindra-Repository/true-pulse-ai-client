import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent {
  features = [
    {
      icon: '🏗️',
      title: 'Entity Launch System',
      description: 'Create the right entity for a business, owner, creator, professional, public figure, or community with a strong digital starting point.'
    },
    {
      icon: '🌐',
      title: 'Instant Website Studio',
      description: 'Generate, refine, preview, and publish branded websites from prompts, menus, brochures, profiles, or uploaded documents.'
    },
    {
      icon: '🎨',
      title: 'Campaign and Image Studio',
      description: 'Create premium posters, promotional images, social-ready creative, and brand-led campaign assets with editable overlays.'
    },
    {
      icon: '🧠',
      title: 'Trust, Memory, and Intelligence',
      description: 'Trusted onboarding, retrospectives, memory workflows, and feedback intelligence continue to power smarter decisions behind the scenes.'
    }
  ];

  values = [
    { title: 'Make serious work feel easier', description: 'We reduce the digital overhead around websites, support, campaigns, and events so operators can stay focused on the real mission.' },
    { title: 'Design for every generation', description: 'The interface should feel welcoming for first-time digital users and still credible for experienced operators and growth teams.' },
    { title: 'Useful AI over flashy AI', description: 'Automation should remove repetitive work, create better outcomes, and stay understandable to the people using it.' },
    { title: 'Trust is part of the product', description: 'Memory, verification, and feedback intelligence matter because better automation depends on more trustworthy inputs.' }
  ];

  timeline = [
    { year: '2024', event: 'Trust and intelligence foundation established', detail: 'The early platform focused on signal quality, memory, retrospectives, and AI-assisted understanding.' },
    { year: '2025', event: 'Entity workflows expanded', detail: 'Website generation, hosting, AI customer support, promotions, and business-facing flows became the center of the experience.' },
    { year: '2026', event: 'ezit.ai brand launched', detail: 'The mission sharpened: make it easy for real entities to launch, promote, support, and grow with AI doing more of the operational work.' }
  ];
}
