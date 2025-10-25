# Photo Viewer Feature - Fullscreen Photo Browser

**Status:** 🔜 Not started  
**Branch:** `feature/photo-viewer`  
**Created:** 2025-10-25  
**Estimated Time:** 8-10h  

---

## 🎯 Feature Overview

### User Story
**As a user**, I want to view photos in fullscreen mode with keyboard/touch navigation, **so that** I can browse through filtered photos without returning to gallery/map view.

### Key Requirements

**Triggers:**
- Click on photo thumbnail in Gallery
- Click on photo thumbnail in Map popup

**Fullscreen Viewer Experience:**
- Photo fills entire screen (100vw x 100vh)
- `object-fit: contain` → preserves aspect ratio (black bars if needed)
- Clean immersive mode - no visible UI elements
- Navigation controls appear only on hover (desktop) or after tap (mobile)

**Navigation:**
- **Desktop:** Arrow keys (← →) to navigate, ESC to close
- **Mobile:** Swipe left/right to navigate, tap center to close
- Context: navigates only through photos from current filter
- Always returns to source view (Gallery or Map)

**Exit:**
- Desktop: ESC key
- Mobile: Tap on center of photo
- Returns to previous route (`/gallery` or `/map`) with preserved state

---

## 🏗️ Architecture Overview

### Components
1. **PhotoViewerComponent** - Fullscreen overlay with photo display
2. **PhotoViewerService** - State management (photos list, current index, source route)

### Data Flow
```
User clicks photo in Gallery
  ↓
GalleryComponent.onPhotoClick(photoId)
  ↓
PhotoViewerService.openViewer(photos$, photoId, '/gallery')
  ↓
PhotoViewerComponent displays photo fullscreen
  ↓
User presses → arrow
  ↓
PhotoViewerComponent.nextPhoto()
  ↓
Loads next photo from filtered list
  ↓
User presses ESC
  ↓
Router.navigate('/gallery') ← Returns to source
```

### Key Design Decisions

**No Browser Fullscreen API:**
- Use CSS `position: fixed` + `z-index: 9999`
- Simpler, more controllable, works everywhere
- Avoids browser compatibility issues

**Photo Size:**
- Load from `/api/photos/{id}/full` endpoint
- Returns `large` size (800px) from backend
- Good balance: quality vs loading time

**State Management:**
- PhotoViewerService with BehaviorSubject pattern
- Stores: photos array, currentIndex, sourceRoute
- Components subscribe to `viewerState$`

**Source Route Tracking:**
- Service stores `/gallery` or `/map` when opening viewer
- Router.navigate(sourceRoute) when closing
- Preserves scroll position and filter state

---

## 📋 Implementation Phases

### Phase 1: Core Viewer Component ✅

**Status:** ✅ Completed (2025-10-25)  
**Time:** ~1.5h  

**Tasks:**
- [x] Create `PhotoViewerComponent` (standalone)
  - [x] Template: fullscreen overlay with image element
  - [x] CSS: `position: fixed`, `object-fit: contain`, black background
  - [x] Keyboard listeners: ESC (close), ArrowLeft (prev), ArrowRight (next)
  - [x] Navigation buttons (‹ › arrows) - visible only on hover
  - [x] Footer with counter (e.g., "3 / 24")
  
- [x] Create `PhotoViewerService`
  - [x] `ViewerState` interface (isOpen, photos, currentIndex, sourceRoute)
  - [x] BehaviorSubject for state management
  - [x] `openViewer(photos, photoId, sourceRoute)` method
  - [x] `closeViewer()` method → Router.navigate(sourceRoute)
  - [x] `nextPhoto()` / `previousPhoto()` methods
  - [x] Boundary checks (first/last photo)
  
- [x] Backend: Updated `/api/photos/{id}/full` endpoint
  - [x] Changed from `originalDirectory` to `largeDirectory` (800px)
  - [x] Added proper content-type detection via `Files.probeContentType()`
  - [x] Error handling (404 if file not found)
  
- [x] Unit Tests
  - [x] `PhotoViewerComponent.spec.ts` (36 tests total passing)
    - [x] Test keyboard navigation (arrows, ESC)
    - [x] Test boundary conditions (first/last photo)
    - [x] Test navigation button clicks
    - [x] Test template rendering
  - [x] `PhotoViewerService.spec.ts`
    - [x] Test state management (BehaviorSubject emissions)
    - [x] Test openViewer/closeViewer flow
    - [x] Test nextPhoto/previousPhoto logic
  - [x] Backend tests (61 tests total passing)

