# Feature: UI Redesign - Modern Navbar + Floating Filters

**Status:** 🔧 In Progress
**Created:** 2025-10-28
**Time Estimate:** ~5.5 hours

---

## 🎯 Cel

Przeprojektowanie nawigacji i filtrów w Photo Map MVP z naciskiem na:
- **Nowoczesną estetykę** - ikony, clean design, minimalizm
- **Funkcjonalność** - wyraźna nawigacja, ukryte filtry domyślnie
- **UX best practices** - intuicyjna obsługa, responsive, smooth animations

---

## 📊 Analiza Obecnego Stanu

### Problemy UX

1. **Navbar tylko tekstowy**
   - Brak ikon → słaba czytelność wizualna
   - Active state: border-bottom-2 → za mało wyrazisty
   - Brak hamburger menu na mobile

2. **Zbędne headery**
   - "Photo Gallery" h1 powtarza informację z navbar
   - "Photo Map" h1 powtarza informację z navbar
   - Marnowana przestrzeń ekranu

3. **Filtry zajmują za dużo miejsca**
   - Desktop: zawsze widoczne (~100px wysokości)
   - Map: `.map-header` absolute → nakłada się na mapę
   - Gallery: filtry przed gridem → mniej przestrzeni na zdjęcia

4. **Brak spójności visual**
   - Wszystko tekstowe, brak systemu ikon
   - Różne style headerów w gallery vs map

### Metryki

**Przed redesignem:**
- Navbar height: 60px
- Filter-bar height: ~100px (desktop)
- Map visible area: ~70% (30% zajęte przez header)
- Gallery grid start: 160px od góry
- Active state: border-bottom-2 (2px)

**Po redesignie (cel):**
- Navbar height: 64px (sticky)
- Filters: 0px (ukryte domyślnie)
- Map visible area: 100% (full screen)
- Gallery grid start: 80px od góry
- Active state: bg-blue-100 (full background)

**Zysk przestrzeni:**
- Gallery: +80px vertical space
- Map: +30% visible area
- Filters: +100px when closed

---

## ✅ Nowy Design - Specyfikacja

### 1. Navbar z Ikonami (Heroicons)

#### Desktop (≥ 768px)

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ PhotoMap [📷 Gallery] [🗺️ Map] [🛡️ Admin]  [👤] [🚪 Logout] │
│          ─────────────                                      │
│          (active: bg-blue-100)                              │
└────────────────────────────────────────────────────────────┘
```

**HTML Structure:**
```html
<nav class="bg-white shadow-md sticky top-0 z-50">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Left: Logo + Navigation -->
      <div class="flex items-center space-x-1">
        <div class="text-xl font-bold text-gray-800 mr-4">PhotoMap</div>

        <a routerLink="/gallery"
           routerLinkActive="bg-blue-100 text-blue-700 font-semibold"
           class="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all">
          <svg class="w-5 h-5">[photo icon]</svg>
          <span>Gallery</span>
        </a>

        <!-- Map, Admin links similar -->
      </div>

      <!-- Right: Logout -->
      <button (click)="logout()" class="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
        <svg class="w-5 h-5">[logout icon]</svg>
        <span class="hidden sm:inline">Logout</span>
      </button>
    </div>
  </div>
</nav>
```

**Key Tailwind Classes:**
- `sticky top-0 z-50` - navbar przyklejony do góry
- `bg-blue-100 text-blue-700 font-semibold` - active state (highlighted)
- `hover:bg-gray-100` - hover effect
- `transition-all` - smooth animations
- `space-x-2` - spacing między ikoną a tekstem

#### Mobile (< 768px)

**Layout (collapsed):**
```
┌────────────────────────┐
│ PhotoMap          [☰] │
└────────────────────────┘
```

**Layout (expanded):**
```
┌────────────────────────┐
│ PhotoMap          [☰] │
├────────────────────────┤
│ 📷 Gallery             │
│ 🗺️ Map                 │
│ 🛡️ Admin Panel         │
│ ────────────────────   │
│ 🚪 Logout              │
└────────────────────────┘
```

**HTML Structure:**
```html
<nav class="bg-white shadow-md sticky top-0 z-50">
  <div class="px-4">
    <div class="flex justify-between items-center h-14">
      <div class="text-lg font-bold text-gray-800">PhotoMap</div>
      <button (click)="toggleMobileMenu()" class="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
        <svg class="w-6 h-6">[hamburger icon]</svg>
      </button>
    </div>

    <div *ngIf="mobileMenuOpen()" class="pb-4 border-t border-gray-200 mt-2">
      <a routerLink="/gallery" (click)="closeMobileMenu()"
         routerLinkActive="bg-blue-100 text-blue-700"
         class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
        <svg class="w-5 h-5">[photo icon]</svg>
        <span>Gallery</span>
      </a>
      <!-- Map, Admin, Logout links similar -->
    </div>
  </div>
