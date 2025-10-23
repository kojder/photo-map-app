import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  expiresIn: number;
  user: User;
}

export interface RegisterResponse {
  id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}
