import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { PhotoViewerService, ViewerState } from '../../services/photo-viewer.service';
import { Photo } from '../../models/photo.model';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-viewer.component.html',
  styleUrls: ['./photo-viewer.component.css']
})
export class PhotoViewerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  viewerState: ViewerState | null = null;
  currentPhoto: Photo | null = null;
  imageUrl: string = '';

  constructor(private photoViewerService: PhotoViewerService) {}

  ngOnInit(): void {
    this.photoViewerService.viewerState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.viewerState = state;
        if (state.isOpen && state.currentIndex >= 0) {
          this.currentPhoto = state.photos[state.currentIndex];
          this.imageUrl = `/api/photos/${this.currentPhoto.id}/full`;
          // Prevent body scroll when viewer is open
          document.body.style.overflow = 'hidden';
        } else {
          this.currentPhoto = null;
          this.imageUrl = '';
          // Restore body scroll when viewer is closed
          document.body.style.overflow = '';
        }
      });
  }

  ngOnDestroy(): void {
    // Restore body scroll on component destroy
    document.body.style.overflow = '';
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.viewerState?.isOpen) {
      return;
    }

    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      case 'ArrowLeft':
        this.previous();
        break;
      case 'ArrowRight':
        this.next();
        break;
    }
  }

  close(): void {
    this.photoViewerService.closeViewer();
  }

  next(): void {
    this.photoViewerService.nextPhoto();
  }

  previous(): void {
    this.photoViewerService.previousPhoto();
  }

  isFirstPhoto(): boolean {
    return this.photoViewerService.isFirstPhoto();
  }

  isLastPhoto(): boolean {
    return this.photoViewerService.isLastPhoto();
  }

  get photoCounter(): string {
    if (!this.viewerState) {
      return '';
    }
    return `${this.viewerState.currentIndex + 1} / ${this.viewerState.photos.length}`;
  }
}
