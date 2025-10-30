import { TestBed } from '@angular/core/testing';
import { FilterService } from './filter.service';
import { PhotoFilters } from '../models/photo.model';

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default filters', (done) => {
    service.filters$.subscribe(filters => {
      expect(filters.page).toBe(0);
      expect(filters.size).toBe(20);
      expect(filters.sort).toBe('uploadedAt,desc');
      done();
    });
  });

  describe('applyFilters', () => {
    it('should apply partial filters and reset page to 0', (done) => {
      const newFilters: Partial<PhotoFilters> = {
        minRating: 8,
        dateFrom: '2024-01-01'
      };

      service.applyFilters(newFilters);

      service.filters$.subscribe(filters => {
        expect(filters.minRating).toBe(8);
        expect(filters.dateFrom).toBe('2024-01-01');
        expect(filters.page).toBe(0);
        expect(filters.size).toBe(20);
        done();
      });
    });

    it('should merge with existing filters', (done) => {
      service.applyFilters({ minRating: 7 });
      service.applyFilters({ dateFrom: '2024-01-01' });

      service.filters$.subscribe(filters => {
        expect(filters.minRating).toBe(7);
        expect(filters.dateFrom).toBe('2024-01-01');
        done();
      });
    });

    it('should remove minRating filter when explicitly set to null (bug fix)', (done) => {
      // First apply a rating filter
      service.applyFilters({ minRating: 3 });

      // Then reset it to null (user selects "All")
      service.applyFilters({ minRating: null } as any);

      service.filters$.subscribe(filters => {
        expect(filters.minRating).toBeUndefined();
        done();
      });
    });

    it('should remove minRating but keep other filters when set to null', (done) => {
      // Apply multiple filters
      service.applyFilters({ minRating: 4, dateFrom: '2024-01-01' });

      // Reset only minRating
      service.applyFilters({ minRating: null } as any);

      service.filters$.subscribe(filters => {
        expect(filters.minRating).toBeUndefined();
        expect(filters.dateFrom).toBe('2024-01-01');
        done();
      });
    });

    it('should handle undefined minRating the same as null', (done) => {
      service.applyFilters({ minRating: 5 });
      service.applyFilters({ minRating: undefined });

      service.filters$.subscribe(filters => {
        expect(filters.minRating).toBeUndefined();
        done();
      });
    });

    it('should not add empty string values to filters', (done) => {
      service.applyFilters({ dateFrom: '' });

      service.filters$.subscribe(filters => {
        expect(filters.dateFrom).toBeUndefined();
        done();
      });
    });
  });

  describe('clearFilters', () => {
    it('should reset to default filters', (done) => {
      service.applyFilters({ minRating: 8, dateFrom: '2024-01-01' });
      service.clearFilters();

      service.filters$.subscribe(filters => {
        expect(filters.minRating).toBeUndefined();
        expect(filters.dateFrom).toBeUndefined();
        expect(filters.page).toBe(0);
        expect(filters.size).toBe(20);
        expect(filters.sort).toBe('uploadedAt,desc');
        done();
      });
    });
  });

  describe('currentFilters', () => {
    it('should return current filter values', () => {
      const testFilters: Partial<PhotoFilters> = {
        minRating: 9,
        hasGps: true
      };

      service.applyFilters(testFilters);

      const current = service.currentFilters();
      expect(current.minRating).toBe(9);
      expect(current.hasGps).toBe(true);
    });
  });

  describe('setPage', () => {
    it('should update only page number', (done) => {
      service.applyFilters({ minRating: 7 });
      service.setPage(2);

      service.filters$.subscribe(filters => {
        expect(filters.page).toBe(2);
        expect(filters.minRating).toBe(7);
        done();
      });
    });
  });
});
