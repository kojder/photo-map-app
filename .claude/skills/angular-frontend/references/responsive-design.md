# Responsive Design (RWD)

Responsive design patterns for Photo Map MVP: mobile-first approach, breakpoints, touch-friendly controls, adaptive layouts.

## Mobile-First Strategy

**Concept:** Design for mobile first, then enhance for larger screens.

```html
<!-- Base: mobile (< 640px) -->
<div class="text-sm p-2">
  <!-- sm: tablets (≥ 640px) -->
  <div class="sm:text-base sm:p-4">
    <!-- md: desktops (≥ 768px) -->
    <div class="md:text-lg md:p-6">
      Content
    </div>
  </div>
</div>
```

## Tailwind Breakpoints

| Prefix | Min Width | Target Device |
|--------|-----------|---------------|
| (none) | 0px | Mobile |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Large desktops |
| `2xl:` | 1536px | Extra large desktops |

## Responsive Grid Layouts

### Photo Gallery Grid

```html
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
  @for (photo of photos(); track photo.id) {
    <app-photo-card [photo]="photo" />
  }
</div>
```

**Breakdowns:**
- Mobile (< 640px): 1 column
- Small tablets (≥ 640px): 2 columns
- Tablets (≥ 768px): 3 columns
- Desktops (≥ 1024px): 4 columns

### Responsive Container

```html
<div class="container mx-auto px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    Content
  </div>
</div>
```

## Touch-Friendly Controls

### Minimum Touch Target: 48px

**WCAG Guideline:** Touch targets should be at least 48x48px for accessibility.

```html
<!-- ✅ GOOD: 48px minimum -->
<button class="w-12 h-12 flex items-center justify-center">
  <svg class="w-6 h-6">...</svg>
</button>

<!-- ❌ BAD: Too small for touch -->
<button class="w-6 h-6">
  <svg class="w-6 h-6">...</svg>
</button>
```

### Mobile Navigation

```html
<!-- Hamburger Menu (mobile only) -->
<div class="md:hidden">
  <button class="w-12 h-12 flex items-center justify-center" (click)="toggleMenu()">
    <svg class="w-6 h-6">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" />
    </svg>
  </button>
</div>

<!-- Desktop Menu -->
<div class="hidden md:flex space-x-4">
  <a href="/gallery">Gallery</a>
  <a href="/map">Map</a>
  <a href="/admin">Admin</a>
</div>
```

### Swipe Gestures (Photo Viewer)

```typescript
export class PhotoViewerComponent {
  private touchStartX = 0;
  private touchMoveX = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    this.touchMoveX = event.touches[0].clientX;
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    const diff = this.touchStartX - this.touchMoveX;
    const threshold = 50; // 50px swipe threshold

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.nextPhoto(); // Swipe left
      } else {
        this.previousPhoto(); // Swipe right
      }
    }

    this.touchStartX = 0;
    this.touchMoveX = 0;
  }
}
```

## Adaptive Typography

```html
<!-- Mobile: 14px, Tablet: 16px, Desktop: 18px -->
<h1 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
  Photo Gallery
</h1>

<!-- Mobile: 12px, Tablet: 14px, Desktop: 16px -->
<p class="text-xs sm:text-sm md:text-base text-gray-600">
  Browse your photo collection
</p>
```

## Responsive Images

### Object Fit

```html
<!-- Preserve aspect ratio, cover container -->
<img
  [src]="photo.thumbnailUrl"
  [alt]="photo.fileName"
  class="w-full h-48 object-cover"
>

<!-- Preserve aspect ratio, contain within container -->
<img
  [src]="photo.fullUrl"
  [alt]="photo.fileName"
  class="w-full h-full object-contain"
>
```

### Responsive Image Sizes

```html
<!-- Mobile: 150px, Tablet: 300px, Desktop: 400px -->
<img
  [src]="photo.thumbnailUrl"
  class="w-full h-auto sm:w-64 md:w-80 lg:w-96"
>
```

## Responsive Spacing

