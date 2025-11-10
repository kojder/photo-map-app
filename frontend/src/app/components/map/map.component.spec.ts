import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError, delay } from 'rxjs';
import { MapComponent } from './map.component';
import { PhotoService } from '../../services/photo.service';
import { FilterService } from '../../services/filter.service';
import { PhotoViewerService } from '../../services/photo-viewer.service';
import { HttpClient } from '@angular/common/http';
import L from 'leaflet';
import { Photo } from '../../models/photo.model';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let photoService: jasmine.SpyObj<PhotoService>;
  let filterService: jasmine.SpyObj<FilterService>;
  let photoViewerService: jasmine.SpyObj<PhotoViewerService>;
  let httpClient: jasmine.SpyObj<HttpClient>;

  const mockPhotos: Photo[] = [
    {
      id: 1,
      filename: 'stored1.jpg',
      originalFilename: 'test1.jpg',
      thumbnailUrl: '/api/photos/1/thumbnail',
      uploadedAt: '2024-01-01T10:00:00',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      gpsLatitude: 52.2297,
      gpsLongitude: 21.0122,
      takenAt: '2024-01-01T10:00:00',
      cameraMake: 'Canon',
      cameraModel: 'EOS 5D',
      averageRating: 4.5,
      totalRatings: 10,
      userRating: 5
    },
    {
      id: 2,
      filename: 'stored2.jpg',
      originalFilename: 'test2.jpg',
      thumbnailUrl: '/api/photos/2/thumbnail',
      uploadedAt: '2024-01-02T10:00:00',
      fileSize: 2048000,
      mimeType: 'image/jpeg',
      gpsLatitude: 50.0647,
      gpsLongitude: 19.9450,
      takenAt: '2024-01-02T10:00:00',
      cameraMake: 'Nikon',
      cameraModel: 'D850',
      averageRating: 0,
      totalRatings: 0,
      userRating: undefined
    }
  ];

  beforeEach(async () => {
    const photoServiceSpy = jasmine.createSpyObj('PhotoService', ['getAllPhotos']);
    const filterServiceSpy = jasmine.createSpyObj('FilterService', ['currentFilters'], {
      filters$: of({})
    });
    const photoViewerServiceSpy = jasmine.createSpyObj('PhotoViewerService', ['openViewer']);
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);

    await TestBed.configureTestingModule({
      imports: [MapComponent, HttpClientTestingModule],
      providers: [
        { provide: PhotoService, useValue: photoServiceSpy },
        { provide: FilterService, useValue: filterServiceSpy },
        { provide: PhotoViewerService, useValue: photoViewerServiceSpy },
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    photoService = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>;
    filterService = TestBed.inject(FilterService) as jasmine.SpyObj<FilterService>;
    photoViewerService = TestBed.inject(PhotoViewerService) as jasmine.SpyObj<PhotoViewerService>;
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;

    filterService.currentFilters.and.returnValue({});
  });

  afterEach(() => {
    const mapDivs = document.querySelectorAll('#map');
    for (const div of Array.from(mapDivs)) {
      const container = div as any;
      if (container._leaflet_id) {
        delete container._leaflet_id;
      }
    }

    if (component && component['map']) {
      try {
        component.ngOnDestroy();
      } catch (e) {
        console.error('Error during cleanup of component', { component, stacktrace: e });
      }
    }

    for (const div of Array.from(mapDivs)) {
      div.remove();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load photos on init with GPS filter', () => {
    photoService.getAllPhotos.and.returnValue(of({
      content: mockPhotos,
      totalElements: 2,
      totalPages: 1,
      page: { number: 0, size: 10000, totalElements: 2, totalPages: 1 }
    }));
    httpClient.get.and.returnValue(of(new Blob()));

    component.ngOnInit();

    expect(photoService.getAllPhotos).toHaveBeenCalledWith(jasmine.objectContaining({
      hasGps: true,
      size: 10000
    }));
  });

  it('should set loading state when loading photos', fakeAsync(() => {
    photoService.getAllPhotos.and.returnValue(of({
      content: mockPhotos,
      totalElements: 2,
      totalPages: 1,
      page: { number: 0, size: 10000, totalElements: 2, totalPages: 1 }
    }).pipe(delay(0)));
    httpClient.get.and.returnValue(of(new Blob()).pipe(delay(0)));

    expect(component.loading()).toBe(false);
    component.loadPhotos();
    expect(component.loading()).toBe(true);
    tick();
    expect(component.loading()).toBe(false);
  }));

  it('should handle photo loading error', () => {
    const errorResponse = { status: 500, statusText: 'Server Error' };
    photoService.getAllPhotos.and.returnValue(throwError(() => errorResponse));

    component.loadPhotos();

    expect(component.errorMessage()).toBe('Failed to load photos. Please try again.');
    expect(component.loading()).toBe(false);
  });

  it('should load thumbnails for photos', fakeAsync(() => {
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    photoService.getAllPhotos.and.returnValue(of({
      content: mockPhotos,
      totalElements: 2,
      totalPages: 1,
      page: { number: 0, size: 10000, totalElements: 2, totalPages: 1 }
    }));
    httpClient.get.and.returnValue(of(mockBlob));

    component.loadPhotos();
    tick();

    expect(httpClient.get).toHaveBeenCalledTimes(2);
    expect(httpClient.get).toHaveBeenCalledWith('/api/photos/1/thumbnail', jasmine.objectContaining({ responseType: 'blob' }));
    expect(httpClient.get).toHaveBeenCalledWith('/api/photos/2/thumbnail', jasmine.objectContaining({ responseType: 'blob' }));
    expect(component.loading()).toBe(false);
  }));

  it('should handle thumbnail loading error gracefully', fakeAsync(() => {
    photoService.getAllPhotos.and.returnValue(of({
      content: mockPhotos,
      totalElements: 2,
      totalPages: 1,
      page: { number: 0, size: 10000, totalElements: 2, totalPages: 1 }
    }));
    httpClient.get.and.returnValue(throwError(() => ({ status: 404 })));

    component.loadPhotos();
    tick();

    expect(component.loading()).toBe(false);
  }));

  it('should initialize map on AfterViewInit', fakeAsync(() => {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    document.body.appendChild(mapDiv);

    component.ngAfterViewInit();
    tick(250);

    expect(component['map']).toBeDefined();

    component.ngOnDestroy();
    component['map'] = undefined;
    document.body.removeChild(mapDiv);
  }));

  it('should not initialize map if already exists', fakeAsync(() => {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    document.body.appendChild(mapDiv);

    component.ngAfterViewInit();
    tick(250);
    const firstMap = component['map'];

    component.ngAfterViewInit();
    tick(250);
    const secondMap = component['map'];

    expect(firstMap).toBe(secondMap);

    component.ngOnDestroy();
    component['map'] = undefined;
    document.body.removeChild(mapDiv);
  }));

  it('should clean up resources on destroy', fakeAsync(() => {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    document.body.appendChild(mapDiv);

    component.ngAfterViewInit();
    tick(250);
    const mockMap = component['map'];
    spyOn(mockMap!, 'remove');

    component.ngOnDestroy();

    expect(mockMap!.remove).toHaveBeenCalled();

    component['map'] = undefined;
    document.body.removeChild(mapDiv);
  }));

  it('should update markers on map', fakeAsync(() => {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    document.body.appendChild(mapDiv);

    component.ngAfterViewInit();
    tick(250);
    component.photos.set(mockPhotos);

    const markerClusterGroup = component['markerClusterGroup'];
    spyOn(markerClusterGroup!, 'clearLayers');
    spyOn(markerClusterGroup!, 'addLayer');

    component.updateMarkers();

    expect(markerClusterGroup!.clearLayers).toHaveBeenCalled();
    expect(markerClusterGroup!.addLayer).toHaveBeenCalledTimes(2);

    component.ngOnDestroy();
    component['map'] = undefined;
    document.body.removeChild(mapDiv);
  }));

  it('should filter photos without GPS coordinates', fakeAsync(() => {
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    document.body.appendChild(mapDiv);

    component.ngAfterViewInit();
    tick(250);

    const photosWithoutGPS: Photo[] = [
      { ...mockPhotos[0], gpsLatitude: undefined, gpsLongitude: undefined }
    ];
    component.photos.set(photosWithoutGPS);

    const markerClusterGroup = component['markerClusterGroup'];
    spyOn(markerClusterGroup!, 'clearLayers');
    spyOn(markerClusterGroup!, 'addLayer');

    component.updateMarkers();

    expect(markerClusterGroup!.clearLayers).toHaveBeenCalled();
    expect(markerClusterGroup!.addLayer).not.toHaveBeenCalled();

    component.ngOnDestroy();
    component['map'] = undefined;
    document.body.removeChild(mapDiv);
  }));

  it('should open photo viewer on photo click', () => {
    component.photos.set(mockPhotos);
    component.onPhotoClick(1);

    expect(photoViewerService.openViewer).toHaveBeenCalledWith(mockPhotos, 1, '/map');
  });

  it('should display rating with user rating indicator', () => {
    const photo = mockPhotos[0];
    const ratingDisplay = component['getRatingDisplay'](photo);

    expect(ratingDisplay).toContain('4.5');
    expect(ratingDisplay).toContain('(your rating)');
  });

  it('should display rating with total ratings count', () => {
    const photo = { ...mockPhotos[0], userRating: undefined };
    const ratingDisplay = component['getRatingDisplay'](photo);

    expect(ratingDisplay).toContain('4.5');
    expect(ratingDisplay).toContain('(10 ratings)');
  });

  it('should display "No rating yet" for unrated photo', () => {
    const photo = mockPhotos[1];
    const ratingDisplay = component['getRatingDisplay'](photo);

    expect(ratingDisplay).toBe('No rating yet');
  });

  it('should create popup content with thumbnail', () => {
    const photo = mockPhotos[0];
    const thumbnailUrl = 'blob:http://localhost/test';

    const popupContent = component['createPopupContent'](photo, thumbnailUrl);

    expect(popupContent).toContain('test1.jpg');
    expect(popupContent).toContain(thumbnailUrl);
    expect(popupContent).toContain('data-photo-id="1"');
    expect(popupContent).toContain('⭐ 4.5');
  });

  it('should create popup content without thumbnail', () => {
    const photo = mockPhotos[0];

    const popupContent = component['createPopupContent'](photo, '');

    expect(popupContent).toContain('test1.jpg');
    expect(popupContent).toContain('background: #e5e7eb');
    expect(popupContent).not.toContain('<img');
  });

  it('should subscribe to filter changes on init', fakeAsync(() => {
    let filterCallback: any;
    const filters$ = {
      subscribe: jasmine.createSpy('subscribe').and.callFake((callback: any) => {
        filterCallback = callback;
        return { unsubscribe: jasmine.createSpy('unsubscribe') };
      })
    };

    Object.defineProperty(filterService, 'filters$', {
      get: () => filters$,
      configurable: true
    });

    photoService.getAllPhotos.and.returnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: { number: 0, size: 10000, totalElements: 0, totalPages: 0 }
    }));

    component.ngOnInit();
    tick();

    expect(filters$.subscribe).toHaveBeenCalled();
    expect(photoService.getAllPhotos).toHaveBeenCalledTimes(1);

    filterCallback({});
    tick();
    expect(photoService.getAllPhotos).toHaveBeenCalledTimes(2);
  }));

  it('should handle empty photos array when loading thumbnails', fakeAsync(() => {
    photoService.getAllPhotos.and.returnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: { number: 0, size: 10000, totalElements: 0, totalPages: 0 }
    }));

    component.loadPhotos();
    tick();

    expect(component.loading()).toBe(false);
    expect(httpClient.get).not.toHaveBeenCalled();
  }));

  it('should use singular "rating" for single rating count', () => {
    const photo = {
      ...mockPhotos[0],
      userRating: undefined,
      totalRatings: 1
    };
    const ratingDisplay = component['getRatingDisplay'](photo);

    expect(ratingDisplay).toContain('(1 rating)');
  });
});
