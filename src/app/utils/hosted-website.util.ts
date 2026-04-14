import { environment } from '../../environments/environment';

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

  const rootDomain = (environment.websiteRootDomain || '').trim().toLowerCase();
  if (!rootDomain) return null;

  if (host === rootDomain) return null;
  if (!host.endsWith(`.${rootDomain}`)) return null;

  const rawSubdomain = host.slice(0, -(`.${rootDomain}`).length);
  const subdomain = normalizeHostedSubdomain(rawSubdomain);
  return subdomain || null;
}

export function isHostedWebsiteHostname(hostname: string): boolean {
  return !!extractHostedSubdomainFromHostname(hostname);
}
