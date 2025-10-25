import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.css'
})
export class FilterBarComponent {
  @Output() filterChange = new EventEmitter<void>();

  dateFrom: string = '';
  dateTo: string = '';
  minRating: number | null = null;

  constructor(private filterService: FilterService) {}

  onFilterChange(): void {
    const filters: any = {};

    if (this.dateFrom) filters.dateFrom = this.dateFrom;
    if (this.dateTo) filters.dateTo = this.dateTo;
    if (this.minRating) filters.minRating = this.minRating;

    this.filterService.applyFilters(filters);
    this.filterChange.emit();
  }

  onClearFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.minRating = null;

    this.filterService.clearFilters();
    this.filterChange.emit();
  }

  onRatingChange(value: string): void {
    this.minRating = value ? parseInt(value) : null;
    this.onFilterChange();
  }
}
