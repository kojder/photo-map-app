import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Photo, PageResponse, RatingRequest, RatingResponse, PhotoFilters } from '../models/photo.model';
import { AppSettings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private readonly baseUrl = '/api/photos';
  private readonly photosSubject = new BehaviorSubject<Photo[]>([]);
  public readonly photos$ = this.photosSubject.asObservable();
  private currentFilters: PhotoFilters | undefined;

  constructor(private readonly http: HttpClient) {}

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
    return this.matchesMinRating(photo, filters.minRating) &&
           this.matchesGpsFilter(photo, filters.hasGps) &&
           this.matchesDateRange(photo, filters.dateFrom, filters.dateTo);
  }

  private matchesMinRating(photo: Photo, minRating: number | undefined): boolean {
    if (!minRating) {
      return true;
    }
    const photoRating = photo.averageRating || 0;
    return photoRating >= minRating;
  }

  private matchesGpsFilter(photo: Photo, hasGpsFilter: boolean | undefined): boolean {
    if (hasGpsFilter === undefined) {
      return true;
    }
    const hasGps = photo.gpsLatitude !== undefined &&
                   photo.gpsLatitude !== null &&
                   photo.gpsLongitude !== undefined &&
                   photo.gpsLongitude !== null;
    return !hasGpsFilter || hasGps;
  }

  private matchesDateRange(photo: Photo, dateFrom: string | undefined, dateTo: string | undefined): boolean {
    if (!photo.takenAt) {
      return true;
    }

    const photoDate = new Date(photo.takenAt);

    if (dateFrom) {
      const filterDate = new Date(dateFrom);
      if (photoDate < filterDate) {
        return false;
      }
    }

    if (dateTo) {
      const filterDate = new Date(dateTo);
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