</nav>
```

**TypeScript (navbar.component.ts):**
```typescript
export class NavbarComponent {
  mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
```

---

### 2. Floating Action Button (FAB) + Slide-in Panel

#### Koncepcja

**Material Design FAB** - floating button w prawym dolnym rogu:
- Domyślnie ukryty content (tylko button)
- Klik → slide-in panel z prawej (desktop) lub dołu (mobile)
- Badge z licznikiem aktywnych filtrów
- Backdrop (overlay) przy otwartych filtrach

#### Desktop Layout

**FAB (closed):**
```
┌─────────────────────────────┐
│                             │
│  [Content]                  │
│                             │
│                      [🔽 2] │ ← FAB z badge
└─────────────────────────────┘
```

**Panel (open):**
```
┌────────────────────────┬────────┐
│ [Content with overlay] │ Filters│
│                        │        │
│                        │ [...]  │
│                        │        │
│                        ├────────┤
│                        │ [Apply]│
└────────────────────────┴────────┘
                         ↑ 320px wide
```

#### HTML Structure (filter-fab.component.html)

```html
<!-- FAB Button -->
<button (click)="toggleFilters()"
        class="fixed bottom-6 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all"
        data-testid="filter-fab">
  <svg class="w-6 h-6">[funnel icon - solid]</svg>
  @if (hasActiveFilters()) {
    <span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
      {{ activeFilterCount() }}
    </span>
  }
</button>

<!-- Backdrop -->
<div *ngIf="filtersOpen()"
     (click)="closeFilters()"
     class="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity">
</div>

<!-- Filter Panel (desktop: side, mobile: bottom) -->
<div class="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 md:block hidden"
     [class.translate-x-0]="filtersOpen()"
     [class.translate-x-full]="!filtersOpen()">

  <!-- Panel Header -->
  <div class="flex justify-between items-center p-4 border-b border-gray-200">
    <h3 class="text-lg font-semibold text-gray-900">Filters</h3>
    <button (click)="closeFilters()" class="p-2 hover:bg-gray-100 rounded-lg">
      <svg class="w-5 h-5">[x-mark icon]</svg>
    </button>
  </div>

  <!-- Panel Content (scrollable) -->
  <div class="p-4 space-y-4 overflow-y-auto h-[calc(100vh-140px)]">
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Date From</label>
      <input type="date" [(ngModel)]="dateFrom" (change)="onFilterChange()"
             class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Date To</label>
      <input type="date" [(ngModel)]="dateTo" (change)="onFilterChange()"
             class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
      <select [(ngModel)]="minRating" (change)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
        <option [ngValue]="null">All</option>
        <option [ngValue]="1">1+</option>
        <option [ngValue]="2">2+</option>
        <option [ngValue]="3">3+</option>
        <option [ngValue]="4">4+</option>
        <option [ngValue]="5">5</option>
      </select>
    </div>
  </div>

  <!-- Panel Footer -->
  <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
    <div class="flex space-x-2">
      <button (click)="onClearFilters()"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
        Clear
      </button>
      <button (click)="closeFilters()"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Apply
      </button>
    </div>
  </div>
</div>

<!-- Mobile: Bottom Sheet (separate div for mobile) -->
<div class="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-50 rounded-t-2xl transform transition-transform duration-300 max-h-[80vh]"
     [class.translate-y-0]="filtersOpen()"
     [class.translate-y-full]="!filtersOpen()">
  <!-- Same content as desktop panel -->
</div>
```

#### TypeScript (filter-fab.component.ts)

```typescript
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FilterService } from '../../services/filter.service';

@Component({
  selector: 'app-filter-fab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-fab.component.html',
  styleUrl: './filter-fab.component.css'
})
export class FilterFabComponent implements OnInit, OnDestroy {
  filtersOpen = signal(false);
  dateFrom: string = '';
  dateTo: string = '';
  minRating: number | null = null;

