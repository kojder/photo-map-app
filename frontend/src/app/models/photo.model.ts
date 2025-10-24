export interface Photo {
  id: number;
  filename: string;
  originalFilename: string;
  thumbnailUrl: string;
  fullUrl?: string;
  fileSize: number;
  mimeType: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  cameraMake?: string;
  cameraModel?: string;
  takenAt?: string;
  uploadedAt: string;
  averageRating?: number;
  totalRatings: number;
  userRating?: number;
}

export interface RatingRequest {
  rating: number;
}

export interface RatingResponse {
  id: number;
  photoId: number;
  userId: number;
  rating: number;
  createdAt: string;
}

export interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface PageResponse<T> {
  content: T[];
  page: PageInfo;
}

export interface PhotoFilters {
  dateFrom?: string;
  dateTo?: string;
  minRating?: number;
  hasGps?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
