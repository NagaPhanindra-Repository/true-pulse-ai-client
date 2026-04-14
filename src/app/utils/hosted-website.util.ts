import { environment } from '../../environments/environment';

function normalizeDomainEntry(domain: string): string {
  return (domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^\*\./, '')
    .replace(/\/$/, '');
}

export function getHostedRootDomains(): string[] {
  const configured = Array.isArray((environment as any).websiteRootDomains)
    ? (environment as any).websiteRootDomains
    : [environment.websiteRootDomain];

  const normalized = configured
    .map(normalizeDomainEntry)
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

export function getPreferredHostedRootDomain(hostname?: string): string {
  const domains = getHostedRootDomains();
  if (!domains.length) return 'localhost';

  const currentHost = (hostname || '').trim().toLowerCase();
  if (!currentHost) return domains[0];

  for (const domain of domains) {
    if (currentHost === domain || currentHost === `www.${domain}` || currentHost.endsWith(`.${domain}`)) {
      return domain;
    }
  }

  return domains[0];
}

export function normalizeHostedSubdomain(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 63);
}

export function extractHostedSubdomainFromHostname(hostname: string): string | null {
  const host = (hostname || '').trim().toLowerCase();
  if (!host) return null;

  const rootDomains = getHostedRootDomains();
  if (!rootDomains.length) return null;

  for (const rootDomain of rootDomains) {
    if (host === rootDomain || host === `www.${rootDomain}`) {
      continue;
    }

    if (!host.endsWith(`.${rootDomain}`)) {
      continue;
    }

    const rawSubdomain = host.slice(0, -(`.${rootDomain}`).length);
    const subdomain = normalizeHostedSubdomain(rawSubdomain);
    if (subdomain && subdomain !== 'www') {
      return subdomain;
    }
  }

  return null;
}

export function isHostedWebsiteHostname(hostname: string): boolean {
  return !!extractHostedSubdomainFromHostname(hostname);
}