  private filterSubscription?: Subscription;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    const currentFilters = this.filterService.currentFilters();
    this.dateFrom = currentFilters.dateFrom || '';
    this.dateTo = currentFilters.dateTo || '';
    this.minRating = currentFilters.minRating || null;

    this.filterSubscription = this.filterService.filters$.subscribe(filters => {
      this.dateFrom = filters.dateFrom || '';
      this.dateTo = filters.dateTo || '';
      this.minRating = filters.minRating || null;
    });
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  hasActiveFilters = computed(() => {
    return !!this.dateFrom || !!this.dateTo || this.minRating !== null;
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.dateFrom) count++;
    if (this.dateTo) count++;
    if (this.minRating !== null) count++;
    return count;
  });

  toggleFilters(): void {
    this.filtersOpen.update(v => !v);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  onFilterChange(): void {
    const filters: any = {};
    if (this.dateFrom) filters.dateFrom = this.dateFrom;
    if (this.dateTo) filters.dateTo = this.dateTo;
    if (this.minRating !== null) filters.minRating = this.minRating;

    this.filterService.applyFilters(filters);
  }

  onClearFilters(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.minRating = null;
    this.filterService.clearFilters();
  }
}
```

---

### 3. Gallery Component - Clean Layout

#### Zmiany

**Usunięcia:**
- ❌ `<h1 class="text-3xl font-bold">Photo Gallery</h1>`
- ❌ `<app-filter-bar>`

**Dodania:**
- ✅ `<app-filter-fab></app-filter-fab>`
- ✅ Upload button z ikoną (arrow-up-tray)

#### Nowy Layout

```html
<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

    <!-- Top Actions Bar -->
    <div class="flex justify-end items-center mb-6">
      <button (click)="onUploadClick()"
              class="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all">
        <svg class="w-5 h-5">[upload icon]</svg>
        <span>Upload Photo</span>
      </button>
    </div>

    <!-- Error, Loading, Grid (bez zmian) -->
    @if (errorMessage()) { ... }
    @if (loading()) { ... }
    @else {
      @if (photos$ | async; as photos) {
        @if (photos.length === 0) { ... }
        @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            @for (photo of photos; track photo.id) {
              <app-photo-card [photo]="photo" ...></app-photo-card>
            }
          </div>
        }
      }
    }

    @if (showUploadDialog()) { ... }
  </div>

  <!-- FAB Filter Button (outside main container) -->
  <app-filter-fab></app-filter-fab>
</div>
```

**Zyski:**
- Grid startuje 80px wyżej (+80px vertical space)
- Upload button wyraźniejszy z ikoną
- Clean, minimalistyczny layout

---

### 4. Map Component - Full Screen

#### Problemy do Rozwiązania

- ❌ `.map-header` absolute → nakłada się na mapę
- ❌ `<h1>Photo Map</h1>` - zbędne
- ❌ Filtry w headerze → redukują wysokość mapy

#### Nowy Layout

```html
<div class="map-container h-screen w-full relative">
  <!-- Leaflet Map (full screen) -->
  <div id="map" class="absolute inset-0"></div>

  <!-- FAB Filter Button -->
  <app-filter-fab></app-filter-fab>

  <!-- Error/Loading Overlays (floating notifications) -->
  @if (errorMessage()) {
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] max-w-md">
      <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-lg">
        {{ errorMessage() }}
      </div>
    </div>
  }

  @if (loading()) {
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div class="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <div class="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        <span class="text-sm text-gray-700">Loading photos...</span>
      </div>
    </div>
  }

  @if (!loading() && photos().length === 0) {
    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
      <div class="bg-white px-4 py-2 rounded-lg shadow-lg">
        <span class="text-sm text-gray-500">No photos with GPS data found.</span>
      </div>
    </div>
  }
</div>
```

**CSS (map.component.css):**

```css
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

#map {
  position: absolute;
  inset: 0; /* top: 0; left: 0; right: 0; bottom: 0; */
  z-index: 0;
}

