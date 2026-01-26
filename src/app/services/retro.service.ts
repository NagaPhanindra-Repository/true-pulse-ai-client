
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Retro } from '../models/retro.model';

@Injectable({
  providedIn: 'root'
})
export class RetroService {
  private readonly baseUrl = 'http://localhost:8080/api/retros';

  constructor(private http: HttpClient) { }

  createRetro(retro: Retro): Observable<Retro> {
    return this.http.post<Retro>(this.baseUrl, retro);
  }
}
