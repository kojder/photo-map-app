import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoViewerComponent } from './photo-viewer.component';
import { PhotoViewerService } from '../../services/photo-viewer.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Photo } from '../../models/photo.model';
import { ViewerState } from '../../services/photo-viewer.service';

describe('PhotoViewerComponent', () => {
  let component: PhotoViewerComponent;
  let fixture: ComponentFixture<PhotoViewerComponent>;
  let photoViewerService: jasmine.SpyObj<PhotoViewerService>;
  let viewerStateSubject: BehaviorSubject<ViewerState>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockPhotos: Photo[] = [
    {
      id: 1,
      filename: 'photo1.jpg',
      originalFilename: 'photo1.jpg',
      thumbnailUrl: '/api/photos/1/thumbnail',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      uploadedAt: '2025-01-01T10:00:00',
      totalRatings: 0
    },
    {
      id: 2,
      filename: 'photo2.jpg',
      originalFilename: 'photo2.jpg',
      thumbnailUrl: '/api/photos/2/thumbnail',
      fileSize: 2048,
      mimeType: 'image/jpeg',
      gpsLatitude: 50.0,
      gpsLongitude: 19.0,
      takenAt: '2025-01-02T12:00:00',
      uploadedAt: '2025-01-02T12:00:00',
      averageRating: 4.5,
      totalRatings: 2,
      userRating: 5
    }
  ];

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    const initialState: ViewerState = {
      isOpen: false,
      photos: [],
      currentIndex: -1,
      sourceRoute: '/'
    };
    
    viewerStateSubject = new BehaviorSubject<ViewerState>(initialState);
    
    const photoViewerServiceSpy = jasmine.createSpyObj('PhotoViewerService', [
      'closeViewer',
      'nextPhoto',
      'previousPhoto',
      'isFirstPhoto',
      'isLastPhoto'
    ], {
      viewerState$: viewerStateSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [PhotoViewerComponent],
      providers: [
        { provide: PhotoViewerService, useValue: photoViewerServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    photoViewerService = TestBed.inject(PhotoViewerService) as jasmine.SpyObj<PhotoViewerService>;
    fixture = TestBed.createComponent(PhotoViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to viewerState$ and update component state', () => {
      fixture.detectChanges();

      const newState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 1,
        sourceRoute: '/gallery'
      };

      viewerStateSubject.next(newState);
      fixture.detectChanges();

      expect(component.viewerState).toEqual(newState);
      expect(component.currentPhoto).toEqual(mockPhotos[1]);
      expect(component.imageUrl).toBe('/api/photos/2/full');
    });

    it('should clear photo data when viewer is closed', () => {
      fixture.detectChanges();

      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };

      viewerStateSubject.next(openState);
      fixture.detectChanges();

      const closedState: ViewerState = {
        isOpen: false,
        photos: [],
        currentIndex: -1,
        sourceRoute: '/'
      };

      viewerStateSubject.next(closedState);
      fixture.detectChanges();

      expect(component.currentPhoto).toBeNull();
      expect(component.imageUrl).toBe('');
    });
  });

  describe('keyboard navigation', () => {
    beforeEach(() => {
      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(openState);
      fixture.detectChanges();
    });

    it('should close viewer on Escape key', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);

      expect(photoViewerService.closeViewer).toHaveBeenCalled();
    });

    it('should navigate to previous photo on ArrowLeft key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      component.handleKeyboardEvent(event);

      expect(photoViewerService.previousPhoto).toHaveBeenCalled();
    });

    it('should navigate to next photo on ArrowRight key', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      component.handleKeyboardEvent(event);

      expect(photoViewerService.nextPhoto).toHaveBeenCalled();
    });

    it('should ignore keyboard events when viewer is closed', () => {
      const closedState: ViewerState = {
        isOpen: false,
        photos: [],
        currentIndex: -1,
        sourceRoute: '/'
      };
      viewerStateSubject.next(closedState);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);

      expect(photoViewerService.closeViewer).not.toHaveBeenCalled();
    });
  });

  describe('navigation methods', () => {
    it('should call service closeViewer on close', () => {
      component.close();
      expect(photoViewerService.closeViewer).toHaveBeenCalled();
    });

    it('should call service nextPhoto on next', () => {
      component.next();
      expect(photoViewerService.nextPhoto).toHaveBeenCalled();
    });

    it('should call service previousPhoto on previous', () => {
      component.previous();
      expect(photoViewerService.previousPhoto).toHaveBeenCalled();
    });
  });

  describe('boundary checks', () => {
    it('should delegate isFirstPhoto to service', () => {
      photoViewerService.isFirstPhoto.and.returnValue(true);
      expect(component.isFirstPhoto()).toBe(true);
      expect(photoViewerService.isFirstPhoto).toHaveBeenCalled();
    });

    it('should delegate isLastPhoto to service', () => {
      photoViewerService.isLastPhoto.and.returnValue(true);
      expect(component.isLastPhoto()).toBe(true);
      expect(photoViewerService.isLastPhoto).toHaveBeenCalled();
    });
  });

  describe('photoCounter', () => {
    it('should return correct counter string', () => {
      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 1,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(openState);
      fixture.detectChanges();

      expect(component.photoCounter).toBe('2 / 2');
    });

    it('should return empty string when no viewer state', () => {
      component.viewerState = null;
      expect(component.photoCounter).toBe('');
    });
  });

  describe('template rendering', () => {
    it('should render viewer when isOpen is true', () => {
      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(openState);
      fixture.detectChanges();

      const viewerElement = fixture.nativeElement.querySelector('[data-testid="viewer-image"]');
      expect(viewerElement).toBeTruthy();
    });

    it('should not render viewer when isOpen is false', () => {
      fixture.detectChanges();

      const viewerElement = fixture.nativeElement.querySelector('[data-testid="viewer-image"]');
      expect(viewerElement).toBeFalsy();
    });

    it('should display correct image URL', () => {
      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 1,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(openState);
      fixture.detectChanges();

      const imgElement = fixture.nativeElement.querySelector('[data-testid="viewer-image"]') as HTMLImageElement;
      expect(imgElement.src).toContain('/api/photos/2/full');
    });

    it('should hide previous button on first photo', () => {
      photoViewerService.isFirstPhoto.and.returnValue(true);
      
      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(openState);
      fixture.detectChanges();

      const prevButton = fixture.nativeElement.querySelector('[data-testid="viewer-prev-button"]');
      expect(prevButton).toBeFalsy();
    });

    it('should hide next button on last photo', () => {
      photoViewerService.isLastPhoto.and.returnValue(true);
      
      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 1,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(openState);
      fixture.detectChanges();

      const nextButton = fixture.nativeElement.querySelector('[data-testid="viewer-next-button"]');
      expect(nextButton).toBeFalsy();
    });
  });

  describe('touch event handlers', () => {
    beforeEach(() => {
      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(openState);
      fixture.detectChanges();
    });

    // Helper function to create mock TouchEvent
    function createMockTouchEvent(screenX: number, screenY: number): any {
      return {
        changedTouches: [{
          screenX,
          screenY,
          clientX: screenX,
          clientY: screenY
        }]
      };
    }

    it('should navigate to next photo on swipe left', () => {
      // Simulate swipe left (start at 200, end at 100 = -100 delta)
      const touchStartEvent = createMockTouchEvent(200, 100);
      const touchEndEvent = createMockTouchEvent(100, 100);

      component.onTouchStart(touchStartEvent as TouchEvent);
      component.onTouchEnd(touchEndEvent as TouchEvent);

      expect(photoViewerService.nextPhoto).toHaveBeenCalled();
    });

    it('should navigate to previous photo on swipe right', () => {
      // Simulate swipe right (start at 100, end at 200 = +100 delta)
      const touchStartEvent = createMockTouchEvent(100, 100);
      const touchEndEvent = createMockTouchEvent(200, 100);

      component.onTouchStart(touchStartEvent as TouchEvent);
      component.onTouchEnd(touchEndEvent as TouchEvent);

      expect(photoViewerService.previousPhoto).toHaveBeenCalled();
    });

    it('should close viewer on tap (small movement)', () => {
      // Simulate tap (start at 100, end at 105 = 5px delta < TAP_THRESHOLD)
      const touchStartEvent = createMockTouchEvent(100, 100);
      const touchEndEvent = createMockTouchEvent(105, 103);

      component.onTouchStart(touchStartEvent as TouchEvent);
      component.onTouchEnd(touchEndEvent as TouchEvent);

      expect(photoViewerService.closeViewer).toHaveBeenCalled();
    });

    it('should not navigate on small swipe (below threshold)', () => {
      // Simulate small swipe (30px < SWIPE_THRESHOLD 50px but > TAP_THRESHOLD 10px)
      const touchStartEvent = createMockTouchEvent(100, 100);
      const touchEndEvent = createMockTouchEvent(130, 100);

      component.onTouchStart(touchStartEvent as TouchEvent);
      component.onTouchEnd(touchEndEvent as TouchEvent);

      // Small swipe that's neither swipe nor tap - no action taken
      expect(photoViewerService.nextPhoto).not.toHaveBeenCalled();
      expect(photoViewerService.previousPhoto).not.toHaveBeenCalled();
      expect(photoViewerService.closeViewer).not.toHaveBeenCalled();
    });

    it('should not navigate on vertical swipe', () => {
      // Simulate vertical swipe (up/down)
      const touchStartEvent = createMockTouchEvent(100, 100);
      const touchEndEvent = createMockTouchEvent(100, 200);

      component.onTouchStart(touchStartEvent as TouchEvent);
      component.onTouchEnd(touchEndEvent as TouchEvent);

      expect(photoViewerService.nextPhoto).not.toHaveBeenCalled();
      expect(photoViewerService.previousPhoto).not.toHaveBeenCalled();
    });

    it('should track touch movement in onTouchMove', () => {
      const touchStartEvent = createMockTouchEvent(100, 100);
      const touchMoveEvent = createMockTouchEvent(150, 105);
      const touchEndEvent = createMockTouchEvent(200, 110);

      component.onTouchStart(touchStartEvent as TouchEvent);
      component.onTouchMove(touchMoveEvent as TouchEvent);
      component.onTouchEnd(touchEndEvent as TouchEvent);

      // Should use touchEnd position (200, 110)
      expect(photoViewerService.previousPhoto).toHaveBeenCalled();
    });

    it('should ignore touch events when viewer is closed', () => {
      const closedState: ViewerState = {
        isOpen: false,
        photos: [],
        currentIndex: -1,
        sourceRoute: '/'
      };
      viewerStateSubject.next(closedState);
      fixture.detectChanges();

      const touchStartEvent = createMockTouchEvent(100, 100);
      const touchEndEvent = createMockTouchEvent(200, 100);

      component.onTouchStart(touchStartEvent as TouchEvent);
      component.onTouchEnd(touchEndEvent as TouchEvent);

      expect(photoViewerService.previousPhoto).not.toHaveBeenCalled();
      expect(photoViewerService.closeViewer).not.toHaveBeenCalled();
    });

    it('should reset touch positions after gesture handling', () => {
      const touchStartEvent = createMockTouchEvent(100, 100);
      const touchEndEvent = createMockTouchEvent(200, 100);

      component.onTouchStart(touchStartEvent as TouchEvent);
      component.onTouchEnd(touchEndEvent as TouchEvent);

      // After gesture, positions should be reset to 0
      expect(component['touchStartX']).toBe(0);
      expect(component['touchStartY']).toBe(0);
      expect(component['touchEndX']).toBe(0);
      expect(component['touchEndY']).toBe(0);
    });
  });

  describe('Loading states', () => {
    it('should set isImageLoading to true when viewer opens', () => {
      fixture.detectChanges();

      const newState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };

      viewerStateSubject.next(newState);
      fixture.detectChanges();

      expect(component.isImageLoading).toBe(true);
    });

    it('should not show spinner immediately (no flicker)', () => {
      fixture.detectChanges();

      const newState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };

      viewerStateSubject.next(newState);
      fixture.detectChanges();

      // Spinner should NOT be visible immediately
      expect(component.showSpinner).toBe(false);
    });

    it('should show spinner after delay if still loading', (done) => {
      fixture.detectChanges();

      const newState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };

      viewerStateSubject.next(newState);
      fixture.detectChanges();

      // Wait for spinner delay (200ms)
      setTimeout(() => {
        // If still loading, spinner should be visible
        if (component.isImageLoading) {
          expect(component.showSpinner).toBe(true);
        }
        done();
      }, 250);
    });

    it('should set isImageLoading to false when image loads', () => {
      component.isImageLoading = true;
      component.showSpinner = true;
      
      component.onImageLoad();
      
      expect(component.isImageLoading).toBe(false);
      expect(component.showSpinner).toBe(false);
    });

    it('should set isImageLoading to false when image fails to load', () => {
      component.isImageLoading = true;
      component.showSpinner = true;
      
      component.onImageError();
      
      expect(component.isImageLoading).toBe(false);
      expect(component.showSpinner).toBe(false);
    });

    it('should set isImageLoading to false when viewer closes', () => {
      // First open the viewer
      const openState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(openState);
      fixture.detectChanges();

      expect(component.isImageLoading).toBe(true);

      // Then close it
      const closedState: ViewerState = {
        isOpen: false,
        photos: [],
        currentIndex: -1,
        sourceRoute: '/'
      };
      viewerStateSubject.next(closedState);
      fixture.detectChanges();

      expect(component.isImageLoading).toBe(false);
      expect(component.showSpinner).toBe(false);
    });

    it('should reset isImageLoading when navigating to next photo', () => {
      // Open viewer with first photo
      const state1: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(state1);
      fixture.detectChanges();

      expect(component.isImageLoading).toBe(true);

      // Simulate image loaded
      component.onImageLoad();
      expect(component.isImageLoading).toBe(false);

      // Navigate to next photo
      const state2: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 1,
        sourceRoute: '/gallery'
      };
      viewerStateSubject.next(state2);
      fixture.detectChanges();

      // Loading state should be reset
      expect(component.isImageLoading).toBe(true);
    });

    it('should not show spinner if image loads before delay', (done) => {
      fixture.detectChanges();

      const newState: ViewerState = {
        isOpen: true,
        photos: mockPhotos,
        currentIndex: 0,
        sourceRoute: '/gallery'
      };

      viewerStateSubject.next(newState);
      fixture.detectChanges();

      // Simulate fast image load (before 200ms delay)
      setTimeout(() => {
        component.onImageLoad();
        
        // Wait a bit more to ensure spinner timeout didn't trigger
        setTimeout(() => {
          expect(component.showSpinner).toBe(false);
          done();
        }, 100);
      }, 50);
    });
  });
});
