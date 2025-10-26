# Public Photo Sharing Feature

**Status:** 📋 Planned (Optional Post-MVP)
**Estimated Time:** 7-9h
**Created:** 2025-10-26
**Dependencies:** MVP Core (Phases 1-4)

---

## 🎯 Feature Overview

### Description

Użytkownicy mogą grupować wybrane zdjęcia i udostępniać je znajomym przez unikalny link UUID bez wymagania rejestracji.

### Use Case Example

> "Wyjazd w grudniu 2024 w Izery" - użytkownik filtruje zdjęcia po dacie, zaznacza 20 zdjęć checkboxami, tworzy grupę "Izery 2024", otrzymuje link `https://app.com/public/shared/abc123-uuid` i wysyła znajomym. Znajomi widzą galerię + mapę (read-only).

### User Stories

- **US-SHARE-001:** Jako użytkownik mogę utworzyć grupę zdjęć z nazwą i opisem
- **US-SHARE-002:** Jako użytkownik mogę zaznaczyć wiele zdjęć checkboxami w galerii
- **US-SHARE-003:** Jako użytkownik mogę przypisać zaznaczone zdjęcia do grupy (nowej lub istniejącej)
- **US-SHARE-004:** Jako użytkownik mogę skopiować link do grupy i wysłać znajomym
- **US-SHARE-005:** Jako gość mogę otworzyć link i zobaczyć galerię + mapę bez logowania
- **US-SHARE-006:** Jako użytkownik mogę zarządzać grupami (dodać/usunąć zdjęcia, zmienić nazwę, usunąć grupę)
- **US-SHARE-007:** Jako użytkownik mogę wykonać bulk operations: zmiana ratingu, zmiana daty, usuwanie

### Requirements Summary

**Zabezpieczenie:**
- Tylko unikalny link UUID (brak hasła, brak expiration dla MVP)

**Zarządzanie grupą (owner):**
- Dodawać/usuwać zdjęcia
- Zmieniać nazwę/opis
- Usuwać całą grupę
- Zarządzać ustawieniami dostępu (regeneracja linku - opcjonalnie)

**Bulk Operations:**
- Zmiana ratingu wielu zdjęć naraz
- Usuwanie wielu zdjęć
- Zmiana daty wielu zdjęć

**Widok publiczny (guest):**
- Galeria + mapa (read-only)
- Bez możliwości edycji, ratingu, usuwania

---

## 📋 Implementation Phases

### Phase 1.1: Backend - Database & API (3-4h)

**Status:** 📋 Planned

#### Database Changes

**Nowa tabela: `shared_groups`**

```sql
CREATE TABLE shared_groups (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_token VARCHAR(36) UNIQUE NOT NULL, -- UUID v4
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX shared_groups_user_id_idx ON shared_groups(user_id);
CREATE UNIQUE INDEX shared_groups_token_idx ON shared_groups(share_token);
```

**Nowa tabela: `shared_group_photos` (junction table)**

```sql
CREATE TABLE shared_group_photos (
    id BIGSERIAL PRIMARY KEY,
    shared_group_id BIGINT NOT NULL REFERENCES shared_groups(id) ON DELETE CASCADE,
    photo_id BIGINT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shared_group_id, photo_id)
);

CREATE INDEX shared_group_photos_group_id_idx ON shared_group_photos(shared_group_id);
CREATE INDEX shared_group_photos_photo_id_idx ON shared_group_photos(photo_id);
```

**Flyway Migration:** `V3__add_shared_groups.sql`

#### JPA Entities

**SharedGroup Entity:**
- Package: `com.photomap.model`
- Fields: id, user, shareToken (UUID), name, description, createdAt, updatedAt
- Relationships:
  - `@ManyToOne` → User (owner)
  - `@ManyToMany` → Photos (through junction table)

**Junction Entity (SharedGroupPhoto):**
- Fields: id, sharedGroup, photo, addedAt
- Relationships: `@ManyToOne` → SharedGroup, `@ManyToOne` → Photo

#### REST API Endpoints

##### Protected Endpoints (require auth)

**POST /api/shared-groups**
- Opis: Utwórz nową grupę
- Request: `{ name, description? }`
- Response: `{ id, shareToken, name, description, createdAt }`
- Security: Authenticated user

