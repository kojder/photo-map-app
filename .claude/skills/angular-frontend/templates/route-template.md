# Routing + Guards Checklist

Use this checklist when setting up routing and guards for Photo Map MVP.

## Route Configuration (app.routes.ts)

### Basic Setup

- [ ] File location: `src/app/app.routes.ts`
- [ ] Export `Routes` array: `export const routes: Routes = [...]`
- [ ] Default redirect configured (path: `''`, redirectTo, pathMatch: `'full'`)
- [ ] Wildcard route configured (path: `'**'`, redirectTo)

### Route Structure

- [ ] Each route has:
  - [ ] `path` property (string, no leading slash)
  - [ ] `component` property (imported component class)
  - [ ] `canActivate` array (if protected)
  - [ ] Optional: `data`, `children`, `loadChildren`

### Route Organization

- [ ] Public routes (no guards) listed first
- [ ] Protected routes (with `authGuard`) grouped together
- [ ] Admin routes (with `authGuard` + `adminGuard`) at end
- [ ] Wildcard route (`**`) at the very end

### Example Routes Array

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },

  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Protected routes (authentication required)
  { path: 'gallery', component: PhotoGalleryComponent, canActivate: [authGuard] },
  { path: 'map', component: MapComponent, canActivate: [authGuard] },

  // Admin routes (authentication + ADMIN role)
  { path: 'admin', component: AdminPanelComponent, canActivate: [authGuard, adminGuard] },

  // Wildcard
  { path: '**', redirectTo: '/gallery' }
];
```

## Functional Guards

### Authentication Guard (authGuard)

- [ ] Type: `CanActivateFn`
- [ ] File: `guards/auth.guard.ts`
- [ ] Inject `AuthService` and `Router` using `inject()`
- [ ] Check `authService.isAuthenticated`
- [ ] Return `true` if authenticated
- [ ] Return `UrlTree` to `/login` if not authenticated
- [ ] Include `returnUrl` in query params

### Example Auth Guard

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

### Admin Guard (adminGuard)

- [ ] Type: `CanActivateFn`
- [ ] File: `guards/auth.guard.ts` (can be in same file)
- [ ] Inject `AuthService` and `Router`
- [ ] Check user role === `'ADMIN'`
- [ ] Return `true` if admin
- [ ] Return `UrlTree` to `/gallery` if not admin

### Example Admin Guard

```typescript
export const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser;
  if (user?.role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/gallery']);
};
```

## Registration in app.config.ts

- [ ] Import `provideRouter` from `@angular/router`
- [ ] Import `routes` from `./app.routes`
- [ ] Add `provideRouter(routes)` to `providers` array

### Example app.config.ts

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

## Navigation

### Programmatic Navigation

- [ ] Inject `Router` service
- [ ] Use `router.navigate(['/path'])` for simple navigation
- [ ] Use `router.navigate(['/path'], { queryParams: {...} })` for query params
- [ ] Use `router.createUrlTree(['/path'])` in guards

### Template Navigation

- [ ] Import `RouterLink` directive in component
- [ ] Use `[routerLink]="['/path']"` in templates
- [ ] Use `routerLinkActive="active-class"` for active state

## Query Parameters

### Reading Query Params

- [ ] Inject `ActivatedRoute`
- [ ] Subscribe to `activatedRoute.queryParams`
- [ ] Or use snapshot: `activatedRoute.snapshot.queryParams['param']`

### Example: Return URL Handling

```typescript
export class LoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  returnUrl = '/gallery'; // default

  ngOnInit(): void {
    this.returnUrl = this.activatedRoute.snapshot.queryParams['returnUrl'] || '/gallery';
  }

  onLogin(): void {
    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl); // Navigate to returnUrl
      }
    });
  }
}
```

## Route Guards Best Practices

**Do:**
- ✅ Use functional guards (`CanActivateFn`)
- ✅ Return `boolean | UrlTree` (NOT promises)
- ✅ Use `inject()` for services
- ✅ Handle redirect logic in guards
- ✅ Chain guards in `canActivate` array: `[authGuard, adminGuard]`

**Don't:**
- ❌ Don't use class-based guards (deprecated)
- ❌ Don't use constructor injection in guards
- ❌ Don't throw errors in guards (return `UrlTree` instead)
- ❌ Don't forget to import guards in routes

## Testing Guards

```typescript
import { TestBed } from '@angular/core/testing';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow access when authenticated', () => {
    mockAuthService.isAuthenticated = true;

    const result = TestBed.runInInjectionContext(() =>
      authGuard(null as any, { url: '/gallery' } as any)
    );

    expect(result).toBe(true);
  });
});
```

## Final Checks

- [ ] All routes compile without errors
- [ ] Navigation works as expected
- [ ] Guards protect routes correctly
- [ ] Return URL logic works (login → redirect)
- [ ] Wildcard route catches invalid paths
- [ ] No circular redirects
- [ ] Admin routes only accessible to ADMIN role
