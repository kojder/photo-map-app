import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Photo } from '../../models/photo.model';
import { PhotoService } from '../../services/photo.service';
import { FilterService } from '../../services/filter.service';
import { PhotoCardComponent } from '../photo-card/photo-card.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { UploadDialogComponent } from '../upload-dialog/upload-dialog.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, PhotoCardComponent, FilterBarComponent, UploadDialogComponent],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent implements OnInit {
  photos$: Observable<Photo[]>;
  loading = signal(false);
  showUploadDialog = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private photoService: PhotoService,
    private filterService: FilterService
  ) {
    this.photos$ = this.photoService.photos$;
  }

  ngOnInit(): void {
    this.loadPhotos();

    this.filterService.filters$.subscribe(() => {
      this.loadPhotos();
    });
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const filters = this.filterService.currentFilters();

    this.photoService.getAllPhotos(filters).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading photos:', error);
        this.errorMessage.set('Failed to load photos. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onUploadClick(): void {
    this.showUploadDialog.set(true);
  }

  onUploadSuccess(): void {
    this.showUploadDialog.set(false);
    this.loadPhotos();
  }

  onUploadClose(): void {
    this.showUploadDialog.set(false);
  }

  onPhotoDeleted(photoId: number): void {
    this.loadPhotos();
  }
}
