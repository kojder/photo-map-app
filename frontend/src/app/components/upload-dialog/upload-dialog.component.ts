import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoService } from '../../services/photo.service';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-dialog.component.html'
})
export class UploadDialogComponent {
  @Output() uploadSuccess = new EventEmitter<void>();
  @Output() dialogClose = new EventEmitter<void>();

  selectedFile = signal<File | null>(null);
  preview = signal<string>('');
  uploading = signal(false);
  uploadProgress = signal(0);
  errorMessage = signal<string | null>(null);
  dragOver = signal(false);

  constructor(private readonly photoService: PhotoService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);

    if (event.dataTransfer?.files?.[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(): void {
    this.dragOver.set(false);
  }

  handleFile(file: File): void {
    this.errorMessage.set(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage.set('Invalid file type. Please upload JPEG, PNG, or HEIC images.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage.set('File too large. Maximum size is 10MB.');
      return;
    }

    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.preview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  onUpload(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.errorMessage.set(null);

    this.photoService.uploadPhoto(file).subscribe({
      next: () => {
        this.uploadProgress.set(100);
        this.uploading.set(false);
        this.uploadSuccess.emit();
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.errorMessage.set('Upload failed. Please try again.');
        this.uploading.set(false);
      }
    });
  }

  onCancel(): void {
    this.dialogClose.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
