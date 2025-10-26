# Security Review Patterns - Photo Map MVP

Detailed security patterns and checks for Photo Map MVP.

---

## User Data Isolation (CRITICAL!)

### User Scoping Pattern

**ALL photo operations MUST include userId filtering to ensure users can only access their own data.**

### Backend User Scoping

**Repository Methods:**

```java
// ✅ ALWAYS include userId parameter
public interface PhotoRepository extends JpaRepository<Photo, Long> {
    Optional<Photo> findByIdAndUserId(Long id, Long userId);
    List<Photo> findAllByUserId(Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
    List<Photo> findByUserIdAndRatingGreaterThanEqual(Long userId, Integer rating);
}
```

**Service Methods:**

```java
@Service
@RequiredArgsConstructor
public class PhotoService {
    private final PhotoRepository photoRepository;

    @Transactional(readOnly = true)
    public PhotoDto getPhoto(final Long photoId, final Long userId) {
        final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        return PhotoMapper.toDto(photo);
    }

    @Transactional
    public void deletePhoto(final Long photoId, final Long userId) {
        final Photo photo = photoRepository.findByIdAndUserId(photoId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        photoRepository.delete(photo);
    }
}
```

**Controller Methods:**

```java
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
        final PhotoDto photo = photoService.getPhoto(id, user.getId());
        return ResponseEntity.ok(photo);
    }
}
```

**Security Checks:**
- ✅ Repository methods include userId in query
- ✅ Service methods accept userId parameter
- ✅ Controllers extract userId from `@AuthenticationPrincipal`
- ✅ ResourceNotFoundException thrown when photo not found OR user mismatch

---

## Authentication & Authorization

### Backend Authentication (JWT)

**JWT Token Provider:**

```java
@Component
public class JwtTokenProvider {
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    public String generateToken(final Authentication authentication) {
        final User user = (User) authentication.getPrincipal();
        final Date now = new Date();
        final Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
            .setSubject(user.getUsername())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }

    public boolean validateToken(final String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUsernameFromToken(final String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }
}
```

**Security Configuration:**

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(final HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

**Security Checks:**
- ✅ JWT token validated on every request
- ✅ Token expiration checked
- ✅ Token signature verified
- ✅ CSRF disabled for stateless API
- ✅ SessionCreationPolicy.STATELESS
- ✅ Role-based access with `hasRole()`

### Frontend Authentication

**JWT Storage:**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'jwt_token';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }
}
```

**JWT Interceptor:**

```typescript
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
```

**Security Checks:**
- ✅ JWT stored in localStorage
- ✅ Token added to requests via interceptor
- ✅ Token expiration checked before use
- ✅ 401 errors trigger logout
- ✅ Token cleared on logout

---

## Input Validation

### Backend Validation

**DTO Validation:**

```java
@Data
public class PhotoUploadRequest {
    @NotBlank(message = "{validation.fileName.required}")
    @Size(max = 255, message = "{validation.fileName.maxLength}")
    private String fileName;

    @NotNull(message = "{validation.rating.required}")
    @Min(value = 1, message = "{validation.rating.min}")
    @Max(value = 5, message = "{validation.rating.max}")
    private Integer rating;

    @Email(message = "{validation.email.invalid}")
    private String userEmail;
}
```

**Controller Validation:**

```java
@PostMapping
public ResponseEntity<PhotoDto> createPhoto(
    @Valid @RequestBody final PhotoUploadRequest request,
    @AuthenticationPrincipal final User user
) {
    final PhotoDto photo = photoService.createPhoto(request, user.getId());
    return ResponseEntity.status(HttpStatus.CREATED).body(photo);
}
```

**File Upload Validation:**

```java
@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<PhotoDto> uploadPhoto(
    @RequestParam("file") final MultipartFile file,
    @AuthenticationPrincipal final User user
) {
    // Validate file
    if (file.isEmpty()) {
        throw new InvalidFileException("File is empty");
    }

    if (file.getSize() > 10_000_000) { // 10MB
        throw new InvalidFileException("File size exceeds limit");
    }

    final String contentType = file.getContentType();
    if (!List.of("image/jpeg", "image/png").contains(contentType)) {
        throw new InvalidFileException("Invalid file type");
    }

    // Sanitize filename
    final String filename = StringUtils.cleanPath(file.getOriginalFilename());
    if (filename.contains("..")) {
        throw new InvalidFileException("Invalid filename");
    }

    final PhotoDto photo = photoService.uploadPhoto(file, user.getId());
    return ResponseEntity.status(HttpStatus.CREATED).body(photo);
}
```

**Validation Checks:**
- ✅ `@Valid` on request DTOs
- ✅ Bean Validation annotations (`@NotBlank`, `@Email`, `@Size`)
- ✅ File upload: size, type, empty check
- ✅ Filename sanitization (prevent directory traversal)
- ✅ Custom validation for business rules

### Frontend Validation

**Form Validation:**

```typescript
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <input formControlName="email" data-testid="login-email" />
      @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
        <span class="text-red-500">Invalid email</span>
      }

      <input formControlName="password" type="password" data-testid="login-password" />
      @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
        <span class="text-red-500">Password required (min 8 characters)</span>
      }

      <button type="submit" [disabled]="loginForm.invalid">Login</button>
    </form>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  onSubmit() {
    if (this.loginForm.valid) {
      // Submit
    }
  }
}
```

**Validation Checks:**
- ✅ ReactiveFormsModule with validators
- ✅ `Validators.required`, `Validators.email`, `Validators.minLength`
- ✅ Validation errors displayed to user
- ✅ Submit button disabled when form invalid
- ✅ Client-side validation + backend validation

---

## Password Security

### Backend Password Handling

**Password Hashing:**

```java
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public void registerUser(final UserRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("User with this email already exists");
        }

        final User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // BCrypt hashing
        user.setRole(Role.USER);

        userRepository.save(user);
    }

    public String authenticateUser(final LoginRequest request) {
        final User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        final Authentication authentication = new UsernamePasswordAuthenticationToken(
            user, null, user.getAuthorities()
        );

        return jwtTokenProvider.generateToken(authentication);
    }
}
```

**Password Security Checks:**
- ✅ BCryptPasswordEncoder used
- ✅ Password never logged or exposed
- ✅ Passwords hashed before storage
- ✅ Password comparison uses `passwordEncoder.matches()`
- ✅ Generic error messages (don't reveal if user exists)

---

## Error Handling

### Backend Error Responses

**Global Exception Handler:**

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(final ResourceNotFoundException ex) {
        final ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(final MethodArgumentNotValidException ex) {
        final Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );

        final ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            errors,
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}
```

**Error Security Checks:**
- ✅ Generic error messages (no internal details)
- ✅ Consistent error response format
- ✅ HTTP status codes correct (404, 400, 401, 500)
- ✅ Stack traces NOT exposed in production

---

## Review Checklist

**Backend Security:**
- [ ] User scoping on ALL photo queries
- [ ] JWT validation working
- [ ] BCrypt password hashing
- [ ] Input validation with `@Valid`
- [ ] File upload validation
- [ ] No entities exposed to API

**Frontend Security:**
- [ ] JWT stored in localStorage
- [ ] Token added via interceptor
- [ ] Token expiration checked
- [ ] 401 errors → logout
- [ ] Form validation working

**General:**
- [ ] Generic error messages
- [ ] No sensitive data in logs
- [ ] HTTPS in production
- [ ] CORS configured correctly
