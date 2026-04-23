import { getSubscribeBlockHtml } from '../blocks/subscribe-block.util';
import { getMapBlockHtml } from '../blocks/map-block.util';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityService } from '../../services/entity.service';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  BusinessWebsiteResponse,
  SaveBusinessWebsiteResponse,
  SubdomainAvailabilityResponse
} from '../../models/business-website.model';
import { getContactFormBlockHtml } from '../blocks/contact-form-block.util';
import { environment } from '../../../environments/environment';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';
import { getHostedRootDomains } from '../../utils/hosted-website.util';

export interface SectionOverride {
  id: string;
  label: string;
  visible: boolean;
  bgColor: string;
  textColor: string;
  fontSize: string;
  fontFamily: string;
}

export interface AddBlockOption {
  type: string;
  label: string;
  icon: string;
  html: string;
}

@Component({
  selector: 'app-website-studio',
  templateUrl: './website-studio.component.html',
  styleUrls: ['./website-studio.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class WebsiteStudioComponent implements OnInit, OnDestroy {

  // ── State ──────────────────────────────────────────────────────────────────
  entityDetails: any;
  loading = false;
  error = '';
  prompt = '';
  selectedFile: File | null = null;
  websiteResponse: BusinessWebsiteResponse | null = null;
  generating = false;
  regenerating = false;
  regeneratePrompt = '';
  private previousRegenerateBackup: BusinessWebsiteResponse | null = null;

  // ── Editor tabs ────────────────────────────────────────────────────────────
  activeTab: 'theme' | 'sections' | 'blocks' | 'code' | 'publish' = 'theme';

  // ── Preview viewport ───────────────────────────────────────────────────────
  previewMode: 'desktop' | 'tablet' | 'mobile' = 'desktop';

  // ── Global theme ──────────────────────────────────────────────────────────
  theme = {
    primaryColor: '#c1440e',
    secondaryColor: '#6b7c5c',
    bgColor: '#fdf5e4',
    textColor: '#1c0a00',
    accentColor: '#e07b39',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Lato', sans-serif",
    borderRadius: '8',          // px
    buttonStyle: 'rounded',     // rounded | square | pill
    shadowLevel: 'medium',      // none | light | medium | strong
    animationSpeed: 'normal',   // none | slow | normal | fast
    navStyle: 'sticky',         // sticky | fixed | static
    sectionSpacing: 'comfortable', // compact | comfortable | spacious
  };

  // ── Typography presets ─────────────────────────────────────────────────────
  readonly fontPairs: { label: string; heading: string; body: string }[] = [
    { label: 'Classic Editorial', heading: "'Playfair Display', serif", body: "'Lato', sans-serif" },
    { label: 'Modern Clean',      heading: "'Montserrat', sans-serif",  body: "'Open Sans', sans-serif" },
    { label: 'Bold Impact',       heading: "'Oswald', sans-serif",      body: "'Roboto', sans-serif" },
    { label: 'Elegant Serif',     heading: "'Cormorant Garamond', serif", body: "'Raleway', sans-serif" },
    { label: 'Tech Minimal',      heading: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif" },
    { label: 'Warm Humanist',     heading: "'Merriweather', serif",     body: "'Source Sans Pro', sans-serif" },
    { label: 'Luxury Brand',      heading: "'Libre Baskerville', serif", body: "'Lato', sans-serif" },
    { label: 'Creative Agency',   heading: "'Poppins', sans-serif",     body: "'DM Sans', sans-serif" },
    { label: 'Newspaper Style',   heading: "'Libre Franklin', sans-serif", body: "'Crimson Text', serif" },
    { label: 'Startup Fresh',     heading: "'Nunito', sans-serif",      body: "'Nunito Sans', sans-serif" },
  ];

  // ── Color palette presets ─────────────────────────────────────────────────
  readonly colorPresets: { label: string; primary: string; secondary: string; accent: string; bg: string; text: string }[] = [
    { label: 'Terra Spice',    primary: '#c1440e', secondary: '#6b7c5c', accent: '#e07b39', bg: '#fdf5e4', text: '#1c0a00' },
    { label: 'Ocean Blue',     primary: '#1a6bb5', secondary: '#0e9aa7', accent: '#f6b352', bg: '#f0f8ff', text: '#0d1b2a' },
    { label: 'Forest Green',   primary: '#2d6a4f', secondary: '#52b788', accent: '#f4a261', bg: '#f1faf4', text: '#081c15' },
    { label: 'Midnight Dark',  primary: '#6c63ff', secondary: '#00d2ff', accent: '#f7c59f', bg: '#0a0a1a', text: '#e8e8f0' },
    { label: 'Rose Gold',      primary: '#c9748e', secondary: '#e8b4b8', accent: '#f5cac3', bg: '#fff0f0', text: '#2d1b1e' },
    { label: 'Slate Corporate',primary: '#2c3e50', secondary: '#3498db', accent: '#e74c3c', bg: '#f8f9fa', text: '#1a252f' },
    { label: 'Saffron Indian', primary: '#e97c1b', secondary: '#7c3d11', accent: '#f5d76e', bg: '#fff9f0', text: '#2e1503' },
    { label: 'Purple Luxe',    primary: '#7b2d8b', secondary: '#e040fb', accent: '#ffd740', bg: '#f9f0ff', text: '#1a0028' },
    { label: 'Neon Cyber',     primary: '#00ff87', secondary: '#60efff', accent: '#ff6b6b', bg: '#0d0d0d', text: '#f0f0f0' },
    { label: 'Autumn Harvest', primary: '#a0522d', secondary: '#cd853f', accent: '#daa520', bg: '#fdf0e0', text: '#1c0a00' },
    { label: 'Arctic Minimal', primary: '#2e86ab', secondary: '#a23b72', accent: '#f18f01', bg: '#ffffff', text: '#1a1a2e' },
    { label: 'Warm Espresso',  primary: '#6f4e37', secondary: '#c19a6b', accent: '#e2b97e', bg: '#faf3e0', text: '#1c0a00' },
  ];

  // ── Section overrides ─────────────────────────────────────────────────────
  sectionOverrides: SectionOverride[] = [];
  expandedSection: string | null = null;

  // ── Addable blocks ─────────────────────────────────────────────────────────
  readonly addableBlocks: AddBlockOption[] = [
        {
          type: 'subscribe',
          label: 'Subscribe',
          icon: 'subscriptions',
          html: '' // Will be set dynamically when added
        },
    {
      type: 'contact-form',
      label: 'Contact Form',
      icon: 'contact_mail',
      html: '' // Will be set dynamically when added
    },
    {
      type: 'pricing-table',
      label: 'Pricing Table',
      icon: 'attach_money',
      html: `<section id="pricing-block" style="padding:3rem 2rem;background:var(--block-bg,#fff);text-align:center">
  <h2 style="margin-bottom:2rem">Our Packages</h2>
  <div style="display:flex;justify-content:center;gap:1.5rem;flex-wrap:wrap">
    <div style="border:2px solid #e0e0e0;border-radius:12px;padding:2rem 1.5rem;min-width:220px;max-width:260px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      <h3 style="margin-bottom:0.5rem">Starter</h3>
      <div style="font-size:2.2rem;font-weight:800;margin:1rem 0">$9<span style="font-size:1rem;font-weight:400">/mo</span></div>
      <ul style="list-style:none;padding:0;margin:0 0 1.5rem;text-align:left">
        <li style="padding:0.4rem 0;border-bottom:1px solid #f0f0f0">✓ Feature One</li>
        <li style="padding:0.4rem 0;border-bottom:1px solid #f0f0f0">✓ Feature Two</li>
        <li style="padding:0.4rem 0">✓ Email Support</li>
      </ul>
      <button style="width:100%;padding:0.75rem;background:#f0f0f0;border:none;border-radius:6px;font-weight:700;cursor:pointer">Get Started</button>
    </div>
    <div style="border:2px solid var(--color-terracotta,#c1440e);border-radius:12px;padding:2rem 1.5rem;min-width:220px;max-width:260px;box-shadow:0 4px 20px rgba(193,68,14,0.2)">
      <div style="background:var(--color-terracotta,#c1440e);color:#fff;border-radius:4px;padding:0.2rem 0.8rem;font-size:0.8rem;font-weight:700;display:inline-block;margin-bottom:0.5rem">POPULAR</div>
      <h3 style="margin-bottom:0.5rem">Pro</h3>
      <div style="font-size:2.2rem;font-weight:800;margin:1rem 0">$29<span style="font-size:1rem;font-weight:400">/mo</span></div>
      <ul style="list-style:none;padding:0;margin:0 0 1.5rem;text-align:left">
        <li style="padding:0.4rem 0;border-bottom:1px solid #f0f0f0">✓ Everything in Starter</li>
        <li style="padding:0.4rem 0;border-bottom:1px solid #f0f0f0">✓ Priority Support</li>
        <li style="padding:0.4rem 0">✓ Analytics Dashboard</li>
      </ul>
      <button style="width:100%;padding:0.75rem;background:var(--color-terracotta,#c1440e);color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer">Get Started</button>
    </div>
    <div style="border:2px solid #e0e0e0;border-radius:12px;padding:2rem 1.5rem;min-width:220px;max-width:260px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      <h3 style="margin-bottom:0.5rem">Enterprise</h3>
      <div style="font-size:2.2rem;font-weight:800;margin:1rem 0">$99<span style="font-size:1rem;font-weight:400">/mo</span></div>
      <ul style="list-style:none;padding:0;margin:0 0 1.5rem;text-align:left">
        <li style="padding:0.4rem 0;border-bottom:1px solid #f0f0f0">✓ Everything in Pro</li>
        <li style="padding:0.4rem 0;border-bottom:1px solid #f0f0f0">✓ Dedicated Manager</li>
        <li style="padding:0.4rem 0">✓ Custom Integrations</li>
      </ul>
      <button style="width:100%;padding:0.75rem;background:#f0f0f0;border:none;border-radius:6px;font-weight:700;cursor:pointer">Contact Us</button>
    </div>
  </div>
</section>`
    },
    {
      type: 'faq',
      label: 'FAQ Section',
      icon: 'quiz',
      html: `<section id="faq-block" style="padding:3rem 2rem;max-width:760px;margin:0 auto">
  <h2 style="text-align:center;margin-bottom:2rem">Frequently Asked Questions</h2>
  <details style="border-bottom:1px solid #e0e0e0;padding:1rem 0;cursor:pointer"><summary style="font-weight:700;font-size:1.05rem">What are your business hours?</summary><p style="margin-top:0.7rem;color:#555">We are open Monday to Saturday, 9 AM to 8 PM. Sunday hours may vary by location.</p></details>
  <details style="border-bottom:1px solid #e0e0e0;padding:1rem 0;cursor:pointer"><summary style="font-weight:700;font-size:1.05rem">Do you offer delivery or takeout?</summary><p style="margin-top:0.7rem;color:#555">Yes! We offer both delivery via our app and takeout. Contact us or visit our order page for details.</p></details>
  <details style="border-bottom:1px solid #e0e0e0;padding:1rem 0;cursor:pointer"><summary style="font-weight:700;font-size:1.05rem">How can I make a reservation?</summary><p style="margin-top:0.7rem;color:#555">Reservations can be made by calling us, emailing, or using the online booking link on this page.</p></details>
  <details style="padding:1rem 0;cursor:pointer"><summary style="font-weight:700;font-size:1.05rem">Do you cater private events?</summary><p style="margin-top:0.7rem;color:#555">Absolutely! We offer full catering packages for corporate events, weddings, and private parties.</p></details>
</section>`
    },
    {
      type: 'team',
      label: 'Team Section',
      icon: 'group',
      html: `<section id="team-block" style="padding:3rem 2rem;text-align:center;background:var(--block-bg,#fafafa)">
  <h2 style="margin-bottom:2rem">Meet Our Team</h2>
  <div style="display:flex;justify-content:center;gap:2rem;flex-wrap:wrap">
    <div style="max-width:180px"><div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#c1440e,#6b7c5c);margin:0 auto 1rem"></div><h4 style="margin-bottom:0.3rem">Alex Johnson</h4><p style="color:#888;font-size:0.9rem">Founder & CEO</p></div>
    <div style="max-width:180px"><div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#6b7c5c,#1c0a00);margin:0 auto 1rem"></div><h4 style="margin-bottom:0.3rem">Maria Silva</h4><p style="color:#888;font-size:0.9rem">Head Chef</p></div>
    <div style="max-width:180px"><div style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#e07b39,#c1440e);margin:0 auto 1rem"></div><h4 style="margin-bottom:0.3rem">Raj Patel</h4><p style="color:#888;font-size:0.9rem">Marketing Lead</p></div>
  </div>
</section>`
    },
    {
      type: 'cta-banner',
      label: 'CTA Banner',
      icon: 'campaign',
      html: `<section id="cta-banner-block" style="padding:3.5rem 2rem;background:linear-gradient(120deg,#c1440e,#6b7c5c);text-align:center;color:#fff">
  <h2 style="color:#fff;font-size:2rem;margin-bottom:0.8rem">Ready to Experience Something Amazing?</h2>
  <p style="font-size:1.1rem;margin-bottom:1.8rem;opacity:0.92">Join thousands of happy customers today. Limited time offer available!</p>
  <a href="#contact" style="display:inline-block;padding:1rem 2.5rem;background:#fff;color:#c1440e;border-radius:50px;font-weight:800;font-size:1.1rem;text-decoration:none;box-shadow:0 4px 20px rgba(0,0,0,0.2)">Get Started Today</a>
</section>`
    },
    {
      type: 'stats',
      label: 'Stats / Numbers',
      icon: 'bar_chart',
      html: `<section id="stats-block" style="padding:3rem 2rem;background:var(--color-espresso,#1c0a00);color:#fff;text-align:center">
  <div style="display:flex;justify-content:center;gap:3rem;flex-wrap:wrap;max-width:900px;margin:0 auto">
    <div><div style="font-size:3rem;font-weight:900;color:#e07b39">500+</div><div style="font-size:1rem;opacity:0.8;margin-top:0.4rem">Happy Clients</div></div>
    <div><div style="font-size:3rem;font-weight:900;color:#7fffd4">12</div><div style="font-size:1rem;opacity:0.8;margin-top:0.4rem">Years Experience</div></div>
    <div><div style="font-size:3rem;font-weight:900;color:#e07b39">98%</div><div style="font-size:1rem;opacity:0.8;margin-top:0.4rem">Satisfaction Rate</div></div>
    <div><div style="font-size:3rem;font-weight:900;color:#7fffd4">24/7</div><div style="font-size:1rem;opacity:0.8;margin-top:0.4rem">Support</div></div>
  </div>
</section>`
    },
    {
      type: 'newsletter',
      label: 'Newsletter Signup',
      icon: 'email',
      html: `<section id="newsletter-block" style="padding:3rem 2rem;background:#f9f4ee;text-align:center">
  <h2 style="margin-bottom:0.8rem">Stay in the Loop</h2>
  <p style="color:#666;margin-bottom:1.5rem">Subscribe for exclusive offers, news, and updates.</p>
  <form style="display:flex;justify-content:center;gap:0.7rem;flex-wrap:wrap;max-width:500px;margin:0 auto" onsubmit="return false">
    <input type="email" placeholder="Enter your email address" style="flex:1;min-width:220px;padding:0.8rem 1.1rem;border:1px solid #ddd;border-radius:6px;font-size:1rem"/>
    <button type="submit" style="padding:0.8rem 1.8rem;background:#c1440e;color:#fff;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-size:1rem">Subscribe</button>
  </form>
</section>`
    },
    {
      type: 'map',
      label: 'Map / Location',
      icon: 'location_on',
      html: '' // Will be set dynamically when added
    },
    {
      type: 'chatbot',
      label: '24/7 AI Chatbot',
      icon: 'smart_toy',
      html: ''  // handled by Angular widget
    },
  ];

  addedBlocks: { type: string; injectedHtml?: string }[] = [];

  // ── Code editor ───────────────────────────────────────────────────────────
  editableHtml = '';
  editableCss = '';
  editableJs = '';
  codeEditMode: 'html' | 'css' | 'js' = 'html';
  codeEdited = false;

  // ── Publish ───────────────────────────────────────────────────────────────
  publishSubdomain = '';
  published = false;
  publishLoading = false;
  publishedUrl = '';
  existingWebsiteId: number | null = null;
  websiteVersion: number | null = null;
  currentSavedSubdomain = '';
  loadingExistingWebsite = false;

  subdomainStatus: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error' = 'idle';
  subdomainStatusMessage = '';
  private subdomainInput$ = new Subject<string>();
  private subdomainCheckSub?: Subscription;

  readonly availabilityDebounceMs = 400;
  readonly publishDomainOptions = this.resolvePublishDomainOptions();
  selectedPublishDomain = this.resolvePublishDomainOptions()[0] || (environment.production ? 'ezit.ai' : 'localhost:4200');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entityService: EntityService,
    private sanitizer: DomSanitizer
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    this.setupSubdomainAvailabilityListener();

    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state?.['entity']) {
      this.entityDetails = nav.extras.state['entity'];
      this.loadExistingWebsiteIfAny();
    } else {
      const entityId = this.route.snapshot.paramMap.get('id');
      if (entityId) {
        this.loading = true;
        this.entityService.getMyEntities().subscribe({
          next: (entities) => {
            const found = entities.find(e => String(e.id) === String(entityId));
            this.entityDetails = found ?? { id: entityId, displayName: 'Entity', icon: 'language' };
            this.loading = false;
            this.loadExistingWebsiteIfAny();
          },
          error: () => {
            this.entityDetails = { id: entityId, displayName: 'Entity', icon: 'language' };
            this.loading = false;
            this.error = 'Could not load entity details.';
            this.loadExistingWebsiteIfAny();
          }
        });
      } else {
        this.entityDetails = { displayName: 'Entity', icon: 'language' };
      }
    }
  }

  ngOnDestroy(): void {
    this.subdomainCheckSub?.unsubscribe();
  }

  private loadExistingWebsiteIfAny() {
    const entityId = Number(this.entityDetails?.id);
    const displayName = String(this.entityDetails?.displayName || '').trim();

    if (!Number.isFinite(entityId) || entityId <= 0 || !displayName) return;

    this.loadingExistingWebsite = true;
    this.entityService.renderBusinessWebsiteByEntity(entityId, displayName)
      .pipe(finalize(() => (this.loadingExistingWebsite = false)))
      .subscribe({
        next: (resp) => {
          this.hydrateStudioFromSavedWebsite(resp);
          this.error = '';
        },
        error: (err: HttpErrorResponse) => {
          if (err.status !== 404) {
            this.error = 'Could not load your saved website. You can still generate a new one.';
          }
        }
      });
  }

  private hydrateStudioFromSavedWebsite(resp: SaveBusinessWebsiteResponse) {
    const metadata = this.parseSavedMetadata(resp.metadata);
    const generatedMetadata = metadata?.generated || {};

    const websiteResponse: BusinessWebsiteResponse = {
      entityId: resp.entityId,
      displayName: resp.displayName,
      html: resp.html || '',
      css: resp.css || '',
      js: resp.js || '',
      metadata: {
        pageTitle: generatedMetadata.pageTitle || resp.displayName,
        entityType: generatedMetadata.entityType || (resp.entityDetails?.type || 'BUSINESS'),
        colorPalette: generatedMetadata.colorPalette || [],
        fonts: generatedMetadata.fonts || [],
        sections: generatedMetadata.sections || [],
        designStyle: generatedMetadata.designStyle || 'Custom',
        targetAudience: generatedMetadata.targetAudience || 'General',
        accentFeatures: generatedMetadata.accentFeatures || []
      },
      entityDetails: resp.entityDetails
    };

    this.websiteResponse = websiteResponse;
    this.editableHtml = websiteResponse.html;
    this.editableCss = websiteResponse.css;
    this.editableJs = websiteResponse.js;

    if (metadata?.studio?.theme) {
      this.theme = { ...this.theme, ...metadata.studio.theme };
    } else {
      this._seedThemeFromResponse(websiteResponse);
    }

    if (Array.isArray(metadata?.studio?.sectionOverrides) && metadata.studio.sectionOverrides.length) {
      this.sectionOverrides = metadata.studio.sectionOverrides;
    } else {
      this._buildSectionOverrides(websiteResponse);
    }

    // Sync addedBlocks with sections present in HTML
    this.addedBlocks = [];
    const html = this.editableHtml;
    const blockTypes = [
      { type: 'contact-form', id: 'contact-form-block' },
      { type: 'pricing-table', id: 'pricing-block' },
      { type: 'faq', id: 'faq-block' },
      { type: 'team', id: 'team-block' },
      { type: 'cta-banner', id: 'cta-banner-block' },
      { type: 'stats', id: 'stats-block' },
      { type: 'newsletter', id: 'newsletter-block' },
      { type: 'map', id: 'map-block' },
      { type: 'chatbot', id: 'chatbot-block' }
    ];
    for (const block of blockTypes) {
      if (html.includes(`id="${block.id}"`) || html.includes(`id='${block.id}'`)) {
        this.addedBlocks.push({ type: block.type });
      }
    }

    this.previewMode = metadata?.studio?.previewMode || 'desktop';

    this.publishSubdomain = this.normalizeSubdomain(resp.subdomain || resp.displayName || 'my-site');
    this.currentSavedSubdomain = this.publishSubdomain;
    this.existingWebsiteId = resp.websiteId;
    this.websiteVersion = resp.version;
    this.published = !!resp.published;
    this.publishedUrl = this.buildWebsiteUrl(this.publishSubdomain);
    this.activeTab = 'publish';
    this.subdomainStatus = 'idle';
    this.subdomainStatusMessage = '';
    this.subdomainInput$.next(this.publishSubdomain);
  }

  private parseSavedMetadata(metadataRaw: string | null | undefined): any {
    if (!metadataRaw) return null;
    try {
      return JSON.parse(metadataRaw);
    } catch {
      return null;
    }
  }

  // ── Generate ──────────────────────────────────────────────────────────────
  generateWebsite() {
    if (!this.entityDetails || !this.prompt) return;
    this.generating = true;
    this.error = '';
    this.published = false;
    this.existingWebsiteId = null;
    this.websiteVersion = null;
    this.currentSavedSubdomain = '';
    this.subdomainStatus = 'idle';
    this.subdomainStatusMessage = '';
    this.websiteResponse = null;
    this.sectionOverrides = [];
    this.addedBlocks = [];
    this.codeEdited = false;
    const formData = new FormData();
    formData.append('entityId', this.entityDetails.id);
    formData.append('displayName', this.entityDetails.displayName);
    formData.append('prompt', this.prompt);
    if (this.selectedFile) formData.append('file', this.selectedFile);

    this.entityService.generateBusinessWebsite(formData).subscribe({
      next: (resp) => {
        const normalized = this.normalizeWebsiteApiResponse(resp);
        this.websiteResponse = normalized;
        this._seedThemeFromResponse(normalized);
        this._buildSectionOverrides(normalized);
        this.editableHtml = normalized.html || '';
        this.editableCss = normalized.css || '';
        this.editableJs = normalized.js || '';
        this.publishSubdomain = this.normalizeSubdomain(normalized.displayName || 'my-site');
        this.subdomainInput$.next(this.publishSubdomain);
        this.regeneratePrompt = this.prompt;
        this.generating = false;
        this.activeTab = 'theme';
      },
      error: () => {
        this.error = 'Failed to generate website. Please try again.';
        this.generating = false;
      }
    });
  }

  onGenerateOrRegenerate() {
    if (this.websiteResponse) {
      this.regenerateWebsite();
      return;
    }
    this.generateWebsite();
  }

  regenerateWebsite() {
    if (!this.entityDetails || !this.websiteResponse || !this.prompt?.trim()) return;

    const entityId = Number(this.entityDetails?.id ?? this.websiteResponse.entityId);
    const displayName = String(this.entityDetails?.displayName || this.websiteResponse.displayName || '').trim();
    if (!Number.isFinite(entityId) || entityId <= 0 || !displayName) {
      this.error = 'Missing entity context. Please refresh and try again.';
      return;
    }

    if (this.codeEdited) this.applyCodeEdit();
    const currentWebsite = this.websiteResponse;

    this.regenerating = true;
    this.error = '';

    const requestPayload = {
      entityId,
      displayName,
      prompt: this.prompt,
      html: currentWebsite.html,
      css: currentWebsite.css,
      js: currentWebsite.js,
      metadata: JSON.stringify({
        generated: currentWebsite.metadata,
        studio: {
          theme: this.theme,
          sectionOverrides: this.sectionOverrides,
          addedBlocks: this.addedBlocks,
          previewMode: this.previewMode,
        }
      }),
      subdomain: this.publishSubdomain || undefined,
      published: this.published,
    };

    const formData = new FormData();
    formData.append('request', new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }));
    if (this.selectedFile) formData.append('file', this.selectedFile);

    this.entityService.regenerateBusinessWebsite(formData).subscribe({
      next: (resp) => {
        const normalized = this.normalizeWebsiteApiResponse(resp);
        this.previousRegenerateBackup = { ...currentWebsite };

        this.websiteResponse = normalized;
        this.editableHtml = normalized.html || '';
        this.editableCss = normalized.css || '';
        this.editableJs = normalized.js || '';

        this._seedThemeFromResponse(normalized);
        this._buildSectionOverrides(normalized);

        this.regeneratePrompt = this.prompt;
        this.codeEdited = false;
        this.activeTab = 'theme';
        this.regenerating = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = err?.error?.message || 'Failed to regenerate website. Please try again.';
        this.regenerating = false;
      }
    });
  }

  restoreBeforeRegenerate() {
    if (!this.previousRegenerateBackup) return;
    const previous = this.previousRegenerateBackup;
    this.websiteResponse = previous;
    this.editableHtml = previous.html;
    this.editableCss = previous.css;
    this.editableJs = previous.js;
    this._seedThemeFromResponse(previous);
    this._buildSectionOverrides(previous);
    this.codeEdited = false;
    this.previousRegenerateBackup = null;
  }

  private normalizeWebsiteApiResponse(resp: any): BusinessWebsiteResponse {
    const unescape = (s: string) => (s || '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '');

    const parsedMetadata = typeof resp?.metadata === 'string'
      ? this.parseSavedMetadata(resp.metadata)
      : (resp?.metadata || {});

    const metadata = {
      pageTitle: parsedMetadata?.pageTitle || resp?.displayName || 'Website',
      entityType: parsedMetadata?.entityType || resp?.entityDetails?.type || 'BUSINESS',
      colorPalette: Array.isArray(parsedMetadata?.colorPalette) ? parsedMetadata.colorPalette : [],
      fonts: Array.isArray(parsedMetadata?.fonts) ? parsedMetadata.fonts : [],
      sections: Array.isArray(parsedMetadata?.sections) ? parsedMetadata.sections : [],
      designStyle: parsedMetadata?.designStyle || 'Custom',
      targetAudience: parsedMetadata?.targetAudience || 'General',
      accentFeatures: Array.isArray(parsedMetadata?.accentFeatures) ? parsedMetadata.accentFeatures : [],
    };

    return {
      entityId: Number(resp?.entityId || this.entityDetails?.id || 0),
      displayName: String(resp?.displayName || this.entityDetails?.displayName || 'Entity'),
      html: unescape(resp?.html || ''),
      css: unescape(resp?.css || ''),
      js: unescape(resp?.js || ''),
      metadata,
      entityDetails: resp?.entityDetails || {
        id: Number(resp?.entityId || this.entityDetails?.id || 0),
        type: 'BUSINESS',
        displayName: String(resp?.displayName || this.entityDetails?.displayName || 'Entity'),
        createdByUserId: 0,
        createdAt: '',
        updatedAt: ''
      }
    };
  }

  private _seedThemeFromResponse(resp: BusinessWebsiteResponse) {
    const palette = resp.metadata?.colorPalette ?? [];
    if (palette[0]) this.theme.textColor = palette[0];
    if (palette[1]) this.theme.primaryColor = palette[1];
    if (palette[2]) this.theme.bgColor = palette[2];
    if (palette[3]) this.theme.secondaryColor = palette[3];

    const fonts = resp.metadata?.fonts ?? [];
    if (fonts[0]) {
      const pair = this.fontPairs.find(p => p.heading.includes(fonts[0]));
      if (pair) { this.theme.headingFont = pair.heading; this.theme.bodyFont = pair.body; }
    }
  }

  private _buildSectionOverrides(resp: BusinessWebsiteResponse) {
    const sections = resp.metadata?.sections ?? [];
    this.sectionOverrides = sections.map((label, i) => ({
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label,
      visible: true,
      bgColor: '',
      textColor: '',
      fontSize: '1rem',
      fontFamily: '',
    }));
  }

  // ── Apply color preset ────────────────────────────────────────────────────
  applyColorPreset(preset: typeof this.colorPresets[0]) {
    this.theme.primaryColor = preset.primary;
    this.theme.secondaryColor = preset.secondary;
    this.theme.accentColor = preset.accent;
    this.theme.bgColor = preset.bg;
    this.theme.textColor = preset.text;
  }

  // ── Apply font pair ───────────────────────────────────────────────────────
  applyFontPair(pair: typeof this.fontPairs[0]) {
    this.theme.headingFont = pair.heading;
    this.theme.bodyFont = pair.body;
  }

  // ── Section helpers ────────────────────────────────────────────────────────
  toggleSection(s: SectionOverride) { s.visible = !s.visible; }
  toggleExpandSection(id: string) { this.expandedSection = this.expandedSection === id ? null : id; }

  // ── Add block ─────────────────────────────────────────────────────────────
  addBlock(block: AddBlockOption) {
    // Prevent adding if already present in HTML or addedBlocks
    let blockId = '';
    let injectedHtml = block.html;
    switch (block.type) {
      case 'contact-form':
        injectedHtml = getContactFormBlockHtml(
          this.entityDetails?.id ? String(this.entityDetails.id) : '',
          this.entityDetails?.displayName || ''
        );
        blockId = 'contact-form-block';
        break;
      case 'subscribe':
        injectedHtml = getSubscribeBlockHtml(
          this.entityDetails?.id ? String(this.entityDetails.id) : '',
          this.entityDetails?.displayName || ''
        );
        blockId = 'subscribe-block';
        break;
      case 'map':
        injectedHtml = getMapBlockHtml(
          this.entityDetails?.id ? String(this.entityDetails.id) : '',
          this.entityDetails?.displayName || ''
        );
        blockId = 'map-block';
        break;
      case 'pricing-table':
        blockId = 'pricing-block';
        break;
      case 'faq':
        blockId = 'faq-block';
        break;
      case 'team':
        blockId = 'team-block';
        break;
      case 'cta-banner':
        blockId = 'cta-banner-block';
        break;
      case 'stats':
        blockId = 'stats-block';
        break;
      case 'newsletter':
        blockId = 'newsletter-block';
        break;
      // case 'map':
      //   blockId = 'map-block';
      //   break;
      case 'chatbot':
        blockId = 'chatbot-block';
        break;
      default:
        blockId = '';
    }
    if (this.addedBlocks.find(b => b.type === block.type)) return;
    this.addedBlocks.push({ type: block.type, injectedHtml });
    // Do NOT append block HTML to editableHtml
    // Only inject blocks in getPreviewSrcDoc
  }

  removeBlock(type: string) {
    this.addedBlocks = this.addedBlocks.filter(b => b.type !== type);
    // Do NOT remove block HTML from editableHtml (since it's not added there)
  }
  isBlockAdded(type: string) { return this.addedBlocks.some(b => b.type === type); }

  // ── Code editor helpers ───────────────────────────────────────────────────
  onCodeChange() { this.codeEdited = true; }
  applyCodeEdit() {
    if (!this.websiteResponse) return;
    this.websiteResponse = { ...this.websiteResponse, html: this.editableHtml, css: this.editableCss, js: this.editableJs };
    this.codeEdited = false;
  }
  discardCodeEdit() {
    if (!this.websiteResponse) return;
    this.editableHtml = this.websiteResponse.html;
    this.editableCss = this.websiteResponse.css;
    this.editableJs = this.websiteResponse.js;
    this.codeEdited = false;
  }

  // ── File ──────────────────────────────────────────────────────────────────
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) this.selectedFile = file;
  }

  get publishSubdomainSuffix(): string {
    return `.${this.selectedPublishDomain}`;
  }

  get publishAddressPreview(): string {
    const safeSubdomain = this.normalizeSubdomain(this.publishSubdomain || 'your-brand');
    return `${safeSubdomain}.${this.selectedPublishDomain}`;
  }

  onPublishDomainChange(domain: string) {
    if (!domain) return;
    this.selectedPublishDomain = domain;
    if (this.publishSubdomain) {
      this.publishedUrl = this.buildWebsiteUrl(this.publishSubdomain);
    }
  }

  get publishActionLabel(): string {
    if (this.publishLoading) return this.hasExistingWebsite ? 'Updating...' : 'Publishing...';
    return this.hasExistingWebsite ? 'Update Website' : 'Publish Website';
  }

  get onrenderAliasUrl(): string {
    if (!environment.production || !this.publishSubdomain) return '';
    const onrenderDomain = getHostedRootDomains().find((d) => d.endsWith('.onrender.com'));
    if (!onrenderDomain) return '';
    return `https://${onrenderDomain}/h/${this.publishSubdomain}`;
  }

  get hasExistingWebsite(): boolean {
    return this.existingWebsiteId !== null;
  }

  get hasRegenerateBackup(): boolean {
    return !!this.previousRegenerateBackup;
  }

  get canPublish(): boolean {
    if (this.publishLoading || !this.publishSubdomain) return false;
    if (this.subdomainStatus === 'checking' || this.subdomainStatus === 'invalid') return false;
    if (this.hasExistingWebsite) return this.subdomainStatus !== 'taken';
    return this.subdomainStatus === 'available';
  }

  onPublishSubdomainChange(value: string) {
    this.publishSubdomain = this.normalizeSubdomain(value);
    this.subdomainInput$.next(this.publishSubdomain);
  }

  private setupSubdomainAvailabilityListener() {
    this.subdomainCheckSub = this.subdomainInput$
      .pipe(
        debounceTime(this.availabilityDebounceMs),
        distinctUntilChanged(),
        switchMap((subdomain) => this.checkSubdomainAvailability$(subdomain))
      )
      .subscribe((status) => {
        this.subdomainStatus = status.kind;
        this.subdomainStatusMessage = status.message;
      });
  }

  private checkSubdomainAvailability$(subdomain: string) {
    if (!subdomain) {
      return of({ kind: 'idle' as const, message: '' });
    }

    this.subdomainStatus = 'checking';
    this.subdomainStatusMessage = 'Checking availability...';

    return this.entityService.checkSubdomainAvailability(subdomain).pipe(
      switchMap((res: SubdomainAvailabilityResponse) => {
        this.publishSubdomain = this.normalizeSubdomain(res.normalizedSubdomain || subdomain);

        if (!res.valid) {
          return of({ kind: 'invalid' as const, message: res.message || 'Subdomain is invalid.' });
        }

        if (!res.available) {
          const isSameAsCurrent = this.hasExistingWebsite && this.publishSubdomain === this.currentSavedSubdomain;
          if (isSameAsCurrent) {
            return of({ kind: 'available' as const, message: 'Current subdomain kept for this website.' });
          }
          return of({ kind: 'taken' as const, message: res.message || 'Subdomain is already taken.' });
        }

        return of({ kind: 'available' as const, message: res.message || 'Subdomain is available.' });
      }),
      catchError(() => of({ kind: 'error' as const, message: 'Could not verify subdomain right now.' }))
    );
  }

  // ── Publish (API) ─────────────────────────────────────────────────────────
  publishWebsite() {
    if (!this.websiteResponse) {
      this.error = 'Generate a website before publishing.';
      return;
    }

    const entityId = Number(this.entityDetails?.id ?? this.websiteResponse.entityId);
    const displayName = String(this.entityDetails?.displayName || this.websiteResponse.displayName || '').trim();
    const subdomain = this.normalizeSubdomain(this.publishSubdomain);

    if (!Number.isFinite(entityId) || entityId <= 0) {
      this.error = 'Missing valid entity id. Please refresh entity details and try again.';
      return;
    }
    if (!displayName) {
      this.error = 'Display name is required before publishing.';
      return;
    }
    if (!subdomain) {
      this.error = 'Please choose a valid subdomain.';
      return;
    }

    this.publishSubdomain = subdomain;
    if (this.codeEdited) this.applyCodeEdit();

    this.publishLoading = true;
    this.error = '';
    this.subdomainStatus = 'checking';
    this.subdomainStatusMessage = 'Checking availability...';

    this.entityService.checkSubdomainAvailability(subdomain).subscribe({
      next: (availability) => {
        const normalized = this.normalizeSubdomain(availability.normalizedSubdomain || subdomain);
        this.publishSubdomain = normalized;

        if (!availability.valid) {
          this.subdomainStatus = 'invalid';
          this.subdomainStatusMessage = availability.message || 'Subdomain is invalid.';
          this.publishLoading = false;
          return;
        }

        const isSameAsCurrent = this.hasExistingWebsite && normalized === this.currentSavedSubdomain;
        if (!availability.available && !isSameAsCurrent) {
          this.subdomainStatus = 'taken';
          this.subdomainStatusMessage = availability.message || 'Subdomain is already taken.';
          this.publishLoading = false;
          return;
        }

        this.subdomainStatus = 'available';
        this.subdomainStatusMessage = isSameAsCurrent
          ? 'Current subdomain kept for this website.'
          : (availability.message || 'Subdomain is available.');

        this.persistWebsite(entityId, displayName, normalized);
      },
      error: () => {
        this.subdomainStatus = 'error';
        this.subdomainStatusMessage = 'Could not verify subdomain right now.';
        this.publishLoading = false;
      }
    });
  }

  private persistWebsite(entityId: number, displayName: string, subdomain: string) {
    const currentWebsite = this.websiteResponse;
    if (!currentWebsite) {
      this.error = 'No website content available to publish.';
      this.publishLoading = false;
      return;
    }

    const metadata = {
      generated: currentWebsite.metadata,
      studio: {
        theme: this.theme,
        sectionOverrides: this.sectionOverrides,
        addedBlocks: this.addedBlocks,
        previewMode: this.previewMode,
      }
    };

    const payload = {
      entityId,
      displayName,
      html: this.getPreviewSrcDoc(),
      css: currentWebsite.css || '',
      js: currentWebsite.js || '',
      metadata: JSON.stringify(metadata),
      subdomain,
      published: true,
    };

    const saveOrUpdate$ = this.hasExistingWebsite
      ? this.entityService.updateBusinessWebsite(payload)
      : this.entityService.saveBusinessWebsite({ ...payload, prompt: this.prompt || undefined });

    saveOrUpdate$.subscribe({
      next: (resp) => {
        const savedSubdomain = this.normalizeSubdomain(resp.subdomain || subdomain);
        this.publishSubdomain = savedSubdomain;
        this.currentSavedSubdomain = savedSubdomain;
        this.existingWebsiteId = resp.websiteId;
        this.websiteVersion = resp.version;
        this.publishedUrl = this.buildWebsiteUrl(savedSubdomain);
        this.published = true;
        this.publishLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = this.getPublishErrorMessage(err);
        this.publishLoading = false;
      }
    });
  }

  copyPublishedUrl() {
    navigator.clipboard?.writeText(this.publishedUrl);
  }

  downloadHtml() {
    const content = this.getPreviewSrcDoc();
    const blob = new Blob([content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.publishSubdomain || 'website'}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Preview src doc ───────────────────────────────────────────────────────
  getSafePreviewSrcDoc(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.getPreviewSrcDoc());
  }

  getPreviewSrcDoc(): string {
    if (!this.websiteResponse) return '';

    // Use the code editor's HTML as the source for preview
    let html = this.editableHtml || '';
    let css  = this.editableCss  || '';
    let js   = this.editableJs   || '';

    // ── Inject section visibility & per-section overrides ────────────────
    let sectionCss = '';
    this.sectionOverrides.forEach(s => {
      if (!s.visible) {
        sectionCss += `#${s.id}, [id="${s.id}"] { display: none !important; }\n`;
      }
      if (s.bgColor)    sectionCss += `#${s.id} { background-color: ${s.bgColor} !important; }\n`;
      if (s.textColor)  sectionCss += `#${s.id}, #${s.id} * { color: ${s.textColor} !important; }\n`;
      if (s.fontFamily) sectionCss += `#${s.id}, #${s.id} * { font-family: ${s.fontFamily} !important; }\n`;
      if (s.fontSize && s.fontSize !== '1rem') sectionCss += `#${s.id} p, #${s.id} li { font-size: ${s.fontSize} !important; }\n`;
    });

    // Insert blocks just above <footer> ONLY if <footer> is the last major element in <body>. Otherwise, insert at end of <main> or <body>.
    if (this.addedBlocks && this.addedBlocks.length > 0) {
      const blocksHtml = this.addedBlocks.filter(b => b.type !== 'chatbot' && b.injectedHtml).map(b => b.injectedHtml ?? '').join('\n');
      if (blocksHtml) {
        // Check if <footer> is the last major element in <body>
        const footerMatch = html.match(/<footer[\s>][\s\S]*?<\/footer>/i);
        if (footerMatch && html.trim().endsWith(footerMatch[0])) {
          // Insert blocks just before <footer>
          html = html.replace(/(<footer[\s>])/i, blocksHtml + '$1');
        } else if (/<\/app-footer>/i.test(html) && html.trim().endsWith('</app-footer>')) {
          html = html.replace(/<\/app-footer>/i, blocksHtml + '</app-footer>');
        } else if (/<\/main>/i.test(html)) {
          html = html.replace(/<\/main>/i, blocksHtml + '</main>');
        } else if (/<\/body>/i.test(html)) {
          html = html.replace(/<\/body>/i, blocksHtml + '</body>');
        }
        // If no suitable place is found, do NOT append blocks
      }
    }

    // ── Inject chatbot widget script snippet ──────────────────────────────
    if (this.addedBlocks.find(b => b.type === 'chatbot')) {
      const chatSnippet = `
<div id="ai-chatbot-bubble" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999">
  <button onclick="document.getElementById('ai-chatbot-panel').style.display=document.getElementById('ai-chatbot-panel').style.display==='none'?'flex':'none'"
    style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#c1440e,#6b7c5c);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-size:1.5rem;color:#fff;display:flex;align-items:center;justify-content:center">💬</button>
  <div id="ai-chatbot-panel" style="display:none;position:absolute;bottom:68px;right:0;width:320px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);flex-direction:column;overflow:hidden">
    <div style="background:linear-gradient(135deg,#c1440e,#6b7c5c);padding:1rem 1.2rem;color:#fff;font-weight:700;font-size:1.05rem">AI Assistant</div>
    <div style="padding:1rem;flex:1;min-height:180px;font-size:0.95rem;color:#555">Hello! How can I help you today?</div>
    <div style="display:flex;border-top:1px solid #eee">
      <input type="text" placeholder="Type a message..." style="flex:1;padding:0.7rem 1rem;border:none;font-size:0.95rem;outline:none"/>
      <button style="padding:0.7rem 1rem;background:#c1440e;color:#fff;border:none;cursor:pointer;font-weight:700">Send</button>
    </div>
  </div>
</div>`;
      html = html.replace(/<\/body>/i, chatSnippet + '</body>');
    }

    // ── Global theme overrides CSS ────────────────────────────────────────
    const br = this.theme.borderRadius;
    const navBehavior = this.theme.navStyle === 'sticky' ? 'sticky' : this.theme.navStyle === 'fixed' ? 'fixed' : 'relative';
    const sectionPad = this.theme.sectionSpacing === 'compact' ? '2rem' : this.theme.sectionSpacing === 'spacious' ? '6rem' : '4rem';
    const animDuration = this.theme.animationSpeed === 'none' ? '0s' : this.theme.animationSpeed === 'slow' ? '1.2s' : this.theme.animationSpeed === 'fast' ? '0.25s' : '0.5s';
    const shadow = this.theme.shadowLevel === 'none' ? 'none' : this.theme.shadowLevel === 'light' ? '0 2px 8px rgba(0,0,0,0.1)' : this.theme.shadowLevel === 'strong' ? '0 8px 32px rgba(0,0,0,0.28)' : '0 4px 16px rgba(0,0,0,0.18)';
    const btnRadius = this.theme.buttonStyle === 'pill' ? '50px' : this.theme.buttonStyle === 'square' ? '4px' : `${br}px`;

    const googleFontsUrl = this._buildGoogleFontsUrl();
    const themeOverride = `
:root {
  --color-primary: ${this.theme.primaryColor};
  --color-secondary: ${this.theme.secondaryColor};
  --color-accent: ${this.theme.accentColor};
  --color-bg: ${this.theme.bgColor};
  --color-text: ${this.theme.textColor};
  --color-terracotta: ${this.theme.primaryColor};
  --color-sage: ${this.theme.secondaryColor};
  --color-cream: ${this.theme.bgColor};
  --color-espresso: ${this.theme.textColor};
  --font-heading: ${this.theme.headingFont};
  --font-body: ${this.theme.bodyFont};
  --border-radius: ${br}px;
  --btn-radius: ${btnRadius};
  --shadow: ${shadow};
  --section-padding: ${sectionPad} 2rem;
  --anim-duration: ${animDuration};
}
html, body { background-color: ${this.theme.bgColor}; color: ${this.theme.textColor}; font-family: ${this.theme.bodyFont}; }
h1, h2, h3, h4, h5 { font-family: ${this.theme.headingFont}; color: ${this.theme.textColor}; }
a { color: ${this.theme.primaryColor}; }
button, .btn { border-radius: ${btnRadius}; box-shadow: ${shadow}; }
.btn.primary, button[type="submit"] { background-color: ${this.theme.primaryColor}; color: #fff; }
header { position: ${navBehavior}; top: 0; z-index: 1000; }
section { padding: ${sectionPad} 2rem; }
.reveal, .fade-up { transition-duration: ${animDuration}; }
${sectionCss}
`;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove local styles.css ref
      doc.querySelectorAll('link[rel="stylesheet"][href="styles.css"]').forEach(el => el.remove());
      // Remove local main.js ref
      doc.querySelectorAll('script[src="main.js"]').forEach(el => el.remove());

      // Add Google Fonts
      if (googleFontsUrl) {
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = googleFontsUrl;
        doc.head.prepend(link);
      }

      // Add base CSS + overrides at end of head (highest specificity)
      const origStyle = doc.createElement('style');
      origStyle.textContent = css;
      doc.head.appendChild(origStyle);
      const themeStyle = doc.createElement('style');
      themeStyle.textContent = themeOverride;
      doc.head.appendChild(themeStyle);

      // JS
      if (js) {
        const script = doc.createElement('script');
        script.textContent = js;
        doc.body.appendChild(script);
      }

      return doc.documentElement.outerHTML;
    } catch {
      return `<html><head><style>${css}\n${themeOverride}</style></head><body>${html}</body></html>`;
    }
  }

  private _buildGoogleFontsUrl(): string {
    const families = new Set<string>();
    const extract = (fontStack: string) => {
      const m = fontStack.match(/'([^']+)'/);
      if (m) families.add(m[1].replace(/ /g, '+'));
    };
    extract(this.theme.headingFont);
    extract(this.theme.bodyFont);
    if (!families.size) return '';
    const familyParams = Array.from(families).map(f => `family=${f}:wght@300;400;600;700;800`).join('&');
    return `https://fonts.googleapis.com/css2?${familyParams}&display=swap`;
  }

  private normalizeSubdomain(value: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 63);
  }

  private buildWebsiteUrl(subdomain: string): string {
    const protocol = environment.production ? 'https' : 'http';
    return `${protocol}://${subdomain}.${this.selectedPublishDomain}`;
  }

  private resolvePublishDomainOptions(): string[] {
    if (!environment.production) return ['localhost:4200'];

    const allDomains = getHostedRootDomains();
    const preferred = 'ezit.ai';
    if (allDomains.includes(preferred)) return [preferred];
    return [environment.websiteRootDomain || preferred];
  }

  private getPublishErrorMessage(err: HttpErrorResponse): string {
    const backendMessage = (err?.error?.message as string | undefined)?.trim();

    if (backendMessage) return backendMessage;

    if (err.status === 400) return 'Publish failed: please verify required fields and subdomain.';
    if (err.status === 404) return this.hasExistingWebsite ? 'Update failed: website was not found. Try saving a new website.' : 'Save failed: entity not found.';
    if (err.status === 409) return this.hasExistingWebsite
      ? 'Update failed: subdomain is already used by another website. Choose another one.'
      : 'Save failed: website or subdomain already exists. Use update flow or pick another subdomain.';

    return 'Failed to save website. Please try again.';
  }
}