/* Remove .map-header - już nie potrzebny */
```

**Zyski:**
- Mapa full screen: 100vh (zamiast ~70%)
- +30% visible area
- FAB nie blokuje widoku (floating)
- Clean, minimalistyczny layout

---

## 🎨 Heroicons SVG

### Wybór: Heroicons v2.0

**Dlaczego Heroicons?**
- Oficjalny icon set dla Tailwind CSS
- MIT License (free commercial)
- Style: outline (thin) + solid (filled)
- Lightweight: inline SVG, no font files
- Perfect match dla Tailwind utilities

### 8 Ikon do Użycia

#### 1. Gallery Icon (outline)
```html
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
</svg>
```

#### 2. Map Icon (outline)
```html
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
</svg>
```

#### 3. Admin Icon (shield-check, outline)
```html
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
</svg>
```

#### 4. Logout Icon (arrow-right-on-rectangle, outline)
```html
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
</svg>
```

#### 5. Filter Icon (funnel, solid)
```html
<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
  <path fill-rule="evenodd"
        d="M3.792 2.938A49.069 49.069 0 0112 2.25c2.797 0 5.54.236 8.209.688a1.857 1.857 0 011.541 1.836v1.044a3 3 0 01-.879 2.121l-6.182 6.182a1.5 1.5 0 00-.439 1.061v2.927a3 3 0 01-1.658 2.684l-1.757.878A.75.75 0 019.75 21v-5.818a1.5 1.5 0 00-.44-1.06L3.13 7.938a3 3 0 01-.879-2.121V4.774c0-.897.64-1.683 1.542-1.836z"
        clip-rule="evenodd" />
