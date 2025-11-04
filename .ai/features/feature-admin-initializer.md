# Feature: Admin Initializer + Must Change Password

**Status:** 🚧 Partially Implemented (Backend foundation done, API + Frontend TODO)
**Priority:** HIGH (Security)
**Estimated Time:** 2-3 hours remaining (API endpoints + Frontend)
**Target:** Before Admin Panel (Phase 5)

---

## Implementation Status

### ✅ COMPLETED (Backend Foundation)
- [x] V2__add_admin_security.sql migration (database schema)
- [x] User entity with `mustChangePassword` field
- [x] UserRepository.countByRole() method
- [x] AdminInitializer (CommandLineRunner - creates default admin)
- [x] AdminInitializerTest (unit tests for initializer)

**Commits:**
- `ef6ad68` - feat(auth): add must_change_password field for admin security
- `b7838a9` - fix(e2e): fix E2E tests - timeout, AdminInitializer, BCrypt hash

### 🚧 TODO (Backend API)
- [ ] Update LoginResponse with `mustChangePassword` field
- [ ] Create ChangePasswordRequest DTO
- [ ] Add AuthService.changePassword() method
- [ ] Add endpoint POST /api/auth/change-password
- [ ] Create UpdateProfileRequest DTO
- [ ] Add AdminService.updateProfile() method
- [ ] Add endpoint PUT /api/admin/profile
- [ ] Write integration tests for new endpoints

### 🚧 TODO (Frontend)
- [ ] Update LoginResponse interface (add mustChangePassword)
- [ ] Update AuthService.login() to handle mustChangePassword flag
- [ ] Create ChangePasswordComponent
- [ ] Add AuthService.changePassword() method
- [ ] Create passwordChangeGuard
- [ ] Update routes (add /change-password route + guard)
- [ ] Manual testing with Chrome DevTools

---

## 1. Overview

**Problem:**
- Anyone can register as admin (no security)
- No automatic creation of first admin

**Solution:**
- **AdminInitializer** (CommandLineRunner) - automatic creation of default admin
- **must_change_password** flag - force password change on first login
- **Admin Profile Endpoint** - ability to change email + password

---

## 2. Database Changes

### Migration: `V2__add_admin_security.sql`

```sql
-- Add must_change_password flag to users table
ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for admin queries
CREATE INDEX users_role_idx ON users(role);

COMMENT ON COLUMN users.must_change_password IS 'Force user to change password on next login';
```

**Reasoning:**
- `must_change_password` - forces password change (admin after first login)
- Index on `role` - fast checking `countByRole(ADMIN)`

---

## 3. Backend Implementation

### 3.1 Update User Entity

```java
@Entity
@Table(name = "users")
public class User {
    // Existing fields
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // NEW FIELD
    @Column(name = "must_change_password", nullable = false)
    private boolean mustChangePassword = false;

    // timestamps, getters, setters...
}
```

### 3.2 Update UserRepository

```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // NEW METHOD
    long countByRole(Role role);
}
```

### 3.3 Create AdminInitializer

**File:** `backend/src/main/java/com/photomap/config/AdminInitializer.java`

```java
package com.photomap.config;

import com.photomap.entity.User;
import com.photomap.entity.Role;
import com.photomap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.email}")
    private String adminEmail;

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        // Check if ANY admin exists (by role, not email!)
        long adminCount = userRepository.countByRole(Role.ADMIN);

        if (adminCount == 0) {
            // No admins - create default admin
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setMustChangePassword(true);  // Force password change!

            userRepository.save(admin);
            log.info("✅ Created default admin user: {}", adminEmail);
            log.warn("⚠️  Admin must change password on first login!");
        } else {
            log.info("ℹ️  Admin user(s) already exist (count: {})", adminCount);
        }
    }
}
```

**Key Points:**
- ✅ Checks `countByRole(ADMIN)` - not email!
- ✅ Idempotent - doesn't duplicate admins
- ✅ Sets `mustChangePassword = true`
- ✅ Uses `PasswordEncoder` - password hashed
- ✅ Credentials from `.env` (different for dev/prod)

### 3.4 Update AuthService

**File:** `backend/src/main/java/com/photomap/service/AuthService.java`

**Add to LoginResponse:**
```java
public record LoginResponse(
    String token,
    UserResponse user,
    boolean mustChangePassword  // NEW FIELD
) {}
```

