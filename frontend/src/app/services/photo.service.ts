import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Photo, PageResponse, RatingRequest, RatingResponse, PhotoFilters } from '../models/photo.model';
import { AppSettings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private baseUrl = '/api/photos';
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  public photos$ = this.photosSubject.asObservable();
  private currentFilters: PhotoFilters | undefined;

  constructor(private http: HttpClient) {}

  getAllPhotos(filters?: PhotoFilters): Observable<PageResponse<Photo>> {
    let params = new HttpParams();

    if (filters) {
      this.currentFilters = filters; // Store current filters
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.minRating) params = params.set('minRating', filters.minRating.toString());
      if (filters.hasGps !== undefined) params = params.set('hasGps', filters.hasGps.toString());
      if (filters.page !== undefined) params = params.set('page', filters.page.toString());
      if (filters.size !== undefined) params = params.set('size', filters.size.toString());
      if (filters.sort) params = params.set('sort', filters.sort);
    }

    return this.http.get<PageResponse<Photo>>(this.baseUrl, { params }).pipe(
      tap(response => this.photosSubject.next(response.content))
    );
  }

  getPhotoById(id: number): Observable<Photo> {
    return this.http.get<Photo>(`${this.baseUrl}/${id}`);
  }

  uploadPhoto(file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Photo>(this.baseUrl, formData).pipe(
      tap(photo => {
        const currentPhotos = this.photosSubject.value;
        this.photosSubject.next([photo, ...currentPhotos]);
      })
    );
  }

  ratePhoto(photoId: number, rating: number): Observable<RatingResponse> {
    const request: RatingRequest = { rating };
    return this.http.put<RatingResponse>(`${this.baseUrl}/${photoId}/rating`, request).pipe(
      tap(() => this.refreshPhoto(photoId))
    );
  }

  clearRating(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${photoId}/rating`).pipe(
      tap(() => this.refreshPhoto(photoId))
    );
  }

  deletePhoto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const currentPhotos = this.photosSubject.value.filter(p => p.id !== id);
        this.photosSubject.next(currentPhotos);
      })
    );
  }

  private refreshPhoto(photoId: number): void {
    this.getPhotoById(photoId).subscribe(updatedPhoto => {
      const currentPhotos = this.photosSubject.value;
      
      // Check if photo still matches current filters
      if (this.currentFilters && !this.photoMatchesFilters(updatedPhoto, this.currentFilters)) {
        // Photo no longer matches filters - remove it from the list
        const filteredPhotos = currentPhotos.filter(p => p.id !== photoId);
        this.photosSubject.next(filteredPhotos);
      } else {
        // Photo still matches - update it
        const updatedPhotos = currentPhotos.map(p =>
          p.id === photoId ? updatedPhoto : p
        );
        this.photosSubject.next(updatedPhotos);
      }
    });
  }

  private photoMatchesFilters(photo: Photo, filters: PhotoFilters): boolean {
    // Check minRating filter
    if (filters.minRating) {
      const photoRating = photo.averageRating || 0;
      if (photoRating < filters.minRating) {
        return false;
      }
    }

    // Check hasGps filter
    if (filters.hasGps !== undefined) {
      const hasGps = photo.gpsLatitude !== undefined && 
                     photo.gpsLatitude !== null && 
                     photo.gpsLongitude !== undefined && 
                     photo.gpsLongitude !== null;
      if (filters.hasGps && !hasGps) {
        return false;
      }
    }

    // Check date filters
    if (filters.dateFrom && photo.takenAt) {
      const photoDate = new Date(photo.takenAt);
      const filterDate = new Date(filters.dateFrom);
      if (photoDate < filterDate) {
        return false;
      }
    }

    if (filters.dateTo && photo.takenAt) {
      const photoDate = new Date(photo.takenAt);
      const filterDate = new Date(filters.dateTo);
      if (photoDate > filterDate) {
        return false;
      }
    }

    return true;
  }

  getPublicSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>('/api/public/settings');
  }

  clearPhotos(): void {
    this.photosSubject.next([]);
  }
}