</svg>
```

#### 6. Close Icon (x-mark, outline)
```html
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M6 18L18 6M6 6l12 12" />
</svg>
```

#### 7. Upload Icon (arrow-up-tray, outline)
```html
<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
</svg>
```

#### 8. Hamburger Icon (bars-3, outline)
```html
<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
```

---

## 🎨 Tailwind Utilities Reference

### Layout
- `container mx-auto` - centered container
- `max-w-7xl` - max width 80rem (1280px)
- `px-4 sm:px-6 lg:px-8` - responsive padding
- `flex items-center justify-between` - flexbox
- `grid grid-cols-2 lg:grid-cols-4` - responsive grid

### Spacing
- `space-x-2` / `space-y-4` - gap between children
- `gap-4` / `gap-6` - grid gap
- `p-4` / `px-4 py-2` - padding
- `mb-6` / `mt-4` - margin

### Colors
- `bg-white` / `bg-gray-50` / `bg-blue-100` - backgrounds
- `text-gray-700` / `text-blue-700` - text colors
- `border border-gray-300` - borders
- `shadow-md` / `shadow-lg` - shadows

### Interactive
- `hover:bg-gray-100` - hover background
- `hover:scale-110` - hover scale
- `focus:ring-2 focus:ring-blue-500` - focus ring

### Positioning
- `fixed` / `absolute` / `relative` / `sticky` - positioning
- `top-0 left-0 right-0 bottom-0` - position values
- `inset-0` - shorthand all sides = 0
- `z-40` / `z-50` - z-index

### Transforms & Animations
- `transform` - enable transforms
- `translate-x-0` / `translate-x-full` - translate
- `scale-110` - scale
- `transition-all` / `transition-transform` - transitions
- `duration-200` / `duration-300` - timing
- `animate-spin` - spin animation

### Responsive
- `sm:` - 640px+ (mobile landscape)
- `md:` - 768px+ (tablet)
- `lg:` - 1024px+ (desktop)
- `xl:` - 1280px+ (large desktop)
- `hidden md:block` - hide mobile, show desktop
- `md:hidden` - show mobile, hide desktop

---

## 📂 Implementation Tasks

### Task 1: Przygotowanie Heroicons SVG (15 min)

**Output:**
- 8 ikon SVG ready to paste inline

---

### Task 2: Redesign navbar.component (45 min)

**Files:**
- `navbar.component.html` - FULL REWRITE
- `navbar.component.ts` - ADD signals + methods
- `navbar.component.spec.ts` - UPDATE tests

**Changes:**
- Desktop: ikony + tekst, active state bg-blue-100
- Mobile: hamburger menu, collapsible
- Logout: ikona + text, hover red

**Tests:**
- Hamburger toggle
- Active state
- Icons visible
- Logout button

---

### Task 3: Filter-fab component (1h 30min)

**Files:**
- `filter-fab.component.html` - NEW
- `filter-fab.component.ts` - NEW
- `filter-fab.component.spec.ts` - NEW
- `filter-fab.component.css` - NEW (optional)

**Features:**
- FAB: fixed bottom-right, badge
- Panel: slide-in, desktop/mobile variants
- Backdrop: click to close
- Logic: FilterService integration

**Tests:**
- Component creation
- Toggle panel
- Close on backdrop
- Badge display
- Filter count
- Apply/clear filters

---

### Task 4: Gallery update (20 min)

**Files:**
- `gallery.component.html` - UPDATE
- `gallery.component.ts` - UPDATE imports

**Changes:**
- Remove h1, filter-bar
- Add filter-fab
- Upload button z ikoną

---

### Task 5: Map update (30 min)

**Files:**
- `map.component.html` - UPDATE
- `map.component.css` - UPDATE
- `map.component.ts` - UPDATE imports

**Changes:**
- Remove .map-header
- #map full screen (inset-0)
- Add filter-fab
- Floating notifications

---

### Task 6: Cleanup (5 min)

**Files:**
- DELETE: `filter-bar/` directory

**Actions:**
- Verify no references
- Delete directory

---

### Task 7: Responsive Testing (45 min)

**Scenarios:**
- Desktop (≥ 1024px)
- Tablet (768-1024px)
- Mobile (< 768px)

**Tools:**
- Chrome DevTools
- Firefox Responsive Mode
- Real devices

---

### Task 8-9: Unit Tests (1h 15min)

**Files:**
- `filter-fab.component.spec.ts` - NEW tests
- `navbar.component.spec.ts` - UPDATE tests

**Coverage:** > 70%

---

### Task 10: Manual E2E Testing (30 min)

**Flows:**
- Login (user + admin)
- Gallery (FAB, filters, grid)
- Map (full screen, FAB, markers)
- Mobile (hamburger, bottom sheet)
- Logout

---

## ✅ Success Criteria

### Visual
- ✅ Navbar z ikonami visible
- ✅ Active state highlighted (bg-blue-100)
- ✅ Hamburger menu działa na mobile
- ✅ FAB visible w prawym dolnym rogu
- ✅ Filter panel slide-in smooth
- ✅ Badge pokazuje licznik aktywnych filtrów
- ✅ Gallery bez h1 header
- ✅ Map full screen bez header overlay
- ✅ Upload button z ikoną

### Functional
- ✅ Nawigacja działa (Gallery / Map / Admin)
- ✅ Logout redirect do /login
- ✅ Filtry działają identycznie jak poprzednio
- ✅ FAB toggle otwiera/zamyka panel
- ✅ Backdrop click zamyka panel
- ✅ Clear filters resetuje wszystkie pola
- ✅ Apply filters zamyka panel (optional)

### Responsive
- ✅ Desktop (≥ 1024px): horizontal navbar, side panel
- ✅ Tablet (768-1024px): horizontal navbar, narrow panel
- ✅ Mobile (< 768px): hamburger menu, bottom sheet
- ✅ Gallery grid responsive (2/3/4 kolumny)
- ✅ No horizontal scroll na żadnym breakpoint

### Performance
- ✅ Smooth animations (60 FPS)
- ✅ No layout shifts
- ✅ Fast interactions (<100ms response)

### Tests
- ✅ filter-fab.component.spec.ts passing
- ✅ navbar.component.spec.ts passing
- ✅ Gallery działa z FAB
- ✅ Map działa z FAB
- ✅ Manual E2E flow pass

### Cleanup
- ✅ filter-bar component deleted
- ✅ No unused imports
- ✅ No console errors/warnings

---

## 📈 Metrics - Przed vs Po

| Metryka | Przed | Po | Zysk |
|---------|-------|-----|------|
| Navbar height | 60px | 64px | +4px (ikony) |
| Filters height | 100px | 0px (hidden) | +100px space |
| Gallery grid start | 160px | 80px | +80px earlier |
| Map visible area | ~70% | 100% | +30% |
| Active state visibility | border-2px | bg-full | +300% |
| Mobile menu | ❌ | ✅ Hamburger | New feature |
| Filter accessibility | Always visible | FAB (1 click) | Better UX |

---

## 🎯 Post-Implementation

**Verification Checklist:**
- [ ] All 10 tasks completed
- [ ] Tests passing (frontend: X/X ✅)
- [ ] No console errors
- [ ] Responsive verified (desktop/tablet/mobile)
- [ ] Manual E2E flows pass
- [ ] Production deployment ready

**Documentation:**
- [ ] PROGRESS_TRACKER.md updated
- [ ] Screenshots (before/after) captured
- [ ] Commit message (Conventional Commits format)

---

**Last Updated:** 2025-10-28
**Status:** 🔧 Implementation in progress