```html
<!-- Mobile: p-2, Tablet: p-4, Desktop: p-6 -->
<div class="p-2 sm:p-4 md:p-6">
  Content
</div>

<!-- Mobile: gap-2, Tablet: gap-4, Desktop: gap-6 -->
<div class="flex gap-2 sm:gap-4 md:gap-6">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Responsive Layouts

### Sidebar Layout (Desktop only)

```html
<div class="flex flex-col md:flex-row">
  <!-- Sidebar (desktop only) -->
  <aside class="hidden md:block md:w-64 bg-gray-100 p-4">
    Sidebar
  </aside>

  <!-- Main Content -->
  <main class="flex-1 p-4">
    Main Content
  </main>
</div>
```

### Stack on Mobile, Side-by-Side on Desktop

```html
<div class="flex flex-col md:flex-row gap-4">
  <div class="md:w-1/2">
    Left Content
  </div>
  <div class="md:w-1/2">
    Right Content
  </div>
</div>
```

## Viewport Meta Tag

**Required in `index.html`:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

This ensures proper scaling on mobile devices.

## Media Queries (CSS fallback)

```css
/* Mobile first */
.photo-card {
  width: 100%;
  padding: 0.5rem;
}

/* Tablet (≥ 768px) */
@media (min-width: 768px) {
  .photo-card {
    width: 50%;
    padding: 1rem;
  }
}

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .photo-card {
    width: 33.333%;
    padding: 1.5rem;
  }
}
```

**Prefer Tailwind utilities over custom CSS.**

## Responsive Navigation Example

```html
<nav class="bg-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex-shrink-0">
        <span class="text-xl sm:text-2xl font-bold text-blue-600">Photo Map</span>
      </div>

      <!-- Desktop Menu -->
      <div class="hidden md:flex items-center space-x-4">
        <a href="/gallery" class="text-gray-700 hover:text-blue-600 px-3 py-2">
          Gallery
        </a>
        <a href="/map" class="text-gray-700 hover:text-blue-600 px-3 py-2">
          Map
        </a>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Logout
        </button>
      </div>

      <!-- Mobile Menu Button -->
      <div class="md:hidden">
        <button
          class="w-12 h-12 flex items-center justify-center text-gray-700"
          (click)="toggleMobileMenu()"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Menu -->
  @if (mobileMenuOpen()) {
    <div class="md:hidden border-t border-gray-200">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <a href="/gallery" class="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Gallery
        </a>
        <a href="/map" class="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
          Map
        </a>
        <button class="w-full text-left bg-blue-600 text-white px-3 py-2 rounded-md">
          Logout
        </button>
      </div>
    </div>
  }
</nav>
```

## Photo Map MVP Responsive Requirements

### Target Devices

1. **Mobile (< 640px)**
   - Single column gallery
   - Touch-friendly controls (48px minimum)
   - Hamburger menu
   - Full-screen photo viewer

2. **Tablet (640-1024px)**
   - 2-3 column gallery
   - Hybrid touch + mouse support
   - Sidebar optional

3. **Desktop (> 1024px)**
   - 4 column gallery
   - Full navigation bar
   - Hover effects
   - Keyboard shortcuts

## Testing Responsive Design

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Test different devices:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

### Breakpoint Testing Checklist

- [ ] Mobile (< 640px) - Single column, hamburger menu
- [ ] Tablet (640-1024px) - 2-3 columns, touch-friendly
- [ ] Desktop (> 1024px) - 4 columns, full navigation

### Common Issues

1. **Text too small on mobile** - Use responsive typography (`text-sm sm:text-base`)
2. **Touch targets too small** - Minimum 48x48px
3. **Images overflow** - Use `w-full` + `object-cover`
4. **Layout breaks on tablet** - Test 640-1024px range
5. **Horizontal scroll** - Check `max-w-full` on large elements

## Best Practices

**Do:**
- ✅ Mobile-first approach (base styles, then sm:, md:, lg:)
- ✅ Touch targets ≥ 48px
- ✅ Test on real devices (not just DevTools)
- ✅ Use Tailwind responsive utilities
- ✅ Viewport meta tag in index.html

**Don't:**
- ❌ Don't assume mouse-only interaction
- ❌ Don't use fixed px widths (use responsive units)
- ❌ Don't forget to test landscape orientation
- ❌ Don't skip intermediate breakpoints (sm:, md:)
- ❌ Don't use hover-only interactions on mobile
