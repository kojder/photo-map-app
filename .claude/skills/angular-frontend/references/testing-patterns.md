# Testing Patterns

Testing patterns for Photo Map MVP: Jasmine + Karma for unit tests, component testing, service testing.

## Component Testing

### Basic Component Test

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoGalleryComponent } from './photo-gallery.component';
import { PhotoService } from '../../services/photo.service';

describe('PhotoGalleryComponent', () => {
  let component: PhotoGalleryComponent;
  let fixture: ComponentFixture<PhotoGalleryComponent>;
  let photoService: jasmine.SpyObj<PhotoService>;

  beforeEach(async () => {
    // Create spy object
    const photoServiceSpy = jasmine.createSpyObj('PhotoService', ['loadPhotos', 'getPhotos']);

    await TestBed.configureTestingModule({
      imports: [PhotoGalleryComponent], // Standalone component!
      providers: [
        { provide: PhotoService, useValue: photoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoGalleryComponent);
    component = fixture.componentInstance;
    photoService = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load photos on init', () => {
    component.ngOnInit();
    expect(photoService.loadPhotos).toHaveBeenCalled();
  });

  it('should display loading state', () => {
    component.loading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="loading-spinner"]')).toBeTruthy();
  });
});
```

### Testing with Signals

```typescript
it('should update photos signal', () => {
  const mockPhotos: Photo[] = [
    { id: 1, fileName: 'photo1.jpg', rating: 8 },
    { id: 2, fileName: 'photo2.jpg', rating: 9 }
  ];

  component.photos.set(mockPhotos);

  expect(component.photos()).toEqual(mockPhotos);
  expect(component.photos().length).toBe(2);
});

it('should compute filtered photos', () => {
  component.photos.set([
    { id: 1, fileName: 'photo1.jpg', rating: 5 },
    { id: 2, fileName: 'photo2.jpg', rating: 8 }
  ]);
  component.selectedRating.set(7);

  const filtered = component.filteredPhotos();

  expect(filtered.length).toBe(1);
  expect(filtered[0].rating).toBe(8);
});
```

### Testing @Input and @Output

```typescript
describe('PhotoCardComponent', () => {
  let component: PhotoCardComponent;
  let fixture: ComponentFixture<PhotoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoCardComponent);
    component = fixture.componentInstance;
  });

  it('should display photo data', () => {
    const mockPhoto: Photo = {
      id: 1,
      fileName: 'test.jpg',
      rating: 8,
      takenAt: new Date()
    };

    component.photo = mockPhoto;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('test.jpg');
    expect(compiled.textContent).toContain('8');
  });

  it('should emit photoClick event', () => {
    spyOn(component.photoClick, 'emit');

    component.photo = { id: 1, fileName: 'test.jpg', rating: 8 };
    component.onClick();

    expect(component.photoClick.emit).toHaveBeenCalledWith(1);
  });

  it('should emit ratingChange event', () => {
    spyOn(component.ratingChange, 'emit');

    component.photo = { id: 1, fileName: 'test.jpg', rating: 8 };
    component.onRate(9);

    expect(component.ratingChange.emit).toHaveBeenCalledWith({ photoId: 1, rating: 9 });
  });
});
```

### Testing with Test IDs

```typescript
it('should have rate button', () => {
  component.photo = { id: 1, fileName: 'test.jpg', rating: 8 };
  fixture.detectChanges();

  const rateButton = fixture.nativeElement.querySelector('[data-testid="photo-card-rate-button"]');
  expect(rateButton).toBeTruthy();
});

