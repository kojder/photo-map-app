import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { PageResponse } from '../models/photo.model';

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

  getUsers(page: number = 0, size: number = 10): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

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
}
