# Security & JWT Authentication

## JWT Authentication Flow

**Photo Map MVP uses stateless JWT authentication:**

### Complete Flow

```
1. User logs in → POST /api/auth/login
   ↓
2. Server validates credentials (email + password)
   ↓
3. Server generates JWT token
   - Payload: user ID, roles, expiration (24h)
   - Signed with secret key (HS512 algorithm)
   ↓
4. Client stores JWT (localStorage or sessionStorage)
   ↓
5. Client sends JWT in Authorization header
   - Format: Authorization: Bearer <token>
   ↓
6. Server validates JWT signature and expiration
   - JwtAuthenticationFilter intercepts request
   - Extracts token from Authorization header
   - Validates signature + expiration
   - Sets Authentication in SecurityContext
   ↓
7. Request proceeds to Controller (user authenticated)
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS512",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user@example.com",
    "userId": 123,
    "roles": ["USER"],
    "iat": 1706000000,
    "exp": 1706086400
  },
  "signature": "..."
}
```

---

## Security Configuration

### SecurityConfig Class

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(final HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for JWT
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Public endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // Admin only
                .requestMatchers("/actuator/health").permitAll() // Public health check
                .requestMatchers("/actuator/**").hasRole("ADMIN") // Admin actuator
                .anyRequest().authenticated() // All other require auth
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS) // No sessions
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
        final AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(
        final UserDetailsService userDetailsService,
        final PasswordEncoder passwordEncoder
    ) {
        final DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }
}
```

### Key Configuration Elements

#### 1. Disable CSRF
```java
.csrf(csrf -> csrf.disable())
```
- CSRF not needed for stateless JWT
- API consumed by Angular (not traditional forms)

#### 2. Public Endpoints
```java
.requestMatchers("/api/auth/**").permitAll()
```
- `/api/auth/login` - login endpoint
- `/api/auth/register` - registration endpoint
- `/actuator/health` - health check

#### 3. Role-Based Access
```java
.requestMatchers("/api/admin/**").hasRole("ADMIN")
```
- Admin endpoints require ADMIN role
- Photo endpoints require authentication (any USER)

#### 4. Stateless Sessions
```java
.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
```
- No HTTP sessions (JWT-based)
- Each request standalone

#### 5. JWT Filter
```java
.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
```
- JWT filter executes before Spring's auth filter
- Extracts JWT, validates, sets Authentication

---

## JWT Token Provider

### JwtTokenProvider Class

```java
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs; // 24 hours

    /**
     * Generate JWT token from UserDetails
     */
    public String generateToken(final UserDetails userDetails) {
        final Map<String, Object> claims = new HashMap<>();
        claims.put("userId", ((CustomUserDetails) userDetails).getUserId());
        claims.put("roles", userDetails.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .toList());

        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }

    /**
     * Extract username (email) from JWT token
     */
    public String getUsernameFromToken(final String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    /**
     * Extract userId from JWT token
     */
    public Long getUserIdFromToken(final String token) {
        final Claims claims = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody();

        return claims.get("userId", Long.class);
    }

    /**
     * Validate JWT token
     * - Signature valid
     * - Not expired
     * - Well-formed
     */
    public boolean validateToken(final String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (final JwtException | IllegalArgumentException e) {
            log.error("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(final String token) {
        final Date expiration = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getExpiration();

        return expiration.before(new Date());
    }
}
```

### JWT Configuration (application.properties)

```properties
# JWT Configuration
jwt.secret=your-secret-key-min-512-bits-for-hs512
jwt.expiration=86400000  # 24 hours in milliseconds
```

**Security note:** Use strong secret key (min 512 bits for HS512).

---

## JWT Authentication Filter

### JwtAuthenticationFilter Class

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
        final HttpServletRequest request,
        final HttpServletResponse response,
        final FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            // 1. Extract JWT from Authorization header
            final String jwt = extractJwtFromRequest(request);

            // 2. Validate JWT
            if (jwt != null && jwtTokenProvider.validateToken(jwt)) {
                // 3. Extract username from JWT
                final String username = jwtTokenProvider.getUsernameFromToken(jwt);

                // 4. Load user details
                final UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // 5. Create authentication token
                final UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                    );

                // 6. Set authentication context
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (final Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        // 7. Continue filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from Authorization header
     * Expected format: Authorization: Bearer <token>
     */
    private String extractJwtFromRequest(final HttpServletRequest request) {
        final String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove "Bearer " prefix
        }

        return null;
    }
}
```

---

## BCrypt Password Hashing

### Password Encoding

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### Usage in AuthService

```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Register new user with hashed password
     */
    public AuthResponse register(final UserRegistrationRequest request) {
        // Hash password with BCrypt
        final String hashedPassword = passwordEncoder.encode(request.getPassword());

        // Create user entity
        final User user = User.builder()
            .email(request.getEmail())
            .passwordHash(hashedPassword)
            .role(Role.USER)
            .enabled(true)
            .build();

        final User saved = userRepository.save(user);

        // Generate JWT token
        final UserDetails userDetails = new CustomUserDetails(saved);
        final String token = jwtTokenProvider.generateToken(userDetails);

        return new AuthResponse(token, saved.getEmail(), saved.getRole().name());
    }

    /**
     * Login user - validate password and generate JWT
     */
    public AuthResponse login(final UserLoginRequest request) {
        // Find user by email
        final User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        // Verify password with BCrypt
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        // Generate JWT token
        final UserDetails userDetails = new CustomUserDetails(user);
        final String token = jwtTokenProvider.generateToken(userDetails);

        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }
}
```

---

## Method-Level Security

### Enable Method Security

```java
@Configuration
@EnableMethodSecurity // Enable @PreAuthorize, @PostAuthorize, etc.
public class SecurityConfig {
    // ...
}
```

### @PreAuthorize Examples

```java
@Service
public class PhotoService {

    // Any authenticated user (default)
    @PreAuthorize("hasRole('USER')")
    public PhotoDto getPhoto(final Long photoId, final Long userId) {
        // Authenticated users only
    }

    // Admin only
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAllPhotos() {
        // Admin role required
    }

    // User can only access their own photos
    @PreAuthorize("#userId == authentication.principal.id")
    public void updatePhoto(final Long photoId, final Long userId) {
        // userId parameter must match authenticated user's ID
    }

    // Multiple roles allowed
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public List<PhotoDto> searchPhotos(final String query) {
        // USER or ADMIN role
    }
}
```

### Method Security Annotations

- `@PreAuthorize` - Check before method execution
- `@PostAuthorize` - Check after method execution
- `@Secured` - Simple role check (legacy)
- `@RolesAllowed` - JSR-250 standard (legacy)

---

## CustomUserDetails

### Implementation

```java
@Getter
public class CustomUserDetails implements UserDetails {

    private final Long userId;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private final boolean enabled;

    public CustomUserDetails(final User user) {
        this.userId = user.getId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.role = user.getRole();
        this.enabled = user.isEnabled();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
```

---

## Key Reminders

**JWT Flow:**
- ✅ Stateless authentication (no sessions)
- ✅ JWT in Authorization header: `Bearer <token>`
- ✅ Token expiration: 24 hours (configurable)
- ✅ Token validation on every request

**Security Config:**
- ✅ Disable CSRF for JWT
- ✅ Public endpoints: `/api/auth/**`, `/actuator/health`
- ✅ Admin endpoints: `/api/admin/**`
- ✅ Stateless session policy

**Password Security:**
- ✅ BCrypt for password hashing
- ✅ Never store plain text passwords
- ✅ Use `passwordEncoder.matches()` for verification

**Method Security:**
- ✅ `@PreAuthorize` for role-based access
- ✅ `hasRole('USER')`, `hasRole('ADMIN')`
- ✅ SpEL for complex authorization logic
