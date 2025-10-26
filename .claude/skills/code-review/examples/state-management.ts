/**
 * State Management Patterns - Angular 18
 *
 * Examples of BAD vs GOOD state management patterns.
 */

// ========================================
// SERVICE STATE MANAGEMENT
// ========================================

// ❌ BAD: Exposed BehaviorSubject (mutable state)
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  // Anyone can call .next() on this!
  public photosSubject = new BehaviorSubject<Photo[]>([]);
}

// Component can mutate state directly (BAD!)
photoService.photosSubject.next([]);

// ✅ GOOD: Private BehaviorSubject, public Observable
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);

  // Private: only this service can modify
  private readonly photosSubject = new BehaviorSubject<Photo[]>([]);

  // Public: components can subscribe, not modify
  readonly photos$ = this.photosSubject.asObservable();

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>('/api/photos').pipe(
      tap(photos => this.photosSubject.next(photos)),
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Error:', error);
    throw error;
  }
}

// ========================================
// COMPONENT-LOCAL STATE (SIGNALS)
// ========================================

// ❌ BAD: Using BehaviorSubject for component-local state
import { Component, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  standalone: true,
  template: `...`
})
export class PhotoGalleryComponent {
  private selectedRatingSubject = new BehaviorSubject<number>(0);
  selectedRating$ = this.selectedRatingSubject.asObservable();

  setRating(rating: number) {
    this.selectedRatingSubject.next(rating);
  }
}

// ✅ GOOD: Using Signals for component-local state
import { Component, signal, computed } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div>Selected rating: {{ selectedRating() }}</div>
    <div>Photos count: {{ filteredPhotosCount() }}</div>
  `
})
export class PhotoGalleryComponent {
  // Signal for simple component state
  readonly selectedRating = signal<number>(0);

  // Computed signal for derived values
  readonly photos = signal<Photo[]>([]);
  readonly filteredPhotosCount = computed(() => {
    return this.photos().filter(p => p.rating >= this.selectedRating()).length;
  });

  setRating(rating: number) {
    this.selectedRating.set(rating);
  }
}

// ========================================
// CONSUMING SHARED STATE
// ========================================

// ❌ BAD: Manual subscription without cleanup
import { Component, inject } from '@angular/core';
import { PhotoService } from '../services/photo.service';

@Component({
  standalone: true,
  template: `...`
})
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);
  photos: Photo[] = [];

  ngOnInit() {
    // Memory leak - no unsubscribe!
    this.photoService.photos$.subscribe(photos => {
      this.photos = photos;
    });
  }
}

// ✅ GOOD: Async pipe (automatic cleanup)
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoService } from '../services/photo.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    @for (photo of photos$ | async; track photo.id) {
      <div>{{ photo.fileName }}</div>
    }
  `
})
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);
  readonly photos$ = this.photoService.photos$;
}

// ✅ ALSO GOOD: takeUntilDestroyed for manual subscriptions
import { Component, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { PhotoService } from '../services/photo.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  template: `
    @for (photo of photos(); track photo.id) {
      <div>{{ photo.fileName }}</div>
    }
  `
})
export class PhotoGalleryComponent implements OnInit {
  private readonly photoService = inject(PhotoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly photos = signal<Photo[]>([]);

  ngOnInit() {
    // Automatic cleanup with takeUntilDestroyed
    this.photoService.photos$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(photos => {
      this.photos.set(photos);
    });
  }
}

// ========================================
// FILTER SERVICE (STATE COORDINATION)
// ========================================

// ✅ GOOD: Service for coordinating shared filters
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { PhotoService } from './photo.service';

@Injectable({ providedIn: 'root' })
export class FilterService {
  private readonly photoService = inject(PhotoService);

  // Private state
  private readonly minRatingSubject = new BehaviorSubject<number>(1);
  private readonly sortOrderSubject = new BehaviorSubject<'asc' | 'desc'>('desc');

  // Public observables
  readonly minRating$ = this.minRatingSubject.asObservable();
  readonly sortOrder$ = this.sortOrderSubject.asObservable();

  // Filtered photos (combines multiple sources)
  readonly filteredPhotos$: Observable<Photo[]> = combineLatest([
    this.photoService.photos$,
    this.minRating$,
    this.sortOrder$
  ]).pipe(
    map(([photos, minRating, sortOrder]) => {
      const filtered = photos.filter(p => p.rating >= minRating);
      return sortOrder === 'asc'
        ? filtered.sort((a, b) => a.rating - b.rating)
        : filtered.sort((a, b) => b.rating - a.rating);
    })
  );

  // Public methods to update state
  setMinRating(rating: number): void {
    this.minRatingSubject.next(rating);
  }

  setSortOrder(order: 'asc' | 'desc'): void {
    this.sortOrderSubject.next(order);
  }
}

// Component using FilterService
@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <select (change)="onRatingChange($event)">
      @for (rating of [1, 2, 3, 4, 5]; track rating) {
        <option [value]="rating">{{ rating }}+</option>
      }
    </select>

    @for (photo of filteredPhotos$ | async; track photo.id) {
      <div>{{ photo.fileName }} ({{ photo.rating }})</div>
    }
  `
})
export class PhotoGalleryComponent {
  private readonly filterService = inject(FilterService);
  readonly filteredPhotos$ = this.filterService.filteredPhotos$;

