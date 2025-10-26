import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * FilterState interface - defines filter structure.
 */
export interface FilterState {
  dateFrom: string | null;
  dateTo: string | null;
  minRating: number | null;
  hasGps: boolean;
  page: number;
  size: number;
}

/**
 * FilterService - manages filter state across components.
 * Uses BehaviorSubject for shared state.
 */
@Injectable({ providedIn: 'root' })
export class FilterService {
  // Private BehaviorSubject with default state
  private readonly filtersSubject = new BehaviorSubject<FilterState>({
    dateFrom: null,
    dateTo: null,
    minRating: null,
    hasGps: false,
    page: 0,
    size: 20
  });

  // Public Observable (expose to components)
  readonly filters$ = this.filtersSubject.asObservable();

  /**
   * Apply partial filters (merge with current state).
   */
  applyFilters(filters: Partial<FilterState>): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      ...filters,
      page: 0 // Reset page when filters change
    });
  }

  /**
   * Clear all filters (reset to default state).
   */
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

  /**
   * Update specific filter field.
   */
  setDateRange(dateFrom: string | null, dateTo: string | null): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      dateFrom,
      dateTo,
      page: 0
    });
  }

  setMinRating(minRating: number | null): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      minRating,
      page: 0
    });
  }

  setHasGps(hasGps: boolean): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      hasGps,
      page: 0
    });
  }

  /**
   * Pagination methods.
   */
  nextPage(): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      page: current.page + 1
    });
  }

  previousPage(): void {
    const current = this.filtersSubject.value;
    if (current.page > 0) {
      this.filtersSubject.next({
        ...current,
        page: current.page - 1
      });
    }
  }

  setPage(page: number): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({
      ...current,
      page: Math.max(0, page)
    });
  }

  /**
   * Synchronous getter for current filter state.
   */
  get currentFilters(): FilterState {
    return this.filtersSubject.value;
  }

  /**
   * Check if any filters are active (not default).
   */
  get hasActiveFilters(): boolean {
    const current = this.filtersSubject.value;
    return (
      current.dateFrom !== null ||
      current.dateTo !== null ||
      current.minRating !== null ||
      current.hasGps === true
    );
  }
}
