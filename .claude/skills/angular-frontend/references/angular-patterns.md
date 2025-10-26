# Angular 18 Patterns

Core Angular 18 patterns for Photo Map MVP: standalone components, modern dependency injection, control flow, and component architecture.

## Standalone Components

**ALL components MUST be standalone (NO NgModules):**

```typescript
@Component({
  selector: 'app-photo-gallery',
  standalone: true,          // REQUIRED!
  imports: [
    CommonModule,            // For built-in directives
    RouterLink,              // For navigation
    PhotoCardComponent       // Child components
  ],
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.css'
})
export class PhotoGalleryComponent { }
```

**Rules:**
- ✅ Always `standalone: true`
- ✅ Explicitly import dependencies in `imports` array
- ✅ Use `CommonModule` for `*ngIf`, `*ngFor`, `@if`, `@for`
- ✅ Import child components directly
- ❌ NO `@NgModule` anywhere!

## Control Flow Syntax

**Use modern control flow (@if, @for, @switch):**

```typescript
// ✅ MODERN: @if syntax
@if (loading()) {
  <div>Loading...</div>
} @else {
  <div>Content loaded</div>
}

// ✅ MODERN: @for syntax
@for (photo of photos(); track photo.id) {
  <app-photo-card [photo]="photo" />
}

// ❌ OLD: *ngIf, *ngFor (still works but not preferred)
<div *ngIf="loading()">Loading...</div>
<div *ngFor="let photo of photos(); trackBy: trackById">
  <app-photo-card [photo]="photo" />
</div>
```

**Rules:**
- ✅ Prefer @if, @for, @switch for new code
- ✅ track expression required in @for (e.g., `track photo.id`)
- ✅ @if/@else for conditional rendering
- ❌ Avoid *ngIf/*ngFor in new code

## Dependency Injection (inject() Function)

**Use inject() function (modern Angular 18):**

```typescript
export class PhotoGalleryComponent {
  private readonly photoService = inject(PhotoService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
}
```

**Rules:**
- ✅ Use `inject()` at class property level
- ✅ Make services private (encapsulation)
- ✅ Use readonly for injected services (cannot be reassigned)
- ❌ DON'T use constructor injection (old style):

```typescript
// ❌ OLD - Don't do this
constructor(
  private photoService: PhotoService,
  private router: Router
) { }
```

## Component Types

### Smart Components (Container)

**Responsibilities:**
- Inject services
- Manage state, fetch data
- Handle business logic
- Pass data to dumb components

**Example:**
```typescript
export class PhotoGalleryComponent implements OnInit {
  private readonly photoService = inject(PhotoService);

  photos = signal<Photo[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadPhotos();
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.photoService.getPhotos().subscribe(photos => {
      this.photos.set(photos);
      this.loading.set(false);
    });
  }

  onRatingChange(photoId: number, rating: number): void {
    this.photoService.updateRating(photoId, rating);
  }
}
```

### Dumb Components (Presentational)

**Responsibilities:**
- Receive data via `@Input()`
- Emit events via `@Output()`
- No service injection (except utility services)
- Pure presentation logic

**Example:**
```typescript
export class PhotoCardComponent {
  @Input() photo!: Photo;
  @Output() ratingChange = new EventEmitter<number>();
  @Output() photoClick = new EventEmitter<number>();

  onRate(rating: number): void {
    this.ratingChange.emit(rating);
  }

  onClick(): void {
    this.photoClick.emit(this.photo.id);
  }
}
```

## Component Lifecycle Hooks

**Common hooks:**

- `ngOnInit()` - Initialize component, load data
- `ngAfterViewInit()` - Access ViewChild, DOM manipulation (e.g., Leaflet map)
- `ngOnDestroy()` - Cleanup subscriptions, timers
- `ngOnChanges(changes)` - React to @Input() changes

**Example:**
```typescript
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private map?: L.Map;
  private subscription?: Subscription;

  ngOnInit(): void {
    // Initialize data
    this.loadPhotos();
  }

  ngAfterViewInit(): void {
    // DOM ready - initialize map
    this.initMap();
  }

  ngOnDestroy(): void {
    // Cleanup
    this.subscription?.unsubscribe();
    this.map?.remove();
  }
}
```

## Routing Configuration

**File:** `app.routes.ts`

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/gallery', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'gallery',
    component: PhotoGalleryComponent,
    canActivate: [authGuard] // Protected
  },
  {
    path: 'map',
    component: MapViewComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard, adminGuard] // Role-based
  },
  { path: '**', redirectTo: '/gallery' }
];
```

**Register in `app.config.ts`:**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

## Functional Guards

**Authentication Guard:**
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

**Admin Guard:**
```typescript
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  const user = authService.currentUser;
  if (user?.role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/gallery']);
};
```

**Rules:**
- ✅ Use functional guards (modern Angular 18)
- ✅ Return `true`, `false`, or `UrlTree`
- ✅ Use `inject()` inside guard
- ❌ DON'T use class-based guards (deprecated)
