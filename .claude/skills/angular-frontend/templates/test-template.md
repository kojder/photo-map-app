# Testing Checklist (Jasmine + Karma)

Use this checklist when writing unit tests for Angular components and services.

## Component Testing Setup

### Test File Setup

- [ ] Test file named: `component-name.component.spec.ts`
- [ ] Imports:
  - [ ] `ComponentFixture, TestBed` from `@angular/core/testing`
  - [ ] Component under test
  - [ ] Mock services (jasmine.SpyObj)

### TestBed Configuration

- [ ] `beforeEach(async () => { ... })` for async setup
- [ ] `await TestBed.configureTestingModule({ ... }).compileComponents()`
- [ ] Import standalone component: `imports: [MyComponent]`
- [ ] Provide mock services: `providers: [{ provide: Service, useValue: mockService }]`
- [ ] Create component fixture: `fixture = TestBed.createComponent(MyComponent)`
- [ ] Get component instance: `component = fixture.componentInstance`
- [ ] Get injected service: `service = TestBed.inject(Service) as jasmine.SpyObj<Service>`

### Example Setup

```typescript
describe('PhotoGalleryComponent', () => {
  let component: PhotoGalleryComponent;
  let fixture: ComponentFixture<PhotoGalleryComponent>;
  let photoService: jasmine.SpyObj<PhotoService>;

  beforeEach(async () => {
    const photoServiceSpy = jasmine.createSpyObj('PhotoService', ['loadPhotos', 'getPhotos']);

    await TestBed.configureTestingModule({
      imports: [PhotoGalleryComponent], // Standalone!
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
});
```

## Component Testing

### Basic Tests

- [ ] Component creation: `expect(component).toBeTruthy()`
- [ ] Initial state: check signal/property values
- [ ] Method calls: spy on service methods, verify called

### Testing @Input

- [ ] Set @Input value: `component.inputProp = mockValue`
- [ ] Call `fixture.detectChanges()`
- [ ] Assert component behavior or DOM updates

### Testing @Output

- [ ] Spy on output: `spyOn(component.outputEvent, 'emit')`
- [ ] Trigger action that emits event
- [ ] Assert: `expect(component.outputEvent.emit).toHaveBeenCalledWith(expectedValue)`

### Testing Signals

- [ ] Set signal: `component.mySignal.set(value)`
- [ ] Read signal: `expect(component.mySignal()).toBe(value)`
- [ ] Test computed signals: update dependencies, assert computed value

### Testing DOM

- [ ] Get element: `const el = fixture.nativeElement.querySelector('[data-testid="my-element"]')`
- [ ] Check element exists: `expect(el).toBeTruthy()`
- [ ] Check text content: `expect(el.textContent).toContain('expected text')`
- [ ] Trigger click: `el.click()` then `fixture.detectChanges()`

### Testing with Test IDs

```typescript
it('should display loading spinner', () => {
  component.loading.set(true);
  fixture.detectChanges();

  const spinner = fixture.nativeElement.querySelector('[data-testid="loading-spinner"]');
  expect(spinner).toBeTruthy();
});

it('should call onRate when rate button clicked', () => {
  spyOn(component, 'onRate');

  component.photo = { id: 1, fileName: 'test.jpg' };
  fixture.detectChanges();

  const rateButton = fixture.nativeElement.querySelector('[data-testid="photo-card-rate-button"]') as HTMLElement;
  rateButton.click();

  expect(component.onRate).toHaveBeenCalled();
});
```

## Service Testing Setup

### Test File Setup

- [ ] Test file named: `service-name.service.spec.ts`
- [ ] Imports:
  - [ ] `TestBed` from `@angular/core/testing`
  - [ ] `HttpClientTestingModule, HttpTestingController` from `@angular/common/http/testing`
  - [ ] Service under test

### TestBed Configuration

- [ ] `beforeEach(() => { ... })` (sync, no async needed)
- [ ] Import `HttpClientTestingModule`
- [ ] Inject service: `service = TestBed.inject(MyService)`
- [ ] Inject httpMock: `httpMock = TestBed.inject(HttpTestingController)`
- [ ] `afterEach(() => { httpMock.verify(); })` - verify no outstanding requests

### Example Setup

```typescript
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
    httpMock.verify(); // Verify no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
```

## Service Testing

### Testing HTTP GET

```typescript
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
```

### Testing HTTP POST

```typescript
it('should upload photo', () => {
  const mockPhoto: Photo = { id: 1, fileName: 'new.jpg', rating: 0 };
  const file = new File(['content'], 'new.jpg', { type: 'image/jpeg' });

  service.uploadPhoto(file).subscribe(photo => {
    expect(photo).toEqual(mockPhoto);
  });

  const req = httpMock.expectOne('/api/photos/upload');
  expect(req.request.method).toBe('POST');
  expect(req.request.body instanceof FormData).toBe(true);
  req.flush(mockPhoto);
});
```

### Testing HTTP Error

```typescript
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
```

### Testing BehaviorSubject

```typescript
it('should update photos$ observable', (done) => {
  const mockPhotos: Photo[] = [{ id: 1, fileName: 'test.jpg', rating: 8 }];

  service.photos$.subscribe(photos => {
    expect(photos).toEqual(mockPhotos);
    done();
  });

  // Simulate state update
  service['photosSubject'].next(mockPhotos);
});

it('should provide current photos synchronously', () => {
  const mockPhotos: Photo[] = [{ id: 1, fileName: 'test.jpg', rating: 8 }];

  service['photosSubject'].next(mockPhotos);

  expect(service.currentPhotos).toEqual(mockPhotos);
});
```

## Async Testing

### Using done callback

```typescript
it('should load photos asynchronously', (done) => {
  const mockPhotos: Photo[] = [{ id: 1, fileName: 'test.jpg' }];

  service.getPhotos().subscribe(photos => {
    expect(photos).toEqual(mockPhotos);
    done(); // Signal test completion
  });

  const req = httpMock.expectOne('/api/photos');
  req.flush(mockPhotos);
});
```

### Using fakeAsync and tick

```typescript
import { fakeAsync, tick } from '@angular/core/testing';

it('should debounce search', fakeAsync(() => {
  component.onSearchInput('test');

  tick(200); // Wait 200ms
  expect(component.searchResults().length).toBe(0); // Not yet

  tick(100); // Total 300ms
  expect(component.searchResults().length).toBeGreaterThan(0); // Now searched
}));
```

## Running Tests

```bash
# Run all tests
ng test

# Run tests once (CI mode)
ng test --watch=false

# Run with coverage
ng test --code-coverage

# Run specific test file
ng test --include='**/photo-gallery.component.spec.ts'
```

## Coverage Goals

- [ ] Component tests: >80% coverage
- [ ] Service tests: >90% coverage
- [ ] Overall: >70% coverage minimum

## Final Checks

- [ ] All tests pass: `ng test --watch=false`
- [ ] No console errors during tests
- [ ] Coverage meets requirements
- [ ] Test IDs used for element selection
- [ ] Mock services configured correctly
- [ ] No outstanding HTTP requests (`httpMock.verify()`)
- [ ] Async tests use `done` or `fakeAsync`
