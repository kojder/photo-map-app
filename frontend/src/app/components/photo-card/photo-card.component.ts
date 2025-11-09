import { Component, Input, Output, EventEmitter, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Photo } from '../../models/photo.model';
import { PhotoService } from '../../services/photo.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-card.component.html'
})
export class PhotoCardComponent implements OnInit, OnDestroy {
  @Input({ required: true }) photo!: Photo;
  @Output() photoDeleted = new EventEmitter<number>();
  @Output() photoClick = new EventEmitter<number>();

  showRatingInput = signal(false);
  selectedRating = signal(0);
  loading = signal(false);
  thumbnailUrl = signal<SafeUrl | null>(null);

  constructor(
    private readonly photoService: PhotoService,
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    public readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadThumbnail();
  }

  ngOnDestroy(): void {
    const currentUrl = this.thumbnailUrl();
    if (currentUrl && typeof currentUrl === 'string') {
      URL.revokeObjectURL(currentUrl);
    }
  }

  private loadThumbnail(): void {
    this.http.get(`/api/photos/${this.photo.id}/thumbnail`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.thumbnailUrl.set(this.sanitizer.bypassSecurityTrustUrl(objectUrl));
      },
      error: (error) => {
        console.error('Error loading thumbnail:', error);
        this.thumbnailUrl.set(null);
      }
    });
  }

  getThumbnailUrl(): string {
    return `/api/photos/${this.photo.id}/thumbnail`;
  }

  getStars(rating: number): string {
    const fullStars = Math.floor(rating);
    return '⭐'.repeat(fullStars);
  }

  onRate(): void {
    this.showRatingInput.set(true);
  }

  onSelectRating(rating: number): void {
    this.selectedRating.set(rating);
    this.loading.set(true);

    this.photoService.ratePhoto(this.photo.id, rating).subscribe({
      next: () => {
        this.showRatingInput.set(false);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error rating photo:', error);
        this.loading.set(false);
      }
    });
  }

  onClearRating(): void {
    if (!confirm('Czy na pewno chcesz usunąć ocenę?')) {
      return;
    }

    this.loading.set(true);
    this.photoService.clearRating(this.photo.id).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error clearing rating:', error);
        this.loading.set(false);
      }
    });
  }

  onDelete(): void {
    if (!confirm('Czy na pewno chcesz usunąć to zdjęcie?')) {
      return;
    }

    this.loading.set(true);
    this.photoService.deletePhoto(this.photo.id).subscribe({
      next: () => {
        this.photoDeleted.emit(this.photo.id);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error deleting photo:', error);
        this.loading.set(false);
      }
    });
  }

  cancelRating(): void {
    this.showRatingInput.set(false);
    this.selectedRating.set(0);
  }

  onPhotoClick(): void {
    this.photoClick.emit(this.photo.id);
  }
}
