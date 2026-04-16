import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { EntityService } from '../../services/entity.service';
import {
  extractHostedSubdomainFromHostname,
  getHostedRootDomains,
  getPreferredHostedRootDomain,
  normalizeHostedSubdomain
} from '../../utils/hosted-website.util';
import { environment } from '../../../environments/environment';

type HostPageState = 'loading' | 'ready' | 'invalid' | 'not-found' | 'unavailable';

@Component({
  selector: 'app-public-website-host',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './public-website-host.component.html',
  styleUrls: ['./public-website-host.component.scss']
})
export class PublicWebsiteHostComponent implements OnInit {
  state: HostPageState = 'loading';
  pageTitle = 'Hosted Website';
  subdomain = '';
  lookupSubdomain = '';
  errorMessage = '';
  hostedSrcDoc: SafeHtml = '';
  resolvedRootDomain = getPreferredHostedRootDomain();
  private navigationMode: 'subdomain-host' | 'path-alias' = 'subdomain-host';
  private readonly onrenderBaseDomain = this.resolveOnrenderBaseDomain();

  constructor(
    private route: ActivatedRoute,
    private entityService: EntityService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      this.state = 'unavailable';
      this.errorMessage = 'This page requires a browser context.';
      return;
    }

    this.resolvedRootDomain = getPreferredHostedRootDomain(window.location.hostname);

    const routeSubdomain = normalizeHostedSubdomain(
      this.route.snapshot.paramMap.get('subdomain') ||
      this.route.snapshot.queryParamMap.get('subdomain') ||
      ''
    );

    if (routeSubdomain) {
      this.navigationMode = 'path-alias';
      this.subdomain = routeSubdomain;
      this.lookupSubdomain = routeSubdomain;
      this.fetchHostedWebsite(routeSubdomain);
      return;
    }

    const detected = extractHostedSubdomainFromHostname(window.location.hostname);
    if (!detected) {
      this.state = 'invalid';
      this.errorMessage = 'Subdomain is missing or invalid.';
      return;
    }

    this.subdomain = detected;
    this.lookupSubdomain = detected;
    this.fetchHostedWebsite(detected);
  }

  get supportMailTo(): string {
    return 'mailto:ravurinagaphanindra@gmail.com?subject=Hosted%20Website%20Help';
  }

  get rootDomainLabel(): string {
    if (!environment.production) return `${this.resolvedRootDomain}:4200`;
    if (this.navigationMode === 'path-alias' && this.onrenderBaseDomain) return this.onrenderBaseDomain;
    return this.resolvedRootDomain;
  }

  get lookupPreviewUrl(): string {
    const safeLookup = normalizeHostedSubdomain(this.lookupSubdomain || 'your-brand');
    return this.buildHostedUrl(safeLookup);
  }

  get homeUrl(): string {
    const protocol = environment.production ? 'https' : 'http';
    return `${protocol}://${this.rootDomainLabel}`;
  }

  retry(): void {
    if (!this.subdomain) return;
    this.lookupSubdomain = this.subdomain;
    this.fetchHostedWebsite(this.subdomain);
  }

  goToHostedSubdomain(): void {
    const subdomain = normalizeHostedSubdomain(this.lookupSubdomain);
    if (!subdomain) {
      this.errorMessage = 'Please enter a valid subdomain.';
      this.state = 'invalid';
      return;
    }

    if (typeof window === 'undefined') return;
    window.location.href = this.buildHostedUrl(subdomain);
  }

  private fetchHostedWebsite(subdomain: string): void {
    this.state = 'loading';
    this.entityService.renderBusinessWebsiteBySubdomain(subdomain).subscribe({
      next: (resp) => {
        this.pageTitle = resp.displayName || subdomain;
        this.hostedSrcDoc = this.sanitizer.bypassSecurityTrustHtml(this.buildSrcDoc(resp.html, resp.css, resp.js));
        this.state = 'ready';
      },
      error: (err: HttpErrorResponse) => {
        this.lookupSubdomain = subdomain;
        if (err.status === 400) {
          this.state = 'invalid';
          this.errorMessage = err.error?.message || 'Subdomain is invalid.';
          return;
        }

        if (err.status === 404) {
          this.state = 'not-found';
          this.errorMessage = err.error?.message || 'Hosted website not found.';
          return;
        }

        this.state = 'unavailable';
        this.errorMessage = err.error?.message || 'Unable to load hosted website right now.';
      }
    });
  }

  private buildHostedUrl(subdomain: string): string {
    const protocol = environment.production ? 'https' : 'http';
    if (environment.production && this.navigationMode === 'path-alias' && this.onrenderBaseDomain) {
      return `${protocol}://${this.onrenderBaseDomain}/h/${subdomain}`;
    }
    return `${protocol}://${subdomain}.${this.rootDomainLabel}`;
  }

  private resolveOnrenderBaseDomain(): string {
    const domains = getHostedRootDomains();
    return domains.find((d) => d.endsWith('.onrender.com')) || 'true-pulse-ai.onrender.com';
  }

  private buildSrcDoc(html: string, css: string, js: string): string {
    const cleanHtml = html || '<!doctype html><html><head></head><body></body></html>';
    const cleanCss = css || '';
    const cleanJs = js || '';

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleanHtml, 'text/html');

      doc.querySelectorAll('link[rel="stylesheet"][href="styles.css"]').forEach((el) => el.remove());
      doc.querySelectorAll('script[src="main.js"]').forEach((el) => el.remove());

      if (cleanCss) {
        const styleTag = doc.createElement('style');
        styleTag.textContent = cleanCss;
        doc.head.appendChild(styleTag);
      }

      if (cleanJs) {
        const scriptTag = doc.createElement('script');
        scriptTag.textContent = cleanJs;
        doc.body.appendChild(scriptTag);
      }

      return doc.documentElement.outerHTML;
    } catch {
      return `<html><head><style>${cleanCss}</style></head><body>${cleanHtml}<script>${cleanJs}</script></body></html>`;
    }
  }
}
