import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { jwtInterceptor } from './jwt.interceptor';

describe('jwtInterceptor', () => {
  let mockRequest: HttpRequest<any>;
  let mockNext: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    mockNext = jasmine.createSpy('next').and.returnValue(of({} as HttpEvent<any>));
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should add Authorization header when token exists and not auth endpoint', () => {
    localStorage.setItem('auth_token', 'test-token');
    mockRequest = new HttpRequest('GET', '/api/photos');

    jwtInterceptor(mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const interceptedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(interceptedRequest.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('should not add Authorization header when no token exists', () => {
    mockRequest = new HttpRequest('GET', '/api/photos');

    jwtInterceptor(mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const interceptedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(interceptedRequest.headers.has('Authorization')).toBe(false);
  });

  it('should not add Authorization header for auth endpoints', () => {
    localStorage.setItem('auth_token', 'test-token');
    mockRequest = new HttpRequest('POST', '/api/auth/login', {});

    jwtInterceptor(mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const interceptedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(interceptedRequest.headers.has('Authorization')).toBe(false);
  });

  it('should not add Authorization header for auth register endpoint', () => {
    localStorage.setItem('auth_token', 'test-token');
    mockRequest = new HttpRequest('POST', '/api/auth/register', {});

    jwtInterceptor(mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalled();
    const interceptedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(interceptedRequest.headers.has('Authorization')).toBe(false);
  });

  it('should pass through request when token is null', () => {
    localStorage.removeItem('auth_token');
    mockRequest = new HttpRequest('GET', '/api/photos');

    jwtInterceptor(mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalledWith(mockRequest);
  });

  it('should pass through original request for auth endpoints', () => {
    localStorage.setItem('auth_token', 'test-token');
    mockRequest = new HttpRequest('POST', '/api/auth/login', {});

    jwtInterceptor(mockRequest, mockNext);

    expect(mockNext).toHaveBeenCalledWith(mockRequest);
  });

  it('should handle requests with existing headers', () => {
    localStorage.setItem('auth_token', 'test-token');
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    mockRequest = new HttpRequest('GET', '/api/photos', { headers });

    jwtInterceptor(mockRequest, mockNext);

    const interceptedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
    expect(interceptedRequest.headers.get('Authorization')).toBe('Bearer test-token');
    expect(interceptedRequest.headers.get('Content-Type')).toBe('application/json');
  });

  it('should work with different API endpoints', () => {
    localStorage.setItem('auth_token', 'test-token');
    
    const endpoints = [
      '/api/photos',
      '/api/admin/users',
      '/api/photos/1/rating',
      '/api/settings'
    ];

    endpoints.forEach(url => {
      mockNext.calls.reset();
      mockRequest = new HttpRequest('GET', url);
      
      jwtInterceptor(mockRequest, mockNext);
      
      const interceptedRequest = mockNext.calls.mostRecent().args[0] as HttpRequest<any>;
      expect(interceptedRequest.headers.get('Authorization')).toBe('Bearer test-token');
    });
  });
});
