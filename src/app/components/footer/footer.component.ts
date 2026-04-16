import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  productLinks = [
    { label: 'Website Studio', route: '/about-us' },
    { label: 'Image Studio', route: '/about-us' },
    { label: 'Entity Launch', route: '/entities/create' },
    { label: 'AI Chat & Hosting', route: '/about-us' }
  ];

  companyLinks = [
    { label: 'About ezit.ai', route: '/about-us' },
    { label: 'Founder', route: '/about' },
    { label: 'Contact', route: '/contact' },
    { label: 'Business Tools', route: '/business' }
  ];

  resourceLinks = [
    { label: 'Hosting Flow', route: '/about-us' },
    { label: 'Events & Passes', route: '/about-us' },
    { label: 'Memory Vault', route: '/about-us' },
    { label: 'Support', route: '/contact' }
  ];

  legalLinks = [
    { label: 'Privacy Policy', route: '/privacy' },
    { label: 'Terms of Service', route: '/terms' },
    { label: 'Trust & Compliance', route: '/about-us' },
    { label: 'Cookies', route: '/privacy' }
  ];

  socialLinks = [
    { icon: 'fab fa-twitter', url: '#', label: 'Twitter' },
    { icon: 'fab fa-linkedin', url: '#', label: 'LinkedIn' },
    { icon: 'fab fa-github', url: '#', label: 'GitHub' }
  ];

  complianceBadges = [
    { icon: '🔒', label: 'SOC 2 Type II', badge: 'SOC2' },
    { icon: '🛡️', label: 'GDPR Compliant', badge: 'GDPR' },
    { icon: '🔐', label: 'ISO 27001', badge: 'ISO27001' }
  ];
}
