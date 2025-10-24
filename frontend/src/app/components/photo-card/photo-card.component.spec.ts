import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PhotoCardComponent } from './photo-card.component';
import { PhotoService } from '../../services/photo.service';
import { Photo, RatingResponse } from '../../models/photo.model';
import { of, throwError } from 'rxjs';

describe('PhotoCardComponent', () => {
  let component: PhotoCardComponent;
  let fixture: ComponentFixture<PhotoCardComponent>;
  let photoServiceSpy: jasmine.SpyObj<PhotoService>;

  const mockPhoto: Photo = {
    id: 1,
    filename: 'test.jpg',
    originalFilename: 'test-original.jpg',
    thumbnailUrl: '/api/photos/1/thumbnail',
    fileSize: 1024,
    mimeType: 'image/jpeg',
    uploadedAt: '2024-01-01T00:00:00Z',
    averageRating: 4.5,
    totalRatings: 10,
    userRating: 5
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('PhotoService', [
      'ratePhoto',
      'clearRating',
      'deletePhoto'
    ]);

    await TestBed.configureTestingModule({
      imports: [PhotoCardComponent, HttpClientTestingModule],
      providers: [
        { provide: PhotoService, useValue: spy }
      ]
    }).compileComponents();

    photoServiceSpy = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>;
    fixture = TestBed.createComponent(PhotoCardComponent);
    component = fixture.componentInstance;
    component.photo = mockPhoto;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getThumbnailUrl', () => {
    it('should return correct thumbnail URL', () => {
      const url = component.getThumbnailUrl();
      expect(url).toBe('/api/photos/1/thumbnail');
    });
  });

  describe('getStars', () => {
    it('should return correct number of star emojis', () => {
      expect(component.getStars(3)).toBe('⭐⭐⭐');
      expect(component.getStars(5)).toBe('⭐⭐⭐⭐⭐');
      expect(component.getStars(0)).toBe('');
    });

    it('should handle decimal ratings by flooring', () => {
      expect(component.getStars(4.7)).toBe('⭐⭐⭐⭐');
      expect(component.getStars(2.3)).toBe('⭐⭐');
    });
  });

  describe('onRate', () => {
    it('should show rating input', () => {
      expect(component.showRatingInput()).toBe(false);
      component.onRate();
      expect(component.showRatingInput()).toBe(true);
    });
  });

  describe('onSelectRating', () => {
    it('should call PhotoService.ratePhoto with correct parameters', () => {
      const mockRating: RatingResponse = {
        id: 1,
        photoId: 1,
        userId: 1,
        rating: 5,
        createdAt: '2024-01-01T00:00:00Z'
      };
      photoServiceSpy.ratePhoto.and.returnValue(of(mockRating));

      component.onSelectRating(5);

      expect(photoServiceSpy.ratePhoto).toHaveBeenCalledWith(1, 5);
      expect(component.selectedRating()).toBe(5);
      expect(component.loading()).toBe(false);
      expect(component.showRatingInput()).toBe(false);
    });

    it('should handle rating error gracefully', () => {
      photoServiceSpy.ratePhoto.and.returnValue(throwError(() => new Error('Rating failed')));
      spyOn(console, 'error');

      component.onSelectRating(5);

      expect(component.loading()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it('should set loading state during rating', () => {
      photoServiceSpy.ratePhoto.and.returnValue(of({} as RatingResponse));

      component.onSelectRating(4);

      expect(component.loading()).toBe(false);
    });
  });

  describe('onClearRating', () => {
    it('should call PhotoService.clearRating after confirmation', () => {
      photoServiceSpy.clearRating.and.returnValue(of(void 0));
      spyOn(window, 'confirm').and.returnValue(true);

      component.onClearRating();

      expect(window.confirm).toHaveBeenCalledWith('Czy na pewno chcesz usunąć ocenę?');
      expect(photoServiceSpy.clearRating).toHaveBeenCalledWith(1);
      expect(component.loading()).toBe(false);
    });

    it('should not call PhotoService if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.onClearRating();

      expect(photoServiceSpy.clearRating).not.toHaveBeenCalled();
    });

    it('should handle clear rating error gracefully', () => {
      photoServiceSpy.clearRating.and.returnValue(throwError(() => new Error('Clear failed')));
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'error');

      component.onClearRating();

      expect(component.loading()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('onDelete', () => {
    it('should call PhotoService.deletePhoto and emit photoDeleted after confirmation', () => {
      photoServiceSpy.deletePhoto.and.returnValue(of(void 0));
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component.photoDeleted, 'emit');

      component.onDelete();

      expect(window.confirm).toHaveBeenCalledWith('Czy na pewno chcesz usunąć to zdjęcie?');
      expect(photoServiceSpy.deletePhoto).toHaveBeenCalledWith(1);
      expect(component.photoDeleted.emit).toHaveBeenCalledWith(1);
      expect(component.loading()).toBe(false);
    });

    it('should not call PhotoService if user cancels confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.onDelete();

      expect(photoServiceSpy.deletePhoto).not.toHaveBeenCalled();
    });

    it('should handle delete error gracefully', () => {
      photoServiceSpy.deletePhoto.and.returnValue(throwError(() => new Error('Delete failed')));
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'error');

      component.onDelete();

      expect(component.loading()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('cancelRating', () => {
    it('should reset rating input state', () => {
      component.showRatingInput.set(true);
      component.selectedRating.set(3);

      component.cancelRating();

      expect(component.showRatingInput()).toBe(false);
      expect(component.selectedRating()).toBe(0);
    });
  });
});
