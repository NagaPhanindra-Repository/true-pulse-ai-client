import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateEntityRequest, CreateEntityResponse } from '../models/entity.model';

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
}
