# Testing Patterns - Spring Boot Backend

## Service Testing (Mockito)

### Test Structure

```java
@ExtendWith(MockitoExtension.class)
class PhotoServiceTest {

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private ExifService exifService;

    @InjectMocks
    private PhotoService photoService;

    @Test
    void should_findPhotosByUserId_when_userExists() {
        // Given
        final Long userId = 1L;
        final List<Photo> mockPhotos = List.of(
            Photo.builder().id(1L).fileName("test.jpg").build()
        );
        when(photoRepository.findByUserIdOrderByTakenAtDesc(userId))
            .thenReturn(mockPhotos);

        // When
        final List<PhotoDto> result = photoService.findPhotosByUserId(userId);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFileName()).isEqualTo("test.jpg");
        verify(photoRepository).findByUserIdOrderByTakenAtDesc(userId);
    }

    @Test
    void should_throwException_when_photoNotFound() {
        // Given
        final Long photoId = 1L;
        final Long userId = 1L;
        when(photoRepository.findByIdAndUserId(photoId, userId))
            .thenReturn(Optional.empty());

        // When / Then
        assertThrows(
            ResourceNotFoundException.class,
            () -> photoService.findPhotoById(photoId, userId)
        );
    }
}
```

### Key Annotations

- `@ExtendWith(MockitoExtension.class)` - Enable Mockito
- `@Mock` - Mock dependency
- `@InjectMocks` - Create instance with mocked dependencies
- `@Test` - Test method

### Mockito Patterns

```java
// when-then
when(repository.findById(1L)).thenReturn(Optional.of(entity));

// verify
verify(repository).save(entity);
verify(repository, times(2)).findAll();
verify(repository, never()).delete(any());

// argument matchers
when(repository.findById(anyLong())).thenReturn(Optional.of(entity));
when(repository.save(argThat(photo -> photo.getRating() >= 5))).thenReturn(photo);

// void methods
doNothing().when(service).deletePhoto(1L, 1L);
doThrow(new RuntimeException()).when(service).processPhoto(any());
```

---

## Controller Testing (MockMvc)

### Test Structure

```java
@WebMvcTest(PhotoController.class)
class PhotoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PhotoService photoService;

    @Test
    void should_returnPhotos_when_authenticated() throws Exception {
        // Given
        final List<PhotoDto> mockPhotos = List.of(
            PhotoDto.builder().id(1L).fileName("test.jpg").build()
        );
        when(photoService.findPhotosByUserId(anyLong())).thenReturn(mockPhotos);

        // When / Then
        mockMvc.perform(get("/api/photos")
                .with(user("testuser").roles("USER")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].fileName").value("test.jpg"));
    }

    @Test
    void should_return404_when_photoNotFound() throws Exception {
        // Given
        when(photoService.findPhotoById(anyLong(), anyLong()))
            .thenThrow(new ResourceNotFoundException("Photo not found"));

        // When / Then
        mockMvc.perform(get("/api/photos/999")
                .with(user("testuser").roles("USER")))
            .andExpect(status().isNotFound());
    }
}
```

### MockMvc Patterns

```java
// GET request
mockMvc.perform(get("/api/photos"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$", hasSize(5)));

// POST request with JSON body
mockMvc.perform(post("/api/photos")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"fileName\":\"test.jpg\"}"))
    .andExpect(status().isCreated());

// PUT request with authentication
mockMvc.perform(put("/api/photos/1/rating")
        .with(user("testuser").roles("USER"))
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"rating\":5}"))
    .andExpect(status().isNoContent());

// DELETE request
mockMvc.perform(delete("/api/photos/1")
        .with(user("testuser").roles("USER")))
    .andExpect(status().isNoContent());
```

---

## Test Coverage Requirements

- ✅ **>70% coverage** for new code
- ✅ Unit tests for all service methods
- ✅ Test happy paths and error cases
- ✅ Test user scoping enforcement
- ✅ Test validation rules

---

## Key Reminders

**Service Tests:**
- ✅ Use `@Mock` for dependencies
- ✅ Use `@InjectMocks` for service under test
- ✅ Follow Given-When-Then pattern
- ✅ Verify method calls with `verify()`
- ✅ Test both success and failure scenarios

**Controller Tests:**
- ✅ Use `@WebMvcTest` for controller tests
- ✅ Use `@MockBean` for service dependencies
- ✅ Use MockMvc for HTTP request simulation
- ✅ Test authentication and authorization
- ✅ Test JSON responses with `jsonPath()`
