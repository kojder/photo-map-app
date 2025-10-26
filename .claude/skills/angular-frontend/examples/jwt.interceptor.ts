import { HttpInterceptorFn } from '@angular/common/http';

/**
 * JWT Interceptor (Functional).
 * Automatically adds JWT token to HTTP requests (except /api/auth/*).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // Skip auth endpoints (login, register)
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  // Add token if exists
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  // No token - proceed without modification
  return next(req);
};

/**
 * Error Interceptor (Functional).
 * Handles 401 (Unauthorized) and 403 (Forbidden) errors globally.
 */
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('token');
        router.navigate(['/login'], {
          queryParams: { returnUrl: window.location.pathname }
        });
      } else if (error.status === 403) {
        // Forbidden - redirect to gallery
        router.navigate(['/gallery']);
      }

      // Re-throw error for component-level handling
      return throwError(() => error);
    })
  );
};

/**
 * Register interceptors in app.config.ts:
 *
 * import { provideHttpClient, withInterceptors } from '@angular/common/http';
 * import { authInterceptor, errorInterceptor } from './interceptors/jwt.interceptor';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([authInterceptor, errorInterceptor])
 *     )
 *   ]
 * };
 */
