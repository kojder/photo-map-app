import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../models/photo.model';

/**
 * Dumb/Presentational component for displaying a photo card.
 * NO service injection - only @Input/@Output communication.
 */
@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
      data-testid="photo-card"
      (click)="onClick()"
    >
      <!-- Image -->
      <div class="relative">
        <img
          [src]="photo.thumbnailUrl"
          [alt]="photo.fileName"
          class="w-full h-48 object-cover"
        >

        <!-- Rating Badge -->
        @if (photo.averageRating && photo.averageRating > 0) {
          <div class="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
            ⭐ {{ photo.averageRating }}/10
          </div>
        }
      </div>

      <!-- Content -->
      <div class="p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-1 truncate">
          {{ photo.fileName }}
        </h3>

        <p class="text-sm text-gray-600 mb-2">
          📅 {{ photo.takenAt | date:'short' }}
        </p>

        @if (photo.latitude && photo.longitude) {
          <p class="text-xs text-gray-500 mb-3 truncate">
            📍 {{ photo.latitude }}, {{ photo.longitude }}
          </p>
        }

        <!-- Rating Info -->
        <div class="mb-3">
          @if (photo.totalRatings && photo.totalRatings > 0) {
            <p class="text-sm text-gray-600">
              ⭐ Average: {{ photo.averageRating }}/10 ({{ photo.totalRatings }} ratings)
            </p>
            @if (photo.userRating && photo.userRating > 0) {
              <p class="text-xs text-blue-600 font-semibold">
                Your rating: {{ photo.userRating }}/10
              </p>
            }
          } @else {
            <p class="text-sm text-gray-500 italic">
              No ratings yet
            </p>
          }
        </div>

        <!-- Actions -->
        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            data-testid="photo-card-rate-button"
            (click)="onRate(); $event.stopPropagation()"
            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Rate
          </button>

          @if (photo.userRating && photo.userRating > 0) {
            <button
              data-testid="photo-card-clear-rating-button"
              (click)="onClearRating(); $event.stopPropagation()"
              class="text-sm text-orange-600 hover:text-orange-800 font-medium"
            >
              Clear Rating
            </button>
          }

          <button
            data-testid="photo-card-delete-button"
            (click)="onDelete(); $event.stopPropagation()"
            class="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PhotoCardComponent {
  // Input - receive data from parent
  @Input() photo!: Photo;

  // Outputs - emit events to parent
  @Output() photoClick = new EventEmitter<number>();
  @Output() ratingChange = new EventEmitter<{ photoId: number, rating: number }>();
  @Output() clearRating = new EventEmitter<number>();
  @Output() deletePhoto = new EventEmitter<number>();

  onClick(): void {
    this.photoClick.emit(this.photo.id);
  }

  onRate(): void {
    // For simplicity, emit a fixed rating (in real app, open rating dialog)
    const rating = prompt('Enter rating (1-10):', '8');
    if (rating) {
      const parsedRating = parseInt(rating, 10);
      if (parsedRating >= 1 && parsedRating <= 10) {
        this.ratingChange.emit({ photoId: this.photo.id, rating: parsedRating });
      } else {
        alert('Invalid rating. Please enter a number between 1 and 10.');
      }
    }
  }

  onClearRating(): void {
    this.clearRating.emit(this.photo.id);
  }

  onDelete(): void {
    this.deletePhoto.emit(this.photo.id);
  }
}
