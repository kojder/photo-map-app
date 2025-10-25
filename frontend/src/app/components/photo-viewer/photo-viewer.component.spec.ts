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
});
