import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Authentication Guard (Functional).
 * Protects routes - only authenticated users can access.
 */
export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated) {
    return true; // Allow access
  }

  // Redirect to login with returnUrl
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

/**
 * Admin Guard (Functional).
 * Protects routes - only ADMIN role can access.
 */
export const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated AND has ADMIN role
  const user = authService.currentUser;
  if (user?.role === 'ADMIN') {
    return true; // Allow access
  }

  // Redirect to gallery if not admin
  return router.createUrlTree(['/gallery']);
};