**Update login() method:**
```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public LoginResponse login(final LoginRequest request) {
        final User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid credentials");
        }

        final String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name());

        return new LoginResponse(
            token,
            new UserResponse(user.getId(), user.getEmail(), user.getRole().name()),
            user.isMustChangePassword()  // NEW: Include flag in response
        );
    }

    // NEW METHOD: Change password
    public void changePassword(final String email, final ChangePasswordRequest request) {
        final User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Validate old password
        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid old password");
        }

        // Validate new password
        if (request.newPassword().length() < 8) {
            throw new ValidationException("Password must be at least 8 characters");
        }

        // Update password and clear flag
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }
}
```

### 3.5 Create ChangePasswordRequest DTO

**File:** `backend/src/main/java/com/photomap/dto/ChangePasswordRequest.java`

```java
package com.photomap.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank(message = "{validation.oldPassword.required}")
    String oldPassword,

    @NotBlank(message = "{validation.newPassword.required}")
    @Size(min = 8, message = "{validation.newPassword.size}")
    String newPassword,

    @NotBlank(message = "{validation.confirmPassword.required}")
    String confirmPassword
) {
    public ChangePasswordRequest {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
    }
}
```

### 3.6 Add Endpoint: POST /api/auth/change-password

**File:** `backend/src/main/java/com/photomap/controller/AuthController.java`

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Existing: /register, /login

    // NEW ENDPOINT
    @PostMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(
        @Valid @RequestBody final ChangePasswordRequest request,
        @AuthenticationPrincipal final UserDetails userDetails
    ) {
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
    }
}
```

### 3.7 Create Admin Profile Endpoint

**File:** `backend/src/main/java/com/photomap/controller/AdminController.java`

```java
// NEW ENDPOINT: Update admin profile (email + password)
@PutMapping("/profile")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<UserResponse> updateProfile(
    @Valid @RequestBody final UpdateProfileRequest request,
    @AuthenticationPrincipal final UserDetails userDetails
) {
    final UserResponse updated = adminService.updateProfile(
        userDetails.getUsername(),
        request
    );
    return ResponseEntity.ok(updated);
}
```

**UpdateProfileRequest DTO:**
```java
public record UpdateProfileRequest(
    String newEmail,  // Optional
    String newPassword,  // Optional
    String currentPassword  // Required for verification
) {}
```

**AdminService.updateProfile():**
```java
@Transactional
public UserResponse updateProfile(final String currentEmail, final UpdateProfileRequest request) {
    final User admin = userRepository.findByEmail(currentEmail)
        .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

    // Verify current password
    if (!passwordEncoder.matches(request.currentPassword(), admin.getPasswordHash())) {
        throw new AuthenticationException("Invalid current password");
    }

    // Update email if provided
    if (request.newEmail() != null && !request.newEmail().equals(currentEmail)) {
        if (userRepository.existsByEmail(request.newEmail())) {
            throw new ValidationException("Email already exists");
        }
        admin.setEmail(request.newEmail());
    }

    // Update password if provided
    if (request.newPassword() != null) {
        admin.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        admin.setMustChangePassword(false);
    }

    userRepository.save(admin);
    return new UserResponse(admin.getId(), admin.getEmail(), admin.getRole().name());
}
```

---

## 4. application.properties Updates

```properties
# Admin Initialization
admin.email=${ADMIN_EMAIL}
admin.password=${ADMIN_PASSWORD}
```

**.env (already has these values):**
```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YxC1eGfIC5HGRu7GTo3r1Q==
```

**.env.example (already updated):**
```bash
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

---

## 5. Frontend Implementation (Basic)

### 5.1 Update LoginResponse Interface

**File:** `frontend/src/app/models/auth.model.ts`

```typescript
export interface LoginResponse {
  token: string;
  user: User;
  mustChangePassword: boolean;  // NEW
}
```

### 5.2 Update AuthService

**File:** `frontend/src/app/services/auth.service.ts`

```typescript
login(email: string, password: string): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
    .pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);

        // Store flag for redirect logic
        if (response.mustChangePassword) {
          localStorage.setItem('mustChangePassword', 'true');
        }
      })
    );
}

// NEW METHOD
changePassword(oldPassword: string, newPassword: string, confirmPassword: string): Observable<void> {
  return this.http.post<void>(`${this.apiUrl}/auth/change-password`, {
    oldPassword,
    newPassword,
    confirmPassword
  }).pipe(
    tap(() => {
      localStorage.removeItem('mustChangePassword');
    })
  );
}
```

