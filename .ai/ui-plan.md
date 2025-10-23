# UI Architecture - Photo Map MVP

**Version:** 1.0
**Date:** 2025-10-19
**Framework:** Angular 18.2.0
**Styling:** Tailwind CSS 3.4.17
**Map Library:** Leaflet.js 1.9.4

---

## Overview

Frontend Photo Map MVP to Single Page Application (SPA) zbudowana z Angular 18 (standalone components) i Tailwind CSS. Aplikacja składa się z:
- **Authentication Views** - Login, Register
- **Main Views** - Gallery (grid), Map (Leaflet)
- **Admin View** - User management
- **Shared Components** - PhotoCard, UploadDialog, FilterBar

**Architecture Pattern:**
- **Standalone components** (no NgModules)
- **Signals** dla reactive state (Angular 16+)
- **BehaviorSubject** w Services dla shared state
- **HttpClient** dla API calls
- **Guards** dla route protection

---

## Routes & Navigation

### Route Configuration

**File:** `app.routes.ts`

**Routes:**
- `/` → redirect to `/gallery`
- `/login` - Public (LoginComponent)
- `/register` - Public (RegisterComponent)
- `/gallery` - Protected: AuthGuard (GalleryComponent)
- `/map` - Protected: AuthGuard (MapComponent)
- `/admin` - Protected: AdminGuard (AdminComponent)
- `/**` → redirect to `/gallery`

### Navigation Component

**File:** `components/navbar/navbar.component.ts`

**Features:**
- Logo / Brand
- Navigation links: Gallery | Map | Admin (conditional: ADMIN role only)
- User menu: Logout button
- Mobile-responsive (hamburger menu)

---

## Authentication Views

### 1. LoginComponent

**Path:** `/login`
**File:** `components/login/login.component.ts`

**Features:**
- Email + Password form (ReactiveFormsModule)
- "Remember me" checkbox (optional MVP)
- "Don't have an account? Register" link
- Error messages (red alert)
- Loading state (disabled button + spinner text)

**Form Fields:**
- `email` - required, email validation
- `password` - required, min 8 characters

**Workflow:**
1. User enters email + password
2. Click "Login" → `AuthService.login()`
3. Success → Navigate to `/gallery`
4. Error → Show error message

**State:**
- `loginForm: FormGroup` (FormBuilder)
- `loading: signal<boolean>`
- `errorMessage: signal<string | null>`

**Test IDs:**
- `login-email-input`, `login-password-input`, `login-submit-button`

---

### 2. RegisterComponent

**Path:** `/register`
**File:** `components/register/register.component.ts`

**Features:**
- Email + Password + Confirm Password form
- Password strength indicator (optional MVP)
- "Already have an account? Login" link
- Error messages (email exists, passwords mismatch)
- Loading state

**Form Fields:**
- `email` - required, email validation
- `password` - required, min 8 characters
- `confirmPassword` - required, must match password

**Workflow:**
1. User enters email + password + confirm password
2. Validate passwords match (custom validator)
3. Click "Register" → `AuthService.register()`
4. Success → Auto-login → Navigate to `/gallery`
5. Error → Show error message

**Custom Validator:**
- `passwordMatchValidator` - Check if `password === confirmPassword`
- Return `{ passwordMismatch: true }` if not matching

**State:** Similar to LoginComponent + `registerForm: FormGroup`

**Test IDs:** `register-email-input`, `register-password-input`, `register-confirm-input`, `register-submit-button`

---

## Main Views

### 3. GalleryComponent

**Path:** `/gallery`
**File:** `components/gallery/gallery.component.ts`

**Features:**
- FilterBar (date range, rating, search)
- PhotoGrid (Masonry/Grid layout: 1-4 columns responsive)
- Upload Button (opens UploadDialogComponent)
- Pagination (infinite scroll or pagination buttons)
- Loading State (spinner)
- Empty State ("No photos yet. Upload your first photo!")

**Layout:**
```
┌─────────────────────────────────────┐
│ FilterBar [Date] [Rating] [Upload]  │
├─────────────────────────────────────┤
│ PhotoGrid (Tailwind grid)           │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
│ │   │ │   │ │   │ │   │            │
│ └───┘ └───┘ └───┘ └───┘            │
└─────────────────────────────────────┘
```

