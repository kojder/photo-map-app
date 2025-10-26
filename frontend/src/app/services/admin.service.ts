import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { PageResponse } from '../models/photo.model';
import { AppSettings } from '../models/settings.model';

interface SpringPage<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = '/api/admin';

  constructor(private http: HttpClient) {}

  getUsers(page: number = 0, size: number = 10, searchEmail?: string): Observable<PageResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchEmail && searchEmail.trim()) {
      params = params.set('searchEmail', searchEmail.trim());
    }

    return this.http.get<SpringPage<User>>(`${this.API_URL}/users`, { params }).pipe(
      map(springPage => ({
        content: springPage.content,
        page: {
          size: springPage.pageable.pageSize,
          number: springPage.pageable.pageNumber,
          totalElements: springPage.totalElements,
          totalPages: springPage.totalPages
        }
      }))
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${id}`);
  }

  updateUserRole(id: number, role: 'USER' | 'ADMIN'): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/users/${id}/role`, { role });
  }

  updateUserPermissions(id: number, permissions: { canViewPhotos: boolean; canRate: boolean }): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/users/${id}/permissions`, permissions);
  }

  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${this.API_URL}/settings`);
  }

  updateSettings(settings: AppSettings): Observable<AppSettings> {
    return this.http.put<AppSettings>(`${this.API_URL}/settings`, settings);
  }
}
