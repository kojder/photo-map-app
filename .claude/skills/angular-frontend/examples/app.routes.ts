import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PhotoGalleryComponent } from './components/photo-gallery/photo-gallery.component';
import { MapComponent } from './components/map/map.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { authGuard, adminGuard } from './guards/auth.guard';

/**
 * Application routes configuration.
 * Uses functional guards (authGuard, adminGuard) for protection.
 */
export const routes: Routes = [
  // Default redirect
  {
    path: '',
    redirectTo: '/gallery',
    pathMatch: 'full'
  },

  // Public routes (no authentication required)
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },

  // Protected routes (authentication required)
  {
    path: 'gallery',
    component: PhotoGalleryComponent,
    canActivate: [authGuard]
  },
  {
    path: 'map',
    component: MapComponent,
    canActivate: [authGuard]
  },

  // Admin route (authentication + ADMIN role required)
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard, adminGuard]
  },

  // Wildcard - redirect to gallery
  {
    path: '**',
    redirectTo: '/gallery'
  }
];
