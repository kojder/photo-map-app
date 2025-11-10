# GitHub Wiki - Upload Instructions

**Step-by-step guide for uploading Wiki pages to GitHub**

---

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with write access to repository: `kojder/photo-map-app`
- [ ] All Wiki pages prepared in `wiki/pages/` directory
- [ ] Internet connection
- [ ] Web browser (Chrome, Firefox, Safari, Edge)

**Optional (for advanced users):**
- [ ] `gh` CLI installed and authenticated
- [ ] Git installed (for cloning Wiki as git repo)

---

## 🌐 Method 1: GitHub Web Interface (Recommended for First-Time Setup)

### Step 1: Navigate to Wiki

1. Open browser
2. Go to: https://github.com/kojder/photo-map-app
3. Click **"Wiki"** tab in top navigation bar
4. If Wiki doesn't exist yet, click **"Create the first page"**

---

### Step 2: Create Home Page

1. Click **"Create the first page"** button (or **"New Page"** if Wiki exists)
2. **Page Title:** `Home` (exactly this, case-sensitive)
3. **Content:** Open `wiki/pages/01-Home.md` in text editor
4. Copy **entire content** from `01-Home.md`
5. Paste into Wiki editor
6. **Edit message:** `docs: create Home page with navigation`
7. Click **"Save Page"**

✅ **Verify:** Home page appears at https://github.com/kojder/photo-map-app/wiki/Home

---

### Step 3: Create User Guide

1. Click **"New Page"** button (top right)
2. **Page Title:** `User Guide` (exactly this, case-sensitive with space)
3. **Content:** Open `wiki/pages/02-User-Guide.md`
4. Copy entire content
5. Paste into Wiki editor
6. **Edit message:** `docs: create User Guide page`
7. Click **"Save Page"**

✅ **Verify:** User Guide appears at https://github.com/kojder/photo-map-app/wiki/User-Guide

**Note:** GitHub Wiki automatically converts spaces to hyphens in URLs

---

### Step 4: Create Quick Start

1. Click **"New Page"** button
2. **Page Title:** `Quick Start`
3. **Content:** Copy from `wiki/pages/03-Quick-Start.md`
4. **Edit message:** `docs: create Quick Start page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/Quick-Start

---

### Step 5: Create Development Setup

1. Click **"New Page"** button
2. **Page Title:** `Development Setup`
3. **Content:** Copy from `wiki/pages/04-Development-Setup.md`
4. **Edit message:** `docs: create Development Setup page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/Development-Setup

---

### Step 6: Create Architecture

1. Click **"New Page"** button
2. **Page Title:** `Architecture`
3. **Content:** Copy from `wiki/pages/05-Architecture.md`
4. **Edit message:** `docs: create Architecture page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/Architecture

---

### Step 7: Create API Documentation

1. Click **"New Page"** button
2. **Page Title:** `API Documentation`
3. **Content:** Copy from `wiki/pages/06-API-Documentation.md`
4. **Edit message:** `docs: create API Documentation page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/API-Documentation

---

### Step 8: Create Testing & Quality (Testing Quality)

