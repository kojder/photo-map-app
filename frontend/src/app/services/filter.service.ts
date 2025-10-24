import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PhotoFilters } from '../models/photo.model';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private defaultFilters: PhotoFilters = {
    page: 0,
    size: 20,
    sort: 'uploadedAt,desc'
  };

  private filtersSubject = new BehaviorSubject<PhotoFilters>(this.defaultFilters);
  public filters$ = this.filtersSubject.asObservable();

  applyFilters(filters: Partial<PhotoFilters>): void {
    const currentFilters = this.filtersSubject.value;
    const newFilters = { ...currentFilters, ...filters, page: 0 };
    this.filtersSubject.next(newFilters);
  }

  clearFilters(): void {
    this.filtersSubject.next(this.defaultFilters);
  }

  currentFilters(): PhotoFilters {
    return this.filtersSubject.value;
  }

  setPage(page: number): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, page });
  }
}
