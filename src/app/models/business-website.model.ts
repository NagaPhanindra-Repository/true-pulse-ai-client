export interface BusinessWebsiteMetadata {
  pageTitle: string;
  entityType: string;
  colorPalette: string[];
  fonts: string[];
  sections: string[];
  designStyle: string;
  targetAudience: string;
  accentFeatures: string[];
}

export interface BusinessWebsiteEntityDetails {
  id: number;
  type: string;
  displayName: string;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessWebsiteResponse {
  entityId: number;
  displayName: string;
  html: string;
  css: string;
  js: string;
  metadata: BusinessWebsiteMetadata;
  entityDetails: BusinessWebsiteEntityDetails;
}

export interface SaveBusinessWebsiteRequest {
  entityId: number;
  displayName: string;
  html: string;
  prompt?: string;
  css?: string;
  js?: string;
  metadata?: string;
  subdomain?: string;
  published?: boolean;
}

export interface SaveBusinessWebsiteResponse {
  websiteId: number;
  entityId: number;
  displayName: string;
  subdomain: string;
  html: string;
  css: string;
  js: string;
  metadata: string;
  published: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  entityDetails: BusinessWebsiteEntityDetails;
}
