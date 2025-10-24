import { Component, OnInit, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { Photo } from '../../models/photo.model';
import { PhotoService } from '../../services/photo.service';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map?: L.Map;
  private markerClusterGroup?: L.MarkerClusterGroup;
  private resizeObserver?: ResizeObserver;

  photos = signal<Photo[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private photoService: PhotoService,
    private filterService: FilterService
  ) {
    this.fixLeafletIconPaths();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private fixLeafletIconPaths(): void {
    const iconRetinaUrl = '/marker-icon-2x.png';
    const iconUrl = '/marker-icon.png';
    const shadowUrl = '/marker-shadow.png';

    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl
    });
  }

  ngOnInit(): void {
    this.loadPhotos();

    this.filterService.filters$.subscribe(() => {
      this.loadPhotos();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = { ...this.filterService.currentFilters(), hasGps: true };

    this.photoService.getAllPhotos(filters).subscribe({
      next: (response) => {
        this.photos.set(response.content);
        this.loading.set(false);
        if (this.map) {
          this.updateMarkers();
        }
      },
      error: (error) => {
        console.error('Error loading photos:', error);
        this.errorMessage.set('Failed to load photos. Please try again.');
        this.loading.set(false);
      }
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

    this.updateMarkers();
  }

  updateMarkers(): void {
    if (!this.map || !this.markerClusterGroup) return;

    this.markerClusterGroup.clearLayers();

    const photosWithGps = this.photos().filter(p => p.gpsLatitude && p.gpsLongitude);

    if (photosWithGps.length === 0) return;

    photosWithGps.forEach(photo => {
      const marker = L.marker([photo.gpsLatitude!, photo.gpsLongitude!]);

      const thumbnailUrl = `/api/photos/${photo.id}/thumbnail`;
      const ratingDisplay = photo.averageRating
        ? `⭐ ${photo.averageRating.toFixed(1)} (${photo.totalRatings})`
        : 'No rating yet';

      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          <img src="${thumbnailUrl}" alt="${photo.originalFilename}" style="width: 128px; height: 96px; object-fit: cover; border-radius: 4px;" />
          <div style="margin-top: 8px; font-weight: 600;">${photo.originalFilename}</div>
          <div style="margin-top: 4px; color: #666;">${ratingDisplay}</div>
          <a href="/gallery" style="display: inline-block; margin-top: 8px; color: #3b82f6; text-decoration: none;">View in Gallery</a>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.markerClusterGroup!.addLayer(marker);
    });

    const bounds = L.latLngBounds(photosWithGps.map(p => [p.gpsLatitude!, p.gpsLongitude!]));
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }
}
