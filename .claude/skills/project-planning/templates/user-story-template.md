# User Story Template

## Basic Format

```
ID: US-[CATEGORY]-[NUMBER]
Tytuł: [Krótki opis funkcji]
Opis: Jako [typ użytkownika], chcę [cel], aby [korzyść/powód].
```

**Categories:**
- AUTH - Authentication/Authorization
- UPLOAD - Photo upload
- GAL - Gallery view
- MAP - Map view
- RAT - Rating system
- FIL - Filtering
- ADMIN - Admin panel
- PHOTO - Photo management

---

## Template

### US-[CATEGORY]-[NUMBER]: [Tytuł]

**Opis:**
Jako [typ użytkownika], chcę [cel], aby [korzyść/powód].

**Kryteria Akceptacji:**
1. [Criterion 1 - Given X, when Y, then Z]
2. [Criterion 2 - Given X, when Y, then Z]
3. [Criterion 3 - Given X, when Y, then Z]

**Priority:** High / Medium / Low

**Complexity:** Simple / Medium / Complex

**Estimated Timeline:** [1-2h / 3-6h / 6-12h]

---

## Examples

### Example 1: Authentication

**US-AUTH-001: User Registration**

**Opis:**
Jako nowy użytkownik, chcę się zarejestrować z email i password, aby mieć własne konto.

**Kryteria Akceptacji:**
1. Given użytkownik na stronie rejestracji, when poda email i password, then konto jest tworzone
2. Given użytkownik podał poprawny email, when email już istnieje, then wyświetla błąd "Email already exists"
3. Given użytkownik podał password, when password < 8 znaków, then wyświetla błąd "Password too short"
4. Given użytkownik się zarejestrował, when rejestracja sukces, then automatycznie zalogowany z JWT token

**Priority:** High (core functionality)

**Complexity:** Medium (3-4 chunks: backend endpoint + frontend form + validation + tests)

**Estimated Timeline:** 3-4h

---

### Example 2: Photo Management

**US-PHOTO-001: Upload Photo**

**Opis:**
Jako użytkownik, chcę uploadować zdjęcia przez web interface, aby dodać je do mojej galerii.

**Kryteria Akceptacji:**
1. Given użytkownik zalogowany, when wybiera plik JPEG/PNG, then plik jest uploadowany
2. Given plik uploadowany, when plik > 10MB, then wyświetla błąd "File too large"
3. Given plik uploadowany, when plik nie jest JPEG/PNG, then wyświetla błąd "Invalid file format"
4. Given plik uploadowany pomyślnie, when system ekstraktuje EXIF, then GPS i data są zapisane
5. Given plik uploadowany pomyślnie, when system generuje thumbnails, then 3 rozmiary są utworzone (150/400/800px)

**Priority:** High (core functionality)

**Complexity:** Complex (6+ chunks: backend endpoint + EXIF + thumbnails + frontend form + tests)

**Estimated Timeline:** 6-8h

---

### Example 3: Gallery View

**US-GAL-002: Filter by Rating**

**Opis:**
Jako użytkownik, chcę filtrować zdjęcia po ocenie (rating), aby szybko znaleźć ulubione zdjęcia.

**Kryteria Akceptacji:**
1. Given użytkownik w galerii, when ustawia min rating = 4, then tylko zdjęcia 4-5★ są wyświetlane
2. Given użytkownik w galerii, when ustawia max rating = 2, then tylko zdjęcia 1-2★ są wyświetlane
3. Given użytkownik ustawił rating filter, when zmienia na "Any", then wszystkie zdjęcia są wyświetlane
4. Given użytkownik ustawił rating filter, when zmienia sorting, then filter pozostaje aktywny

**Priority:** Medium (nice to have)

**Complexity:** Medium (3-4 chunks: FilterService + filter controls + apply filter + tests)

**Estimated Timeline:** 3-4h

---

## Kryteria Akceptacji - Best Practices

### ✅ Dobre Kryteria

**Format:** Given [context], when [action], then [expected result]

**Characteristics:**
- Testowalne (można zweryfikować czy spełnione)
- Konkretne (nie vague, nie "should work well")
- Mierzalne (clear success/failure)
- Kompletne (cover happy path + edge cases + errors)

**Examples:**
- ✅ Given user clicks rating star 5, when request succeeds, then photo rating is updated to 5
- ✅ Given user uploads 15MB file, when file > 10MB limit, then error "File too large" is displayed
- ✅ Given user not authenticated, when accesses /gallery, then redirected to /login

---

### ❌ Złe Kryteria

**Examples:**
- ❌ "System should upload photos" (vague, not testable)
- ❌ "Rating feature works correctly" (not specific, not measurable)
- ❌ "User can filter" (incomplete - filter by what? how?)
- ❌ "Performance is good" (not measurable - good = how fast?)

**How to Fix:**
- "System should upload photos" → "Given user selects JPEG file <10MB, when clicks Upload, then file is uploaded and appears in gallery"
- "Rating feature works correctly" → "Given user clicks rating star, when request succeeds, then rating is saved and persists after page reload"
- "User can filter" → "Given user in gallery, when sets min rating = 4, then only 4-5★ photos are displayed"
- "Performance is good" → "Given user loads gallery, when page loads, then initial render completes in <3 seconds"

---

## User Story Checklist

### Before Writing User Story
- [ ] Identified user persona (type of user)
- [ ] Identified goal (what user wants to accomplish)
- [ ] Identified benefit (why user needs this)

### During Writing
- [ ] Used standard format: "As X, I want Y, so that Z"
- [ ] Assigned unique ID (US-[CATEGORY]-[NUMBER])
- [ ] Defined 3-5 acceptance criteria (testable!)
- [ ] Assessed priority (High/Medium/Low)
- [ ] Assessed complexity (Simple/Medium/Complex)
- [ ] Estimated timeline

### After Writing
- [ ] All criteria are testable
- [ ] Covered happy path
- [ ] Covered edge cases
- [ ] Covered error scenarios
- [ ] User scoping addressed (if applicable)
- [ ] Reviewed by team/user (if applicable)

---

## Categories of User Stories

### Authentication (US-AUTH-XXX)
- Registration, login, logout
- Password reset, email verification
- JWT token management
- Role-based access (USER/ADMIN)

### Photo Upload (US-UPLOAD-XXX)
- Web upload (single file)
- Batch upload (multiple files)
- EXIF extraction
- Thumbnail generation
- Format validation

### Gallery View (US-GAL-XXX)
- Display photos (grid, list)
- Sorting (date, name, rating, size)
- Pagination
- Lazy loading

### Map View (US-MAP-XXX)
- Display map with markers
- Marker clustering
- Popups (photo details)
- fitBounds (auto-zoom)
- GPS statistics

### Rating (US-RAT-XXX)
- Rate photos (1-5 stars)
- Update/delete rating
- Display rating (gallery, map)

### Filtering (US-FIL-XXX)
- Filter by rating (min-max)
- Filter by date (range)
- Combined filters (AND logic)
- Clear filters

### Admin Panel (US-ADMIN-XXX)
- List users
- Change user role
- View user stats (photo count)

### Photo Management (US-PHOTO-XXX)
- View photo details
- Edit photo (description, rating)
- Delete photo
- Download photo

---

## Related Documentation

- `.ai/prd.md` - all user stories dla Photo Map MVP
- `templates/feature-proposal-template.md` - planning new feature
- `templates/implementation-plan-template.md` - jak zaimplementować user story
- `references/verification-checklist.md` - checklist przed/podczas/po implementacji
