# Leaflet.js Integration

Leaflet.js map integration for Photo Map MVP: map initialization, markers, popups, and marker clustering.

## Installation

```bash
npm install leaflet@1.9.4
npm install @types/leaflet --save-dev
npm install leaflet.markercluster@1.5.3
npm install @types/leaflet.markercluster --save-dev
```

## CSS Imports

**File:** `angular.json` or component styles

```json
{
  "styles": [
    "node_modules/leaflet/dist/leaflet.css",
    "node_modules/leaflet.markercluster/dist/MarkerCluster.css",
    "node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css",
    "src/styles.css"
  ]
}
```

**Or in component:**

```typescript
@Component({
  styleUrls: [
    '../../../node_modules/leaflet/dist/leaflet.css',
    './map.component.css'
  ]
})
```

## Map Component Implementation

```typescript
import { Component, OnInit, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly photoService = inject(PhotoService);

  private map?: L.Map;
  private markerClusterGroup?: L.MarkerClusterGroup;

  photos = signal<Photo[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadPhotos();
  }

  ngAfterViewInit(): void {
    // Wait for DOM to be ready
    setTimeout(() => this.initializeMap(), 0);
  }

  ngOnDestroy(): void {
    // Cleanup map instance
    this.map?.remove();
  }

  private initializeMap(): void {
    // Create map instance
    this.map = L.map('map').setView([52.2297, 21.0122], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Initialize marker cluster group
    this.markerClusterGroup = L.markerClusterGroup();
    this.map.addLayer(this.markerClusterGroup);

    // Load markers
    this.updateMarkers();
  }

  private loadPhotos(): void {
    this.loading.set(true);
    this.photoService.getPhotos({ hasGps: true }).subscribe(photos => {
      this.photos.set(photos);
      this.loading.set(false);
      this.updateMarkers();
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
    return `
      <div style="min-width: 200px;">
        <img src="${photo.thumbnailUrl}" alt="${photo.fileName}" style="width: 100%; max-width: 200px; height: auto; border-radius: 4px;">
        <h3 style="font-size: 16px; font-weight: bold; margin: 8px 0;">${photo.fileName}</h3>
        <p style="font-size: 14px; color: #666;">⭐ Rating: ${photo.rating}/10</p>
        <p style="font-size: 12px; color: #999;">📅 ${new Date(photo.takenAt).toLocaleDateString()}</p>
        <a href="/gallery?photoId=${photo.id}" style="color: #3B82F6; text-decoration: none;">View Details →</a>
      </div>
    `;
  }
}
```

## Template

```html
<div class="relative w-full h-screen">
  @if (loading()) {
    <div class="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  }

  <!-- Map container -->
  <div id="map" class="w-full h-full"></div>
</div>
```

## Component Styles

```css
/* Fix Leaflet marker icon path issues */
:host ::ng-deep .leaflet-pane img {
  max-width: none;
}

:host ::ng-deep .leaflet-container {
  height: 100%;
  width: 100%;
}

/* Custom marker cluster styling */
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
```

## Fix Leaflet Default Marker Icons

**Issue:** Leaflet default marker icons don't work in Angular (path issues)

**Solution:**

```typescript
import { icon, Marker } from 'leaflet';

// Fix default marker icon
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';

Marker.prototype.options.icon = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
```

**Download marker images:**

1. Copy marker images from `node_modules/leaflet/dist/images/` to `src/assets/`
2. Or use custom marker icons

## Custom Marker Icons

```typescript
const customIcon = L.icon({
  iconUrl: 'assets/custom-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const marker = L.marker([lat, lng], { icon: customIcon });
```

## Marker Clustering Configuration

```typescript
// Custom cluster options
this.markerClusterGroup = L.markerClusterGroup({
  maxClusterRadius: 80,        // Max radius for clustering
  spiderfyOnMaxZoom: true,     // Spiderfy on max zoom
  showCoverageOnHover: false,  // Don't show cluster area on hover
  zoomToBoundsOnClick: true,   // Zoom to cluster bounds on click
  disableClusteringAtZoom: 15  // Disable clustering at zoom level 15
});
```

## Interactive Features

### Click to Open Photo Viewer

```typescript
private createMarker(photo: Photo): L.Marker {
  const marker = L.marker([photo.latitude!, photo.longitude!]);

  marker.on('click', () => {
    this.photoViewerService.openViewer([photo], photo.id, '/map');
  });

  marker.bindPopup(this.createPopupContent(photo));

  return marker;
}
```

### Filter Integration

```typescript
export class MapComponent implements OnInit {
  private readonly filterService = inject(FilterService);

  ngOnInit(): void {
    // React to filter changes
    this.filterService.filters$.subscribe(filters => {
      this.loadPhotos(filters);
    });
  }

  private loadPhotos(filters: FilterState): void {
    this.photoService.getPhotos({ ...filters, hasGps: true }).subscribe(photos => {
      this.photos.set(photos);
      this.updateMarkers();
    });
  }
}
```

## Common Issues

### 1. Map Container Not Found

**Error:** `Map container not found`

**Solution:** Ensure `#map` div exists and `ngAfterViewInit` is used

```typescript
ngAfterViewInit(): void {
  setTimeout(() => this.initializeMap(), 0);
}
```

### 2. Marker Icons Not Showing

**Solution:** Fix icon paths (see "Fix Leaflet Default Marker Icons")

### 3. Map Not Resizing

**Solution:** Call `map.invalidateSize()` after container size changes

```typescript
onResize(): void {
  this.map?.invalidateSize();
}
```

### 4. Tiles Not Loading

**Solution:** Check internet connection, verify tile URL

```typescript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(this.map);
```

## Performance Tips

1. **Use marker clustering** - essential for large datasets
2. **Limit visible markers** - filter photos by viewport bounds
3. **Lazy load popups** - load popup content on demand
4. **Debounce updates** - debounce marker updates on filter changes
5. **Cleanup on destroy** - always call `map.remove()` in `ngOnDestroy()`
