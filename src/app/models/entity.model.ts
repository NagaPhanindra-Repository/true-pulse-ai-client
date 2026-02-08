export type EntityType = 'BUSINESS' | 'BUSINESS_LEADER' | 'POLITICIAN' | 'CELEBRITY';

export interface BusinessProfile {
  entityId?: number;
  fullName?: string;
  address?: string;
  description?: string;
  businessType?: string;
  mobileNumber?: string;
  countryCode?: string;
  email?: string;
  contactHours?: string;
}

export interface BusinessLeaderProfile {
  entityId?: number;
  fullName?: string;
  company?: string;
  projectName?: string;
  projectDescription?: string;
  mobileNumber?: string;
  countryCode?: string;
  email?: string;
  contactHours?: string;
}

export interface PoliticianProfile {
  entityId?: number;
  fullName?: string;
  partyName?: string;
  segmentAddress?: string;
  contestingTo?: string;
  description?: string;
  mobileNumber?: string;
  countryCode?: string;
  email?: string;
  contactHours?: string;
}

export interface CelebrityProfile {
  entityId?: number;
  realName?: string;
  artistName?: string;
  artistType?: string;
  description?: string;
  mobileNumber?: string;
  countryCode?: string;
  email?: string;
  contactHours?: string;
}

export interface CreateEntityRequest {
  type: EntityType;
  displayName: string;
  createdByUserId: number;

  // Business
  businessFullName?: string;
  businessAddress?: string;
  businessDescription?: string;
  businessType?: string;
  businessMobileNumber?: string;
  businessCountryCode?: string;
  businessEmail?: string;
  businessContactHours?: string;

  // Business leader
  leaderFullName?: string;
  leaderCompany?: string;
  leaderProjectName?: string;
  leaderProjectDescription?: string;
  leaderMobileNumber?: string;
  leaderCountryCode?: string;
  leaderEmail?: string;
  leaderContactHours?: string;

  // Politician
  politicianFullName?: string;
  politicianPartyName?: string;
  politicianSegmentAddress?: string;
  politicianContestingTo?: string;
  politicianDescription?: string;
  politicianMobileNumber?: string;
  politicianCountryCode?: string;
  politicianEmail?: string;
  politicianContactHours?: string;

  // Celebrity
  celebrityRealName?: string;
  celebrityArtistName?: string;
  celebrityArtistType?: string;
  celebrityDescription?: string;
  celebrityMobileNumber?: string;
  celebrityCountryCode?: string;
  celebrityEmail?: string;
  celebrityContactHours?: string;
}

export interface CreateEntityResponse {
  id: number;
  type: EntityType;
  displayName: string;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  businessProfile?: BusinessProfile;
  businessLeaderProfile?: BusinessLeaderProfile;
  politicianProfile?: PoliticianProfile;
  celebrityProfile?: CelebrityProfile;
}