**Acceptance Criteria:**
- ✅ Viewer opens and displays photo fullscreen
- ✅ ESC key closes viewer and navigates to sourceRoute
- ✅ Arrow keys navigate between photos
- ✅ Navigation respects boundaries (can't go before first or after last)
- ✅ All unit tests passing (36 frontend + 61 backend)

---

### Phase 2: Gallery Integration ⏳

**Status:** 🔜 Not started  
**Time:** ~1h  

**Tasks:**
- [ ] Update `PhotoCardComponent`
  - [ ] Add `@Output() photoClick` event emitter
  - [ ] Emit photo.id when thumbnail clicked
  - [ ] Add cursor pointer on hover
  
- [ ] Update `GalleryComponent`
  - [ ] Import `PhotoViewerComponent` in template
  - [ ] Add `<app-photo-viewer></app-photo-viewer>` at end of template
  - [ ] Implement `onPhotoClick(photoId)` handler
  - [ ] Call `viewerService.openViewer(photos$, photoId, '/gallery')`
  
- [ ] Manual Testing
  - [ ] Click photo in gallery → viewer opens
  - [ ] Navigate with arrows → shows filtered photos only
  - [ ] Press ESC → returns to gallery with same scroll position
  - [ ] Filters still applied after returning

**Acceptance Criteria:**
- ✅ Clicking photo thumbnail in gallery opens fullscreen viewer
- ✅ Viewer shows only photos from current filter
- ✅ ESC returns to gallery with preserved state
- ✅ No console errors

---

### Phase 3: Map Integration ⏳

**Status:** 🔜 Not started  
**Time:** ~1h  

**Tasks:**
- [ ] Update `MapComponent`
  - [ ] Import `PhotoViewerComponent` in template
  - [ ] Add `<app-photo-viewer></app-photo-viewer>` at end of template
  - [ ] Add click handler to popup thumbnail images
  - [ ] Call `viewerService.openViewer(photos$, photoId, '/map')`
  
- [ ] Leaflet Popup Integration
  - [ ] Make popup thumbnail clickable
  - [ ] Prevent popup from closing when clicking image
  - [ ] Handle event properly (stop propagation)
  
- [ ] Manual Testing
  - [ ] Click marker on map → popup opens
  - [ ] Click thumbnail in popup → viewer opens
  - [ ] Navigate with arrows → shows only photos with GPS
  - [ ] Press ESC → returns to map with same zoom/position

**Acceptance Criteria:**
- ✅ Clicking thumbnail in map popup opens fullscreen viewer
- ✅ Viewer shows only photos with GPS coordinates
- ✅ ESC returns to map with preserved state (zoom, center)
- ✅ Map popup doesn't interfere with viewer

---

### Phase 4: Mobile Touch Support ⏳

**Status:** 🔜 Not started  
**Time:** ~1.5h  

**Tasks:**
- [ ] Add Touch Event Handlers to `PhotoViewerComponent`
  - [ ] `onTouchStart(event)` - record start position
  - [ ] `onTouchMove(event)` - track movement
  - [ ] `onTouchEnd(event)` - detect swipe direction
  
- [ ] Swipe Detection Logic
  - [ ] Calculate delta X between start and end
  - [ ] Threshold: 50px minimum for swipe
  - [ ] Swipe left → next photo
  - [ ] Swipe right → previous photo
  
- [ ] Tap-to-Close Feature
  - [ ] Detect tap vs swipe (movement < 10px)
  - [ ] Tap on center area → close viewer
  - [ ] Tap on navigation buttons → still navigates
  
- [ ] CSS Improvements
  - [ ] Remove hover-only navigation on mobile
  - [ ] Show navigation arrows always on touch devices
  - [ ] Increase touch target size (48px minimum)
  
- [ ] Mobile Testing
  - [ ] Chrome DevTools MCP: mobile viewport
  - [ ] Test swipe gestures (left, right)
  - [ ] Test tap-to-close
  - [ ] Test on different screen sizes

**Acceptance Criteria:**
- ✅ Swipe left navigates to next photo
- ✅ Swipe right navigates to previous photo
- ✅ Tap on center closes viewer
- ✅ Touch targets are large enough (accessibility)
- ✅ Works on mobile viewport (tested with DevTools)

---

### Phase 5: UX Enhancements ⏳

**Status:** 🔜 Not started  
**Time:** ~2h  

**Tasks:**
- [ ] Loading States
  - [ ] Show spinner while loading full-size photo
  - [ ] Placeholder while image loads
  - [ ] Smooth fade-in animation when loaded
  
- [ ] Preloading Strategy
  - [ ] Preload next photo when viewer opens
  - [ ] Preload previous photo after 1 second
  - [ ] Cache blob URLs in service
  - [ ] Clean up blob URLs on viewer close
  
- [ ] Transition Animations
  - [ ] Fade in/out on open/close
  - [ ] Slide animation between photos (optional)
  - [ ] Smooth navigation button appearance
  
- [ ] Error Handling
  - [ ] Handle 404 when photo file missing
  - [ ] Show error message if load fails
  - [ ] Allow navigation even if current photo fails
  - [ ] Retry button for failed loads
  
- [ ] Accessibility
  - [ ] ARIA labels on navigation buttons
  - [ ] Keyboard focus management
  - [ ] Screen reader announcements
  
- [ ] Polish
  - [ ] Photo metadata in footer (filename, date, rating)
  - [ ] Loading progress indicator
  - [ ] Smooth hover effects
  - [ ] Dark mode support (already black background)

**Acceptance Criteria:**
- ✅ Loading spinner shows while photo loads
- ✅ Next/prev photos preloaded for instant navigation
- ✅ Smooth animations between states
- ✅ Error states handled gracefully
- ✅ Keyboard accessible (focus visible, logical tab order)

---

## 🧪 Testing Strategy

### Unit Tests (Required)
- `PhotoViewerComponent.spec.ts` (keyboard, navigation, boundaries)
- `PhotoViewerService.spec.ts` (state management, routing)
- `PhotoController` (backend endpoint test)

**Target Coverage:** >70% for new code

### Integration Tests
- Gallery → Viewer → Navigation → Close flow
- Map → Viewer → Navigation → Close flow
- Filter changes reflected in viewer photo list

### Manual Testing Checklist
- [ ] Desktop: keyboard navigation (arrows, ESC)
- [ ] Desktop: mouse clicks on navigation buttons
- [ ] Desktop: hover effects on controls
- [ ] Mobile: swipe left/right gestures
- [ ] Mobile: tap-to-close on center
- [ ] Mobile: touch targets large enough
- [ ] Different photo sizes (portrait, landscape, square)
- [ ] Filtered photo sets (verify only filtered photos shown)
- [ ] Return to source (gallery vs map routing)
- [ ] Browser compatibility (Chrome, Firefox, Safari)

### Chrome DevTools MCP Verification
- [ ] Mobile viewport testing (iPhone, Android sizes)
- [ ] Touch event simulation
- [ ] Network throttling (slow 3G - test loading states)
- [ ] Console error check
- [ ] Performance profiling

---

## 📝 Technical Decisions Log

### Decision 1: CSS Fixed Position vs Browser Fullscreen API
**Choice:** CSS `position: fixed` with `z-index: 9999`  
**Reasoning:**
- Simpler implementation
- Better cross-browser compatibility
- More control over UI elements
- Avoids browser chrome differences

### Decision 2: Photo Size to Load
**Choice:** Load from `large/` directory (800px)  
**Reasoning:**
- Good balance between quality and file size
- Fast loading even on mobile networks
- Original files can be very large (5-10MB)
- Can add "view original" button in future if needed

### Decision 3: State Management Pattern
**Choice:** BehaviorSubject in PhotoViewerService  
**Reasoning:**
- Consistent with existing PhotoService and FilterService
- No external dependencies (no NgRx)
- Simple for this use case
- Easy to test

### Decision 4: Source Route Tracking
**Choice:** Store sourceRoute in ViewerState  
**Reasoning:**
- Allows proper back navigation
- Preserves filter/scroll state
- Simple Router.navigate() on close
- User-friendly experience

### Decision 5: Mobile Gesture Threshold
**Choice:** 50px minimum swipe distance  
**Reasoning:**
- Prevents accidental navigation
- Industry standard (based on iOS/Android guidelines)
- Tested in similar apps (Instagram, Google Photos)

---

## 🚀 Deployment Notes

### Build Verification
- [ ] Backend: `./mvnw clean test` (all tests pass)
- [ ] Frontend: `ng test` (all tests pass)
- [ ] Frontend: `ng build --configuration production` (no errors)

### Post-Merge Checklist
- [ ] Merge `feature/photo-viewer` to `master`
- [ ] Update `PROGRESS_TRACKER.md` (move to "Last Completed")
- [ ] Tag release: `git tag v1.1.0-photo-viewer`
- [ ] Deploy to dev environment for final verification
- [ ] Update user documentation (if exists)

---

## 📊 Progress Summary

| Phase | Status | Time Spent | Notes |
|-------|--------|------------|-------|
| Phase 1: Core Viewer | 🔜 Not started | - | - |
| Phase 2: Gallery Integration | 🔜 Not started | - | - |
| Phase 3: Map Integration | 🔜 Not started | - | - |
| Phase 4: Mobile Touch | 🔜 Not started | - | - |
| Phase 5: UX Enhancements | 🔜 Not started | - | - |
| **TOTAL** | **0%** | **0h / 8-10h** | - |

---

**Last Updated:** 2025-10-25  
**Branch:** `feature/photo-viewer`  
**Next Step:** Start Phase 1 - Core Viewer Component
