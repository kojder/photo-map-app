# Feature: Email System (Post-MVP)

**Status:** 🔜 Future Enhancement
**Priority:** Medium
**Estimated Time:** 12-16 hours
**Dependencies:** None (independent feature)

---

## 1. Overview

System obsługi emaili dla:
1. **Weryfikacja email** - potwierdzenie rejestracji
2. **Reset hasła** - odzyskiwanie hasła przez email
3. **Powiadomienia** (opcjonalne) - nowe zdjęcia, komentarze, itp.

---

## 2. Business Requirements

### 2.1 Weryfikacja Email

**User Story:**
> Jako użytkownik, chcę zweryfikować swój adres email, aby potwierdzić że jest prawidłowy i zabezpieczyć konto.

**Flow:**
1. User rejestruje się → konto utworzone ale `email_verified = false`
2. System wysyła email z linkiem weryfikacyjnym (UUID token, ważny 24h)
3. User klika link → endpoint `/api/auth/verify-email?token=UUID`
4. System weryfikuje token → ustawia `email_verified = true`
5. User może korzystać z pełnej funkcjonalności

**Business Rules:**
- Niezweryfikowani użytkownicy mogą się logować ale mają ograniczenia (np. watermark na zdjęciach)
- Link weryfikacyjny ważny 24h
- Możliwość ponownego wysłania linku (max 3x/godzinę - rate limiting)

### 2.2 Reset Hasła

**User Story:**
> Jako użytkownik, chcę odzyskać dostęp do konta jeśli zapomnę hasła.

**Flow:**
1. User klika "Forgot password?" na ekranie logowania
2. Podaje email → System wysyła link resetujący (UUID token, ważny 1h)
3. User klika link → Redirect do `/reset-password?token=UUID`
4. User podaje nowe hasło (+ confirmation)
5. System weryfikuje token + ustawia nowe hasło

**Security:**
- Token jednorazowy (po użyciu nieważny)
- Ważność: 1 godzina
- Rate limiting: max 3 requesty/godzinę na email
- Wymóg silnego hasła (min 8 znaków, cyfra, wielka litera)

### 2.3 Powiadomienia (Opcjonalne)

**User Stories:**
- Powiadomienie o nowych zdjęciach w grupie (Phase 2)
- Powiadomienie o komentarzach (future)
- Cotygodniowe podsumowanie aktywności (future)

**Konfiguracja:**
- User może włączyć/wyłączyć powiadomienia w Settings
- Frequency: instant, daily digest, weekly digest, off

---

## 3. Technical Requirements

### 3.1 Database Schema Changes

**Migration: `V3__add_email_verification.sql`**
```sql
-- Add email verification fields to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN verification_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN password_reset_token_expiry TIMESTAMP;

-- Add indexes for token lookups
CREATE INDEX users_verification_token_idx ON users(verification_token);
CREATE INDEX users_password_reset_token_idx ON users(password_reset_token);

-- Email notification preferences (optional, future)
CREATE TABLE email_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'instant', -- instant, daily, weekly, off
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_preferences_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT email_preferences_user_unique UNIQUE (user_id)
);
```

### 3.2 Email Configuration

**Dependencies:**
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

**application.properties:**
```properties
# Email Configuration
spring.mail.host=${SMTP_HOST:smtp.gmail.com}
spring.mail.port=${SMTP_PORT:587}
spring.mail.username=${SMTP_USERNAME}
spring.mail.password=${SMTP_PASSWORD}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# Email settings
app.email.from=${EMAIL_FROM:noreply@photomap.app}
app.email.verification.url=${APP_URL:http://localhost:4200}/verify-email
app.email.reset-password.url=${APP_URL:http://localhost:4200}/reset-password
```

**.env variables:**
```bash
# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application URLs
APP_URL=http://localhost:4200  # Dev
# APP_URL=https://photomap.yourdomain.com  # Prod

# Email sender
EMAIL_FROM=noreply@photomap.app
```

### 3.3 Backend Implementation