**State:**
- `photos: signal<Photo[]>`
- `loading: signal<boolean>`
- `showUploadDialog: signal<boolean>`

**Flow:**
1. `ngOnInit` → `loadPhotos()`
2. Subscribe to `FilterService.filters$` → reload on filter change
3. `loadPhotos()` → `PhotoService.getAllPhotos(filters)` → update `photos` signal
4. Upload button → open dialog → `onUploadSuccess()` → reload photos

**Template Structure:**
- FilterBar component (event: `filterChange`)
- Upload button (test-id: `gallery-upload-button`)
- Loading spinner (@if loading)
- Empty state (@if no photos)
- Photo grid (@if photos, Tailwind grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`)
- Upload dialog (@if showUploadDialog)

**Test IDs:** `gallery-upload-button`, `gallery-photo-card`

---

### 4. MapComponent

**Path:** `/map`
**File:** `components/map/map.component.ts`

**Features:**
- Leaflet Map (full viewport)
- Photo Markers (GPS-tagged photos)
- Marker Clustering (leaflet.markercluster)
- Popup (click marker → thumbnail + details + link)
- Filter Integration (FilterService)
- Loading State (spinner overlay)

**Layout:**
```
┌─────────────────────────────────────┐
│ Map (Leaflet full viewport)         │
│   📍 📍 📍 📍                         │
│        📍📍                          │
│ Popup: [Thumbnail|Date|Rating|Link] │
└─────────────────────────────────────┘
```

**State:**
- `map?: L.Map`
- `markerClusterGroup?: L.MarkerClusterGroup`
- `photos: signal<Photo[]>`
- `loading: signal<boolean>`

**Flow:**
1. `ngOnInit` → `loadPhotos()` (with filter: `hasGps: true`)
2. Subscribe to `FilterService.filters$` → reload + update markers
3. `ngAfterViewInit` → `initMap()` (Leaflet initialization)
4. `initMap()`:
   - Create map: `L.map('map').setView([52.2297, 21.0122], 6)` (default: Warsaw)
   - Add OSM tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
   - Create marker cluster group
5. `updateMarkers()`:
   - Clear existing markers
   - For each photo with GPS → create marker
   - Bind popup (HTML: thumbnail + filename + rating + link)
   - Add to cluster group
   - Fit bounds to show all markers

**Popup Content:**
- Thumbnail image (w-32 h-24)
- Filename (font-semibold)
- Rating (⭐ + average)
- Link: "View Details" → `/gallery?photoId={id}`

**CSS Requirements:**
- Import Leaflet CSS, MarkerCluster CSS (from node_modules)

---

## Shared Components

### 5. PhotoCardComponent

**File:** `components/photo-card/photo-card.component.ts`

**Input:** `@Input() photo: Photo`

**Features:**
- Thumbnail image (w-full h-48 object-cover)
- Original filename (truncate)
- Date taken (or uploaded, Angular date pipe: 'short')
- Average rating (⭐ 1-5 stars + average + total count)
- Actions: Rate button, Clear rating button, Delete button

**Template Structure:**
- Card container (bg-white, shadow-lg, rounded-lg, hover:shadow-xl)
- Image (thumbnail)
- Content (p-4):
  - Filename (font-semibold, truncate)
  - Date (text-sm, gray-600)
  - Rating (flex: ⭐ + average + (total) lub "No rating yet")
  - Actions (flex justify-between): Rate | Clear Rating | Delete buttons

**Methods:**
- `onRate()` - Open rating dialog or inline rating input (1-5 stars)
- `onClearRating()` - Call `PhotoService.clearRating()` (DELETE endpoint) + confirmation
- `onDelete()` - Call `PhotoService.deletePhoto()` + confirm dialog (optional)

**Test IDs:** `photo-card`, `photo-card-rate-button`, `photo-card-clear-rating-button`, `photo-card-delete-button`

---

### 6. UploadDialogComponent

**File:** `components/upload-dialog/upload-dialog.component.ts`

**Features:**
- Modal dialog (fixed overlay + centered card, z-50)
- File input OR drag-and-drop (border-dashed, hover effect)
- Preview thumbnail po wybraniu (w-full h-64 object-cover)
- Upload progress bar (width % based on progress)
- File info (name, size in MB)
- Buttons: Cancel | Upload
- Error messages (invalid file, too large)

**State:**
- `selectedFile: signal<File | null>`
- `preview: signal<string>` (base64 preview)
- `uploading: signal<boolean>`
- `uploadProgress: signal<number>` (0-100)
- `errorMessage: signal<string | null>`

**Flow:**
1. User clicks dropzone OR drags file
2. `onFileSelected()` / `onDrop()` → validate file (type, size)
3. If valid → set `selectedFile`, generate `preview` (FileReader)
4. Click "Upload" → `onUpload()` → call `PhotoService.uploadPhoto()` with progress tracking
5. Success → emit `@Output() uploadSuccess` → close dialog
6. Error → show error message

**Validation:**
- File type: `image/jpeg`, `image/png`, `image/heic`
- Max size: 10MB

**Outputs:**
- `@Output() uploadSuccess: EventEmitter<void>`
- `@Output() close: EventEmitter<void>`

**Test IDs:** `upload-dialog`, `upload-dropzone`, `upload-cancel-button`, `upload-submit-button`

---

### 7. FilterBarComponent

**File:** `components/filter-bar/filter-bar.component.ts`

**Features:**
- Date range picker (from, to) - `<input type="date">`
- Rating filter (dropdown: All, 7+, 8+, 9+) - `<select>`
- "Clear Filters" button

**Template Structure:**
- Container (bg-white, shadow-sm, rounded-lg, p-4, mb-6)
- Grid layout (grid-cols-1 md:grid-cols-4, gap-4)
- 3 inputs + 1 button (flex items-end)

**State:**
- `dateFrom: string`
- `dateTo: string`
- `minRating: number | null`

**Methods:**
- `onFilterChange()` - Update `FilterService.applyFilters()` + emit `@Output() filterChange`
- `onClearFilters()` - Reset all filters + call `FilterService.clearFilters()`

**Output:**
- `@Output() filterChange: EventEmitter<void>`

**Test IDs:** `filter-bar`, `filter-date-from`, `filter-date-to`, `filter-rating`, `filter-clear-button`

---

## Admin View

### 8. AdminComponent

**Path:** `/admin`
**File:** `components/admin/admin.component.ts`

**Features:**
- User list table (email, role, total photos, created at)
- Actions: Change role (dropdown: USER/ADMIN), Delete user
- Pagination
- Loading state

**Template Structure:**
- Title: "Admin Panel - User Management"
- Loading spinner (@if loading)
- Table (@if !loading):
  - Columns: Email | Role | Photos | Created | Actions
  - Role: `<select>` with options USER/ADMIN + change event
  - Delete button: disabled if current user (cannot delete self)

**State:**
- `users: signal<User[]>`
- `loading: signal<boolean>`
- `currentUserId: signal<number>` (from AuthService)

**Methods:**
- `ngOnInit()` → load users from `AdminService.getUsers()`
- `onRoleChange(user)` → call `AdminService.updateRole(user.id, user.role)`
- `onDeleteUser(user)` → confirm dialog → `AdminService.deleteUser(user.id)` → reload list

**Test IDs:** `admin-users-table`, `admin-user-role-select`, `admin-delete-user-button`

---

## Services

### 9. AuthService

**File:** `services/auth.service.ts`

**Responsibilities:**
- Login, Register (API calls)
- Logout (clear localStorage token)
- Get current user (from JWT token)
- Check if user is ADMIN

**State:**
- `currentUser$: Observable<User | null>` (BehaviorSubject)

**Methods:**
- `login(email, password): Observable<LoginResponse>`
- `register(email, password): Observable<UserResponse>`
- `logout(): void` - Clear `localStorage['auth_token']`
- `isLoggedIn(): boolean` - Check if token exists
- `isAdmin(): boolean` - Decode JWT + check role

**JWT Token:**
- Storage: `localStorage['auth_token']`
- Payload: `{ sub: userId, email, role }`

---

### 10. PhotoService

**File:** `services/photo.service.ts`

**Responsibilities:**
- CRUD operations for photos + rating

**State:**
- `photos$: Observable<Photo[]>` (BehaviorSubject, optional cache)

**Methods:**
- `getAllPhotos(filters): Observable<PageResponse<Photo>>`
- `getPhotoById(id): Observable<Photo>`
- `uploadPhoto(file): Observable<Photo>` - multipart/form-data
- `ratePhoto(photoId, rating): Observable<RatingResponse>` - rating 1-5
- `clearRating(photoId): Observable<void>` - DELETE /api/photos/{id}/rating
- `deletePhoto(id): Observable<void>`

---

### 11. FilterService

**File:** `services/filter.service.ts`

**Responsibilities:**
- Manage filter state (dateFrom, dateTo, minRating, hasGps, page, size)
- Emit filter changes

**State:**
- `filters$: Observable<FilterState>` (BehaviorSubject)

**FilterState:**
- `{ dateFrom, dateTo, minRating, hasGps, page, size }`

**Methods:**
- `applyFilters(filters): void` - Update BehaviorSubject
- `clearFilters(): void` - Reset to defaults
- `currentFilters(): FilterState` - Get current value

---

### 12. MapService (Optional)

**Note:** Most map logic in MapComponent. Service only if reusable map utilities needed.

---

## Guards

### 13. AuthGuard

**File:** `guards/auth.guard.ts`
**Type:** `CanActivateFn` (functional guard)

**Purpose:** Protect routes dla zalogowanych (USER + ADMIN)

**Logic:**
- Check `AuthService.isLoggedIn()` (JWT token exists in localStorage)
- YES → allow navigation (return true)
- NO → redirect to `/login` (return false)

---

### 14. AdminGuard

**File:** `guards/admin.guard.ts`
**Type:** `CanActivateFn`

**Purpose:** Protect routes tylko dla ADMIN

**Logic:**
- Check `AuthService.isLoggedIn()` AND `AuthService.isAdmin()`
- YES → allow navigation (return true)
- NO → redirect to `/gallery` (return false)

---

## Models (TypeScript Interfaces)

**File:** `models/*.model.ts`

### Photo Model
- `id, filename, originalFilename, thumbnailUrl, fullUrl?, fileSize, mimeType`
- `gpsLatitude?, gpsLongitude?, cameraMake?, cameraModel?, takenAt?`
- `uploadedAt, averageRating?, totalRatings, userRating?`

### User Model
- `id, email, role: 'USER' | 'ADMIN', createdAt, totalPhotos?`

### LoginResponse Model
- `token, type, expiresIn, user: User`

### PageResponse<T> Model
- `content: T[], page: PageInfo`

### PageInfo Model
- `size, number, totalElements, totalPages`

---

## HTTP Interceptors

### 15. JwtInterceptor

**File:** `interceptors/jwt.interceptor.ts`
**Type:** `HttpInterceptorFn` (functional interceptor)

**Purpose:** Auto-add JWT token to HTTP requests (except `/api/auth/*`)

**Logic:**
1. Get token from `localStorage['auth_token']`
2. If token exists AND URL not `/api/auth/*`:
   - Clone request + add header: `Authorization: Bearer ${token}`
3. Return `next(req)`

**Registration:** `app.config.ts` → `provideHttpClient(withInterceptors([jwtInterceptor]))`

---

## State Management Strategy

**Pattern:** BehaviorSubject (private) → Observable (public)

**Service Pattern:**
```
private subject = new BehaviorSubject<T>(initialValue);
public observable$ = subject.asObservable();
```

**Component Consumption:**
```
service.observable$.subscribe(data => signal.set(data))
```

**Why not NgRx:** Simple MVP - BehaviorSubject sufficient for shared state

---

## Testing Strategy

### Test IDs Convention

**Format:** `data-testid="component-element-action"`

**Examples:**
- `login-email-input`, `login-password-input`, `login-submit-button`
- `register-email-input`, `register-password-input`, `register-confirm-input`, `register-submit-button`
- `gallery-upload-button`, `gallery-photo-card`
- `photo-card-rate-button`, `photo-card-clear-rating-button`, `photo-card-delete-button`
- `upload-dialog`, `upload-dropzone`, `upload-cancel-button`, `upload-submit-button`
- `filter-bar`, `filter-date-from`, `filter-date-to`, `filter-rating`, `filter-clear-button`
- `admin-users-table`, `admin-user-role-select`, `admin-delete-user-button`

**Usage:** Playwright E2E tests use these for element selection

---

**Dokument przygotowany dla:** Claude Code - Photo Map MVP Implementation
**Następny krok:** Implementacja Angular components + services zgodnie z architekturą