it('should trigger delete on button click', () => {
  spyOn(component, 'onDelete');

  component.photo = { id: 1, fileName: 'test.jpg', rating: 8 };
  fixture.detectChanges();

  const deleteButton = fixture.nativeElement.querySelector('[data-testid="photo-card-delete-button"]') as HTMLElement;
  deleteButton.click();

  expect(component.onDelete).toHaveBeenCalled();
});
```

## Service Testing

### Basic Service Test

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PhotoService } from './photo.service';

describe('PhotoService', () => {
  let service: PhotoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PhotoService]
    });

    service = TestBed.inject(PhotoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verify no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch photos', () => {
    const mockPhotos: Photo[] = [
      { id: 1, fileName: 'photo1.jpg', rating: 8 },
      { id: 2, fileName: 'photo2.jpg', rating: 9 }
    ];

    service.getPhotos().subscribe(photos => {
      expect(photos.length).toBe(2);
      expect(photos).toEqual(mockPhotos);
    });

    const req = httpMock.expectOne('/api/photos');
    expect(req.request.method).toBe('GET');
    req.flush(mockPhotos);
  });

  it('should handle error', () => {
    service.getPhotos().subscribe({
      next: () => fail('should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne('/api/photos');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });
});
```

### Testing BehaviorSubject

```typescript
it('should update photos$ observable', (done) => {
  const mockPhotos: Photo[] = [
    { id: 1, fileName: 'photo1.jpg', rating: 8 }
  ];

  service.photos$.subscribe(photos => {
    expect(photos).toEqual(mockPhotos);
    done();
  });

  // Simulate state update
  service['photosSubject'].next(mockPhotos);
});

it('should provide current photos synchronously', () => {
  const mockPhotos: Photo[] = [
    { id: 1, fileName: 'photo1.jpg', rating: 8 }
  ];

  service['photosSubject'].next(mockPhotos);

  expect(service.currentPhotos).toEqual(mockPhotos);
});
```

### Testing with Spy

```typescript
it('should call photoService.loadPhotos', () => {
  const photoService = TestBed.inject(PhotoService);
  spyOn(photoService, 'loadPhotos');

  component.ngOnInit();

  expect(photoService.loadPhotos).toHaveBeenCalled();
});

it('should call photoService.getPhotos with filters', () => {
  const photoService = TestBed.inject(PhotoService);
  spyOn(photoService, 'getPhotos').and.returnValue(of([]));

  component.loadPhotos({ minRating: 8 });

  expect(photoService.getPhotos).toHaveBeenCalledWith({ minRating: 8 });
});
```

## Guard Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(null as any, { url: '/gallery' } as any)
    );

    expect(result).toBe(true);
  });

  it('should redirect to login when not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);
    const urlTree = {} as UrlTree;
    router.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(null as any, { url: '/gallery' } as any)
    );

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/gallery' }
    });
  });
});
```

## Async Testing

### Using fakeAsync and tick

```typescript
import { fakeAsync, tick } from '@angular/core/testing';

it('should debounce search input', fakeAsync(() => {
  component.onSearchInput('test');

  tick(200); // Wait 200ms
  expect(component.searchResults().length).toBe(0); // Not yet

  tick(100); // Total 300ms
  expect(component.searchResults().length).toBeGreaterThan(0); // Now searched
}));
```

### Using done callback

```typescript
it('should load photos asynchronously', (done) => {
  const mockPhotos: Photo[] = [{ id: 1, fileName: 'test.jpg', rating: 8 }];

  service.getPhotos().subscribe(photos => {
    expect(photos).toEqual(mockPhotos);
    done(); // Signal test completion
  });

  const req = httpMock.expectOne('/api/photos');
  req.flush(mockPhotos);
});
```

## Running Tests

```bash
# Run all tests
ng test

# Run tests once (CI mode)
ng test --watch=false

# Run tests with coverage
ng test --code-coverage

# Run specific test file
ng test --include='**/photo-gallery.component.spec.ts'
```

## Coverage Report

```bash
ng test --code-coverage --watch=false
```

Coverage report generated in `coverage/` directory. Open `coverage/index.html` in browser.

## Best Practices

**Do:**
- ✅ Test component behavior, not implementation
- ✅ Use Test IDs for element selection
- ✅ Mock external dependencies (services, HTTP)
- ✅ Test @Input/@Output communication
- ✅ Test error scenarios
- ✅ Aim for >70% coverage

**Don't:**
- ❌ Don't test framework behavior
- ❌ Don't test private methods directly
- ❌ Don't skip afterEach cleanup (httpMock.verify())
- ❌ Don't forget detectChanges() after setting @Input
- ❌ Don't use real HTTP calls in tests
