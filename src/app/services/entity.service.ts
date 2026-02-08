import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BusinessLeaderProfile,
  BusinessProfile,
  CelebrityProfile,
  CreateEntityRequest,
  CreateEntityResponse,
  PoliticianProfile
} from '../models/entity.model';

@Injectable({ providedIn: 'root' })
export class EntityService {
  private readonly baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  createEntity(request: CreateEntityRequest): Observable<CreateEntityResponse> {
    return this.http.post<CreateEntityResponse>(`${this.baseUrl}/entities`, request);
  }

  getMyEntities(): Observable<CreateEntityResponse[]> {
    return this.http.get<CreateEntityResponse[]>(`${this.baseUrl}/entities/my-entities`);
  }

  getRandomEntities(limit: number = 10): Observable<CreateEntityResponse[]> {
    return this.http.get<CreateEntityResponse[]>(`${this.baseUrl}/entities/random?limit=${limit}`);
  }

  searchEntities(query: string): Observable<CreateEntityResponse[]> {
    return this.http.get<CreateEntityResponse[]>(`${this.baseUrl}/entities/search?q=${encodeURIComponent(query)}`);
  }

  getBusinessProfile(entityId: number): Observable<BusinessProfile> {
    return this.http.get<BusinessProfile>(`${this.baseUrl}/entities/${entityId}/business`);
  }

  upsertBusinessProfile(entityId: number, payload: BusinessProfile): Observable<BusinessProfile> {
    return this.http.put<BusinessProfile>(`${this.baseUrl}/entities/${entityId}/business`, payload);
  }

  deleteBusinessProfile(entityId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/entities/${entityId}/business`);
  }

  getBusinessLeaderProfile(entityId: number): Observable<BusinessLeaderProfile> {
    return this.http.get<BusinessLeaderProfile>(`${this.baseUrl}/entities/${entityId}/business-leader`);
  }

  upsertBusinessLeaderProfile(entityId: number, payload: BusinessLeaderProfile): Observable<BusinessLeaderProfile> {
    return this.http.put<BusinessLeaderProfile>(`${this.baseUrl}/entities/${entityId}/business-leader`, payload);
  }

  deleteBusinessLeaderProfile(entityId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/entities/${entityId}/business-leader`);
  }

  getPoliticianProfile(entityId: number): Observable<PoliticianProfile> {
    return this.http.get<PoliticianProfile>(`${this.baseUrl}/entities/${entityId}/politician`);
  }

  upsertPoliticianProfile(entityId: number, payload: PoliticianProfile): Observable<PoliticianProfile> {
    return this.http.put<PoliticianProfile>(`${this.baseUrl}/entities/${entityId}/politician`, payload);
  }

  deletePoliticianProfile(entityId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/entities/${entityId}/politician`);
  }

  getCelebrityProfile(entityId: number): Observable<CelebrityProfile> {
    return this.http.get<CelebrityProfile>(`${this.baseUrl}/entities/${entityId}/celebrity`);
  }

  upsertCelebrityProfile(entityId: number, payload: CelebrityProfile): Observable<CelebrityProfile> {
    return this.http.put<CelebrityProfile>(`${this.baseUrl}/entities/${entityId}/celebrity`, payload);
  }

  deleteCelebrityProfile(entityId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/entities/${entityId}/celebrity`);
  }
}
