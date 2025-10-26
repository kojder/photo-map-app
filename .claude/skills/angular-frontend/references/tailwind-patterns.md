# Tailwind CSS Patterns

Tailwind CSS styling for Photo Map MVP: utility-first approach, responsive design, component patterns.

## Critical Constraint

**⚠️ IMPORTANT: Tailwind 3.4.17 (NOT 4!)**

- **Reason:** Angular 18 incompatibility with Tailwind 4
- **Version:** 3.4.17 (specified in package.json)
- **Do NOT upgrade** to Tailwind 4 during MVP

## Utility-First Approach

### Button Variants

```html
<!-- Primary Button -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
  Primary
</button>

<!-- Secondary Button -->
<button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
  Secondary
</button>

<!-- Danger Button -->
<button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
  Delete
</button>

<!-- Disabled Button -->
<button class="px-4 py-2 bg-gray-400 text-gray-600 rounded-lg cursor-not-allowed" disabled>
  Disabled
</button>
```

### Form Inputs

```html
<!-- Text Input -->
<input
  type="text"
  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text"
/>

<!-- Input with Error -->
<input
  type="email"
  class="w-full px-4 py-2 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500"
  placeholder="Enter email"
/>
<p class="mt-1 text-sm text-red-600">Invalid email address</p>

<!-- Select Dropdown -->
<select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

## Responsive Grid (Photo Gallery)

### Grid Layout

```html
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
  @for (photo of photos(); track photo.id) {
    <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <img [src]="photo.thumbnailUrl" class="w-full h-48 object-cover">
      <div class="p-4">
        <h3 class="text-lg font-semibold">{{ photo.fileName }}</h3>
        <p class="text-sm text-gray-600">{{ photo.takenAt | date:'short' }}</p>
      </div>
    </div>
  }
</div>
```

**Breakpoints:**
- `grid-cols-1` - mobile (< 640px)
- `sm:grid-cols-2` - small (≥ 640px)
- `md:grid-cols-3` - medium (≥ 768px)
- `lg:grid-cols-4` - large (≥ 1024px)

## Photo Card Pattern

```html
<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer">
  <!-- Image -->
  <div class="relative">
    <img [src]="photo.thumbnailUrl" class="w-full h-48 object-cover">

    <!-- Rating Badge -->
    <div class="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
      ⭐ {{ photo.rating }}/10
    </div>
  </div>

  <!-- Content -->
  <div class="p-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ photo.fileName }}</h3>
    <p class="text-sm text-gray-600 mb-2">📅 {{ photo.takenAt | date:'short' }}</p>
    <p class="text-xs text-gray-500">📍 GPS: {{ photo.latitude }}, {{ photo.longitude }}</p>

    <!-- Actions -->
    <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
      <button class="text-sm text-blue-600 hover:text-blue-800">
        Rate
      </button>
      <button class="text-sm text-red-600 hover:text-red-800">
        Delete
      </button>
    </div>
  </div>
</div>
```

## Modal Dialog Pattern

```html
<!-- Overlay -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <!-- Modal Card -->
  <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
    <!-- Header -->
    <div class="flex justify-between items-center p-6 border-b border-gray-200">
      <h3 class="text-xl font-semibold text-gray-900">Upload Photo</h3>
      <button class="text-gray-400 hover:text-gray-600">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="p-6">
      <p class="text-gray-600">Select a photo to upload</p>
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-3 p-6 border-t border-gray-200">
      <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
        Cancel
      </button>
      <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Upload
      </button>
    </div>
  </div>
</div>
```

## Loading States

```html
<!-- Spinner -->
<div class="flex items-center justify-center p-8">
  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
</div>

<!-- Skeleton Loader -->
<div class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
  <div class="bg-gray-300 h-48 w-full"></div>
  <div class="p-4">
    <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div class="h-3 bg-gray-300 rounded w-1/2"></div>
  </div>
</div>
```

## Alert Messages

```html
<!-- Success Alert -->
<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
  <strong class="font-bold">Success!</strong>
  <span class="block sm:inline">Photo uploaded successfully.</span>
</div>

<!-- Error Alert -->
<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
  <strong class="font-bold">Error!</strong>
  <span class="block sm:inline">Failed to upload photo.</span>
</div>

<!-- Warning Alert -->
<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
  <strong class="font-bold">Warning!</strong>
  <span class="block sm:inline">File size exceeds 10MB.</span>
</div>

<!-- Info Alert -->
<div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative" role="alert">
  <strong class="font-bold">Info!</strong>
  <span class="block sm:inline">Processing may take a few minutes.</span>
</div>
```

## Responsive Navigation

```html
<!-- Desktop Navbar -->
<nav class="bg-white shadow-md">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex-shrink-0">
        <span class="text-2xl font-bold text-blue-600">Photo Map</span>
      </div>

      <!-- Desktop Menu -->
      <div class="hidden md:block">
        <div class="flex items-center space-x-4">
          <a href="/gallery" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
            Gallery
          </a>
          <a href="/map" class="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
            Map
          </a>
          <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Logout
          </button>
        </div>
      </div>

      <!-- Mobile Menu Button -->
      <div class="md:hidden">
        <button class="text-gray-700 hover:text-blue-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Menu -->
  <div class="md:hidden">
    <div class="px-2 pt-2 pb-3 space-y-1">
      <a href="/gallery" class="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md">
        Gallery
      </a>
      <a href="/map" class="block text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md">
        Map
      </a>
      <button class="w-full text-left bg-blue-600 text-white px-3 py-2 rounded-md">
        Logout
      </button>
    </div>
  </div>
</nav>
```

## Mobile-First Responsive Breakpoints

**Tailwind 3 Breakpoints:**

| Prefix | Min Width | Target |
|--------|-----------|--------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Large desktops |
| `2xl:` | 1536px | Extra large |

**Mobile-First Strategy:**

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

## Configuration (tailwind.config.js)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
      },
    },
  },
  plugins: [],
}
```

## Best Practices

**Do:**
- ✅ Use utility classes directly in templates
- ✅ Mobile-first approach (base styles, then sm:, md:, lg:)
- ✅ Compose utilities for one-off designs
- ✅ Use `@apply` only for repeated patterns

**Don't:**
- ❌ Don't create custom CSS classes for everything
- ❌ Don't use Tailwind 4 (Angular 18 incompatibility!)
- ❌ Don't inline all styles (extract repeated patterns)
- ❌ Don't forget responsive breakpoints
