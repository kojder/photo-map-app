import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PhotoService } from './photo.service';
import { Photo, PageResponse, RatingResponse } from '../models/photo.model';

describe('PhotoService', () => {
  let service: PhotoService;
  let httpMock: HttpTestingController;
  const baseUrl = '/api/photos';

  const mockPhoto: Photo = {
    id: 1,
    filename: 'test.jpg',
    originalFilename: 'test-original.jpg',
    thumbnailUrl: '/api/photos/1/thumbnail',
    fileSize: 1024,
    mimeType: 'image/jpeg',
    gpsLatitude: 52.2297,
    gpsLongitude: 21.0122,
    uploadedAt: '2024-01-01T00:00:00Z',
    averageRating: 4.5,
    totalRatings: 10,
    userRating: 5
  };

  const mockPageResponse: PageResponse<Photo> = {
    content: [mockPhoto],
    page: {
      size: 20,
      number: 0,
      totalElements: 1,
      totalPages: 1
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PhotoService]
    });
    service = TestBed.inject(PhotoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllPhotos', () => {
    it('should fetch photos without filters', (done) => {
      service.getAllPhotos().subscribe(response => {
        expect(response).toEqual(mockPageResponse);
        expect(response.content.length).toBe(1);
        expect(response.content[0]).toEqual(mockPhoto);
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockPageResponse);
    });

    it('should fetch photos with filters', (done) => {
      const filters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        minRating: 8,
        hasGps: true,
        page: 0,
        size: 10
      };

      service.getAllPhotos(filters).subscribe(response => {
        expect(response).toEqual(mockPageResponse);
        done();
      });

      const req = httpMock.expectOne(req => req.url === baseUrl && req.params.keys().length > 0);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('dateFrom')).toBe('2024-01-01');
      expect(req.request.params.get('minRating')).toBe('8');
      expect(req.request.params.get('hasGps')).toBe('true');
      req.flush(mockPageResponse);
    });

    it('should update photos$ BehaviorSubject on successful fetch', (done) => {
      service.photos$.subscribe(photos => {
        if (photos.length > 0) {
          expect(photos).toEqual([mockPhoto]);
          done();
        }
      });

      service.getAllPhotos().subscribe();

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockPageResponse);
    });
  });

  describe('getPhotoById', () => {
    it('should fetch single photo by id', (done) => {
      service.getPhotoById(1).subscribe(photo => {
        expect(photo).toEqual(mockPhoto);
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPhoto);
    });
  });

  describe('uploadPhoto', () => {
    it('should upload photo file', (done) => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      service.uploadPhoto(file).subscribe(photo => {
        expect(photo).toEqual(mockPhoto);
        done();
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTruthy();
      req.flush(mockPhoto);
    });

    it('should add uploaded photo to photos$ at the beginning', (done) => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      service.photos$.subscribe(photos => {
        if (photos.length === 1) {
          expect(photos[0]).toEqual(mockPhoto);
          done();
        }
      });

      service.uploadPhoto(file).subscribe();

      const req = httpMock.expectOne(baseUrl);
      req.flush(mockPhoto);
    });
  });

  describe('ratePhoto', () => {
    it('should rate photo with valid rating', (done) => {
      const mockRating: RatingResponse = {
        id: 1,
        photoId: 1,
        userId: 1,
        rating: 5,
        createdAt: '2024-01-01T00:00:00Z'
      };

      service.ratePhoto(1, 5).subscribe(response => {
        expect(response).toEqual(mockRating);
        done();
      });

      const rateReq = httpMock.expectOne(`${baseUrl}/1/rating`);
      expect(rateReq.request.method).toBe('PUT');
      expect(rateReq.request.body).toEqual({ rating: 5 });
      rateReq.flush(mockRating);

      const refreshReq = httpMock.expectOne(`${baseUrl}/1`);
      expect(refreshReq.request.method).toBe('GET');
      refreshReq.flush(mockPhoto);
    });
  });

  describe('clearRating', () => {
    it('should clear rating from photo', (done) => {
      service.clearRating(1).subscribe(() => {
        done();
      });

      const deleteReq = httpMock.expectOne(`${baseUrl}/1/rating`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      const refreshReq = httpMock.expectOne(`${baseUrl}/1`);
      expect(refreshReq.request.method).toBe('GET');
      refreshReq.flush(mockPhoto);
    });
  });

  describe('deletePhoto', () => {
    it('should delete photo by id', (done) => {
      service.deletePhoto(1).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should remove deleted photo from photos$', (done) => {
      service['photosSubject'].next([mockPhoto]);

      service.photos$.subscribe(photos => {
        if (photos.length === 0) {
          done();
        }
      });

      service.deletePhoto(1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/1`);
      req.flush(null);
    });
  });
});