  onRatingChange(event: Event): void {
    const rating = parseInt((event.target as HTMLSelectElement).value);
    this.filterService.setMinRating(rating);
  }
}

// ========================================
// NESTED SUBSCRIPTIONS (ANTI-PATTERN)
// ========================================

// ❌ BAD: Nested subscriptions (callback hell)
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  template: `...`
})
export class PhotoGalleryComponent {
  private readonly http = inject(HttpClient);

  loadPhotos() {
    // Nested subscriptions - BAD!
    this.http.get<User>('/api/user').subscribe(user => {
      this.http.get<Photo[]>(`/api/photos/${user.id}`).subscribe(photos => {
        this.http.get<Rating[]>(`/api/ratings/${user.id}`).subscribe(ratings => {
          // Now what?
        });
      });
    });
  }
}

// ✅ GOOD: RxJS operators (switchMap, forkJoin)
import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, forkJoin } from 'rxjs';

@Component({
  standalone: true,
  template: `...`
})
export class PhotoGalleryComponent {
  private readonly http = inject(HttpClient);
  readonly photos = signal<Photo[]>([]);
  readonly ratings = signal<Rating[]>([]);

  loadData() {
    // Sequential: switchMap
    this.http.get<User>('/api/user').pipe(
      switchMap(user => this.http.get<Photo[]>(`/api/photos/${user.id}`))
    ).subscribe(photos => {
      this.photos.set(photos);
    });

    // Parallel: forkJoin
    forkJoin({
      photos: this.http.get<Photo[]>('/api/photos'),
      ratings: this.http.get<Rating[]>('/api/ratings')
    }).subscribe(({ photos, ratings }) => {
      this.photos.set(photos);
      this.ratings.set(ratings);
    });
  }
}

// ========================================
// STATE MANAGEMENT DECISION TREE
// ========================================

/**
 * When to Use What:
 *
 * 1. Component-Local State (not shared):
 *    ✅ Use Signals: signal(), computed(), effect()
 *    - UI state (loading, selected, expanded)
 *    - Component counters, flags
 *    - Derived values
 *
 * 2. Shared State (cross-component):
 *    ✅ Use BehaviorSubject in Service
 *    - Photo list (PhotoService)
 *    - Authentication state (AuthService)
 *    - Filters (FilterService)
 *    Pattern: private BehaviorSubject → public Observable
 *
 * 3. Consuming Shared State:
 *    ✅ Prefer Async Pipe (automatic cleanup)
 *    ✅ Or use takeUntilDestroyed() for manual subscriptions
 *    ❌ NO subscriptions without cleanup
 *
 * 4. Complex State Coordination:
 *    ✅ Use combineLatest, switchMap, forkJoin
 *    ❌ NO nested subscriptions
 *
 * 5. MVP Scope:
 *    ✅ Signals + BehaviorSubject (sufficient for MVP)
 *    ❌ NO NgRx (overkill for MVP)
 *    ❌ NO custom state management libs
 */

// ========================================
// TESTING STATE MANAGEMENT
// ========================================

// ✅ GOOD: Testing service state
describe('PhotoService', () => {
  let service: PhotoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(PhotoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should update photos$ when getPhotos called', (done) => {
    const mockPhotos = [{ id: 1, fileName: 'test.jpg' }];

    // Subscribe to photos$
    service.photos$.subscribe(photos => {
      if (photos.length > 0) {
        expect(photos).toEqual(mockPhotos);
        done();
      }
    });

    // Trigger getPhotos
    service.getPhotos().subscribe();

    const req = httpMock.expectOne('/api/photos');
    req.flush(mockPhotos);
  });
});

// ✅ GOOD: Testing component with Signals
describe('PhotoGalleryComponent', () => {
  let component: PhotoGalleryComponent;

  beforeEach(() => {
    component = new PhotoGalleryComponent();
  });

  it('should update filteredPhotosCount when rating changes', () => {
    component.photos.set([
      { id: 1, rating: 3 },
      { id: 2, rating: 5 }
    ]);
    component.selectedRating.set(4);

    expect(component.filteredPhotosCount()).toBe(1);
  });
});
