import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PhotoFilters } from '../models/photo.model';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private readonly defaultFilters: PhotoFilters = {
    page: 0,
    size: 20,
    sort: 'uploadedAt,desc'
  };

  private readonly filtersSubject = new BehaviorSubject<PhotoFilters>(this.defaultFilters);
  public readonly filters$ = this.filtersSubject.asObservable();

  applyFilters(filters: Partial<PhotoFilters>): void {
    const currentFilters = this.filtersSubject.value;
    
    // Start with current filters
    const newFilters = { ...currentFilters, page: 0 };
    
    // Remove minRating if explicitly set to null/undefined
    if (filters.hasOwnProperty('minRating') && (filters.minRating === null || filters.minRating === undefined)) {
      delete (newFilters as any).minRating;
    }
    
    // Apply new filter values (excluding null/undefined/empty)
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        (newFilters as any)[key] = value;
      }
    }
    
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
