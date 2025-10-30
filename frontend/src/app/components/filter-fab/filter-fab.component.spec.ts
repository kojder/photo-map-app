import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterFabComponent } from './filter-fab.component';
import { FilterService } from '../../services/filter.service';
import { BehaviorSubject } from 'rxjs';
import { PhotoFilters } from '../../models/photo.model';

describe('FilterFabComponent', () => {
  let component: FilterFabComponent;
  let fixture: ComponentFixture<FilterFabComponent>;
  let filterService: jasmine.SpyObj<FilterService>;
  let filtersSubject: BehaviorSubject<PhotoFilters>;

  const defaultFilters: PhotoFilters = {
    page: 0,
    size: 20,
    sort: 'uploadedAt,desc'
  };

  beforeEach(async () => {
    filtersSubject = new BehaviorSubject<PhotoFilters>(defaultFilters);

    const filterServiceSpy = jasmine.createSpyObj('FilterService', [
      'applyFilters',
      'clearFilters',
      'currentFilters'
    ], {
      filters$: filtersSubject.asObservable()
    });

    filterServiceSpy.currentFilters.and.returnValue(defaultFilters);

    await TestBed.configureTestingModule({
      imports: [FilterFabComponent],
      providers: [
        { provide: FilterService, useValue: filterServiceSpy }
      ]
    }).compileComponents();

    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    fixture = TestBed.createComponent(FilterFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default values from FilterService', () => {
      expect(component.dateFrom).toBe('');
      expect(component.dateTo).toBe('');
      expect(component.minRating).toBeNull();
    });

    it('should subscribe to filter changes on init', () => {
      const testFilters: PhotoFilters = {
        ...defaultFilters,
        minRating: 3,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      };

      filtersSubject.next(testFilters);

      expect(component.minRating).toBe(3);
      expect(component.dateFrom).toBe('2024-01-01');
      expect(component.dateTo).toBe('2024-12-31');
    });
  });

  describe('Filter Panel Toggle', () => {
    it('should toggle filter panel open/close', () => {
      expect(component.filtersOpen()).toBe(false);

      component.toggleFilters();
      expect(component.filtersOpen()).toBe(true);

      component.toggleFilters();
      expect(component.filtersOpen()).toBe(false);
    });

    it('should close filters when closeFilters is called', () => {
      component.toggleFilters(); // Open
      expect(component.filtersOpen()).toBe(true);

      component.closeFilters();
      expect(component.filtersOpen()).toBe(false);
    });
  });

  describe('Active Filters Detection', () => {
    it('should detect no active filters initially', () => {
      expect(component.hasActiveFilters()).toBe(false);
      expect(component.activeFilterCount()).toBe(0);
    });

    it('should detect active date from filter', () => {
      component.dateFrom = '2024-01-01';
      // Computed signals are reactive, but need to be read to trigger
      expect(component.hasActiveFilters()).toBe(true);
      expect(component.activeFilterCount()).toBe(1);
    });

    it('should detect active date to filter', () => {
      component.dateTo = '2024-12-31';
      expect(component.hasActiveFilters()).toBe(true);
      expect(component.activeFilterCount()).toBe(1);
    });

    it('should detect active rating filter', () => {
      component.minRating = 3;
      expect(component.hasActiveFilters()).toBe(true);
      expect(component.activeFilterCount()).toBe(1);
    });

    it('should count multiple active filters', () => {
      component.dateFrom = '2024-01-01';
      component.dateTo = '2024-12-31';
      component.minRating = 5;
      expect(component.hasActiveFilters()).toBe(true);
      expect(component.activeFilterCount()).toBe(3);
    });

    it('should not count null rating as active filter', () => {
      component.minRating = null;
      expect(component.hasActiveFilters()).toBe(false);
      expect(component.activeFilterCount()).toBe(0);
    });
  });

  describe('onFilterChange - Rating Reset Bug Fix', () => {
    it('should include minRating in filters when value is selected', () => {
      component.minRating = 3;
      component.onFilterChange();

      expect(filterService.applyFilters).toHaveBeenCalledWith({
        minRating: 3
      });
    });

    it('should include minRating=null when "All" is selected (bug fix)', () => {
      // Setup: First apply a rating filter
      component.minRating = 3;
      component.onFilterChange();
      expect(filterService.applyFilters).toHaveBeenCalledWith({ minRating: 3 });

      // Reset spy
      filterService.applyFilters.calls.reset();

      // Test: Change to "All" (null)
      component.minRating = null;
      component.onFilterChange();

      // Should explicitly pass minRating: null so FilterService can detect reset
      expect(filterService.applyFilters).toHaveBeenCalledWith({
        minRating: null as any
      });
    });

    it('should include all filters when multiple are active', () => {
      component.dateFrom = '2024-01-01';
      component.dateTo = '2024-12-31';
      component.minRating = 4;

      component.onFilterChange();

      expect(filterService.applyFilters).toHaveBeenCalledWith({
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        minRating: 4
      });
    });

    it('should include minRating=null even when other filters are active', () => {
      component.dateFrom = '2024-01-01';
      component.minRating = null;

      component.onFilterChange();

      expect(filterService.applyFilters).toHaveBeenCalledWith({
        dateFrom: '2024-01-01',
        minRating: null as any
      });
    });

    it('should not include empty date fields', () => {
      component.dateFrom = '';
      component.dateTo = '';
      component.minRating = 3;

      component.onFilterChange();

      expect(filterService.applyFilters).toHaveBeenCalledWith({
        minRating: 3
      });
    });
  });

  describe('onClearFilters', () => {
    it('should reset all local filter values', () => {
      component.dateFrom = '2024-01-01';
      component.dateTo = '2024-12-31';
      component.minRating = 5;

      component.onClearFilters();

      expect(component.dateFrom).toBe('');
      expect(component.dateTo).toBe('');
      expect(component.minRating).toBeNull();
    });

    it('should call FilterService.clearFilters()', () => {
      component.onClearFilters();

      expect(filterService.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const subscription = component['filterSubscription'];
      spyOn(subscription!, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription!.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined minRating as null', () => {
      component.minRating = undefined as any;
      component.onFilterChange();

      // Should pass null explicitly (or undefined, both should work with fix)
      const calls = filterService.applyFilters.calls.mostRecent();
      expect(calls.args[0].hasOwnProperty('minRating')).toBe(true);
    });

    it('should handle rating value of 0 (edge case)', () => {
      component.minRating = 0;
      component.onFilterChange();

      // 0 should be treated as falsy in activeFilterCount but still passed to service
      expect(filterService.applyFilters).toHaveBeenCalledWith({
        minRating: 0
      });
    });
  });
});
