# Wiki Correction Format

**Created:** 2025-11-10
**Purpose:** Guidelines for marking Wiki content corrections

---

## 📝 Format Specification

Use **Markdown/HTML comments** to mark content that needs correction:

```markdown
<!-- CORR_001: instruction in Polish or English -->
Content to be modified
<!-- /CORR_001 -->
```

**Why comments?**
- ✅ Invisible on GitHub Wiki (public won't see them)
- ✅ Safe to commit and push
- ✅ Easy to search: `grep -r "<!-- CORR_" wiki/pages/`

---

## 🎯 Instruction Types

### Delete
```markdown
<!-- CORR_001: delete this -->
Unnecessary content to remove
<!-- /CORR_001 -->
```

### Shorten
```markdown
<!-- CORR_002: shorten to 5 sentences -->
Long paragraph with too much detail that needs to be condensed...
<!-- /CORR_002 -->
```

### Extend
```markdown
<!-- CORR_003: extend with example -->
Brief explanation that needs more detail
<!-- /CORR_003 -->
```

### Rewrite
```markdown
<!-- CORR_004: rewrite as bullet points -->
Long paragraph that would be clearer as a list...
<!-- /CORR_004 -->
```

### Replace
```markdown
<!-- CORR_005: replace with: New content here -->
Old content
<!-- /CORR_005 -->
```

### Make More Concise
```markdown
<!-- CORR_006: make more concise -->
Verbose explanation with redundant information...
<!-- /CORR_006 -->
```

### Fix Grammar
```markdown
<!-- CORR_007: fix grammar -->
Sentence with grammar errors
<!-- /CORR_007 -->
```

---

## 🔢 Numbering Convention

Use sequential numbers: `CORR_001`, `CORR_002`, `CORR_003`, etc.

**Across files:**
- Continue numbering across different files
- Example: `01-Home.md` has CORR_001-003, `02-User-Guide.md` starts with CORR_004

**Why?** Easy tracking and reporting ("Found 25 corrections total")

---

## 🇵🇱 Polish Instructions OK

Instructions can be in Polish (faster for you):

```markdown
<!-- CORR_008: usuń to -->
<!-- CORR_009: skróć do 3 zdań -->
<!-- CORR_010: przepisz jako lista -->
<!-- CORR_011: dodaj przykład użycia -->
<!-- CORR_012: popraw gramatykę -->
```

Claude Code understands Polish instructions.

---

## 🔄 Processing Workflow

### Step 1: Mark Corrections (You)

Edit files in `wiki/pages/*.md` and add `<!-- CORR_* -->` markers.

### Step 2: Request Processing (You)

Say: **"process corrections"** or **"przetwórz korekty"**

### Step 3: Claude Scans Files

```bash
grep -r "<!-- CORR_" wiki/pages/
```

Generates report:
```
Found 12 corrections:
- wiki/pages/01-Home.md: CORR_001 (delete this)
- wiki/pages/01-Home.md: CORR_002 (shorten to 3 sentences)
- wiki/pages/02-User-Guide.md: CORR_003 (rewrite as bullets)
...
```

### Step 4: Claude Executes Corrections

For each marker:
1. Read instruction
2. Execute according to instruction (delete/shorten/extend/rewrite)
3. **Remove both markers** (opening + closing)

### Step 5: Review & Commit (You)

Claude shows diff/summary → You review → Commit → Push to GitHub Wiki

---

## 📋 Example: Full Correction Flow

### Before (in wiki/pages/01-Home.md):

```markdown
## Welcome to Photo Map

<!-- CORR_001: shorten to 2 sentences -->
This is a comprehensive photo management application that allows users to upload,
organize, and view their photos on an interactive map. The application provides
advanced features such as EXIF metadata extraction, thumbnail generation, rating
system, and much more. It's built with modern technologies and follows best practices.
<!-- /CORR_001 -->

<!-- CORR_002: delete this -->
This section is outdated and no longer relevant.
<!-- /CORR_002 -->
```

### After Processing:

```markdown
## Welcome to Photo Map

This is a photo management application that allows users to upload, organize, and
view their photos on an interactive map. Built with Angular 18, Spring Boot 3, and PostgreSQL.
```

**Changes:**
- CORR_001: Shortened from 4 sentences to 2
- CORR_002: Section deleted
- Both markers removed

---

## 🚀 Quick Reference

**Add correction:**
```markdown
<!-- CORR_NNN: instruction -->
Content
<!-- /CORR_NNN -->
```

**Common instructions:**
- `delete this` / `usuń to`
- `shorten to N sentences` / `skróć do N zdań`
- `extend with example` / `dodaj przykład`
- `rewrite as bullet points` / `przepisz jako lista`
- `make more concise` / `bardziej zwięźle`
- `fix grammar` / `popraw gramatykę`
- `replace with: NEW_TEXT` / `zamień na: NOWY_TEKST`

**Process corrections:**
Say: "process corrections" → Claude scans → executes → shows diff → you commit

---

## 📂 Files to Correct

All 11 Wiki pages in `wiki/pages/`:
- 01-Home.md
- 02-User-Guide.md
- 03-Quick-Start.md
- 04-Development-Setup.md
- 05-Architecture.md
- 06-API-Documentation.md
- 07-Testing-Quality.md
- 08-Scripts-Reference.md
- 09-Deployment.md
- 10-AI-Development-Methodology.md
- 11-Contributing.md

---

## ✅ Success Criteria

- [x] Format defined (`<!-- CORR_* -->` comments)
- [x] Instruction types documented
- [x] Processing workflow explained
- [x] Examples provided
- [ ] All corrections marked (waiting for user)
- [ ] All corrections processed (waiting for user)
- [ ] Changes pushed to GitHub Wiki (waiting for user)

---

**Ready to start!** Add `<!-- CORR_* -->` markers in Wiki pages, then say "process corrections".