#### EmailService
```java
@Service
public class EmailService {

    @Async
    void sendVerificationEmail(String toEmail, String token);

    @Async
    void sendPasswordResetEmail(String toEmail, String token);

    @Async
    void sendPasswordChangedNotification(String toEmail);
}
```

#### EmailTemplateService
```java
@Service
public class EmailTemplateService {
    String buildVerificationEmail(String username, String verificationLink);
    String buildPasswordResetEmail(String username, String resetLink);
    String buildPasswordChangedEmail(String username);
}
```

#### TokenService
```java
@Service
public class TokenService {
    String generateVerificationToken();
    String generatePasswordResetToken();
    boolean isTokenValid(String token, LocalDateTime expiry);
}
```

#### Updated AuthService
```java
@Service
public class AuthService {

    // Existing methods
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);

    // New methods
    void sendVerificationEmail(String email);
    void verifyEmail(String token) throws InvalidTokenException;
    void initiatePasswordReset(String email);
    void resetPassword(String token, String newPassword) throws InvalidTokenException;
}
```

### 3.4 API Endpoints

**Email Verification:**
```
POST   /api/auth/resend-verification    Resend verification email
GET    /api/auth/verify-email?token=    Verify email with token
```

**Password Reset:**
```
POST   /api/auth/forgot-password        Request password reset
POST   /api/auth/reset-password         Reset password with token
```

**Request/Response DTOs:**
```java
// ResendVerificationRequest
{ "email": "user@example.com" }

// ForgotPasswordRequest
{ "email": "user@example.com" }

// ResetPasswordRequest
{
  "token": "uuid-token",
  "newPassword": "NewStrongPass123",
  "confirmPassword": "NewStrongPass123"
}

// Response
{
  "success": true,
  "message": "Verification email sent"
}
```

### 3.5 Frontend Implementation

**New Components:**
```
src/app/auth/
├── verify-email/
│   └── verify-email.component.ts     # /verify-email?token=...
├── forgot-password/
│   └── forgot-password.component.ts  # Form: enter email
├── reset-password/
│   └── reset-password.component.ts   # /reset-password?token=...
└── email-verified/
    └── email-verified.component.ts   # Success message
```

**Updated AuthService:**
```typescript
class AuthService {
  // Existing
  login(email: string, password: string): Observable<AuthResponse>
  register(email: string, password: string): Observable<AuthResponse>

  // New
  resendVerificationEmail(email: string): Observable<void>
  verifyEmail(token: string): Observable<void>
  forgotPassword(email: string): Observable<void>
  resetPassword(token: string, newPassword: string): Observable<void>
}
```

**Routing:**
```typescript
export const routes: Routes = [
  // Existing routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // New routes
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'email-verified', component: EmailVerifiedComponent }
];
```

---

## 4. Security Considerations

### 4.1 Token Security
- **UUID v4** dla tokenów (128-bit random)
- **One-time use** - token invalid po użyciu
- **Short expiry** - weryfikacja 24h, reset hasła 1h
- **Hashing** - tokeny hashowane w bazie (SHA-256)

### 4.2 Rate Limiting
```java
@RateLimiter(name = "email", fallbackMethod = "rateLimitFallback")
public void sendVerificationEmail(String email) {
    // Max 3 emails per hour per IP/email
}
```

### 4.3 Email Enumeration Prevention
- Zawsze zwracaj "Email sent" nawet jeśli email nie istnieje
- Log'uj failed attempts (monitoring)

### 4.4 SMTP Security
- **App passwords** dla Gmail (nie main password!)
- **TLS/STARTTLS** wymagane
- **Credentials w .env** - NIGDY w kodzie

---

## 5. Testing Strategy

### 5.1 Unit Tests
- TokenService - generowanie i walidacja tokenów
- EmailTemplateService - rendering HTML templates
- AuthService - email verification flow + password reset flow

### 5.2 Integration Tests
- `/api/auth/verify-email` - valid/invalid/expired token
- `/api/auth/reset-password` - valid/invalid/expired token
- Rate limiting - 4th request w ciągu godziny zwraca 429

