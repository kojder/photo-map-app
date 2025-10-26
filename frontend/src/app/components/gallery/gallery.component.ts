import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, take } from 'rxjs';
import { Photo } from '../../models/photo.model';
import { PhotoService } from '../../services/photo.service';
import { FilterService } from '../../services/filter.service';
import { PhotoViewerService } from '../../services/photo-viewer.service';
import { AdminService } from '../../services/admin.service';
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
  isPermissionError = signal(false);
  adminContactEmail = signal<string>('admin@photomap.local');

  constructor(
    private photoService: PhotoService,
    private filterService: FilterService,
    private photoViewerService: PhotoViewerService,
    private adminService: AdminService
  ) {
    this.photos$ = this.photoService.photos$;
  }

  ngOnInit(): void {
    this.loadAdminContact();
    this.loadPhotos();

    this.filterService.filters$.subscribe(() => {
      this.loadPhotos();
    });
  }

  loadAdminContact(): void {
    this.photoService.getPublicSettings().subscribe({
      next: (settings) => {
        this.adminContactEmail.set(settings.adminContactEmail);
      },
      error: () => {
        this.adminContactEmail.set('admin@photomap.local');
      }
    });
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.isPermissionError.set(false);

    const filters = this.filterService.currentFilters();

    this.photoService.getAllPhotos(filters).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading photos:', error);

        // Clear photos on error
        this.photoService.clearPhotos();

        if (error.error?.message?.includes('permission') || error.status === 403) {
          this.isPermissionError.set(true);
          this.errorMessage.set(`Aby oglądać zdjęcia, skontaktuj się z administratorem: ${this.adminContactEmail()}`);
        } else {
          this.errorMessage.set('Nie udało się załadować zdjęć. Spróbuj ponownie.');
        }

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

  onPhotoClick(photoId: number): void {
    // Get current photos array from the observable
    this.photoService.photos$
      .pipe(take(1))
      .subscribe(photos => {
        this.photoViewerService.openViewer(photos, photoId, '/gallery');
      });
  }
}
