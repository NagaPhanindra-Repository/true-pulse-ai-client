export type EntityType = 'BUSINESS' | 'BUSINESS_LEADER' | 'POLITICIAN' | 'CELEBRITY';

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
  businessProfile?: any;
  businessLeaderProfile?: any;
  politicianProfile?: any;
  celebrityProfile?: any;
}
