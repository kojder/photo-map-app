import { Component, OnInit, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { PhotoService } from '../../services/photo.service';
import { PhotoViewerService } from '../../services/photo-viewer.service';
import { FilterService } from '../../services/filter.service';
import { Photo } from '../../models/photo.model';

/**
 * MapComponent - displays photos on Leaflet map with clustering.
 * Integrates with PhotoService, FilterService, and PhotoViewerService.
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-screen">
      @if (loading()) {
        <div class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }

      @if (error()) {
        <div class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-20">
          {{ error() }}
        </div>
      }

      <!-- Map container -->
      <div id="map" class="w-full h-full"></div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .leaflet-pane img {
      max-width: none;
    }

    :host ::ng-deep .leaflet-container {
      height: 100%;
      width: 100%;
    }

    :host ::ng-deep .marker-cluster-small {
      background-color: rgba(59, 130, 246, 0.6);
    }

    :host ::ng-deep .marker-cluster-small div {
      background-color: rgba(59, 130, 246, 0.8);
    }

    :host ::ng-deep .marker-cluster-medium {
      background-color: rgba(251, 191, 36, 0.6);
    }

    :host ::ng-deep .marker-cluster-medium div {
      background-color: rgba(251, 191, 36, 0.8);
    }

    :host ::ng-deep .marker-cluster-large {
      background-color: rgba(239, 68, 68, 0.6);
    }

    :host ::ng-deep .marker-cluster-large div {
      background-color: rgba(239, 68, 68, 0.8);
    }
  `]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly photoService = inject(PhotoService);
  private readonly photoViewerService = inject(PhotoViewerService);
  private readonly filterService = inject(FilterService);

  private map?: L.Map;
  private markerClusterGroup?: L.MarkerClusterGroup;

  photos = signal<Photo[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPhotos();
    this.subscribeToFilters();
  }

  ngAfterViewInit(): void {
    // Wait for DOM to be ready, then initialize map
    setTimeout(() => this.initializeMap(), 0);
  }

  ngOnDestroy(): void {
    // Cleanup map instance
    this.map?.remove();
  }

  private initializeMap(): void {
    // Create map instance (default view: Warsaw, Poland)
    this.map = L.map('map').setView([52.2297, 21.0122], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Initialize marker cluster group
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 15
    });

    this.map.addLayer(this.markerClusterGroup);

    // Load markers
    this.updateMarkers();
  }

  private loadPhotos(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = { ...this.filterService.currentFilters, hasGps: true };

    this.photoService.getPhotos(filters).subscribe({
      next: (photos) => {
        this.photos.set(photos);
        this.loading.set(false);
        this.updateMarkers();
      },
      error: (err) => {
        this.error.set('Failed to load photos. Please try again.');
        this.loading.set(false);
        console.error('Load photos error:', err);
      }
    });
  }

  private subscribeToFilters(): void {
    this.filterService.filters$.subscribe(() => {
      this.loadPhotos();
    });
  }

  private updateMarkers(): void {
    if (!this.map || !this.markerClusterGroup) {
      return;
    }

    // Clear existing markers
    this.markerClusterGroup.clearLayers();

    const markers: L.Marker[] = [];

    // Create markers for photos with GPS
    this.photos().forEach(photo => {
      if (photo.latitude && photo.longitude) {
        const marker = L.marker([photo.latitude, photo.longitude]);

        // Bind popup
        marker.bindPopup(this.createPopupContent(photo));

        // Click handler - open photo viewer
        marker.on('click', () => {
          this.photoViewerService.openViewer(this.photos(), photo.id, '/map');
        });

        markers.push(marker);
      }
    });

    // Add all markers to cluster group
    this.markerClusterGroup.addLayers(markers);

    // Fit map bounds to show all markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  }

  private createPopupContent(photo: Photo): string {
    const date = photo.takenAt ? new Date(photo.takenAt).toLocaleDateString() : 'Unknown date';
    const rating = photo.averageRating ? `${photo.averageRating}/10` : 'No rating';

    return `
      <div style="min-width: 200px; font-family: sans-serif;">
        <img
          src="${photo.thumbnailUrl}"
          alt="${photo.fileName}"
          style="width: 100%; max-width: 200px; height: auto; border-radius: 4px; margin-bottom: 8px;"
        >
        <h3 style="font-size: 16px; font-weight: bold; margin: 8px 0; color: #111;">
          ${photo.fileName}
        </h3>
        <p style="font-size: 14px; color: #666; margin: 4px 0;">
          ⭐ Rating: ${rating}
        </p>
        <p style="font-size: 12px; color: #999; margin: 4px 0;">
          📅 ${date}
        </p>
        <a
          href="/gallery?photoId=${photo.id}"
          style="display: inline-block; margin-top: 8px; color: #3B82F6; text-decoration: none; font-size: 14px;"
        >
          View Details →
        </a>
      </div>
    `;
  }
}
