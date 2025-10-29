import { Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
  imageUrl: SafeUrl | null = null;
  isFullscreen: boolean = false;
  isImageLoading: boolean = false;
  showSpinner: boolean = false; // Only show spinner after delay
  errorMessage = signal<string | null>(null);

  // Touch event tracking
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private touchStartTime: number = 0;
  private touchStartTarget: EventTarget | null = null;
  private readonly SWIPE_THRESHOLD: number = 50; // Minimum distance for swipe (px)
  private readonly TAP_THRESHOLD: number = 10; // Maximum movement for tap (px)
  private readonly SPINNER_DELAY: number = 200; // Show spinner only if loading takes > 200ms
  private spinnerTimeout: any = null;

  constructor(
    private photoViewerService: PhotoViewerService,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.photoViewerService.viewerState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.viewerState = state;
        if (state.isOpen && state.currentIndex >= 0) {
          // Clear previous timeout before setting new one
          this.clearSpinnerTimeout();
          
          this.currentPhoto = state.photos[state.currentIndex];
          // Set loading state before loading image
          this.isImageLoading = true;
          this.errorMessage.set(null); // Clear any previous error
          // Show spinner only if loading takes longer than SPINNER_DELAY
          this.spinnerTimeout = setTimeout(() => {
            if (this.isImageLoading) {
              this.showSpinner = true;
            }
          }, this.SPINNER_DELAY);
          // Load image as blob to include JWT token in request
          this.loadFullImage(this.currentPhoto.id);
          // Prevent body scroll when viewer is open
          document.body.style.overflow = 'hidden';
          // Auto-enter fullscreen on mobile
          this.attemptFullscreen();
          // iOS Safari - scroll to hide address bar
          this.hideAddressBarOnIOS();
        } else {
          this.currentPhoto = null;
          // Revoke object URL to prevent memory leak
          if (this.imageUrl && typeof this.imageUrl === 'string') {
            URL.revokeObjectURL(this.imageUrl);
          }
          this.imageUrl = null;
          this.isImageLoading = false;
          this.showSpinner = false;
          // Clear spinner timeout if exists
          this.clearSpinnerTimeout();
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
    // Revoke object URL to prevent memory leak
    if (this.imageUrl && typeof this.imageUrl === 'string') {
      URL.revokeObjectURL(this.imageUrl);
    }
    // Clear spinner timeout if exists
    this.clearSpinnerTimeout();
    // Exit fullscreen on component destroy
    this.exitFullscreen();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load full resolution image as blob (includes JWT token in request)
   */
  private loadFullImage(photoId: number): void {
    this.http.get(`/api/photos/${photoId}/full`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        // Revoke previous object URL if exists
        if (this.imageUrl && typeof this.imageUrl === 'string') {
          URL.revokeObjectURL(this.imageUrl);
        }
        const objectUrl = URL.createObjectURL(blob);
        this.imageUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.isImageLoading = false;
        this.showSpinner = false;
        this.errorMessage.set(null);
        this.clearSpinnerTimeout();
      },
      error: (error) => {
        console.error('Failed to load photo:', error);
        this.isImageLoading = false;
        this.showSpinner = false;
        this.errorMessage.set('Failed to load photo. The image may be missing or corrupted.');
        this.clearSpinnerTimeout();
      }
    });
  }

  /**
   * Clear spinner timeout to prevent memory leaks
   */
  private clearSpinnerTimeout(): void {
    if (this.spinnerTimeout) {
      clearTimeout(this.spinnerTimeout);
      this.spinnerTimeout = null;
    }
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

    // Record starting position and target
    this.touchStartX = event.changedTouches[0].screenX;
    this.touchStartY = event.changedTouches[0].screenY;
    this.touchStartTime = Date.now();
    this.touchStartTarget = event.target;
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

    // Check if touch started on a navigation button (don't close on button tap)
    const targetElement = this.touchStartTarget as HTMLElement;
    if (targetElement && (
      targetElement.classList.contains('nav-button') ||
      targetElement.classList.contains('close-button') ||
      targetElement.closest('.nav-button') ||
      targetElement.closest('.close-button')
    )) {
      // Let the button's click handler take care of it
      this.resetTouchState();
      return;
    }

    // Check if it's a tap (very small movement)
    if (absDeltaX < this.TAP_THRESHOLD && absDeltaY < this.TAP_THRESHOLD) {
      // Tap detected on image/background - close viewer
      this.close();
      this.resetTouchState();
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

    this.resetTouchState();
  }

  /**
   * Reset touch tracking state
   */
  private resetTouchState(): void {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.touchStartTime = 0;
    this.touchStartTarget = null;
  }

}
