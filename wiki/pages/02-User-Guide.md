# User Guide

> Learn how to use Photo Map MVP - registration, gallery browsing, map view, filters, rating photos, and admin panel.

---

## 📖 Table of Contents

- [Registration & Login](#registration--login)
- [Using the Application](#using-the-application)
  - [Gallery View](#gallery-view)
  - [Map View](#map-view)
  - [Filters](#filters)
  - [Rating Photos](#rating-photos)
  - [Uploading Photos](#uploading-photos)
  - [Photo Viewer](#photo-viewer)
- [Admin Panel](#admin-panel)
  - [User Management](#user-management)
  - [Permissions](#permissions)
  - [Photo Management](#photo-management)

---

## 🔐 Registration & Login

### Registration

**Photo Map MVP uses a manual registration process:**

1. Navigate to the application URL (e.g., https://your-domain.com/)
2. Click **"Register"** button on the login page
3. Fill in the registration form:
   - Email address
   - Password (minimum requirements apply)
   - Confirm password
4. Submit the form

**After registration:**
- ✅ Your account is created successfully
- ✅ **You can log in immediately** - your account is active
- ⚠️ **But you won't see any photos yet** - you need permissions from admin
- 📧 Contact the administrator to request **VIEW_PHOTOS** and **RATE_PHOTOS** permissions
- After admin grants permissions, you'll be able to view and rate photos

**Why permission-based access?**
- **Family & friends focus:** Photo Map MVP is designed for sharing photos with family and close friends
- **Privacy:** Only trusted users can view photos
- **Security:** Prevents unauthorized access and spam registrations
- **Control:** Administrator verifies each new user before granting permissions
- **Simple for MVP:** No email verification needed - suitable for small trusted groups
### Login

**After registration, you can log in immediately:**

1. Navigate to the login page
2. Enter your email and password
3. Click **"Login"** button
4. You'll be redirected to the Gallery page

**If you don't have permissions yet:**
- Gallery will be empty with a message: "You don't have permission to view photos"
- Contact the administrator (email shown on screen) to request **VIEW_PHOTOS** permission
- The email shown is the administrator's contact email configured in the admin panel

**JWT Authentication:**
- Your session is secured with JWT tokens
- Tokens are stored in browser localStorage
- Tokens expire after a certain period (refresh required)
- You'll be automatically logged out after token expiration

**Troubleshooting:**
- **"Invalid credentials"** → Check your email and password
- **Empty gallery after login** → You need **VIEW_PHOTOS** permission from admin
- **Can't rate photos** → You need **RATE_PHOTOS** permission from admin
- **"Token expired"** → Log in again to refresh your session

---

## 🎨 Using the Application

### Gallery View

**Responsive photo grid** displaying all your uploaded photos.

**Features:**
- **Grid Layout:** Responsive grid that adapts to screen size (mobile, tablet, desktop)
- **Photo Cards:** Each card shows:
  - Thumbnail (300px medium-sized image)
  - Filename
  - Average rating from all users (e.g., 4.5 stars from 10 ratings)
  - Indicator if you've rated this photo
- **Loading:** Automatic loading when scrolling to bottom (infinite scroll)
- **Empty State:** Shows helpful message when no photos match filters

**Actions:**
- Click on a photo → Open fullscreen Photo Viewer
- Click on star rating → Rate the photo (1-5 stars)
- Click Upload button (floating action button) → Upload new photos

**Permissions:**
- ✅ **VIEW_PHOTOS** permission required to see photos
- Without VIEW_PHOTOS permission, you'll see an empty state with a message

### Map View

**Interactive map** showing photo locations based on GPS metadata (EXIF data).

**Features:**
- **Leaflet.js Map:** Zoomable, draggable interactive map
- **GPS Markers:** Each photo with GPS coordinates appears as a marker
- **Markercluster:** Groups nearby markers into clusters (improves performance)
- **Click Marker:** Click on a marker to see photo details (opens Photo Viewer)
- **No GPS Data:** Photos without GPS coordinates don't appear on the map

**Map Controls:**
- Zoom In/Out: Use +/- buttons or scroll wheel
- Pan: Click and drag to move the map
- Reset View: Double-click to reset zoom and center

**Permissions:**
- ✅ **VIEW_PHOTOS** permission required to see map markers
- Without permission, map is visible but empty

### Filters

**Filter photos by date, location, and rating.**

**Available Filters:**
- **Date Range:**
  - Start Date: Filter photos taken after this date
  - End Date: Filter photos taken before this date
  - Format: DD.MM.YYYY (date picker available)
- **Rating:**
  - Minimum Rating: Show only photos with rating >= selected value (1-5 stars)
  - Filter by average rating (all users) or your personal rating
- **GPS Location:**
  - Map view automatically shows only photos with GPS coordinates
  - Gallery view shows all photos (with and without GPS)

**How to Use Filters:**
1. Click **Filter FAB** (floating action button in bottom right corner) on Gallery or Map page
2. Filter panel slides in from the side
3. Select your filter criteria
4. Results are filtered automatically (no Apply button needed)
5. Click **"Clear Filters"** to reset
6. Close filter panel by clicking FAB again or clicking outside

**Filter Behavior:**
- Filters are applied immediately (no page reload)
- Multiple filters can be combined (AND logic)
- Filter state is preserved when switching between Gallery and Map views
- Filters persist during the session (until you clear them or log out)

### Rating Photos

**Rate photos from 1 to 5 stars.**

**Features:**
- **Average Rating Display:**
  - Shows average rating from all users (e.g., 4.5 stars)
  - Indicator if you've already rated this photo
- **View Ratings:** Each photo card shows average rating from all users
- **Add/Change Rating:** Click on stars to rate or change your rating
- **Real-time Update:** Ratings are updated immediately (no page reload)
- **Rating Calculation:** Average is recalculated automatically when you rate

**How to Rate:**
1. Find the photo you want to rate (Gallery view)
2. Click on the star rating area (1-5 stars)
3. Select your rating (1 star = worst, 5 stars = best)
4. Rating is saved automatically
5. Overall rating recalculates immediately

**Permissions:**
- ✅ **RATE_PHOTOS** permission required to rate photos
- Without permission, you can only view ratings (read-only)

**Rating Statistics:**
- Average rating = Average of all users' ratings
- Rating count = Number of users who rated the photo
- If you rated = Indicator shows you've already rated this photo

### Uploading Photos

**Upload your geotagged photos to the gallery.**

**Features:**
- **Single Photo Upload:** Upload one photo at a time (max 10MB per file)
- **Batch Upload Alternative:** For multiple photos, use server-side upload (see deployment documentation)
- **Drag & Drop:** Drag photo directly onto the upload dialog
- **File Select:** Click "Choose File" button to select photo from your device
- **EXIF Extraction:** GPS coordinates and timestamp are extracted automatically
- **Thumbnail Generation:** Thumbnails (300px) are generated automatically
- **Progress Indicator:** See upload progress for each photo
- **Error Handling:** Failed uploads show error messages

**How to Upload:**
1. Click **Upload FAB** (floating action button with + icon)
2. Upload dialog appears
3. Drag & drop photo OR click "Choose File"
4. Select a photo (JPEG format recommended, max 10MB)
5. Click **"Upload"** button
6. Photo appears in Gallery after processing

**Note:** Upload functionality is available to all logged-in users in MVP (no special permission required)

**Supported Formats:**
- JPEG/JPG (recommended - contains EXIF metadata)
- PNG (supported but usually lacks GPS data)
- Max file size: 10MB (default)

**EXIF Metadata:**
- **GPS Coordinates:** Latitude, Longitude (required for Map view)
- **Timestamp:** Photo taken date and time
- Other EXIF data may be extracted but is not displayed in MVP

**Troubleshooting:**
- **"Upload failed"** → Check file size and format
- **"No GPS data"** → Photo won't appear on Map (still visible in Gallery)
- **"Processing error"** → Photo is moved to `uploads/failed/` folder (contact admin)

### Photo Viewer

**Fullscreen photo viewer with keyboard navigation and mobile touch support.**

**Features:**
- **Fullscreen Mode:** Photo displayed in fullscreen overlay
- **Keyboard Navigation:**
  - `→` (Right Arrow) - Next photo
  - `←` (Left Arrow) - Previous photo
  - `ESC` - Close viewer
- **Mobile Touch Support:**
  - Swipe Left → Next photo
  - Swipe Right → Previous photo
  - Tap outside photo → Close viewer
- **Photo Info:**
  - Filename
  - Date taken (from EXIF)
  - GPS coordinates (if available)
  - Average rating from all users
- **High Quality:** Displays original full-resolution image (best quality)

**How to Use:**
1. Click on any photo in Gallery
2. Photo opens in fullscreen viewer
3. Navigate between photos using arrows or swipe gestures
4. Press ESC or tap outside to close

**Keyboard Shortcuts:**
- `→` - Next photo
- `←` - Previous photo
- `ESC` - Close viewer

---

## 🛡️ Admin Panel

**Administrator tools for managing users, permissions, and photos.**

**Access Requirements:**
- ✅ **ADMIN role** required to access Admin Panel
- Admin Panel link appears in navbar only for admin users
- URL: `/admin` (e.g., https://your-domain.com/admin)

### User Management

**Manage user accounts and permissions.**

**Features:**
- **User List:** View all registered users
  - Email, Role (USER/ADMIN), Permissions
- **Search:** Search users by email
- **User Details:** Click on user row to see details and manage permissions
- **Change Role:** Switch user between USER and ADMIN roles
- **Manage Permissions:** Grant or revoke VIEW_PHOTOS and RATE_PHOTOS permissions
- **Delete User:** Remove user account (use with caution)

**Actions:**
1. Navigate to Admin Panel
2. View list of all users
3. Search for specific user (optional)
4. Click on user row to open details panel
5. Grant or revoke permissions (VIEW_PHOTOS, RATE_PHOTOS)
6. Change user role (USER ↔ ADMIN)
7. Delete user if needed (cannot be undone in MVP)

### Permissions

**Manage user permissions for photo access and actions.**

**Available Permissions:**
1. **VIEW_PHOTOS** - View photos in Gallery and Map
2. **RATE_PHOTOS** - Rate photos (1-5 stars)

**How to Manage Permissions:**
1. Navigate to Admin Panel
2. Click on user row
3. User details panel appears
4. Toggle permissions on/off
5. Click **"Save"** button
6. Permissions are updated immediately

**Default Permissions:**
- **New users:** No permissions by default (admin must grant)
- **Recommended for trusted users:** VIEW_PHOTOS + RATE_PHOTOS

**Permission Effects:**
- **VIEW_PHOTOS:**
  - Disabled → User sees empty Gallery/Map with message
  - Enabled → User can view all photos
- **RATE_PHOTOS:**
  - Disabled → Rating is read-only (view only)
  - Enabled → User can rate photos

### Photo Management

**Photo management features are planned for post-MVP releases.**


**Planned Features (Post-MVP):**
- **Photo List:** View all uploaded photos with metadata
- **Photo Details:** View EXIF data, GPS, ratings for each photo
- **Delete Photos:** Admin can delete photos from gallery
- **Orphaned Photos:** Manage photos from deleted users
- **Bulk Actions:** Select and delete multiple photos at once
- **Photo Statistics:** View upload stats, most rated photos

---

## 💡 Tips & Tricks

**Gallery:**
- Use filters to find photos by date, rating, or location
- Sort photos by upload date, taken date, or rating (future feature)

**Map:**
- Zoom in to see individual markers
- Clusters show number of photos in area
- Click cluster to zoom into that area

**Rating:**
- Rate photos to help others find the best ones
- Your personal rating is private (only you can see it)

**Upload:**
- Use photos with GPS metadata for best experience (Map view)
- Upload multiple photos at once to save time
- Wait for upload to complete before navigating away

**Admin:**
- Grant VIEW_PHOTOS permission to new users after verifying they're trusted
- Grant RATE_PHOTOS permission to users who should be able to rate photos
- Regularly check for new registrations and grant permissions promptly

---

## 🆘 Troubleshooting

**Login Issues:**
- Check email and password (case-sensitive)
- Clear browser cache and try again

**Photo Upload Issues:**
- Check file format (JPEG recommended)
- Check file size (contact admin for limit)
- Ensure stable internet connection

**Map Issues:**
- Photos without GPS coordinates don't appear on map
- Check if GPS data exists in EXIF metadata
- Use GPS-enabled camera or smartphone

**Permission Issues:**
- Contact admin to request permissions
- Log out and log in again after permission changes

---

**Last Updated:** 2025-11-10

**Sources:**
- `README.md` (Features section)
- `.ai/prd.md` (User stories and requirements)
