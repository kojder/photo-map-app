/**
 * User Scoping Patterns - Photo Map MVP
 *
 * Examples of BAD vs GOOD user scoping patterns for security.
 */

// ========================================
// REPOSITORY LAYER
// ========================================

// ❌ BAD: No user scoping - SECURITY VULNERABILITY!
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    // Any user can access any photo by ID!
    Optional<Photo> findById(Long id);
    List<Photo> findAll();
    void deleteById(Long id);
}

// ✅ GOOD: User scoping enforced in all methods
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    Optional<Photo> findByIdAndUserId(Long id, Long userId);
    List<Photo> findAllByUserId(Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
    List<Photo> findByUserIdAndRatingGreaterThanEqual(Long userId, Integer rating);
}

// ========================================
// SERVICE LAYER
// ========================================

// ❌ BAD: No userId parameter - SECURITY VULNERABILITY!
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;

    @Transactional(readOnly = true)
    public PhotoDto getPhoto(final Long photoId) {
        // User A can access User B's photo!
        final Photo photo = photoRepository.findById(photoId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        return PhotoMapper.toDto(photo);
    }

    @Transactional
    public void deletePhoto(final Long photoId) {
        // User A can delete User B's photo!
        photoRepository.deleteById(photoId);
    }
}

// ✅ GOOD: userId parameter required in all methods
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;

    @Transactional(readOnly = true)
    public PhotoDto getPhoto(final Long photoId, final Long userId) {
        // User can only access their own photos
        final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        return PhotoMapper.toDto(photo);
    }

    @Transactional
    public void deletePhoto(final Long photoId, final Long userId) {
        // User can only delete their own photos
        final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        photoRepository.delete(photo);
    }

    @Transactional(readOnly = true)
    public List<PhotoDto> getPhotosByRating(final Integer minRating, final Long userId) {
        // User can only see their own photos with rating filter
        final List<Photo> photos = photoRepository
            .findByUserIdAndRatingGreaterThanEqual(userId, minRating);
        return photos.stream()
            .map(PhotoMapper::toDto)
            .toList();
    }
}

// ========================================
// CONTROLLER LAYER
// ========================================

// ❌ BAD: No @AuthenticationPrincipal - SECURITY VULNERABILITY!
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {
    private final PhotoService photoService;

    @GetMapping("/{id}")
    public ResponseEntity<PhotoDto> getPhoto(@PathVariable final Long id) {
        // No user authentication - anyone can access!
        final PhotoDto photo = photoService.getPhoto(id);
        return ResponseEntity.ok(photo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable final Long id) {
        // No user authentication - anyone can delete!
        photoService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }
}

// ✅ GOOD: Extract userId from @AuthenticationPrincipal
@RestController
@RequestMapping("/api/photos")
@RequiredArgsConstructor
public class PhotoController {
    private final PhotoService photoService;

    @GetMapping("/{id}")
    public ResponseEntity<PhotoDto> getPhoto(
        @PathVariable final Long id,
        @AuthenticationPrincipal final User user
    ) {
        // Extract userId from authenticated user
        final PhotoDto photo = photoService.getPhoto(id, user.getId());
        return ResponseEntity.ok(photo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePhoto(
        @PathVariable final Long id,
        @AuthenticationPrincipal final User user
    ) {
        // Extract userId from authenticated user
        photoService.deletePhoto(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<PhotoDto>> getPhotosByRating(
        @RequestParam(defaultValue = "1") final Integer minRating,
        @AuthenticationPrincipal final User user
    ) {
        // Extract userId from authenticated user
        final List<PhotoDto> photos = photoService.getPhotosByRating(minRating, user.getId());
        return ResponseEntity.ok(photos);
    }
}

// ========================================
// ENTITY LAYER
// ========================================

// ✅ GOOD: Photo entity with User relationship
@Entity
@Table(name = "photos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String url;

    private Double latitude;
    private Double longitude;

    @Column(nullable = false)
    private Integer rating;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

// ========================================
// SECURITY CONSIDERATIONS
// ========================================

/**
 * Why User Scoping is CRITICAL:
 *
 * 1. Data Isolation:
 *    - User A cannot access User B's photos
 *    - User A cannot delete User B's photos
 *    - User A cannot see User B's photo metadata
 *
 * 2. Security by Design:
 *    - All repository methods include userId
 *    - All service methods require userId parameter
 *    - All controllers extract userId from @AuthenticationPrincipal
 *
 * 3. Defense in Depth:
 *    - Even if JWT validation fails, user scoping prevents unauthorized access
 *    - Even if someone guesses photo ID, they can't access it without userId match
 *
 * 4. Error Handling:
 *    - ResourceNotFoundException for both "not found" and "user mismatch"
 *    - No information leakage about photo existence
 */

// ========================================
// TESTING USER SCOPING
// ========================================

// ✅ GOOD: Test user scoping in unit tests
@ExtendWith(MockitoExtension.class)
class PhotoServiceTest {
    @Mock private PhotoRepository photoRepository;
    @InjectMocks private PhotoService photoService;

    @Test
    void getPhoto_withValidIdAndUserId_returnsPhoto() {
        // Arrange
        final Photo photo = new Photo(/* ... */);
        when(photoRepository.findByIdAndUserId(1L, 100L))
            .thenReturn(Optional.of(photo));

        // Act
        final PhotoDto result = photoService.getPhoto(1L, 100L);

        // Assert
        assertNotNull(result);
        verify(photoRepository).findByIdAndUserId(1L, 100L);
    }

    @Test
    void getPhoto_withMismatchedUserId_throwsException() {
        // Arrange
        when(photoRepository.findByIdAndUserId(1L, 999L))
            .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            photoService.getPhoto(1L, 999L);
        });
    }
}