1. Click **"New Page"** button
2. **Page Title:** `Testing Quality` (no ampersand - GitHub Wiki doesn't support &)
3. **Content:** Copy from `wiki/pages/07-Testing-Quality.md`
4. **Edit message:** `docs: create Testing Quality page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/Testing-Quality

**Note:** Use "Testing Quality" (no &) because GitHub Wiki URL encoding

---

### Step 9: Create Scripts Reference

1. Click **"New Page"** button
2. **Page Title:** `Scripts Reference`
3. **Content:** Copy from `wiki/pages/08-Scripts-Reference.md`
4. **Edit message:** `docs: create Scripts Reference page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/Scripts-Reference

---

### Step 10: Create Deployment

1. Click **"New Page"** button
2. **Page Title:** `Deployment`
3. **Content:** Copy from `wiki/pages/09-Deployment.md`
4. **Edit message:** `docs: create Deployment page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/Deployment

---

### Step 11: Create AI Development Methodology

1. Click **"New Page"** button
2. **Page Title:** `AI Development Methodology`
3. **Content:** Copy from `wiki/pages/10-AI-Development-Methodology.md`
4. **Edit message:** `docs: create AI Development Methodology page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/AI-Development-Methodology

---

### Step 12: Create Contributing

1. Click **"New Page"** button
2. **Page Title:** `Contributing`
3. **Content:** Copy from `wiki/pages/11-Contributing.md`
4. **Edit message:** `docs: create Contributing page`
5. Click **"Save Page"**

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki/Contributing

---

### Step 13: Verify All Pages

1. Go to: https://github.com/kojder/photo-map-app/wiki
2. Check sidebar (right side) - should show all 11 pages:
   - Home
   - User Guide
   - Quick Start
   - Development Setup
   - Architecture
   - API Documentation
   - Testing Quality
   - Scripts Reference
   - Deployment
   - AI Development Methodology
   - Contributing

3. Click each page and verify:
   - [ ] Content displays correctly
   - [ ] Internal links work (links between Wiki pages)
   - [ ] Code blocks render properly
   - [ ] Tables display correctly
   - [ ] No broken images

---

## 🔧 Method 2: Git Clone (Advanced Users)

### Alternative: Clone Wiki as Git Repository

GitHub Wiki is a separate git repository. You can clone it and push all pages at once.

```bash
# Clone Wiki repository
git clone https://github.com/kojder/photo-map-app.wiki.git
cd photo-map-app.wiki

# Copy all Wiki pages
cp /home/andrew/projects/photo-map-app/wiki/pages/01-Home.md Home.md
cp /home/andrew/projects/photo-map-app/wiki/pages/02-User-Guide.md User-Guide.md
cp /home/andrew/projects/photo-map-app/wiki/pages/03-Quick-Start.md Quick-Start.md
cp /home/andrew/projects/photo-map-app/wiki/pages/04-Development-Setup.md Development-Setup.md
cp /home/andrew/projects/photo-map-app/wiki/pages/05-Architecture.md Architecture.md
cp /home/andrew/projects/photo-map-app/wiki/pages/06-API-Documentation.md API-Documentation.md
cp /home/andrew/projects/photo-map-app/wiki/pages/07-Testing-Quality.md Testing-Quality.md
cp /home/andrew/projects/photo-map-app/wiki/pages/08-Scripts-Reference.md Scripts-Reference.md
cp /home/andrew/projects/photo-map-app/wiki/pages/09-Deployment.md Deployment.md
cp /home/andrew/projects/photo-map-app/wiki/pages/10-AI-Development-Methodology.md AI-Development-Methodology.md
cp /home/andrew/projects/photo-map-app/wiki/pages/11-Contributing.md Contributing.md

# Add all pages
git add .

# Commit
git commit -m "docs: create GitHub Wiki documentation (11 pages)"

# Push to Wiki
git push origin master
```

✅ **Verify:** https://github.com/kojder/photo-map-app/wiki

---

## 📄 Step 14: Replace Local README Files

After Wiki pages are uploaded, update local README files.

### 1. Replace Main README.md

```bash
cd /home/andrew/projects/photo-map-app

# Backup original (optional)
cp README.md README.md.backup

# Replace with new version
cp wiki/modified-files/README.md README.md

# Verify
wc -l README.md  # Should be ~180 lines
```

---

### 2. Replace deployment/README.md

```bash
cd /home/andrew/projects/photo-map-app

# Backup original (optional)
cp deployment/README.md deployment/README.md.backup

# Replace with modified version
cp wiki/modified-files/deployment-README.md deployment/README.md

# Verify
head -15 deployment/README.md  # Should see Wiki link at top
```

---

### 3. Replace scripts/README.md

```bash
cd /home/andrew/projects/photo-map-app

# Backup original (optional)
cp scripts/README.md scripts/README.md.backup

# Replace with modified version
cp wiki/modified-files/scripts-README.md scripts/README.md

# Verify
head -15 scripts/README.md  # Should see Wiki link at top
```

---

## 📝 Step 15: Commit Changes

### Review Changes

```bash
cd /home/andrew/projects/photo-map-app

# Check what changed
git status

# Expected output:
# modified:   README.md
# modified:   deployment/README.md
# modified:   scripts/README.md
# new files:  wiki/

# Review diff
git diff README.md
git diff deployment/README.md
git diff scripts/README.md
```

---

### Stage Changes

```bash
# Stage README files
git add README.md
git add deployment/README.md
git add scripts/README.md

# Stage wiki/ folder (working files - for reference)
git add wiki/

# Check staged changes
git diff --cached --stat
```

---

### Commit

```bash
git commit -m "docs: restructure README.md and create GitHub Wiki documentation

- Reduce main README.md to ~180 lines (overview + quick start + Wiki links)
- Add Wiki links to deployment/README.md and scripts/README.md
- Create 11 Wiki pages: Home, User Guide, Quick Start, Development Setup,
  Architecture, API Documentation, Testing Quality, Scripts Reference,
  Deployment, AI Development Methodology, Contributing
- Improve documentation organization for end users, developers, and AI development
- Add wiki/ folder with working files (pages, modified files, instructions)

📖 Wiki: https://github.com/kojder/photo-map-app/wiki"
```

---

### Push

```bash
# ⚠️ Pre-push hook will run tests automatically
git push

# If tests fail:
# - Fix errors
# - Run ./scripts/run-all-tests.sh manually
# - Commit fixes
# - Push again
```

---

## ✅ Final Verification

### Check Wiki

1. Go to: https://github.com/kojder/photo-map-app/wiki
2. Verify all 11 pages appear in sidebar
3. Click Home page - verify navigation table works
4. Test internal links (click links between Wiki pages)
5. Test external links (repository, production, dashboards)

---

### Check Main Repository

1. Go to: https://github.com/kojder/photo-map-app
2. Verify README.md is concise (~180 lines)
3. Verify "Documentation" section has links to Wiki
4. Click Wiki links - verify they work

---

### Check Local Files

1. Verify `deployment/README.md` has Wiki link at top
2. Verify `scripts/README.md` has Wiki link at top
3. Verify `wiki/` folder exists with all working files

---

## 🐛 Troubleshooting

### Problem: "Page already exists"

**Solution:** Use different page title or delete existing page first

```bash
# Via web: Click "Edit" → "Delete Page" → Confirm
# Via git: rm PageName.md && git commit && git push
```

---

### Problem: "Internal links not working"

**Cause:** Wrong page title or URL format

**Solution:**
- Check exact page title (case-sensitive)
- Use hyphens instead of spaces in links: `[Development Setup](Development-Setup)`
- Verify page exists in Wiki sidebar

---

### Problem: "Code blocks not rendering"

**Cause:** Wrong markdown syntax

**Solution:**
- Use triple backticks with language: ` ```bash `
- Ensure closing backticks: ` ``` `

---

### Problem: "Tables not displaying"

**Cause:** Missing pipes or incorrect format

**Solution:**
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

---

### Problem: "Emoji not showing"

**Cause:** GitHub Wiki supports emoji codes, not all Unicode emoji

**Solution:** Use emoji codes: `:white_check_mark:` → ✅

---

## 📚 Additional Resources

### GitHub Wiki Documentation

- https://docs.github.com/en/communities/documenting-your-project-with-wikis
- https://docs.github.com/en/communities/documenting-your-project-with-wikis/adding-or-editing-wiki-pages

### Markdown Guide

- https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax

### GitHub CLI (gh)

- https://cli.github.com/manual/

---

## 🎯 Success Checklist

- [ ] All 11 Wiki pages uploaded to GitHub
- [ ] All pages visible in Wiki sidebar
- [ ] Home page navigation table works
- [ ] Internal links between Wiki pages work
- [ ] External links (repository, dashboards) work
- [ ] Code blocks render correctly
- [ ] Tables display correctly
- [ ] README.md (main) replaced with new version (~180 lines)
- [ ] deployment/README.md has Wiki link
- [ ] scripts/README.md has Wiki link
- [ ] Changes committed to git
- [ ] Changes pushed to remote
- [ ] PROGRESS_TRACKER.md updated
- [ ] CLAUDE.md updated

---

**Congratulations! GitHub Wiki documentation is complete.** 🎉

**Next:** Share Wiki URL with team: https://github.com/kojder/photo-map-app/wiki
