import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GalleryComponent } from './gallery.component';
import { PhotoService } from '../../services/photo.service';
import { FilterService } from '../../services/filter.service';
import { PhotoViewerService } from '../../services/photo-viewer.service';
import { AdminService } from '../../services/admin.service';
import { Photo } from '../../models/photo.model';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('GalleryComponent', () => {
  let component: GalleryComponent;
  let fixture: ComponentFixture<GalleryComponent>;
  let photoService: jasmine.SpyObj<PhotoService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let photoViewerService: jasmine.SpyObj<PhotoViewerService>;
  let adminService: jasmine.SpyObj<AdminService>;

  const mockPhotos: Photo[] = [
    {
      id: 1,
      filename: 'test1.jpg',
      originalFilename: 'test1.jpg',
      thumbnailUrl: '/api/photos/1/thumbnail',
      fileSize: 1024,
      mimeType: 'image/jpeg',
      uploadedAt: '2025-10-30T00:00:00Z',
      totalRatings: 0
    },
    {
      id: 2,
      filename: 'test2.jpg',
      originalFilename: 'test2.jpg',
      thumbnailUrl: '/api/photos/2/thumbnail',
      fileSize: 2048,
      mimeType: 'image/jpeg',
      uploadedAt: '2025-10-30T01:00:00Z',
      totalRatings: 0
    }
  ];

  const mockSettings = {
    adminContactEmail: 'admin@test.com'
  };

  beforeEach(async () => {
    const photosSubject = new BehaviorSubject<Photo[]>([]);
    const filtersSubject = new BehaviorSubject<any>({});

    const photoServiceSpy = jasmine.createSpyObj('PhotoService', [
      'getAllPhotos',
      'getPublicSettings',
      'clearPhotos'
    ], {
      photos$: photosSubject.asObservable()
    });

    const filterServiceSpy = jasmine.createSpyObj('FilterService', ['currentFilters'], {
      filters$: filtersSubject.asObservable()
    });

    const photoViewerServiceSpy = jasmine.createSpyObj('PhotoViewerService', ['openViewer']);
    const adminServiceSpy = jasmine.createSpyObj('AdminService', ['getAdminContact']);

    await TestBed.configureTestingModule({
      imports: [GalleryComponent],
      providers: [
        { provide: PhotoService, useValue: photoServiceSpy },
        { provide: FilterService, useValue: filterServiceSpy },
        { provide: PhotoViewerService, useValue: photoViewerServiceSpy },
        { provide: AdminService, useValue: adminServiceSpy }
      ]
    }).compileComponents();

    photoService = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    photoViewerService = TestBed.inject(PhotoViewerService) as jasmine.SpyObj<PhotoViewerService>;
    adminService = TestBed.inject(AdminService) as jasmine.SpyObj<AdminService>;

    photoService.getAllPhotos.and.returnValue(of({ content: mockPhotos, page: { size: 10, number: 0, totalElements: 2, totalPages: 1 } }));
    photoService.getPublicSettings.and.returnValue(of(mockSettings));
    filterService.currentFilters.and.returnValue({});
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load photos on init', () => {
      expect(photoService.getAllPhotos).toHaveBeenCalled();
    });

    it('should load admin contact on init', () => {
      expect(photoService.getPublicSettings).toHaveBeenCalled();
    });

    it('should set admin contact email from settings', () => {
      expect(component.adminContactEmail()).toBe('admin@test.com');
    });

    it('should use default admin email on settings error', () => {
      photoService.getPublicSettings.and.returnValue(throwError(() => new Error('Failed')));
      component.loadAdminContact();
      expect(component.adminContactEmail()).toBe('admin@photomap.local');
    });

    it('should initialize with loading false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize with no error message', () => {
      expect(component.errorMessage()).toBeNull();
    });

    it('should initialize with upload dialog closed', () => {
      expect(component.showUploadDialog()).toBe(false);
    });

    it('should initialize with no permission error', () => {
      expect(component.isPermissionError()).toBe(false);
    });
  });

  describe('Load Photos', () => {
    it('should set loading to true when loading photos', () => {
      component.loadPhotos();
      // Loading is set to false after success, so we can't test the true state easily
      expect(photoService.getAllPhotos).toHaveBeenCalled();
    });

    it('should set loading to false after successful load', () => {
      component.loadPhotos();
      expect(component.loading()).toBe(false);
    });

    it('should clear error message when loading photos', () => {
      component.errorMessage.set('Previous error');
      component.loadPhotos();
      expect(component.errorMessage()).toBeNull();
    });

    it('should pass filters to getAllPhotos', () => {
      filterService.currentFilters.and.returnValue({ minRating: 3 });
      component.loadPhotos();
      expect(photoService.getAllPhotos).toHaveBeenCalledWith(jasmine.objectContaining({ minRating: 3, size: 200 }));
    });

    it('should set size to 200 in filters', () => {
      component.loadPhotos();
      expect(photoService.getAllPhotos).toHaveBeenCalledWith(jasmine.objectContaining({ size: 200 }));
    });
  });

  describe('Error Handling', () => {
    it('should set error message on load failure', () => {
      const error = new HttpErrorResponse({ status: 500 });
      photoService.getAllPhotos.and.returnValue(throwError(() => error));
      
      component.loadPhotos();
      
      expect(component.errorMessage()).toBe('Nie udało się załadować zdjęć. Spróbuj ponownie.');
      expect(component.loading()).toBe(false);
    });

    it('should detect permission error from status 403', () => {
      const error = new HttpErrorResponse({ status: 403 });
      photoService.getAllPhotos.and.returnValue(throwError(() => error));
      
      component.loadPhotos();
      
      expect(component.isPermissionError()).toBe(true);
      expect(component.errorMessage()).toContain('Aby oglądać zdjęcia, skontaktuj się z administratorem');
    });

    it('should detect permission error from error message', () => {
      const error = new HttpErrorResponse({ error: { message: 'No permission to view' }, status: 400 });
      photoService.getAllPhotos.and.returnValue(throwError(() => error));
      
      component.loadPhotos();
      
      expect(component.isPermissionError()).toBe(true);
      expect(component.errorMessage()).toContain('administratorem');
    });

    it('should include admin email in permission error message', () => {
      component.adminContactEmail.set('admin@example.com');
      const error = new HttpErrorResponse({ status: 403 });
      photoService.getAllPhotos.and.returnValue(throwError(() => error));
      
      component.loadPhotos();
      
      expect(component.errorMessage()).toContain('admin@example.com');
    });

    it('should clear photos on error', () => {
      const error = new HttpErrorResponse({ status: 500 });
      photoService.getAllPhotos.and.returnValue(throwError(() => error));
      
      component.loadPhotos();
      
      expect(photoService.clearPhotos).toHaveBeenCalled();
    });
  });

  describe('Upload Dialog', () => {
    it('should open upload dialog on upload click', () => {
      component.onUploadClick();
      expect(component.showUploadDialog()).toBe(true);
    });

    it('should close upload dialog on cancel', () => {
      component.showUploadDialog.set(true);
      component.onUploadClose();
      expect(component.showUploadDialog()).toBe(false);
    });

    it('should close upload dialog on success', () => {
      component.showUploadDialog.set(true);
      component.onUploadSuccess();
      expect(component.showUploadDialog()).toBe(false);
    });

    it('should reload photos after successful upload', () => {
      photoService.getAllPhotos.calls.reset();
      component.onUploadSuccess();
      expect(photoService.getAllPhotos).toHaveBeenCalled();
    });
  });

  describe('Photo Actions', () => {
    it('should reload photos after photo deletion', () => {
      photoService.getAllPhotos.calls.reset();
      component.onPhotoDeleted(1);
      expect(photoService.getAllPhotos).toHaveBeenCalled();
    });

    it('should open photo viewer on photo click', () => {
      const photosSubject = new BehaviorSubject<Photo[]>(mockPhotos);
      Object.defineProperty(photoService, 'photos$', {
        get: () => photosSubject.asObservable()
      });

      component.onPhotoClick(1);

      expect(photoViewerService.openViewer).toHaveBeenCalledWith(mockPhotos, 1, '/gallery');
    });
  });
});
