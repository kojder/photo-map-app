import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PhotoViewerService, ViewerState } from './photo-viewer.service';
import { Photo } from '../models/photo.model';

describe('PhotoViewerService', () => {
  let service: PhotoViewerService;
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
    },
    {
      id: 3,
      filename: 'photo3.jpg',
      originalFilename: 'photo3.jpg',
      thumbnailUrl: '/api/photos/3/thumbnail',
      fileSize: 3072,
      mimeType: 'image/jpeg',
      gpsLatitude: 51.0,
      gpsLongitude: 20.0,
      takenAt: '2025-01-03T14:00:00',
      uploadedAt: '2025-01-03T14:00:00',
      averageRating: 3.0,
      totalRatings: 1,
      userRating: 3
    }
  ];

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      providers: [
        PhotoViewerService,
        { provide: Router, useValue: routerSpyObj }
      ]
    });
    
    service = TestBed.inject(PhotoViewerService);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('openViewer', () => {
    it('should open viewer with correct state', (done) => {
      service.viewerState$.subscribe((state: ViewerState) => {
        if (state.isOpen) {
          expect(state.isOpen).toBe(true);
          expect(state.photos).toEqual(mockPhotos);
          expect(state.currentIndex).toBe(1);
          expect(state.sourceRoute).toBe('/gallery');
          done();
        }
      });

      service.openViewer(mockPhotos, 2, '/gallery');
    });

    it('should not open viewer if photo not found', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      
      service.openViewer(mockPhotos, 999, '/gallery');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Photo not found in photos array:', 999);
    });
  });

  describe('closeViewer', () => {
    it('should close viewer and navigate to source route', () => {
      service.openViewer(mockPhotos, 2, '/gallery');
      service.closeViewer();
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/gallery']);
    });

    it('should reset state to initial', (done) => {
      service.openViewer(mockPhotos, 2, '/gallery');
      service.closeViewer();
      
      service.viewerState$.subscribe((state: ViewerState) => {
        expect(state.isOpen).toBe(false);
        expect(state.photos).toEqual([]);
        expect(state.currentIndex).toBe(-1);
        done();
      });
    });
  });

  describe('nextPhoto', () => {
    it('should navigate to next photo', (done) => {
      service.openViewer(mockPhotos, 1, '/gallery');
      service.nextPhoto();
      
      service.viewerState$.subscribe((state: ViewerState) => {
        if (state.currentIndex === 1) {
          expect(state.currentIndex).toBe(1);
          done();
        }
      });
    });

    it('should not navigate beyond last photo', () => {
      service.openViewer(mockPhotos, 3, '/gallery');
      const initialIndex = 2; // Last photo (index 2)
      
      service.nextPhoto();
      
      const currentPhoto = service.getCurrentPhoto();
      expect(currentPhoto?.id).toBe(3); // Still at last photo
    });

    it('should not navigate if viewer is closed', () => {
      service.nextPhoto();
      
      const currentPhoto = service.getCurrentPhoto();
      expect(currentPhoto).toBeNull();
    });
  });

  describe('previousPhoto', () => {
    it('should navigate to previous photo', (done) => {
      service.openViewer(mockPhotos, 2, '/gallery');
      service.previousPhoto();
      
      service.viewerState$.subscribe((state: ViewerState) => {
        if (state.currentIndex === 0) {
          expect(state.currentIndex).toBe(0);
          done();
        }
      });
    });

    it('should not navigate before first photo', () => {
      service.openViewer(mockPhotos, 1, '/gallery');
      const initialIndex = 0; // First photo (index 0)
      
      service.previousPhoto();
      
      const currentPhoto = service.getCurrentPhoto();
      expect(currentPhoto?.id).toBe(1); // Still at first photo
    });

    it('should not navigate if viewer is closed', () => {
      service.previousPhoto();
      
      const currentPhoto = service.getCurrentPhoto();
      expect(currentPhoto).toBeNull();
    });
  });

  describe('getCurrentPhoto', () => {
    it('should return current photo when viewer is open', () => {
      service.openViewer(mockPhotos, 2, '/gallery');
      
      const currentPhoto = service.getCurrentPhoto();
      expect(currentPhoto?.id).toBe(2);
    });

    it('should return null when viewer is closed', () => {
      const currentPhoto = service.getCurrentPhoto();
      expect(currentPhoto).toBeNull();
    });
  });

  describe('isFirstPhoto', () => {
    it('should return true when at first photo', () => {
      service.openViewer(mockPhotos, 1, '/gallery');
      
      expect(service.isFirstPhoto()).toBe(true);
    });

    it('should return false when not at first photo', () => {
      service.openViewer(mockPhotos, 2, '/gallery');
      
      expect(service.isFirstPhoto()).toBe(false);
    });
  });

  describe('isLastPhoto', () => {
    it('should return true when at last photo', () => {
      service.openViewer(mockPhotos, 3, '/gallery');
      
      expect(service.isLastPhoto()).toBe(true);
    });

    it('should return false when not at last photo', () => {
      service.openViewer(mockPhotos, 1, '/gallery');
      
      expect(service.isLastPhoto()).toBe(false);
    });
  });
});
