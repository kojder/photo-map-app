import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoCardComponent } from '../photo-card/photo-card.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { PhotoViewerComponent } from '../photo-viewer/photo-viewer.component';
import { PhotoService } from '../../services/photo.service';
import { PhotoViewerService } from '../../services/photo-viewer.service';
import { FilterService } from '../../services/filter.service';
import { Photo, FilterState } from '../../models/photo.model';

/**
 * Smart component for photo gallery.
 * Manages state, injects services, handles business logic.
 */
@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [
    CommonModule,
    PhotoCardComponent,
    FilterBarComponent,
    PhotoViewerComponent
  ],
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.css'
})
export class PhotoGalleryComponent implements OnInit {
  // Service injection (readonly!)
  private readonly photoService = inject(PhotoService);
  private readonly photoViewerService = inject(PhotoViewerService);
  private readonly filterService = inject(FilterService);

  // Component state (Signals for local state)
  photos = signal<Photo[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  showUploadDialog = signal(false);

  // Computed state
  filteredPhotos = computed(() => {
    // Example: additional client-side filtering if needed
    return this.photos();
  });

  ngOnInit(): void {
    this.loadPhotos();
    this.subscribeToFilters();
  }

  private loadPhotos(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.filterService.currentFilters;

    this.photoService.getPhotos(filters).subscribe({
      next: (photos) => {
        this.photos.set(photos);
        this.loading.set(false);
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

  // Business logic handlers
  onPhotoClick(photoId: number): void {
    this.photoViewerService.openViewer(this.photos(), photoId, '/gallery');
  }

  onRatingChange(data: { photoId: number, rating: number }): void {
    this.photoService.ratePhoto(data.photoId, data.rating).subscribe({
      next: () => {
        this.loadPhotos(); // Reload to get updated rating
      },
      error: (err) => {
        console.error('Failed to rate photo:', err);
        this.error.set('Failed to rate photo. Please try again.');
      }
    });
  }

  onClearRating(photoId: number): void {
    if (!confirm('Are you sure you want to clear your rating?')) {
      return;
    }

    this.photoService.clearRating(photoId).subscribe({
      next: () => {
        this.loadPhotos(); // Reload to reflect cleared rating
      },
      error: (err) => {
        console.error('Failed to clear rating:', err);
        this.error.set('Failed to clear rating. Please try again.');
      }
    });
  }

  onDeletePhoto(photoId: number): void {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    this.photoService.deletePhoto(photoId).subscribe({
      next: () => {
        this.loadPhotos(); // Reload gallery
      },
      error: (err) => {
        console.error('Failed to delete photo:', err);
        this.error.set('Failed to delete photo. Please try again.');
      }
    });
  }

  onFilterChange(filters: FilterState): void {
    this.filterService.applyFilters(filters);
  }

  onUploadClick(): void {
    this.showUploadDialog.set(true);
  }

  onUploadSuccess(): void {
    this.showUploadDialog.set(false);
    this.loadPhotos(); // Reload gallery after successful upload
  }

  onUploadCancel(): void {
    this.showUploadDialog.set(false);
  }
}
