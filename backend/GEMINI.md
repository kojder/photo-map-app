# Spring Boot Backend Development Guidelines

This document outlines the core principles and best practices for developing the Spring Boot backend of the Photo Map application.

## 1. Project Stack

- **Framework:** Spring Boot 3
- **Language:** Java 17
- **Database:** PostgreSQL 15 with Flyway migrations
- **Security:** Spring Security with JWT (stateless)
- **Build:** Maven

## 2. Architecture

We use a classic layered architecture: **Controller -> Service -> Repository**.

1.  **Controllers (`@RestController`)**:
    - Handle HTTP requests and responses.
    - Perform input validation (`@Valid`).
    - Delegate business logic to the Service layer.
    - **STRICTLY NO business logic.**

2.  **Services (`@Service`)**:
    - Contain all business logic.
    - Manage transactions (`@Transactional`).
    - Coordinate data access through repositories.

3.  **Repositories (`JpaRepository`)**:
    - Data access only.
    - Define queries using Spring Data JPA query methods or `@Query`.
    - **STRICTLY NO business logic.**

4.  **Entities (`@Entity`)**:
    - Represent database tables.
    - **STRICTLY NO business logic.**

## 3. Critical Security Pattern: User Scoping

**All database queries for user-specific data MUST be filtered by `userId`**. This is critical to prevent data leaks between users.

- **BAD:** `photoRepository.findById(photoId)` - *Allows any user to access any photo.*
- **GOOD:** `photoRepository.findByIdAndUserId(photoId, userId)` - *Ensures a user can only access their own photos.*

This applies to every repository method that fetches user-owned resources.

## 4. Code Quality & Best Practices

### Dependency Injection

- **ALWAYS use constructor injection** with `final` fields.
- Use Lombok's `@RequiredArgsConstructor` on service and controller classes to automate this.

```java
// ✅ GOOD: Final fields and constructor injection
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;
    private final UserService userService;
}

// ❌ BAD: Field injection (mutable, harder to test)
@Service
public class PhotoService {
    @Autowired
    private PhotoRepository photoRepository;
}
```

### Immutability with `final`

- Use the `final` keyword for method parameters and local variables that are not reassigned. This improves readability and prevents bugs.

```java
// ✅ GOOD: `final` for parameters and variables
public PhotoDto getPhoto(final Long photoId, final Long userId) {
    final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
    return PhotoDto.fromEntity(photo);
}
```

### Java 17 Features

- **Records for DTOs**: Use `record` for all Data Transfer Objects. They are immutable and concise.
  ```java
  public record PhotoDto(Long id, String fileName, Double latitude) {
      public static PhotoDto fromEntity(final Photo photo) {
          // ... conversion logic
      }
  }
  ```
- **`Stream.toList()`**: Prefer `stream.toList()` over `stream.collect(Collectors.toList())` for creating immutable lists.

## 5. REST API Design

- **Controllers return `ResponseEntity<T>`**: This gives full control over the HTTP status code and headers.
- **Use DTOs for all API communication**: NEVER expose JPA entities directly in controllers.
- **Use standard HTTP status codes**:
    - `200 OK` (GET, PUT)
    - `201 Created` (POST)
    - `204 No Content` (DELETE)
    - `400 Bad Request` (Validation errors)
    - `401 Unauthorized` (Missing/invalid JWT)
    - `403 Forbidden` (Insufficient permissions)
    - `404 Not Found` (Resource not found)
    - `500 Internal Server Error` (Unexpected errors)

## 6. Exception Handling

- Use a **Global Exception Handler** (`@RestControllerAdvice`) to centralize error handling.
- Create custom, specific exceptions (e.g., `ResourceNotFoundException`).
- The global handler should catch these exceptions and map them to appropriate `ErrorResponse` DTOs and HTTP status codes.

## 7. Database Migrations with Flyway

- All schema changes **MUST** be done through Flyway migration scripts located in `src/main/resources/db/migration/`.
- Migration files are named `V{version}__{Description}.sql` (e.g., `V1__initial_schema.sql`).
- **NEVER modify an existing, applied migration script.** To make further changes, create a new migration file with an incremented version number.

## 8. Testing

- **Unit Tests (JUnit 5 + Mockito)**: For services and business logic. Mock dependencies like repositories.
- **Integration Tests (`@SpringBootTest` + MockMvc)**: For controllers and API endpoints. Test the full flow from HTTP request to the database (or a mocked service layer).
- Write tests for all new features and bug fixes.
