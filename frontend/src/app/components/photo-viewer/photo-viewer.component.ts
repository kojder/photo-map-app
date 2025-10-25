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
  isFullscreen: boolean = false;

  // Touch event tracking
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private readonly SWIPE_THRESHOLD: number = 50; // Minimum distance for swipe (px)
  private readonly TAP_THRESHOLD: number = 10; // Maximum movement for tap (px)

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
          // Auto-enter fullscreen on mobile
          this.attemptFullscreen();
          // iOS Safari - scroll to hide address bar
          this.hideAddressBarOnIOS();
        } else {
          this.currentPhoto = null;
          this.imageUrl = '';
          // Restore body scroll when viewer is closed
          document.body.style.overflow = '';
          // Exit fullscreen when closing viewer
          this.exitFullscreen();
        }
      });

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });
  }

  ngOnDestroy(): void {
    // Restore body scroll on component destroy
    document.body.style.overflow = '';
    // Exit fullscreen on component destroy
    this.exitFullscreen();
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

  /**
   * Attempt to enter fullscreen mode
   * Works on mobile and desktop browsers
   */
  async attemptFullscreen(): Promise<void> {
    try {
      // Check if already in fullscreen
      if (document.fullscreenElement) {
        return;
      }

      // Try to enter fullscreen on the document element
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        // Safari
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        // Firefox
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        // IE/Edge
        await (elem as any).msRequestFullscreen();
      }
    } catch (error) {
      // Fullscreen request failed (user denied or browser doesn't support)
      // This is not critical, so we just silently fail
      console.debug('Fullscreen request failed:', error);
    }
  }

  /**
   * Exit fullscreen mode
   */
  exitFullscreen(): void {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.debug('Exit fullscreen failed:', error);
    }
  }

  /**
   * Toggle fullscreen mode manually
   */
  toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.attemptFullscreen();
    }
  }

  /**
   * iOS Safari specific - scroll to hide address bar
   * This provides a better fullscreen-like experience on iOS
   */
  private hideAddressBarOnIOS(): void {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo(0, 1);
      }, 100);
    }
  }

  /**
   * Touch event handlers for mobile swipe gestures
   */
  onTouchStart(event: TouchEvent): void {
    if (!this.viewerState?.isOpen) {
      return;
    }

    // Record starting position
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.viewerState?.isOpen) {
      return;
    }

    // Update current position during move
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;
  }

  onTouchEnd(event: TouchEvent): void {
    if (!this.viewerState?.isOpen) {
      return;
    }

    // Final position
    this.touchEndX = event.changedTouches[0].screenX;
    this.touchEndY = event.changedTouches[0].screenY;

    this.handleGesture();
  }

  /**
   * Analyze touch gesture and perform action
   */
  private handleGesture(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if it's a tap (very small movement)
    if (absDeltaX < this.TAP_THRESHOLD && absDeltaY < this.TAP_THRESHOLD) {
      // Tap detected - close viewer
      this.close();
      return;
    }

    // Horizontal swipe detection
    if (absDeltaX > absDeltaY && absDeltaX > this.SWIPE_THRESHOLD) {
      if (deltaX > 0) {
        // Swipe right → previous photo
        this.previous();
      } else {
        // Swipe left → next photo
        this.next();
      }
    }

    // Reset touch positions
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
  }
}
