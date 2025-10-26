/**
 * Standalone Component Patterns - Angular 18
 *
 * Examples of BAD vs GOOD Angular 18 patterns.
 */

// ========================================
// COMPONENT ARCHITECTURE
// ========================================

// ❌ BAD: Using NgModule (Angular 18 violation!)
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [PhotoGalleryComponent],
  imports: [CommonModule],
  exports: [PhotoGalleryComponent]
})
export class PhotoGalleryModule { }

// ✅ GOOD: Standalone component
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-photo-gallery',
  templateUrl: './photo-gallery.component.html',
  styleUrls: ['./photo-gallery.component.css']
})
export class PhotoGalleryComponent {
  // Component logic
}

// ========================================
// DEPENDENCY INJECTION
// ========================================

// ❌ BAD: Constructor injection (old style)
import { Component } from '@angular/core';
import { PhotoService } from '../services/photo.service';

@Component({
  standalone: true,
  selector: 'app-photo-gallery',
  template: `...`
})
export class PhotoGalleryComponent {
  constructor(private photoService: PhotoService) {}
}

// ✅ GOOD: inject() function (Angular 18)
import { Component, inject } from '@angular/core';
import { PhotoService } from '../services/photo.service';

@Component({
  standalone: true,
  selector: 'app-photo-gallery',
  template: `...`
})
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);
}

// ========================================
// TEMPLATE CONTROL FLOW
// ========================================

// ❌ BAD: Old structural directives
@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isLoading">Loading...</div>
    <div *ngFor="let photo of photos">
      {{ photo.fileName }}
    </div>
  `
})
export class PhotoGalleryComponent {
  isLoading = false;
  photos: Photo[] = [];
}

// ✅ GOOD: Angular 18 control flow (@if, @for)
import { Component, signal } from '@angular/core';

@Component({
  standalone: true,
  template: `
    @if (isLoading()) {
      <div>Loading...</div>
    }
    @for (photo of photos(); track photo.id) {
      <div>{{ photo.fileName }}</div>
    }
  `
})
export class PhotoGalleryComponent {
  readonly isLoading = signal(false);
  readonly photos = signal<Photo[]>([]);
}

// ========================================
// SMART VS DUMB COMPONENTS
// ========================================

// ✅ GOOD: Smart (Container) Component
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoCardComponent } from './photo-card.component';
import { PhotoService } from '../services/photo.service';

@Component({
  standalone: true,
  imports: [CommonModule, PhotoCardComponent],
  selector: 'app-photo-gallery',
  template: `
    @if (isLoading()) {
      <div>Loading photos...</div>
    } @else {
      <div class="grid grid-cols-3 gap-4">
        @for (photo of photos(); track photo.id) {
          <app-photo-card
            [photo]="photo"
            (rate)="onRate($event)"
            data-testid="photo-card"
          />
        }
      </div>
    }
  `
})
export class PhotoGalleryComponent implements OnInit {
  private readonly photoService = inject(PhotoService);

  readonly photos = signal<Photo[]>([]);
  readonly isLoading = signal(false);

  ngOnInit() {
    this.loadPhotos();
  }

  private loadPhotos() {
    this.isLoading.set(true);
    this.photoService.getPhotos().subscribe({
      next: (photos) => {
        this.photos.set(photos);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load photos', error);
        this.isLoading.set(false);
      }
    });
  }

  onRate(event: { photoId: number, rating: number }) {
    this.photoService.ratePhoto(event.photoId, event.rating).subscribe({
      next: () => this.loadPhotos(),
      error: (error) => console.error('Failed to rate photo', error)
    });
  }
}

// ✅ GOOD: Dumb (Presentational) Component
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-photo-card',
  template: `
    <div class="card">
      <img [src]="photo().thumbnailUrl" [alt]="photo().fileName" />
      <h3>{{ photo().fileName }}</h3>
      <div class="rating">
        @for (star of [1, 2, 3, 4, 5]; track star) {
          <button
            (click)="onStarClick(star)"
            [class.active]="star <= photo().rating"
            data-testid="star-button"
          >
            ⭐
          </button>
        }
      </div>
    </div>
  `
})
export class PhotoCardComponent {
  // Input using signal-based API (Angular 18)
  readonly photo = input.required<Photo>();

  // Output using signal-based API (Angular 18)
  readonly rate = output<{ photoId: number, rating: number }>();

  onStarClick(rating: number) {
    this.rate.emit({
      photoId: this.photo().id,
      rating
    });
  }
}

// ========================================
// ROUTING
// ========================================

// ❌ BAD: NgModule-based routing
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: 'gallery', component: PhotoGalleryComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

// ✅ GOOD: Standalone routing (app.routes.ts)
import { Routes } from '@angular/router';
import { PhotoGalleryComponent } from './components/photo-gallery.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'gallery',
    component: PhotoGalleryComponent,
    canActivate: [authGuard]
  }
];

// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes)
  ]
};

// ========================================
// GUARDS (Functional)
// ========================================

// ❌ BAD: Class-based guard (old style)
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}

// ✅ GOOD: Functional guard (Angular 18)
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

// ========================================
// TESTING STANDALONE COMPONENTS
// ========================================

// ✅ GOOD: Testing with standalone imports
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoGalleryComponent } from './photo-gallery.component';
import { PhotoService } from '../services/photo.service';
import { of } from 'rxjs';

describe('PhotoGalleryComponent', () => {
  let component: PhotoGalleryComponent;
  let fixture: ComponentFixture<PhotoGalleryComponent>;
  let photoService: jasmine.SpyObj<PhotoService>;

  beforeEach(() => {
    const photoServiceSpy = jasmine.createSpyObj('PhotoService', ['getPhotos', 'ratePhoto']);

    TestBed.configureTestingModule({
      imports: [PhotoGalleryComponent], // Import standalone component!
      providers: [
        { provide: PhotoService, useValue: photoServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(PhotoGalleryComponent);
    component = fixture.componentInstance;
    photoService = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>;
  });

  it('should load photos on init', () => {
    const mockPhotos = [
      { id: 1, fileName: 'test.jpg', rating: 5 }
    ];
    photoService.getPhotos.and.returnValue(of(mockPhotos));

    component.ngOnInit();

    expect(component.photos()).toEqual(mockPhotos);
    expect(photoService.getPhotos).toHaveBeenCalled();
  });
});

// ========================================
// KEY PRINCIPLES
// ========================================

/**
 * Angular 18 Standalone Principles:
 *
 * 1. NO NgModules:
 *    - All components must have `standalone: true`
 *    - Explicit imports in component metadata
 *    - No declarations, exports, or module files
 *
 * 2. Modern DI:
 *    - Use `inject()` function, not constructor injection
 *    - Services marked `readonly`
 *    - Functional guards, not class-based
 *
 * 3. Control Flow:
 *    - Use @if, @for, @switch (Angular 18)
 *    - NOT *ngIf, *ngFor, *ngSwitch (old)
 *    - Always use `track` in @for loops
 *
 * 4. Component Patterns:
 *    - Smart components: inject services, manage state
 *    - Dumb components: @Input/@Output only, no services
 *    - Signal-based APIs: input.required(), output()
 *
 * 5. Testing:
 *    - Import standalone components in TestBed
 *    - Mock services with jasmine.createSpyObj
 *    - Test component logic, not templates
 */
