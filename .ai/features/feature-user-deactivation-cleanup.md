# Feature: User Deactivation & Orphaned Photos Cleanup

**Status:** 🚧 In Progress (Database + Backend implementation)
**Priority:** MEDIUM (Data Management)
**Estimated Time:** 3-4 hours (Backend + Admin Panel)
**Target:** Post-MVP enhancement (Phase 6+)

---

## Implementation Status

### ✅ COMPLETED
- [x] V6__update_photos_user_fk_to_set_null.sql migration
- [x] User.java - removed cascade from @OneToMany photos

### 🚧 TODO (Backend)
- [ ] Create UserDeactivationService
- [ ] Implement deactivateUser() method (soft delete + email anonymization)
- [ ] Add AdminUserController endpoints:
  - [ ] GET /api/admin/users/inactive - list inactive users
  - [ ] GET /api/admin/photos/orphaned - list orphaned photos (user_id IS NULL)
  - [ ] DELETE /api/admin/photos/orphaned - bulk delete orphaned photos
- [ ] Write unit tests for UserDeactivationService
- [ ] Write integration tests for AdminUserController

### 🚧 TODO (Frontend)
- [ ] Create AdminUsersComponent (list inactive users)
- [ ] Create AdminOrphanedPhotosComponent (list + bulk delete orphaned photos)
- [ ] Add navigation to Admin Panel
- [ ] Manual testing with Chrome DevTools

---

## 1. Overview

**Problem:**
- CASCADE DELETE for photos.user_id is too restrictive
- When user is deleted, all their photos are permanently lost
- No way to preserve photos after user deactivation

**Solution:**
- **Soft Delete** - deactivate user instead of physical deletion
- **Email Anonymization** - `inactive_{timestamp_millis}_{userId}@deleted.local`
- **SET NULL on photos.user_id** - preserve photos as orphaned (user_id = NULL)
- **Admin Endpoints** - manage inactive users and orphaned photos

---

## 2. Database Changes

### Migration: `V6__update_photos_user_fk_to_set_null.sql`

