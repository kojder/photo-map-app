export interface User {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  totalPhotos?: number;
  canViewPhotos?: boolean;
  canRate?: boolean;
}
