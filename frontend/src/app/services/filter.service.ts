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
    
    // Start with current filters
    const newFilters = { ...currentFilters, page: 0 };
    
    // Remove minRating if explicitly set to null/undefined
    if (filters.hasOwnProperty('minRating') && (filters.minRating === null || filters.minRating === undefined)) {
      delete (newFilters as any).minRating;
    }
    
    // Apply new filter values (excluding null/undefined/empty)
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        (newFilters as any)[key] = value;
      }
    });
    
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
