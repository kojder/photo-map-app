import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-filter-fab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-fab.component.html',
  styleUrl: './filter-fab.component.css'
})
export class FilterFabComponent implements OnInit, OnDestroy {
  filtersOpen = signal(false);
  dateFrom: string = '';
  dateTo: string = '';
  minRating: number | null = null;

  private filterSubscription?: Subscription;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    const currentFilters = this.filterService.currentFilters();
    this.dateFrom = currentFilters.dateFrom || '';
    this.dateTo = currentFilters.dateTo || '';
    this.minRating = currentFilters.minRating || null;

    this.filterSubscription = this.filterService.filters$.subscribe(filters => {
      this.dateFrom = filters.dateFrom || '';
      this.dateTo = filters.dateTo || '';
      this.minRating = filters.minRating || null;
    });
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  hasActiveFilters(): boolean {
    return !!this.dateFrom || !!this.dateTo || this.minRating !== null;
  }

  activeFilterCount(): number {
    let count = 0;
    if (this.dateFrom) count++;
    if (this.dateTo) count++;
    if (this.minRating !== null) count++;
    return count;
  }

  toggleFilters(): void {
    this.filtersOpen.update(value => !value);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  onApplyFilters(): void {
    this.onFilterChange();
    this.closeFilters();
  }

  onFilterChange(): void {
    const filters: any = {};
    if (this.dateFrom) filters.dateFrom = this.dateFrom;
    if (this.dateTo) filters.dateTo = this.dateTo;
    
    // Always include minRating (even if null) so FilterService can detect when user selects "All"
    filters.minRating = this.minRating;

    this.filterService.applyFilters(filters);
  }

  onClearFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.minRating = null;
    this.filterService.clearFilters();
  }
}