**GET /api/shared-groups**
- Opis: Lista grup użytkownika
- Query params: `page`, `size`, `sort`
- Response: `PageResponse<SharedGroupResponse>`
- Security: Authenticated user (tylko własne grupy)

**GET /api/shared-groups/{id}**
- Opis: Szczegóły grupy
- Response: `{ id, shareToken, name, description, photoCount, createdAt }`
- Security: Owner only

**PUT /api/shared-groups/{id}**
- Opis: Edycja nazwy/opisu
- Request: `{ name, description? }`
- Response: `SharedGroupResponse`
- Security: Owner only

**DELETE /api/shared-groups/{id}**
- Opis: Usunięcie grupy
- Response: 204 No Content
- Security: Owner only

**POST /api/shared-groups/{id}/photos**
- Opis: Dodanie zdjęć do grupy (bulk)
- Request: `{ photoIds: [1, 2, 3, ...] }`
- Response: `{ added: 3, total: 15 }`
- Security: Owner only + user owns all photoIds

**DELETE /api/shared-groups/{id}/photos/{photoId}**
- Opis: Usunięcie zdjęcia z grupy
- Response: 204 No Content
- Security: Owner only

**POST /api/photos/bulk/rating**
- Opis: Bulk zmiana ratingu
- Request: `{ photoIds: [1, 2, 3], rating: 4 }`
- Response: `{ updated: 3 }`
- Security: Authenticated user (owns photos)

**PUT /api/photos/bulk/date**
- Opis: Bulk zmiana daty
- Request: `{ photoIds: [1, 2, 3], takenAt: "2024-12-15T10:30:00Z" }`
- Response: `{ updated: 3 }`
- Security: Authenticated user (owns photos)

**DELETE /api/photos/bulk**
- Opis: Bulk usuwanie
- Request: `{ photoIds: [1, 2, 3] }`
- Response: `{ deleted: 3 }`
- Security: Authenticated user (owns photos)

##### Public Endpoints (no auth required)

**GET /api/public/shared/{token}**
- Opis: Pobranie metadanych grupy (public)
- Response: `{ name, description, photoCount, createdAt }`
- Security: Public (tylko share_token validation)

**GET /api/public/shared/{token}/photos**
- Opis: Lista zdjęć w grupie (public)
- Query params: `page`, `size`
- Response: `PageResponse<PublicPhotoResponse>`
  - PublicPhotoResponse: id, filename, thumbnailUrl, gpsLatitude, gpsLongitude, takenAt, averageRating
  - **Brak:** userId, originalFilename, fullUrl (security)
- Security: Public

#### Service Layer

**SharedGroupService:**
- `createGroup(userId, name, description)` - Create group with UUID token
- `addPhotosToGroup(groupId, photoIds, userId)` - Bulk add with ownership check
- `removePhotoFromGroup(groupId, photoId, userId)` - Owner check
- `getGroupsByUser(userId)` - List user's groups
- `getGroupByToken(token)` - Public access (no auth)
- `deleteGroup(groupId, userId)` - Owner check + cascade delete

**PhotoService - new methods:**
- `bulkUpdateRating(photoIds, rating, userId)` - Validate ownership
- `bulkUpdateDate(photoIds, takenAt, userId)` - Validate ownership
- `bulkDelete(photoIds, userId)` - Validate ownership + file deletion

#### Testing

- Unit tests: SharedGroupService (create, add photos, validate ownership)
- Integration tests: REST endpoints (authenticated + public)
- Test coverage: >70%

---

### Phase 1.2: Frontend - Bulk Selection & Sharing UI (4-5h)

**Status:** 📋 Planned

#### New Components

##### 1. BulkActionsBarComponent

**Location:** `src/app/components/bulk-actions-bar/`

**Features:**
- Toggle "Select Mode" button
- Select All / Deselect All
- Actions dropdown: "Assign to Group", "Change Rating", "Change Date", "Delete Selected"
- Counter: "X photos selected"

**State:**
- `selectionMode: signal<boolean>` (toggle on/off)
- `selectedPhotoIds: signal<Set<number>>` (selected IDs)

**Methods:**
- `toggleSelectMode()` - Enable/disable checkboxes
- `selectAll()` / `deselectAll()`
- `onAssignToGroup()` - Open SharedGroupDialogComponent
- `onBulkRating()` - Open rating dialog
- `onBulkDate()` - Open date picker dialog
- `onBulkDelete()` - Confirm + call PhotoService.bulkDelete()

