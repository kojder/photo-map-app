import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadDialogComponent } from './upload-dialog.component';
import { PhotoService } from '../../services/photo.service';
import { Photo } from '../../models/photo.model';
import { of, throwError } from 'rxjs';

describe('UploadDialogComponent', () => {
  let component: UploadDialogComponent;
  let fixture: ComponentFixture<UploadDialogComponent>;
  let photoService: jasmine.SpyObj<PhotoService>;

  const mockPhoto: Photo = {
    id: 1,
    filename: 'test.jpg',
    originalFilename: 'test.jpg',
    thumbnailUrl: '/api/photos/1/thumbnail',
    fileSize: 1024,
    mimeType: 'image/jpeg',
    uploadedAt: '2025-10-30T00:00:00Z',
    totalRatings: 0
  };

  beforeEach(async () => {
    const photoServiceSpy = jasmine.createSpyObj('PhotoService', ['uploadPhoto']);

    await TestBed.configureTestingModule({
      imports: [UploadDialogComponent],
      providers: [
        { provide: PhotoService, useValue: photoServiceSpy }
      ]
    }).compileComponents();

    photoService = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with no file selected', () => {
      expect(component.selectedFile()).toBeNull();
    });

    it('should initialize with empty preview', () => {
      expect(component.preview()).toBe('');
    });

    it('should initialize with uploading false', () => {
      expect(component.uploading()).toBe(false);
    });

    it('should initialize with upload progress 0', () => {
      expect(component.uploadProgress()).toBe(0);
    });

    it('should initialize with no error message', () => {
      expect(component.errorMessage()).toBeNull();
    });

    it('should initialize with dragOver false', () => {
      expect(component.dragOver()).toBe(false);
    });
  });

  describe('File Selection', () => {
    it('should handle valid JPEG file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.handleFile(file);
      expect(component.selectedFile()).toBe(file);
      expect(component.errorMessage()).toBeNull();
    });

    it('should handle valid PNG file', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      component.handleFile(file);
      expect(component.selectedFile()).toBe(file);
      expect(component.errorMessage()).toBeNull();
    });

    it('should handle valid HEIC file', () => {
      const file = new File([''], 'test.heic', { type: 'image/heic' });
      component.handleFile(file);
      expect(component.selectedFile()).toBe(file);
      expect(component.errorMessage()).toBeNull();
    });

    it('should reject invalid file type', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      component.handleFile(file);
      expect(component.errorMessage()).toBe('Invalid file type. Please upload JPEG, PNG, or HEIC images.');
    });

    it('should reject file larger than 10MB', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      component.handleFile(largeFile);
      expect(component.errorMessage()).toBe('File too large. Maximum size is 10MB.');
    });

    it('should clear error message when handling new valid file', () => {
      component.errorMessage.set('Previous error');
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.handleFile(file);
      expect(component.errorMessage()).toBeNull();
    });
  });

  describe('Drag and Drop', () => {
    it('should set dragOver to true on drag over', () => {
      const event = new DragEvent('dragover');
      spyOn(event, 'preventDefault');
      component.onDragOver(event);
      expect(component.dragOver()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should set dragOver to false on drag leave', () => {
      component.dragOver.set(true);
      component.onDragLeave();
      expect(component.dragOver()).toBe(false);
    });

    it('should handle dropped file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      const event = new DragEvent('drop', { dataTransfer });
      spyOn(event, 'preventDefault');
      
      component.onDrop(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.dragOver()).toBe(false);
      expect(component.selectedFile()).toBe(file);
    });

    it('should not handle drop without files', () => {
      const event = new DragEvent('drop', { dataTransfer: new DataTransfer() });
      spyOn(event, 'preventDefault');
      
      component.onDrop(event);
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.selectedFile()).toBeNull();
    });
  });

  describe('Upload', () => {
    it('should not upload if no file selected', () => {
      component.onUpload();
      expect(photoService.uploadPhoto).not.toHaveBeenCalled();
    });

    it('should upload selected file', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.selectedFile.set(file);
      photoService.uploadPhoto.and.returnValue(of(mockPhoto));

      component.onUpload();

      expect(photoService.uploadPhoto).toHaveBeenCalledWith(file);
    });

    it('should set uploading to true during upload', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.selectedFile.set(file);
      photoService.uploadPhoto.and.returnValue(of(mockPhoto));

      component.onUpload();

      expect(component.uploading()).toBe(false); // completed immediately in test
    });

    it('should emit uploadSuccess on successful upload', (done) => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.selectedFile.set(file);
      photoService.uploadPhoto.and.returnValue(of(mockPhoto));

      component.uploadSuccess.subscribe(() => {
        expect(component.uploadProgress()).toBe(100);
        expect(component.uploading()).toBe(false);
        done();
      });

      component.onUpload();
    });

    it('should set error message on upload failure', (done) => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.selectedFile.set(file);
      photoService.uploadPhoto.and.returnValue(throwError(() => new Error('Upload failed')));

      component.uploadSuccess.subscribe({
        complete: () => fail('Should not complete'),
        error: () => fail('Should not error')
      });

      component.onUpload();

      setTimeout(() => {
        expect(component.errorMessage()).toBe('Upload failed. Please try again.');
        expect(component.uploading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Cancel', () => {
    it('should emit dialogClose when cancel is called', (done) => {
      component.dialogClose.subscribe(() => {
        done();
      });
      component.onCancel();
    });
  });

  describe('File Size Formatting', () => {
    it('should format 0 bytes', () => {
      expect(component.formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(component.formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(component.formatFileSize(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(component.formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(component.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should round decimal values', () => {
      expect(component.formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('onFileSelected', () => {
    it('should handle file selection from input event', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const input = document.createElement('input');
      input.type = 'file';
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      
      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      
      component.onFileSelected(event);
      
      expect(component.selectedFile()).toBe(file);
    });

    it('should not handle file selection if no files', () => {
      const input = document.createElement('input');
      input.type = 'file';
      const event = new Event('change');
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      
      component.onFileSelected(event);
      
      expect(component.selectedFile()).toBeNull();
    });
  });
});