```sql
-- Change photos.user_id FK constraint from CASCADE DELETE to SET NULL
-- Reason: When user is deactivated, preserve their photos as orphaned (user_id = NULL)

ALTER TABLE photos DROP CONSTRAINT photos_user_fk;

ALTER TABLE photos
ADD CONSTRAINT photos_user_fk
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

**Reasoning:**
- `ON DELETE SET NULL` - when user is deleted, set photos.user_id to NULL (orphaned)
- Orphaned photos can be managed separately by admin
- Photos are preserved even after user deactivation

**Other Constraints:**
- `ratings.user_id ON DELETE CASCADE` - remains unchanged (ratings are meta-data, OK to delete)

---

## 3. Backend Implementation

### 3.1 UserDeactivationService

Service responsible for soft delete (deactivation) of users.

```java
@Service
@RequiredArgsConstructor
public class UserDeactivationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Deactivate user (soft delete):
     * - Set isActive = false
     * - Anonymize email: inactive_{timestamp_millis}_{userId}@deleted.local
     * - Replace password with random hash
     * - Photos remain with user_id = NULL (orphaned)
     */
    @Transactional
    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.ADMIN) {
            throw new InvalidOperationException("Cannot deactivate admin user");
        }

        long timestamp = System.currentTimeMillis();
        String anonymizedEmail = String.format("inactive_%d_%d@deleted.local", timestamp, userId);
        String randomPassword = UUID.randomUUID().toString();

        user.setEmail(anonymizedEmail);
        user.setPasswordHash(passwordEncoder.encode(randomPassword));
        user.setIsActive(false);
        user.setCanUpload(false);
        user.setCanRate(false);
        user.setCanViewPhotos(false);

        userRepository.save(user);
    }
}
```

**Key Features:**
- Soft delete (isActive = false)
- Email anonymization with timestamp + userId (ensures uniqueness)
- Random password hash (user cannot log in)
- Admin users cannot be deactivated (safety check)

---

### 3.2 AdminUserController Endpoints

Admin-only endpoints for managing users and orphaned photos.

#### 3.2.1 GET /api/admin/users/inactive

**Purpose:** List all inactive users

```java
@GetMapping("/users/inactive")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<UserSummaryDTO>> getInactiveUsers() {
    List<User> inactiveUsers = userRepository.findByIsActive(false);
    List<UserSummaryDTO> dtos = inactiveUsers.stream()
        .map(this::toUserSummaryDTO)
        .toList();
    return ResponseEntity.ok(dtos);
}
```

**Response:**
```json
[
  {
    "id": 123,
    "email": "inactive_1699876543210_123@deleted.local",
    "role": "USER",
    "isActive": false,
    "createdAt": "2024-11-01T10:00:00Z",
    "deactivatedAt": "2024-11-05T14:30:00Z"
  }
]
```

---

#### 3.2.2 GET /api/admin/photos/orphaned

**Purpose:** List all orphaned photos (user_id IS NULL)

```java
@GetMapping("/photos/orphaned")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Page<OrphanedPhotoDTO>> getOrphanedPhotos(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("uploadedAt").descending());
    Page<Photo> orphanedPhotos = photoRepository.findByUserIdIsNull(pageable);
    Page<OrphanedPhotoDTO> dtos = orphanedPhotos.map(this::toOrphanedPhotoDTO);
    return ResponseEntity.ok(dtos);
}
```

**Response:**
```json
{
  "content": [
    {
      "id": 456,
      "filename": "photo123.jpg",
      "originalFilename": "sunset.jpg",
      "fileSize": 2048576,
      "uploadedAt": "2024-11-01T15:00:00Z",
      "gpsLatitude": 52.2297,
      "gpsLongitude": 21.0122
    }
  ],
  "totalElements": 150,
  "totalPages": 8,
  "number": 0,
  "size": 20
}
```

---

#### 3.2.3 DELETE /api/admin/photos/orphaned

**Purpose:** Bulk delete all orphaned photos

```java
@DeleteMapping("/photos/orphaned")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<BulkDeleteResponse> deleteOrphanedPhotos() {
    List<Photo> orphanedPhotos = photoRepository.findByUserIdIsNull();

    int deletedCount = 0;
    for (Photo photo : orphanedPhotos) {
        try {
            photoService.deletePhoto(photo.getId());
            deletedCount++;
        } catch (Exception e) {
            log.error("Failed to delete photo: {}", photo.getId(), e);
        }
    }

    return ResponseEntity.ok(new BulkDeleteResponse(deletedCount, orphanedPhotos.size()));
}
```

**Response:**
```json
{
  "deletedCount": 150,
  "totalCount": 150,
  "message": "Successfully deleted 150 orphaned photos"
}
```

---

### 3.3 DTOs

#### UserSummaryDTO
```java
@Data
public class UserSummaryDTO {
    private Long id;
    private String email;
    private String role;
    private boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}
```

#### OrphanedPhotoDTO
```java
@Data
public class OrphanedPhotoDTO {
    private Long id;
    private String filename;
    private String originalFilename;
    private Long fileSize;
    private Instant uploadedAt;
    private Double gpsLatitude;
    private Double gpsLongitude;
}
```

#### BulkDeleteResponse
```java
@Data
@AllArgsConstructor
public class BulkDeleteResponse {
    private int deletedCount;
    private int totalCount;
    private String message;