### 5.3 Create ChangePasswordComponent (Basic)

**File:** `frontend/src/app/auth/change-password/change-password.component.ts`

```typescript
@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 class="text-2xl font-bold mb-4">Change Password</h2>
        <p class="text-sm text-gray-600 mb-6">
          For security reasons, you must change your password before continuing.
        </p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Old Password -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Current Password</label>
            <input type="password" formControlName="oldPassword"
                   class="w-full px-3 py-2 border rounded">
          </div>

          <!-- New Password -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">New Password</label>
            <input type="password" formControlName="newPassword"
                   class="w-full px-3 py-2 border rounded">
          </div>

          <!-- Confirm Password -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Confirm New Password</label>
            <input type="password" formControlName="confirmPassword"
                   class="w-full px-3 py-2 border rounded">
          </div>

          <button type="submit" [disabled]="form.invalid"
                  class="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400">
            Change Password
          </button>
        </form>
      </div>
    </div>
  `
})
export class ChangePasswordComponent {
  form = this.fb.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.form.valid) {
      const { oldPassword, newPassword, confirmPassword } = this.form.value;
      this.authService.changePassword(oldPassword!, newPassword!, confirmPassword!)
        .subscribe({
          next: () => {
            alert('Password changed successfully!');
            this.router.navigate(['/gallery']);
          },
          error: (err) => {
            alert('Error changing password: ' + err.error.message);
          }
        });
    }
  }
}
```

### 5.4 Add Route Guard for mustChangePassword

**File:** `frontend/src/app/guards/password-change.guard.ts`

```typescript
export const passwordChangeGuard: CanActivateFn = () => {
  const router = inject(Router);
  const mustChange = localStorage.getItem('mustChangePassword');

  if (mustChange === 'true') {
    router.navigate(['/change-password']);
    return false;
  }

  return true;
};
```

**Update routes:**
```typescript
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  {
    path: 'gallery',
    component: GalleryComponent,
    canActivate: [authGuard, passwordChangeGuard]  // Add guard
  },
  // ... other routes
];
```

---

## 6. Testing

### 6.1 Unit Tests

**AdminInitializerTest.java:**
```java
@SpringBootTest
class AdminInitializerTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminInitializer adminInitializer;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldCreateAdminWhenNoneExists() {
        // When
        adminInitializer.run();

        // Then
        long adminCount = userRepository.countByRole(Role.ADMIN);
        assertThat(adminCount).isEqualTo(1);

        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
        assertThat(admin.isMustChangePassword()).isTrue();
    }

    @Test
    void shouldNotCreateDuplicateAdminOnRestart() {
        // Given
        adminInitializer.run();
        long initialCount = userRepository.countByRole(Role.ADMIN);

        // When - simulate restart
        adminInitializer.run();

        // Then
        long finalCount = userRepository.countByRole(Role.ADMIN);
        assertThat(finalCount).isEqualTo(initialCount);
    }

    @Test
    void shouldNotCreateNewAdminAfterEmailChange() {
        // Given - create admin and change email
        adminInitializer.run();
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();
        admin.setEmail("newadmin@example.com");
        userRepository.save(admin);

        // When - restart
        adminInitializer.run();

        // Then - still only 1 admin
        long adminCount = userRepository.countByRole(Role.ADMIN);
        assertThat(adminCount).isEqualTo(1);
    }
}
```

**AuthServiceTest.java (update):**
```java
@Test
void shouldIncludeMustChangePasswordInLoginResponse() {
    // Given
    User admin = createUser("admin@test.com", "pass", Role.ADMIN);
    admin.setMustChangePassword(true);
    when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));
    when(passwordEncoder.matches("pass", admin.getPasswordHash())).thenReturn(true);

    // When
    LoginResponse response = authService.login(new LoginRequest("admin@test.com", "pass"));

    // Then
    assertThat(response.mustChangePassword()).isTrue();
}