**Template:**
- Sticky top bar (bg-blue-100, shadow-md)
- Toggle button (test-id: `bulk-mode-toggle`)
- Counter badge
- Actions dropdown (test-id: `bulk-actions-dropdown`)

---

##### 2. SharedGroupDialogComponent

**Location:** `src/app/components/shared-group-dialog/`

**Features:**
- Create new group: name + description inputs
- Select existing group: searchable dropdown
- Display share link (copy to clipboard button)

**Inputs:**
- `@Input() selectedPhotoIds: number[]`

**Outputs:**
- `@Output() groupCreated: EventEmitter<SharedGroup>`
- `@Output() photosAssigned: EventEmitter<void>`

**State:**
- `groups: signal<SharedGroup[]>` (user's existing groups)
- `selectedGroup: signal<SharedGroup | null>`
- `newGroupName: string`
- `newGroupDescription: string`

**Methods:**
- `onCreateNew()` - Call SharedGroupService.createGroup()
- `onSelectExisting()` - Assign to existing group
- `copyShareLink()` - Copy to clipboard (https://app.com/public/shared/{token})

**Template:**
- Modal dialog (z-50, centered)
- Tabs: "Create New" | "Add to Existing"
- Share link display (input + copy button)

---

##### 3. SharedGroupListComponent

**Location:** `src/app/components/shared-group-list/`

**Features:**
- List of user's groups (table or cards)
- Columns: Name, Photos Count, Created, Share Link, Actions
- Actions: Edit, Delete, Copy Link

**State:**
- `groups: signal<SharedGroup[]>`
- `loading: signal<boolean>`

**Methods:**
- `ngOnInit()` - Load groups from SharedGroupService
- `onEdit(group)` - Open edit dialog
- `onDelete(group)` - Confirm + delete
- `onCopyLink(group)` - Copy share link

**Template:**
- Table layout (desktop) or card grid (mobile)
- Copy link button (test-id: `group-copy-link-btn`)
- Edit/Delete buttons (test-id: `group-edit-btn`, `group-delete-btn`)

---

##### 4. PublicGalleryComponent

**Location:** `src/app/components/public-gallery/`

**Features:**
- Public gallery view (no auth required)
- Display photos in grid (like GalleryComponent)
- Map with markers (like MapComponent)
- Read-only (no rating, no upload, no delete)
- Group name + description header

**Route:** `/public/shared/:token` (no auth guard)

**State:**
- `group: signal<SharedGroupInfo | null>`
- `photos: signal<Photo[]>`
- `loading: signal<boolean>`

**Methods:**
- `ngOnInit()` - Load group by token (public API)
- `loadPhotos()` - Load photos from public endpoint

**Template:**
- Header: Group name + description
- Tabs: Gallery | Map
- Footer: "Powered by Photo Map" (branding)

**Test IDs:** `public-gallery-header`, `public-gallery-grid`, `public-map`

---

#### Changes to Existing Components

##### PhotoCardComponent

**Changes:**
- Add checkbox (top-left corner, conditional: `@if (selectionMode)`)
- Input: `@Input() selectionMode: boolean`
- Input: `@Input() isSelected: boolean`
- Output: `@Output() selectionChange: EventEmitter<boolean>`

**Template:**
- Checkbox (absolute positioning, top-2 left-2, z-10)
- Conditional display: `@if (selectionMode())`

---

##### GalleryComponent

**Changes:**
- Integrate BulkActionsBarComponent
- Pass `selectionMode` and `selectedPhotoIds` to PhotoCardComponent
- Handle checkbox events (update Set<number>)

**State:**
- `selectionMode: signal<boolean>` (from BulkActionsBar)
- `selectedPhotoIds: signal<Set<number>>`

**Methods:**
- `onPhotoSelectionChange(photoId, selected)` - Update Set

---

#### Services

##### SharedGroupService

**Location:** `src/app/services/shared-group.service.ts`

**State:**
- `groups$: Observable<SharedGroup[]>` (BehaviorSubject)

**Methods:**
- `createGroup(name, description): Observable<SharedGroup>`
- `getMyGroups(): Observable<SharedGroup[]>`
- `getGroupById(id): Observable<SharedGroup>`
- `updateGroup(id, name, description): Observable<SharedGroup>`
- `deleteGroup(id): Observable<void>`
- `addPhotosToGroup(groupId, photoIds): Observable<void>`
- `removePhotoFromGroup(groupId, photoId): Observable<void>`
- `getPublicGroup(token): Observable<SharedGroupInfo>` (no auth)
- `getPublicGroupPhotos(token): Observable<Photo[]>` (no auth)

---

##### PhotoService - Bulk Methods

**New methods:**
- `bulkUpdateRating(photoIds, rating): Observable<{ updated: number }>`
- `bulkUpdateDate(photoIds, takenAt): Observable<{ updated: number }>`
- `bulkDelete(photoIds): Observable<{ deleted: number }>`

---

#### Routing

**New routes:**
- `/shared-groups` - SharedGroupListComponent (protected, authGuard)
- `/public/shared/:token` - PublicGalleryComponent (public, no guard)

**Update navbar:**
- Add "Shared Groups" link (między Gallery i Map, authenticated users only)

---

#### UX Flow Example

**Creating and sharing a group:**

1. User navigates to `/gallery`
2. Applies filters: date range = December 2024
3. Clicks "Select Mode" toggle (BulkActionsBar appears)
4. Checkboxes appear on all PhotoCards
5. User clicks checkboxes to select 20 photos
6. Counter shows "20 photos selected"
7. Clicks "Actions" → "Assign to Group"
8. SharedGroupDialogComponent opens
9. Tab "Create New": enters name "Izery 2024", description "Wyjazd w grudniu"
10. Clicks "Create & Assign"
11. System creates group, assigns photos, generates UUID token
12. Dialog shows share link: `https://app.com/public/shared/abc123-uuid`
13. User clicks "Copy Link"
14. Sends link to friends via email/messenger

**Guest viewing shared group:**

1. Guest receives link: `https://app.com/public/shared/abc123-uuid`
2. Opens link in browser (no login required)
3. PublicGalleryComponent loads
4. Header shows: "Izery 2024" + description
5. Tabs: Gallery (grid view) | Map (Leaflet with markers)
6. Guest can browse, click photos (fullscreen viewer), explore map
7. No rating, no upload, no delete options (read-only)

---

#### Testing

- Unit tests: BulkActionsBarComponent (selection logic)
- Unit tests: SharedGroupService (all methods)
- Integration tests: Public gallery (no auth required)
- E2E tests: Create group → assign photos → copy link → open public view

---

## ✅ Acceptance Criteria

### Must Have

- ✅ User can create group with name + description
- ✅ User can select multiple photos with checkboxes (bulk selection mode)
- ✅ User can assign selected photos to group (new or existing)
- ✅ System generates unique UUID token for group
- ✅ User can copy share link and send to friends
- ✅ Guest can open link and view gallery + map (no auth required)
- ✅ Guest sees read-only view (no rating, upload, delete)
- ✅ Owner can manage group: add/remove photos, edit name/description, delete group
- ✅ Bulk operations work: change rating, change date, delete multiple photos

### Performance

- ✅ Public gallery loads <2s (20 photos)
- ✅ Bulk operations handle 50+ photos efficiently

### Security

- ✅ UUID tokens are unpredictable (UUID v4)
- ✅ Public endpoint does not expose sensitive data (no userId, no fullUrl)
- ✅ Ownership validation prevents unauthorized access

---

## 📊 Time Estimate

**Phase 1.1 (Backend):** 3-4 hours
- Database migration: 30 min
- JPA entities: 30 min
- Service layer: 1h
- REST endpoints: 1h
- Testing: 1h

**Phase 1.2 (Frontend):** 4-5 hours
- BulkActionsBarComponent: 1h
- SharedGroupDialogComponent: 1h
- PublicGalleryComponent: 1.5h
- PhotoCard checkbox integration: 30 min
- Testing: 1h

**Total:** 7-9 hours

---

## 📖 Related Documentation

- `.ai/prd.md` - MVP requirements
- `.ai/db-plan.md` - Current database schema
- `.ai/api-plan.md` - Current API specification
- `.ai/ui-plan.md` - Current UI architecture
- `PROGRESS_TRACKER.md` - Project status

---

**Feature Status:** 📋 Planned (Optional Post-MVP)
**Last Updated:** 2025-10-26
**Dependencies:** MVP Core (Phases 1-4), Temporal Filters (optional - can help with testing)
