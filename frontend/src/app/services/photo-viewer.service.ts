import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { Photo } from '../models/photo.model';

export interface ViewerState {
  isOpen: boolean;
  photos: Photo[];
  currentIndex: number;
  sourceRoute: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoViewerService {
  private readonly initialState: ViewerState = {
    isOpen: false,
    photos: [],
    currentIndex: -1,
    sourceRoute: '/'
  };

  private viewerStateSubject = new BehaviorSubject<ViewerState>(this.initialState);
  public viewerState$: Observable<ViewerState> = this.viewerStateSubject.asObservable();

  constructor(private router: Router) {}

  openViewer(photos: Photo[], photoId: number, sourceRoute: string): void {
    const currentIndex = photos.findIndex(p => p.id === photoId);
    
    if (currentIndex === -1) {
      console.error('Photo not found in photos array:', photoId);
      return;
    }

    this.viewerStateSubject.next({
      isOpen: true,
      photos,
      currentIndex,
      sourceRoute
    });
  }

  closeViewer(): void {
    const currentState = this.viewerStateSubject.value;
    this.viewerStateSubject.next(this.initialState);
    this.router.navigate([currentState.sourceRoute]);
  }

  nextPhoto(): void {
    const currentState = this.viewerStateSubject.value;
    
    if (!currentState.isOpen || currentState.currentIndex >= currentState.photos.length - 1) {
      return; // Already at last photo or viewer closed
    }

    this.viewerStateSubject.next({
      ...currentState,
      currentIndex: currentState.currentIndex + 1
    });
  }

  previousPhoto(): void {
    const currentState = this.viewerStateSubject.value;
    
    if (!currentState.isOpen || currentState.currentIndex <= 0) {
      return; // Already at first photo or viewer closed
    }

    this.viewerStateSubject.next({
      ...currentState,
      currentIndex: currentState.currentIndex - 1
    });
  }

  getCurrentPhoto(): Photo | null {
    const currentState = this.viewerStateSubject.value;
    
    if (!currentState.isOpen || currentState.currentIndex < 0) {
      return null;
    }

    return currentState.photos[currentState.currentIndex] || null;
  }

  isFirstPhoto(): boolean {
    const currentState = this.viewerStateSubject.value;
    return currentState.currentIndex === 0;
  }

  isLastPhoto(): boolean {
    const currentState = this.viewerStateSubject.value;
    return currentState.currentIndex === currentState.photos.length - 1;
  }
}