@Test
void shouldClearMustChangePasswordFlagAfterPasswordChange() {
    // Given
    User user = createUser("user@test.com", "oldpass", Role.USER);
    user.setMustChangePassword(true);
    when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
    when(passwordEncoder.matches("oldpass", user.getPasswordHash())).thenReturn(true);

    // When
    authService.changePassword("user@test.com",
        new ChangePasswordRequest("oldpass", "newpass123", "newpass123"));

    // Then
    assertThat(user.isMustChangePassword()).isFalse();
    verify(userRepository).save(user);
}
```

### 6.2 Integration Tests

**AdminProfileIntegrationTest.java:**
```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();

        // Create admin
        User admin = new User();
        admin.setEmail("admin@test.com");
        admin.setPasswordHash(passwordEncoder.encode("adminpass"));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        // Login to get token
        MvcResult result = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"admin@test.com\",\"password\":\"adminpass\"}"))
            .andReturn();

        String response = result.getResponse().getContentAsString();
        adminToken = JsonPath.read(response, "$.token");
    }

    @Test
    void shouldUpdateAdminEmail() throws Exception {
        mockMvc.perform(put("/api/admin/profile")
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                    "newEmail": "newemail@test.com",
                    "currentPassword": "adminpass"
                }
                """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("newemail@test.com"));

        assertThat(userRepository.findByEmail("newemail@test.com")).isPresent();
    }

    @Test
    void shouldUpdateAdminPassword() throws Exception {
        mockMvc.perform(put("/api/admin/profile")
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                    "newPassword": "newstrongpass123",
                    "currentPassword": "adminpass"
                }
                """))
            .andExpect(status().isOk());

        User admin = userRepository.findByEmail("admin@test.com").orElseThrow();
        assertThat(passwordEncoder.matches("newstrongpass123", admin.getPasswordHash())).isTrue();
    }
}
```

---

## 7. Deployment Checklist

### Before Deployment (Mikrus VPS):

1. **Generate production passwords:**
```bash
# SSH to Mikrus
ssh user@mikrus.example.com

# Generate strong admin password
openssl rand -base64 24
# Output: xyz123ABC... (use this as ADMIN_PASSWORD)
```

2. **Update .env on Mikrus:**
```bash
# /opt/photomap/.env
ADMIN_EMAIL=your-email@domain.com
ADMIN_PASSWORD=xyz123ABC...
JWT_SECRET=<new production secret>
```

3. **Deploy backend:**
```bash
./mvnw clean package
sudo systemctl restart photomap-backend
```

4. **First login as admin:**
```
1. Navigate to https://photomap.yourdomain.com/login
2. Login with ADMIN_EMAIL + ADMIN_PASSWORD
3. System redirects to /change-password
4. Set strong permanent password
5. Update email to your real email
```

---

## 8. Success Criteria

✅ AdminInitializer creates default admin on first startup
✅ AdminInitializer is idempotent (doesn't duplicate admins)
✅ Admin after email change doesn't cause creation of new admin
✅ `mustChangePassword` flag works - forces password change
✅ Endpoint `/api/auth/change-password` works correctly
✅ Endpoint `/api/admin/profile` allows changing email + password
✅ Frontend redirects to /change-password if flag = true
✅ All tests passing (unit + integration)
✅ Credentials in `.env` - not hardcoded
✅ Production deployment works end-to-end

---

## 9. Implementation Order

1. **Backend - Database** (30 min)
   - Migration V2__add_admin_security.sql
   - Update User entity

2. **Backend - AdminInitializer** (45 min)
   - Create AdminInitializer
   - Update UserRepository (countByRole)
   - Write tests

3. **Backend - Change Password** (60 min)
   - Update AuthService (changePassword)
   - Create ChangePasswordRequest DTO
   - Add endpoint POST /api/auth/change-password
   - Update LoginResponse with flag
   - Write tests

4. **Backend - Admin Profile** (45 min)
   - Create UpdateProfileRequest DTO
   - AdminService.updateProfile()
   - Add endpoint PUT /api/admin/profile
   - Write tests

5. **Frontend - Basic Implementation** (60 min)
   - Update LoginResponse interface
   - Create ChangePasswordComponent
   - Add passwordChangeGuard
   - Update routes

6. **Testing & Deployment** (30 min)
   - Run all tests
   - Manual testing (dev)
   - Deploy to Mikrus
   - Production verification

**Total: 3-4 hours**

---

**Document Purpose:** Implementation plan for Admin Initializer + Must Change Password
**Priority:** HIGH (Security before Admin Panel)
**Status:** 🔜 Ready to implement
**Last Updated:** 2025-11-04
