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
    { label: 'Features', route: '/about-us' },
    { label: 'Security', route: '/about-us' },
    { label: 'Pricing', route: '/about-us' },
    { label: 'API', route: '/about-us' }
  ];

  companyLinks = [
    { label: 'About Us', route: '/about-us' },
    { label: 'Founder', route: '/about' },
    { label: 'Contact', route: '/contact' },
    { label: 'Business', route: '/business' }
  ];

  resourceLinks = [
    { label: 'Documentation', route: '/about-us' },
    { label: 'Blog', route: '/about-us' },
    { label: 'Community', route: '/about-us' },
    { label: 'Support', route: '/contact' }
  ];

  legalLinks = [
    { label: 'Privacy Policy', route: '/privacy' },
    { label: 'Terms of Service', route: '/terms' },
    { label: 'Security & Compliance', route: '/about-us' },
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
