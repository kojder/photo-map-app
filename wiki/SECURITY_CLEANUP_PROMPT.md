# GitHub Wiki Security Cleanup - Continuation Prompt

**Created:** 2025-11-10
**Task:** Remove sensitive data from public GitHub Wiki
**Status:** Ready to execute

---

## 📍 Context

GitHub Wiki for Photo Map MVP is **public** and currently contains:
- Production URLs (photos.tojest.dev) - 5 occurrences
- JWT token examples - need verification they're truncated

**Task:** Remove/replace sensitive data with generic examples.

---

## 🎯 Execution Prompt (use after /clear)

```
Remove sensitive data from GitHub Wiki for photo-map-app.

Context:
- GitHub Wiki is public: https://github.com/kojder/photo-map-app/wiki
- Local source files: wiki/pages/ directory
- Task details in PROGRESS_TRACKER.md "Next Action" section

Tasks:
1. Read PROGRESS_TRACKER.md "Next Action" for full details
2. Modify 5 Wiki page files in wiki/pages/ directory:
   - Remove production URLs (photos.tojest.dev)
   - Verify JWT tokens are placeholders only
   - Replace with generic examples
3. Clone Wiki repo: https://github.com/kojder/photo-map-app.wiki.git
4. Copy modified files to Wiki repo
5. Commit and push changes to GitHub Wiki

Files to modify:
- wiki/pages/01-Home.md (line 62)
- wiki/pages/02-User-Guide.md (lines 30, 260)
- wiki/pages/05-Architecture.md (line 487)
- wiki/pages/06-API-Documentation.md (line 127)
- wiki/pages/09-Deployment.md (lines 370, 551)

Goal: Ensure GitHub Wiki contains no real production URLs or credentials.
```

---

## 🔍 Detailed Changes Needed

### 1. Production URL Replacements

**Replace:** `https://photos.tojest.dev/`
**With:** `https://your-domain.com/` or remove entirely

**Locations:**
```
01-Home.md:62       - Production link in Quick Links
02-User-Guide.md:30 - Example URL in registration instructions
02-User-Guide.md:260 - Admin panel URL example
05-Architecture.md:487 - Production URL in deployment section
09-Deployment.md:551 - Deployment verification example
```

### 2. JWT Token Examples

**Verify these are truncated (ending with `...`):**

```
06-API-Documentation.md:127
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

09-Deployment.md:370
# Expected: {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

**Action:** Ensure tokens end with `...` (truncated, not real tokens)

### 3. Example Replacements

**For production URLs:**
```markdown
# Before:
- **Production:** [photos.tojest.dev](https://photos.tojest.dev/)

# After:
- **Production:** `https://your-domain.com/` (example)

# OR remove line entirely if not needed
```

**For example URLs in instructions:**
```markdown
# Before:
1. Navigate to the application URL (e.g., https://photos.tojest.dev/)

# After:
1. Navigate to the application URL (e.g., https://your-domain.com/)
```

---

## 📝 Workflow Steps

### Step 1: Modify Local Wiki Files

```bash
cd /home/andrew/projects/photo-map-app/wiki/pages

# Edit each file:
# - 01-Home.md
# - 02-User-Guide.md
# - 05-Architecture.md
# - 06-API-Documentation.md
# - 09-Deployment.md
```

### Step 2: Clone Wiki Repository

```bash
cd /tmp
rm -rf photo-map-app.wiki
git clone https://github.com/kojder/photo-map-app.wiki.git
cd photo-map-app.wiki
```

### Step 3: Copy Modified Files

```bash
# Copy modified files from local wiki/pages/ to Wiki repo
cp /home/andrew/projects/photo-map-app/wiki/pages/01-Home.md Home.md
cp /home/andrew/projects/photo-map-app/wiki/pages/02-User-Guide.md User-Guide.md
cp /home/andrew/projects/photo-map-app/wiki/pages/05-Architecture.md Architecture.md
cp /home/andrew/projects/photo-map-app/wiki/pages/06-API-Documentation.md API-Documentation.md
cp /home/andrew/projects/photo-map-app/wiki/pages/09-Deployment.md Deployment.md
```

### Step 4: Commit and Push

```bash
cd /tmp/photo-map-app.wiki

git add .
git commit -m "docs: remove production URLs and verify token examples

- Replaced photos.tojest.dev with generic examples
- Verified JWT tokens are truncated placeholders only
- Ensured no real credentials in public Wiki

Security: Wiki is public - no sensitive data should be exposed"

git push
```

### Step 5: Commit Local Changes

```bash
cd /home/andrew/projects/photo-map-app

git add wiki/pages/
git commit -m "docs: remove sensitive data from Wiki source files

- Removed production URLs from Wiki pages
- Replaced with generic examples
- Updated: Home, User Guide, Architecture, API Docs, Deployment"

git push
```

### Step 6: Update PROGRESS_TRACKER.md

```bash
# Mark task as completed in PROGRESS_TRACKER.md
# Move from "Next Action" to "Last Completed"
```

---

## ✅ Success Criteria

- [ ] No production URLs (photos.tojest.dev) in Wiki pages
- [ ] JWT token examples are clearly truncated with `...`
- [ ] All references use generic examples (your-domain.com)
- [ ] Changes pushed to GitHub Wiki
- [ ] Local source files updated in wiki/pages/
- [ ] PROGRESS_TRACKER.md updated

---

## 🔗 Related Files

- `PROGRESS_TRACKER.md` - Task details in "Next Action" section
- `CLAUDE.md` - Wiki documentation reference
- `wiki/pages/` - Local Wiki source files
- Wiki repo: https://github.com/kojder/photo-map-app.wiki.git

---

**Last Updated:** 2025-11-10
**Priority:** High (security)
**Time Estimate:** 30-60 minutes
