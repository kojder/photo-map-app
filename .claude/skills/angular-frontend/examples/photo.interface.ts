/**
 * Photo interface - represents photo data from API.
 * Uses readonly for immutable properties.
 */
export interface Photo {
  readonly id: number;
  readonly fileName: string;
  readonly thumbnailUrl: string;
  readonly fullUrl?: string;
  readonly fileSize: number;
  readonly mimeType: string;

  // GPS data (optional)
  readonly latitude?: number;
  readonly longitude?: number;
  readonly altitude?: number;

  // Camera metadata (optional)
  readonly cameraMake?: string;
  readonly cameraModel?: string;

  // Dates
  readonly takenAt?: Date | string;
  readonly uploadedAt: Date | string;

  // Rating data
  averageRating?: number;      // Mutable - can be updated
  totalRatings?: number;        // Mutable - can be updated
  userRating?: number;          // Mutable - can be updated
}

/**
 * User interface.
 */
export interface User {
  readonly id: number;
  readonly email: string;
  readonly role: 'USER' | 'ADMIN';
  readonly createdAt: Date | string;
  totalPhotos?: number;
}

/**
 * Login response from API.
 */
export interface LoginResponse {
  readonly token: string;
  readonly type: string;
  readonly expiresIn: number;
  readonly user: User;
}

/**
 * Filter state for photos.
 */
export interface FilterState {
  dateFrom: string | null;
  dateTo: string | null;
  minRating: number | null;
  hasGps: boolean;
  page: number;
  size: number;
}

/**
 * Photo filters for API requests.
 */
export interface PhotoFilters {
  minRating?: number;
  dateFrom?: string;
  dateTo?: string;
  hasGps?: boolean;
  page?: number;
  size?: number;
}

/**
 * Page response from API (pagination).
 */
export interface PageResponse<T> {
  readonly content: T[];
  readonly page: PageInfo;
}

/**
 * Page info (pagination metadata).
 */
export interface PageInfo {
  readonly size: number;
  readonly number: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/**
 * Rating response from API.
 */
export interface RatingResponse {
  readonly photoId: number;
  readonly averageRating: number;
  readonly totalRatings: number;
  readonly userRating: number;
}

/**
 * Photo upload response.
 */
export interface PhotoUploadResponse {
  readonly photo: Photo;
  readonly message: string;
}

/**
 * Error response from API.
 */
export interface ErrorResponse {
  readonly message: string;
  readonly status: number;
  readonly timestamp: string;
  readonly path?: string;
}