    public BulkDeleteResponse(int deletedCount, int totalCount) {
        this.deletedCount = deletedCount;
        this.totalCount = totalCount;
        this.message = String.format("Successfully deleted %d orphaned photos", deletedCount);
    }
}
```

---

### 3.4 Repository Methods

#### UserRepository
```java
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByIsActive(boolean isActive);
}
```

#### PhotoRepository
```java
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    Page<Photo> findByUserIdIsNull(Pageable pageable);
    List<Photo> findByUserIdIsNull();
}
```

---

## 4. Admin Panel (Frontend)

### 4.1 AdminUsersComponent

**Purpose:** Display list of inactive users

**Features:**
- Table with inactive users (email, role, createdAt, deactivatedAt)
- Pagination
- Search by email

**Location:** `frontend/src/app/admin/admin-users/admin-users.component.ts`

---

### 4.2 AdminOrphanedPhotosComponent

**Purpose:** Display and manage orphaned photos

**Features:**
- Grid/list view of orphaned photos
- Pagination
- Bulk delete button (with confirmation dialog)
- Counter: "Total orphaned photos: 150"

**Location:** `frontend/src/app/admin/admin-orphaned-photos/admin-orphaned-photos.component.ts`

---

### 4.3 AdminService

```typescript
@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getInactiveUsers(): Observable<UserSummaryDTO[]> {
    return this.http.get<UserSummaryDTO[]>(`${this.apiUrl}/users/inactive`);
  }

  getOrphanedPhotos(page: number, size: number): Observable<Page<OrphanedPhotoDTO>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Page<OrphanedPhotoDTO>>(`${this.apiUrl}/photos/orphaned`, { params });
  }

  deleteOrphanedPhotos(): Observable<BulkDeleteResponse> {
    return this.http.delete<BulkDeleteResponse>(`${this.apiUrl}/photos/orphaned`);
  }
}
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

#### UserDeactivationServiceTest
- `testDeactivateUser_Success()` - verify email anonymization, isActive=false, random password
- `testDeactivateUser_AdminUser_ThrowsException()` - cannot deactivate admin
- `testDeactivateUser_UserNotFound_ThrowsException()`

---

### 5.2 Integration Tests

#### AdminUserControllerTest
- `testGetInactiveUsers_ReturnsInactiveUsersOnly()`
- `testGetOrphanedPhotos_Paginated()`
- `testDeleteOrphanedPhotos_BulkDelete()`
- `testDeleteOrphanedPhotos_EmptyList()`

---

### 5.3 Manual Testing

**Scenario 1: Deactivate user and verify orphaned photos**
1. Create test user and upload 5 photos
2. Admin deactivates user via API
3. Verify:
   - User isActive = false
   - User email = `inactive_{timestamp}_{userId}@deleted.local`
   - Photos still exist with user_id = NULL
   - GET /api/admin/photos/orphaned returns 5 photos

**Scenario 2: Bulk delete orphaned photos**
1. Create 10 orphaned photos
2. Call DELETE /api/admin/photos/orphaned
3. Verify:
   - All 10 photos deleted from DB
   - Files deleted from storage
   - Response: deletedCount = 10

---

## 6. Security Considerations

**Access Control:**
- All admin endpoints require `@PreAuthorize("hasRole('ADMIN')")`
- JWT token validation enforced by Spring Security

**Email Uniqueness:**
- Anonymized email format: `inactive_{timestamp_millis}_{userId}@deleted.local`
- Timestamp in milliseconds ensures uniqueness even for simultaneous deactivations

**Admin Protection:**
- Admin users cannot be deactivated (safety check in UserDeactivationService)

---

## 7. Future Enhancements (Post-MVP)

**Reactivation Feature:**
- Admin can reactivate user (restore original email)
- Store original email in separate table before anonymization

**Audit Log:**
- Track who deactivated which user and when
- Log bulk delete operations

**Soft Delete for Photos:**
- Instead of physical deletion, add `isDeleted` flag to photos
- Restore photos within 30 days

**Scheduled Cleanup:**
- Cron job to auto-delete orphaned photos older than 90 days

---

## 8. References

- `.ai/db-plan.md:93-94` - Original CASCADE DELETE documentation
- `V6__update_photos_user_fk_to_set_null.sql` - Migration implementation
- `User.java:58-59` - @OneToMany photos without cascade

---

**Last Updated:** 2025-11-09
**Author:** Claude Code (User Deactivation Implementation)
