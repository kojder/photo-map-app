# Angular Frontend Development - Photo Map MVP

## 1. Project Context & Key Constraints

**Photo Map MVP** is a Single Page Application (SPA) for managing photos with geolocation.

**Frontend Stack:**
- **Angular:** 18.2.0+ (standalone components, NO NgModules!)
- **TypeScript:** 5.5.2+ (strict mode)
- **Styling:** Tailwind CSS 3.4.17 (NOT v4 - Angular 18 incompatibility!)
- **Map:** Leaflet.js 1.9.4 + marker clustering
- **State:** RxJS 7.8.0 (BehaviorSubject pattern, no NgRx)
- **Build:** Angular CLI 18.2.0 (esbuild)

**Key Constraints:**
- **Standalone components ONLY** - NO NgModules anywhere!
- **Tailwind 3.x** - NOT 4.x (incompatibility).
- **`inject()` function** - NOT constructor injection.
- **`signal`** for component-local reactive state.
- **`BehaviorSubject`** in services for shared state (no NgRx).

---

## 2. Component Architecture

### Standalone Components

**ALL components MUST be standalone.**

```typescript
@Component({
  selector: 'app-example',
  standalone: true,          // REQUIRED!
  imports: [
    CommonModule,            // For *ngIf, *ngFor, @if, @for
    RouterLink,              // For navigation
    ChildComponent           // Import child components directly
  ],
  templateUrl: './example.component.html',
})
export class ExampleComponent { }
```

**Rules:**
- ✅ Always use `standalone: true`.
- ✅ Explicitly import all dependencies in the `imports` array.
- ❌ **NEVER** create or use `@NgModule`.

### Dependency Injection

**Always use the `inject()` function.** Do not use constructor injection.

```typescript
// ✅ GOOD: Use inject() at the class property level
export class ExampleComponent {
  private photoService = inject(PhotoService);
  private router = inject(Router);
}

// ❌ BAD: Don't use constructor injection
constructor(private photoService: PhotoService) { }
```

---

## 3. State Management

### BehaviorSubject Pattern in Services

Use this pattern for all services that manage shared state. **Do not use NgRx.**

```typescript
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private http = inject(HttpClient);

  // 1. Private BehaviorSubject holds the state.
  private photosSubject = new BehaviorSubject<Photo[]>([]);

  // 2. Public Observable exposes the state to components.
  photos$ = this.photosSubject.asObservable();

  // 3. Public methods update the state.
  loadPhotos(): void {
    this.http.get<Photo[]>('/api/photos').subscribe(photos => {
      this.photosSubject.next(photos);
    });
  }
}
```

**Rules:**
- ✅ Keep the `BehaviorSubject` **private**.
- ✅ Expose a public `Observable` (`asObservable()`).
- ✅ Components consume the state with the `async` pipe.

---

## 4. Routing

### Functional Guards

**Always use functional guards.** Do not use class-based guards.

```typescript
// Example: app/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page
  return router.createUrlTree(['/login']);
};
```

---

## 5. HTTP Client

### HTTP Interceptor (JWT)

Use a functional interceptor to add the JWT token to outgoing requests.

```typescript
// Example: app/interceptors/jwt.interceptor.ts
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');

  if (token && !req.url.includes('/api/auth/')) {
    const clonedRequest = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(clonedRequest);
  }

  return next(req);
};
```

**Register the interceptor in `app.config.ts`:**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([jwtInterceptor]))
  ]
};
```

---

## 6. Key Reminders

**Standalone Components:**
- ✅ ALWAYS `standalone: true`.
- ❌ NO `@NgModule` anywhere.
- ✅ Import all dependencies explicitly in the `imports` array.

**Dependency Injection:**
- ✅ Use the `inject()` function.
- ❌ NO constructor injection.

**State Management:**
- ✅ Use the `BehaviorSubject` pattern in services for shared state.
- ❌ NO NgRx for this project.

**Styling:**
- ✅ Use **Tailwind CSS 3.x** (NOT 4.x).
- ✅ Follow a utility-first approach.
- ✅ Implement mobile-first responsive designs.

**Security:**
- ✅ Store JWT in `localStorage`.
- ✅ Use the `jwtInterceptor` to add the auth token to requests.
- ✅ Protect routes with functional guards (`authGuard`, `adminGuard`).
