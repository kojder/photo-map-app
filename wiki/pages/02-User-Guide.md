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

1. Navigate to the application URL (e.g., https://photos.tojest.dev/)
2. Click **"Register"** button on the login page
3. Fill in the registration form:
   - Email address
   - Password (minimum requirements apply)
   - Confirm password
4. Submit the form

**After registration:**
- ✅ Your account is created successfully
- ⚠️ **Your account is NOT active yet** - you'll see an on-screen message:
  > "Registration successful! Please contact the administrator to activate your account."
- 📧 Contact the administrator via email to request account activation
- Administrator will activate your account and notify you

**Why manual activation?**
- Security: Prevents unauthorized access and spam registrations
- Control: Administrator verifies each new user before granting access
- Privacy: Ensures only trusted users can view and upload photos

### Login

**After your account is activated by the administrator:**

1. Navigate to the login page
2. Enter your email and password
3. Click **"Login"** button
4. You'll be redirected to the Gallery page

**JWT Authentication:**
- Your session is secured with JWT tokens
- Tokens are stored in browser localStorage
- Tokens expire after a certain period (refresh required)
- You'll be automatically logged out after token expiration

**Troubleshooting:**
- **"Invalid credentials"** → Check your email and password
- **"Account not activated"** → Contact the administrator
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
  - Overall rating (average from all users)
  - Your personal rating
- **Loading:** Automatic loading when scrolling to bottom (infinite scroll)
- **Empty State:** Shows helpful message when no photos match filters

**Actions:**
- Click on a photo → Open fullscreen Photo Viewer
- Click on star rating → Rate the photo (1-5 stars)
- Click Upload button (floating action button) → Upload new photos

**Permissions:**
- ✅ **VIEW_PHOTOS** permission required to see photos
- ✅ **UPLOAD_PHOTOS** permission required to upload new photos
- Without permissions, you'll see an empty state with a message

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
  - Format: YYYY-MM-DD (date picker available)
- **Rating:**
  - Minimum Rating: Show only photos with rating >= selected value (1-5 stars)
  - Filter by average rating (all users) or your personal rating
- **GPS Location:**
  - Show only photos with GPS coordinates
  - Show only photos without GPS coordinates

**How to Use Filters:**
1. Click **Filter FAB** (floating action button) on Gallery or Map page
2. Filter panel slides in from the side
3. Select your filter criteria
4. Click **"Apply"** button
5. Results are filtered immediately
6. Click **"Clear Filters"** to reset
7. Close filter panel by clicking FAB again or clicking outside

**Filter Behavior:**
- Filters are applied immediately (no page reload)
- Multiple filters can be combined (AND logic)
- Filter state is preserved when switching between Gallery and Map views
- Filters persist during the session (until you clear them or log out)

### Rating Photos

**Rate photos from 1 to 5 stars.**

**Features:**
- **Two Rating Types:**
  - **Overall Rating:** Average rating from all users (read-only)
  - **Your Rating:** Your personal rating (editable)
- **View Ratings:** Each photo card shows both overall and personal rating
- **Change Rating:** Click on stars to change your personal rating
- **Delete Rating:** Click on the same star again to remove your rating
- **Real-time Update:** Ratings are updated immediately (no page reload)

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
- Overall rating = Average of all users' ratings
- Rating count = Number of users who rated the photo
- Your rating = Your personal rating (visible only to you)

### Uploading Photos

**Upload your geotagged photos to the gallery.**

**Features:**
- **Drag & Drop:** Drag photos directly onto the upload dialog
- **File Select:** Click "Choose Files" button to select photos from your device
- **Multiple Upload:** Upload multiple photos at once
- **EXIF Extraction:** GPS coordinates and timestamp are extracted automatically
- **Thumbnail Generation:** Thumbnails (300px) are generated automatically
- **Progress Indicator:** See upload progress for each photo
- **Error Handling:** Failed uploads show error messages

**How to Upload:**
1. Click **Upload FAB** (floating action button with + icon)
2. Upload dialog appears
3. Drag & drop photos OR click "Choose Files"
4. Select one or more photos (JPEG format recommended)
5. Click **"Upload"** button
6. Wait for upload to complete
7. Photos appear in Gallery immediately

**Permissions:**
- ✅ **UPLOAD_PHOTOS** permission required to upload photos
- Without permission, Upload button is hidden

**Supported Formats:**
- JPEG/JPG (recommended - contains EXIF metadata)
- PNG (supported but usually lacks GPS data)
- Max file size: Check with administrator

**EXIF Metadata:**
- **GPS Coordinates:** Latitude, Longitude (required for Map view)
- **Timestamp:** Photo taken date and time
- **Camera Info:** Camera model, lens, settings (extracted but not displayed)

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
  - Rating (overall and personal)
- **High Quality:** Displays medium-sized image (300px thumbnail)

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
- URL: `/admin` (e.g., https://photos.tojest.dev/admin)

### User Management

**Manage user accounts and permissions.**

**Features:**
- **User List:** View all registered users
  - Email, Name, Status (Active/Inactive), Roles
- **Search:** Search users by email or name
- **User Details:** Click on user to view details
- **Activate/Deactivate:** Enable or disable user accounts
- **Delete User:** Remove user account (future: soft delete with anonymization)

**Actions:**
1. Navigate to Admin Panel
2. View list of all users
3. Search for specific user (optional)
4. Click on user row to view details
5. Activate/Deactivate user account
6. Manage permissions (see Permissions section)

**User Activation:**
- **Activate:** Enable user account (user can log in)
- **Deactivate:** Disable user account (user cannot log in)
- **Newly Registered Users:** Inactive by default (admin must activate)

### Permissions

**Manage user permissions for photo access and actions.**

**Available Permissions:**
1. **VIEW_PHOTOS** - View photos in Gallery and Map
2. **UPLOAD_PHOTOS** - Upload new photos
3. **RATE_PHOTOS** - Rate photos (1-5 stars)
4. **DELETE_PHOTOS** - Delete photos (future feature)

**How to Manage Permissions:**
1. Navigate to Admin Panel
2. Click on user row
3. User details panel appears
4. Toggle permissions on/off
5. Click **"Save"** button
6. Permissions are updated immediately

**Default Permissions:**
- New users: No permissions (admin must grant)
- Recommended: VIEW_PHOTOS + UPLOAD_PHOTOS + RATE_PHOTOS

**Permission Effects:**
- **VIEW_PHOTOS:**
  - Disabled → User sees empty Gallery/Map with message
  - Enabled → User can view all photos
- **UPLOAD_PHOTOS:**
  - Disabled → Upload button hidden
  - Enabled → Upload button visible, user can upload photos
- **RATE_PHOTOS:**
  - Disabled → Rating is read-only (view only)
  - Enabled → User can rate photos

### Photo Management

**Manage photos uploaded by all users.**

**Features:**
- **Photo List:** View all uploaded photos
  - Filename, Uploader, Upload Date, GPS Status
- **Search:** Search photos by filename or uploader
- **Photo Details:** View photo metadata (EXIF, GPS, ratings)
- **Delete Photo:** Remove photo from gallery (future: admin can delete)
- **Orphaned Photos:** Manage photos without owner (future feature)

**Orphaned Photos:**
- Photos uploaded by deleted/deactivated users
- Admin can reassign ownership or delete
- Prevents data loss when users are removed

**Future Features:**
- **Bulk Actions:** Select multiple photos and delete at once
- **Photo Statistics:** View upload statistics, most rated photos
- **Photo Moderation:** Approve/reject uploaded photos

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
- Activate new users promptly to improve their experience
- Grant VIEW_PHOTOS permission to all trusted users
- Grant UPLOAD_PHOTOS and RATE_PHOTOS based on trust level

---

## 🆘 Troubleshooting

**Login Issues:**
- Check email and password (case-sensitive)
- Contact admin if account not activated
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
