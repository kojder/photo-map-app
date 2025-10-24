import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Photo, PageResponse, RatingRequest, RatingResponse, PhotoFilters } from '../models/photo.model';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private baseUrl = '/api/photos';
  private photosSubject = new BehaviorSubject<Photo[]>([]);
  public photos$ = this.photosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllPhotos(filters?: PhotoFilters): Observable<PageResponse<Photo>> {
    let params = new HttpParams();

    if (filters) {
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
      const currentPhotos = this.photosSubject.value.map(p =>
        p.id === photoId ? updatedPhoto : p
      );
      this.photosSubject.next(currentPhotos);
    });
  }
}
