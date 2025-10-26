# Service Patterns

Service architecture patterns for Photo Map MVP: HttpClient, state management, interceptors, error handling.

## Service with BehaviorSubject (State Management)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/photos';

  // Private BehaviorSubject (internal state)
  private readonly photosSubject = new BehaviorSubject<Photo[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  // Public Observables (expose to components)
  readonly photos$ = this.photosSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  // CRUD methods
  getPhotos(filters?: PhotoFilters): Observable<Photo[]> {
    return this.http.get<Photo[]>(this.apiUrl, { params: filters as any });
  }

  getPhotoById(id: number): Observable<Photo> {
    return this.http.get<Photo>(`${this.apiUrl}/${id}`);
  }

  uploadPhoto(file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Photo>(`${this.apiUrl}/upload`, formData);
  }

  ratePhoto(photoId: number, rating: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${photoId}/rating`, { rating });
  }

  clearRating(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}/rating`);
  }

  deletePhoto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // State management methods
  loadPhotos(filters?: PhotoFilters): void {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.getPhotos(filters).subscribe({
      next: (photos) => {
        this.photosSubject.next(photos);
        this.loadingSubject.next(false);
      },
      error: (error) => {
        this.errorSubject.next('Failed to load photos');
        this.loadingSubject.next(false);
        console.error('Load photos error:', error);
      }
    });
  }

  // Synchronous getters
  get currentPhotos(): Photo[] {
    return this.photosSubject.value;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
```

## HTTP Client Patterns

### GET with Query Params

```typescript
getPhotos(filters: PhotoFilters): Observable<Photo[]> {
  const params = new HttpParams()
    .set('page', filters.page?.toString() ?? '0')
    .set('size', filters.size?.toString() ?? '20');

  if (filters.minRating) {
    params.set('minRating', filters.minRating.toString());
  }

  return this.http.get<Photo[]>(this.apiUrl, { params });
}
```

### POST with JSON Body

```typescript
register(email: string, password: string): Observable<UserResponse> {
  return this.http.post<UserResponse>('/api/auth/register', {
    email,
    password
  });
}
```

### POST with FormData (File Upload)

```typescript
uploadPhoto(file: File): Observable<Photo> {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post<Photo>('/api/photos/upload', formData, {
    reportProgress: true, // For progress tracking
    observe: 'events'     // Get progress events
  });
}
```

### PUT (Update)

```typescript
updateRating(photoId: number, rating: number): Observable<void> {
  return this.http.put<void>(`/api/photos/${photoId}/rating`, { rating });
}
```

### DELETE

```typescript
deletePhoto(photoId: number): Observable<void> {
  return this.http.delete<void>(`/api/photos/${photoId}`);
}
```

## HTTP Interceptors

### JWT Interceptor (Add Token)

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // Skip auth endpoints
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  // Add token if exists
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};
```

**Register in `app.config.ts`:**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

### Error Interceptor (Handle 401/403)

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('token');
        router.navigate(['/login']);
      } else if (error.status === 403) {
        // Forbidden - redirect to gallery
        router.navigate(['/gallery']);
      }

      return throwError(() => error);
    })
  );
};
```

**Register multiple interceptors:**

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    )
  ]
};
```

## Authentication Service

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Initialize user from token on service creation
    this.initializeUser();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/register', { email, password }).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  get isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'ADMIN';
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private initializeUser(): void {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT and set user
      const payload = this.decodeToken(token);
      this.currentUserSubject.next({
        id: payload.sub,
        email: payload.email,
        role: payload.role
      });
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }
}
```

## Filter Service (Shared State)

```typescript
@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly filtersSubject = new BehaviorSubject<FilterState>({
    dateFrom: null,
    dateTo: null,
    minRating: null,
    hasGps: false,
    page: 0,
    size: 20
  });

  readonly filters$ = this.filtersSubject.asObservable();

  applyFilters(filters: Partial<FilterState>): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      ...filters,
      page: 0 // Reset page on filter change
    });
  }

  clearFilters(): void {
    this.filtersSubject.next({
      dateFrom: null,
      dateTo: null,
      minRating: null,
      hasGps: false,
      page: 0,
      size: 20
    });
  }

  nextPage(): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      page: current.page + 1
    });
  }

  get currentFilters(): FilterState {
    return this.filtersSubject.value;
  }
}
```

## Error Handling Patterns

### Service-Level Error Handling

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  uploadPhoto(file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Photo>('/api/photos/upload', formData).pipe(
      catchError(error => {
        console.error('Upload failed:', error);

        // Transform to user-friendly message
        let message = 'Upload failed';
        if (error.status === 413) {
          message = 'File too large (max 10MB)';
        } else if (error.status === 415) {
          message = 'Invalid file type (JPEG/PNG only)';
        } else if (error.status === 500) {
          message = 'Server error';
        }

        return throwError(() => new Error(message));
      }),
      retry(2) // Retry 2 times before failing
    );
  }
}
```

### Global Error Handling

```typescript
@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  showError(message: string): void {
    this.errorSubject.next(message);

    // Auto-clear after 5 seconds
    setTimeout(() => this.clearError(), 5000);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }
}
```

## Service Best Practices

**Do:**
- ✅ Always `providedIn: 'root'` (singleton)
- ✅ Keep BehaviorSubject PRIVATE
- ✅ Expose Observable (public)
- ✅ Use readonly for injected services
- ✅ Explicit return types (Observable<T>)
- ✅ Handle errors (catchError)
- ✅ Type-safe interfaces

**Don't:**
- ❌ Don't expose BehaviorSubject directly
- ❌ Don't forget error handling
- ❌ Don't use constructor injection (use inject())
- ❌ Don't skip type annotations
- ❌ Don't create multiple instances (use singleton)