### 5.3 Manual Testing
- Test z prawdziwym SMTP (Gmail test account)
- Sprawdzenie HTML templates w różnych klientach email
- Weryfikacja linków (dev + prod URLs)

---

## 6. Email Templates (HTML)

**Przykład: Verification Email**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; }
        .button {
            background: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <h2>Witaj {{username}}!</h2>
    <p>Dziękujemy za rejestrację w Photo Map.</p>
    <p>Kliknij poniższy link aby zweryfikować swój adres email:</p>
    <a href="{{verificationLink}}" class="button">Zweryfikuj Email</a>
    <p>Link jest ważny przez 24 godziny.</p>
    <p>Jeśli nie rejestrowałeś się w Photo Map, zignoruj tę wiadomość.</p>
</body>
</html>
```

**Templates directory:**
```
backend/src/main/resources/templates/email/
├── verification.html
├── password-reset.html
└── password-changed.html
```

---

## 7. Implementation Phases

### Phase 1: Email Infrastructure (3-4h)
- [ ] Add spring-boot-starter-mail dependency
- [ ] Configure SMTP in application.properties + .env
- [ ] Create EmailService + EmailTemplateService
- [ ] Create TokenService (UUID generation + validation)
- [ ] Write unit tests

### Phase 2: Email Verification (3-4h)
- [ ] Migration: add email_verified, verification_token columns
- [ ] Update User entity
- [ ] Update AuthService - register flow with email sending
- [ ] Create endpoints: /resend-verification, /verify-email
- [ ] Frontend: VerifyEmailComponent + routing
- [ ] Integration tests

### Phase 3: Password Reset (4-5h)
- [ ] Migration: add password_reset_token columns
- [ ] Create endpoints: /forgot-password, /reset-password
- [ ] Frontend: ForgotPasswordComponent + ResetPasswordComponent
- [ ] Rate limiting implementation
- [ ] Security testing

### Phase 4: Polish & Deployment (2-3h)
- [ ] HTML email templates styling
- [ ] Error handling + user feedback
- [ ] Test with real SMTP (Gmail)
- [ ] Update .env.example
- [ ] Documentation update

---

## 8. SMTP Provider Options

### Gmail (Recommended for MVP)
**Pros:** Free, easy setup, reliable
**Cons:** 500 emails/day limit, wymaga App Password
**Setup:** https://support.google.com/accounts/answer/185833

### SendGrid
**Pros:** 100 emails/day free, professional API
**Cons:** Wymaga weryfikacji domeny
**Setup:** https://sendgrid.com/

### Mailgun
**Pros:** 5000 emails/month free (first 3 months)
**Cons:** Wymaga karty kredytowej
**Setup:** https://www.mailgun.com/

### Self-hosted (Mikrus VPS)
**Pros:** Full control, no limits
**Cons:** Spam risk, wymaga konfiguracji SPF/DKIM/DMARC
**Not recommended for MVP**

---

## 9. Success Criteria

✅ User receives verification email after registration
✅ Verification link works and marks email as verified
✅ Password reset flow works end-to-end
✅ Tokens expire correctly (verification 24h, reset 1h)
✅ Rate limiting prevents abuse (max 3 emails/hour)
✅ HTML emails render correctly in Gmail, Outlook, Apple Mail
✅ SMTP credentials secured in .env (not in code)
✅ All tests passing (unit + integration)

---

## 10. Future Enhancements (Post-Implementation)

- [ ] Email notifications for group activity (Phase 2)
- [ ] Weekly digest emails (summary of activity)
- [ ] Email preferences UI (Settings page)
- [ ] Multi-language email templates (EN + PL)
- [ ] Email delivery monitoring (track bounces, opens)
- [ ] Queue system for bulk emails (Redis + Sidekiq pattern)

---

**Document Purpose:** Feature specification for Email System (Post-MVP)
**Related:** `.ai/prd.md` (section 9), `PROGRESS_TRACKER.md` (Future Enhancements)
**Status:** 🔜 Ready for implementation (after MVP completion)
**Last Updated:** 2025-10-26
