import { Component, OnInit, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import L from 'leaflet';
import 'leaflet.markercluster';
import { Photo } from '../../models/photo.model';
import { PhotoService } from '../../services/photo.service';
import { FilterService } from '../../services/filter.service';
import { PhotoViewerService } from '../../services/photo-viewer.service';
import { FilterFabComponent } from '../filter-fab/filter-fab.component';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FilterFabComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map?: L.Map;
  private markerClusterGroup?: L.MarkerClusterGroup;
  private resizeObserver?: ResizeObserver;
  private thumbnailUrls = new Map<number, string>();

  photos = signal<Photo[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private photoService: PhotoService,
    private filterService: FilterService,
    private photoViewerService: PhotoViewerService,
    private http: HttpClient
  ) {
    this.fixLeafletIconPaths();
  }

  ngOnDestroy(): void {
    this.thumbnailUrls.forEach(url => URL.revokeObjectURL(url));
    this.thumbnailUrls.clear();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private fixLeafletIconPaths(): void {
    const iconRetinaUrl = 'marker-icon-2x.png';
    const iconUrl = 'marker-icon.png';
    const shadowUrl = 'marker-shadow.png';

    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  ngOnInit(): void {
    this.loadPhotos();

    this.filterService.filters$.subscribe(() => {
      this.loadPhotos();
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = { ...this.filterService.currentFilters(), hasGps: true, size: 10000 };

    this.photoService.getAllPhotos(filters).subscribe({
      next: (response) => {
        this.photos.set(response.content);
        this.loadThumbnails();
      },
      error: (error) => {
        console.error('Error loading photos:', error);
        this.errorMessage.set('Failed to load photos. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private loadThumbnails(): void {
    this.thumbnailUrls.forEach(url => URL.revokeObjectURL(url));
    this.thumbnailUrls.clear();

    const photos = this.photos();
    if (photos.length === 0) {
      this.loading.set(false);
      if (this.map) {
        this.updateMarkers();
      }
      return;
    }

    let loadedCount = 0;
    const totalCount = photos.length;

    photos.forEach(photo => {
      this.http.get(`/api/photos/${photo.id}/thumbnail`, {
        responseType: 'blob'
      }).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.thumbnailUrls.set(photo.id, objectUrl);
          loadedCount++;

          if (loadedCount === totalCount) {
            this.loading.set(false);
            if (this.map) {
              this.updateMarkers();
            }
          }
        },
        error: (error) => {
          console.error(`Error loading thumbnail for photo ${photo.id}:`, error);
          loadedCount++;

          if (loadedCount === totalCount) {
            this.loading.set(false);
            if (this.map) {
              this.updateMarkers();
            }
          }
        }
      });
    });
  }

  initMap(): void {
    if (this.map) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }

    this.map = L.map('map').setView([52.2297, 21.0122], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.markerClusterGroup = L.markerClusterGroup();
    this.map.addLayer(this.markerClusterGroup);

    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    });
    this.resizeObserver.observe(mapElement);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 200);

    if (this.photos().length > 0 && !this.loading()) {
      this.updateMarkers();
    }
  }

  updateMarkers(): void {
    if (!this.map || !this.markerClusterGroup) {
      return;
    }

    this.markerClusterGroup.clearLayers();

    const photosWithGps = this.photos().filter(p => p.gpsLatitude && p.gpsLongitude);

    if (photosWithGps.length === 0) {
      return;
    }

    photosWithGps.forEach(photo => {
      const marker = L.marker([photo.gpsLatitude!, photo.gpsLongitude!]);

      const thumbnailUrl = this.thumbnailUrls.get(photo.id) || '';
      
      let ratingDisplay = 'No rating yet';
      if (photo.averageRating && photo.averageRating > 0) {
        const ratingValue = `⭐ ${photo.averageRating.toFixed(1)}`;
        if (photo.userRating) {
          ratingDisplay = `${ratingValue} (your rating)`;
        } else if (photo.totalRatings > 0) {
          ratingDisplay = `${ratingValue} (${photo.totalRatings} ${photo.totalRatings === 1 ? 'rating' : 'ratings'})`;
        } else {
          ratingDisplay = ratingValue;
        }
      }

      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          ${thumbnailUrl ? `<img 
            src="${thumbnailUrl}" 
            alt="${photo.originalFilename}" 
            data-photo-id="${photo.id}"
            data-testid="map-popup-thumbnail"
            style="width: 128px; height: 96px; object-fit: cover; border-radius: 4px; cursor: pointer;" 
          />` : '<div style="width: 128px; height: 96px; background: #e5e7eb; border-radius: 4px;"></div>'}
          <div style="margin-top: 8px; font-weight: 600;">${photo.originalFilename}</div>
          <div style="margin-top: 4px; color: #666; font-size: 14px;">${ratingDisplay}</div>
        </div>
      `;

      const popup = L.popup().setContent(popupContent);
      
      popup.on('add', () => {
        const popupElement = popup.getElement();
        if (popupElement) {
          const img = popupElement.querySelector('img[data-photo-id]');
          if (img) {
            img.addEventListener('click', (e: Event) => {
              const target = e.target as HTMLImageElement;
              const photoId = parseInt(target.getAttribute('data-photo-id') || '0', 10);
              if (photoId) {
                this.onPhotoClick(photoId);
              }
            });
          }
        }
      });

      marker.bindPopup(popup);
      this.markerClusterGroup!.addLayer(marker);
    });

    const bounds = L.latLngBounds(photosWithGps.map(p => [p.gpsLatitude!, p.gpsLongitude!]));
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  onPhotoClick(photoId: number): void {
    const photos = this.photos();
    this.photoViewerService.openViewer(photos, photoId, '/map');
  }
}
