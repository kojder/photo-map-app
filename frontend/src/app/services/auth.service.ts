import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'auth_token';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromToken());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, loginRequest)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  register(email: string, password: string): Observable<RegisterResponse> {
    const registerRequest: RegisterRequest = { email, password };
    return this.http.post<RegisterResponse>(`${this.API_URL}/register`, registerRequest);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const payload = this.decodeToken(token);
      return payload?.role === 'ADMIN';
    } catch (error) {
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private getUserFromToken(): User | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);
      if (!payload) {
        return null;
      }

      return {
        id: parseInt(payload.sub, 10),
        email: payload.email,
        role: payload.role,
        createdAt: ''
      };
    } catch (error) {
      return null;
    }
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      return null;
    }
  }
}
