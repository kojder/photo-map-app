import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Photo, PhotoFilters } from '../models/photo.model';

/**
 * PhotoService - manages photo state and HTTP operations.
 * Uses BehaviorSubject pattern for state management.
 */
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

  /**
   * Get photos with optional filters.
   */
  getPhotos(filters?: PhotoFilters): Observable<Photo[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.minRating) {
        params = params.set('minRating', filters.minRating.toString());
      }
      if (filters.dateFrom) {
        params = params.set('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params = params.set('dateTo', filters.dateTo);
      }
      if (filters.hasGps !== undefined) {
        params = params.set('hasGps', filters.hasGps.toString());
      }
      if (filters.page !== undefined) {
        params = params.set('page', filters.page.toString());
      }
      if (filters.size !== undefined) {
        params = params.set('size', filters.size.toString());
      }
    }

    return this.http.get<Photo[]>(this.apiUrl, { params });
  }

  /**
   * Get photo by ID.
   */
  getPhotoById(id: number): Observable<Photo> {
    return this.http.get<Photo>(`${this.apiUrl}/${id}`);
  }

  /**
   * Upload photo (multipart/form-data).
   */
  uploadPhoto(file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Photo>(`${this.apiUrl}/upload`, formData).pipe(
      catchError(error => {
        console.error('Upload failed:', error);
        throw error;
      })
    );
  }

  /**
   * Rate photo (1-10).
   */
  ratePhoto(photoId: number, rating: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${photoId}/rating`, { rating }).pipe(
      tap(() => {
        // Update local state if needed
        this.updatePhotoRating(photoId, rating);
      }),
      catchError(error => {
        console.error('Failed to rate photo:', error);
        throw error;
      })
    );
  }

  /**
   * Clear user rating (DELETE).
   */
  clearRating(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}/rating`).pipe(
      tap(() => {
        // Update local state if needed
        this.updatePhotoRating(photoId, 0);
      }),
      catchError(error => {
        console.error('Failed to clear rating:', error);
        throw error;
      })
    );
  }

  /**
   * Delete photo.
   */
  deletePhoto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Remove from local state
        this.removePhotoFromState(id);
      }),
      catchError(error => {
        console.error('Failed to delete photo:', error);
        throw error;
      })
    );
  }

  /**
   * Load photos with state management.
   */
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

  /**
   * Synchronous getters for current state.
   */
  get currentPhotos(): Photo[] {
    return this.photosSubject.value;
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }

  get currentError(): string | null {
    return this.errorSubject.value;
  }

  /**
   * Private helper: update photo rating in local state.
   */
  private updatePhotoRating(photoId: number, userRating: number): void {
    const photos = this.photosSubject.value;
    const updatedPhotos = photos.map(photo =>
      photo.id === photoId ? { ...photo, userRating } : photo
    );
    this.photosSubject.next(updatedPhotos);
  }

  /**
   * Private helper: remove photo from local state.
   */
  private removePhotoFromState(photoId: number): void {
    const photos = this.photosSubject.value;
    const filteredPhotos = photos.filter(photo => photo.id !== photoId);
    this.photosSubject.next(filteredPhotos);
  }
}
