import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { LoginResponse, RegisterResponse } from '../models/auth.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const TOKEN_KEY = 'auth_token';

  const mockLoginResponse: LoginResponse = {
    token: createMockToken('1', 'test@example.com', 'USER'),
    type: 'Bearer',
    expiresIn: 3600,
    user: {
      id: 1,
      email: 'test@example.com',
      role: 'USER',
      createdAt: '2025-10-24T00:00:00Z'
    }
  };

  const mockAdminLoginResponse: LoginResponse = {
    token: createMockToken('2', 'admin@example.com', 'ADMIN'),
    type: 'Bearer',
    expiresIn: 3600,
    user: {
      id: 2,
      email: 'admin@example.com',
      role: 'ADMIN',
      createdAt: '2025-10-24T00:00:00Z'
    }
  };

  const mockRegisterResponse: RegisterResponse = {
    id: 1,
    email: 'newuser@example.com',
    role: 'USER',
    createdAt: '2025-10-24T00:00:00Z'
  };

  function createMockToken(sub: string, email: string, role: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub, email, role, exp: Date.now() / 1000 + 3600 }));
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token', () => {
      service.login('test@example.com', 'password123').subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        expect(localStorage.getItem(TOKEN_KEY)).toBe(mockLoginResponse.token);
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password123' });
      req.flush(mockLoginResponse);
    });

    it('should update currentUser$ on successful login', (done) => {
      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user.id).toBe(mockLoginResponse.user.id);
          expect(user.email).toBe(mockLoginResponse.user.email);
          expect(user.role).toBe(mockLoginResponse.user.role);
          done();
        }
      });

      service.login('test@example.com', 'password123').subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockLoginResponse);
    });

    it('should handle login error', () => {
      service.login('test@example.com', 'wrongpassword').subscribe({
        next: () => fail('should have failed with 401 error'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should register successfully', () => {
      service.register('newuser@example.com', 'password123').subscribe(response => {
        expect(response).toEqual(mockRegisterResponse);
      });

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'newuser@example.com', password: 'password123' });
      req.flush(mockRegisterResponse);
    });

    it('should handle registration error (email exists)', () => {
      service.register('existing@example.com', 'password123').subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne('/api/auth/register');
      req.flush('Email already exists', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('logout', () => {
    it('should clear token and reset currentUser$', (done) => {
      localStorage.setItem(TOKEN_KEY, mockLoginResponse.token);

      service.logout();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();

      service.currentUser$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when token exists', () => {
      localStorage.setItem(TOKEN_KEY, mockLoginResponse.token);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      localStorage.setItem(TOKEN_KEY, mockAdminLoginResponse.token);
      expect(service.isAdmin()).toBe(true);
    });

    it('should return false for USER role', () => {
      localStorage.setItem(TOKEN_KEY, mockLoginResponse.token);
      expect(service.isAdmin()).toBe(false);
    });

    it('should return false when no token exists', () => {
      expect(service.isAdmin()).toBe(false);
    });

    it('should return false for invalid token', () => {
      localStorage.setItem(TOKEN_KEY, 'invalid.token.here');
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when exists', () => {
      localStorage.setItem(TOKEN_KEY, mockLoginResponse.token);
      expect(service.getToken()).toBe(mockLoginResponse.token);
    });

    it('should return null when token does not exist', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('currentUser$ initialization', () => {
    it('should initialize currentUser$ from localStorage token on service creation', () => {
      localStorage.setItem(TOKEN_KEY, mockLoginResponse.token);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthService
        ]
      });

      const newService = TestBed.inject(AuthService);

      newService.currentUser$.subscribe(user => {
        expect(user).not.toBeNull();
        expect(user?.id).toBe(1);
        expect(user?.email).toBe('test@example.com');
        expect(user?.role).toBe('USER');
      });
    });

    it('should initialize currentUser$ as null when no token exists', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthService
        ]
      });

      const newService = TestBed.inject(AuthService);

      newService.currentUser$.subscribe(user => {
        expect(user).toBeNull();
      });
    });
  });

  describe('JWT token decode', () => {
    it('should decode valid JWT token correctly', () => {
      const token = createMockToken('123', 'decode@example.com', 'USER');
      localStorage.setItem(TOKEN_KEY, token);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthService
        ]
      });

      const newService = TestBed.inject(AuthService);

      newService.currentUser$.subscribe(user => {
        expect(user).not.toBeNull();
        expect(user?.id).toBe(123);
        expect(user?.email).toBe('decode@example.com');
        expect(user?.role).toBe('USER');
      });
    });

    it('should handle malformed JWT token gracefully', () => {
      localStorage.setItem(TOKEN_KEY, 'not.a.valid.jwt.token');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthService
        ]
      });

      const newService = TestBed.inject(AuthService);

      newService.currentUser$.subscribe(user => {
        expect(user).toBeNull();
      });
    });
  });
});
