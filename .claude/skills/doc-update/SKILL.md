---
name: doc-update
description: Update and clean up project documentation files (primarily .ai/features/, but also README.md, PROGRESS_TRACKER.md, CLAUDE.md, and other .md files). Use when user requests documentation cleanup, organization, or updates for any feature, module, or project documentation (e.g., 'update photo viewer docs', 'clean up README', 'organize documentation'). Removes code snippets, outdated details, and redundant information while preserving essential architectural decisions and technical context.
---

# Documentation Update Skill

## Overview

This skill provides a systematic workflow for updating and cleaning up project documentation files. While primarily designed for feature documentation in `.ai/features/`, it works with any markdown documentation in the project including README.md, PROGRESS_TRACKER.md, CLAUDE.md, or documentation within code modules.

The skill removes verbose implementation details, code snippets, outdated information, and redundant content while preserving essential architectural decisions and technical context needed for future development.

It is particularly valuable for maintaining a lean, focused documentation set that provides maximum value without information overload.

## When to Use This Skill

Use this skill when the user requests documentation cleanup, updates, or organization for:
- **Feature documentation** in `.ai/features/` (primary use case)
- **Core documentation** (README.md, PROGRESS_TRACKER.md, CLAUDE.md)
- **Any markdown file** in the project that needs cleanup
- **Module or component documentation** that has become outdated

**Trigger phrases:**
- "update docs for X" / "zaktualizuj dokumentację X"
- "clean up X documentation" / "posprzątaj dokumentację X"
- "organize documentation" / "uporządkuj dokumentację"
- "condense X documentation" / "wyczyść dokumentację X"
- "remove outdated details from X"
- "update README" / "clean up PROGRESS_TRACKER"

## Documentation Update Workflow

Follow this 7-step workflow when updating feature documentation:

### Step 1: Identify the Documentation File

Extract the documentation target from the user's request and locate the corresponding file.

**Actions:**
- Identify target from user request:
  - Feature name → `.ai/features/feature-*.md` (e.g., "photo viewer" → `feature-photo-viewer.md`)
  - Core docs → `README.md`, `PROGRESS_TRACKER.md`, `CLAUDE.md`
  - Other files → Any `.md` file mentioned by user
- Locate file in project structure
- Confirm file exists, if not, ask user for clarification

**Examples:**
```
User: "Update photo viewer documentation"
→ Target: .ai/features/feature-photo-viewer.md

User: "Clean up README"
→ Target: README.md

User: "Posprzątaj PROGRESS_TRACKER"
→ Target: PROGRESS_TRACKER.md
```

### Step 2: Gather Context from Multiple Sources

Before making changes, gather comprehensive context about the feature's current state from multiple sources.

**Required Context Sources:**

1. **Feature File**: Read the target `.ai/features/feature-*.md` file
   - Current status markers
   - Implementation details
   - Completion dates

2. **PROGRESS_TRACKER.md**: Check feature status in project tracker
   - Is it in "Last Completed"?
   - Is it in "Currently Working On"?
   - Is it in "Opcjonalne Fazy (Post-MVP)"?

3. **Git History**: Check implementation progress
   ```bash
   # Find commits related to this feature
   git log --all --oneline --grep="feature-name"
   git log --all --oneline --grep="photo-viewer"

   # Check if feature branch exists or was merged
   git branch -a | grep -i feature-name
   ```

4. **Codebase**: Verify implementation exists
   - Check if mentioned components exist in code
   - Verify services, endpoints, or modules are implemented
   - Look for test files related to feature

5. **CLAUDE.md**: Review project conventions
   - Language preferences (Polish/English)
   - Documentation standards
   - Technical stack info

**Do not proceed until all context is gathered.**

### Step 3: Determine Implementation Status

Based on gathered context, classify the feature into one of these statuses:

- **✅ COMPLETED**: Fully implemented, tested, merged to main
- **⏳ IN-PROGRESS**: Actively being developed, mixed completion status
- **🔜 PLANNED**: Designed but not yet started
- **⏸️ PAUSED**: Started but temporarily on hold
- **🗑️ DEPRECATED**: No longer relevant or replaced

**Decision Matrix:**

| Indicator | Status |
|-----------|--------|
| Branch merged + all phases complete + in PROGRESS_TRACKER "Last Completed" | ✅ COMPLETED |
| Branch active + some phases complete + in "Currently Working On" | ⏳ IN-PROGRESS |
| No code + in "Post-MVP" section + only planning details | 🔜 PLANNED |
| Some code + explicit "paused" marker + in waiting state | ⏸️ PAUSED |
| Explicit deprecation notice or code removed | 🗑️ DEPRECATED |

**Reference:** See `references/feature-status-levels.md` for detailed status definitions.

### Step 4: Apply Appropriate Cleanup Level

Based on status determined in Step 3, apply the corresponding cleanup strategy.

#### For ✅ COMPLETED Features: Aggressive Cleanup

**Remove:**
- All code snippets and examples
- Detailed step-by-step implementation instructions
- Granular task checklists (convert to phase summaries)
- Time tracking and progress tables
- Verbose testing procedures
- Development history and commit logs
- "Currently Working On" sections
- Outdated "Next Steps"

**Keep:**
- Status section with completion date
- Architecture overview (high-level components)
- Key technical decisions with rationale
- Component/service names and responsibilities
- Integration points with other features
- API endpoints or public interfaces
- Important constraints or limitations
- Future enhancement considerations

**Target reduction:** 60-85% file size reduction

#### For ⏳ IN-PROGRESS Features: Moderate Cleanup

**Remove:**
- Outdated code snippets
- Completed phase details (summarize instead)
- Resolved blockers
- Obsolete implementation attempts
- Redundant information

**Keep:**
- Current phase details and tasks
- Next steps and planned work
- Active blockers or decisions needed
- Recent implementation notes
- Testing approach for current work
- All items from COMPLETED list

**Target reduction:** 40-60% file size reduction

#### For 🔜 PLANNED Features: Light Cleanup

**Remove:**
- Speculative code examples
- Over-detailed implementation plans
- Premature technical decisions
- Excessive alternative approaches (keep top 2-3)

**Keep:**
- Requirements and user stories
- High-level architecture proposals
- Technology evaluation (brief)
- Dependencies and prerequisites
- Estimated effort/complexity
- Integration points

**Target reduction:** 30-50% file size reduction

**Reference:** See `references/cleanup-guidelines.md` for detailed guidelines.

### Step 5: Update Status Section

Ensure the feature file has a clear, prominent status section at the top.

**Required Format:**

```markdown
# [Feature Name]

**Status:** [✅/⏳/🔜/⏸️/🗑️] [Description]
**Branch:** [branch-name] ([merged to main] or [active])
**Completed:** [YYYY-MM-DD] (for completed features)
**Last Updated:** [YYYY-MM-DD] (for in-progress features)

## Overview
[Brief 1-2 paragraph summary]
```

**Examples:**
```markdown
**Status:** ✅ Completed (2025-10-25)
**Branch:** `feature/photo-viewer` (merged to master)

**Status:** ⏳ In Progress - Phase 2 of 4
**Branch:** `feature/email-system`
**Last Updated:** 2025-11-03

**Status:** 🔜 Planned (Post-MVP)
**Estimated Effort:** 2-3 weeks
```

### Step 6: Preserve Language

**CRITICAL: Always preserve the original language of the document unless user explicitly requests translation.**

**Detection:**
- Read first few sections of the document
- Identify if content is in Polish or English
- Check PROGRESS_TRACKER.md for project language patterns

**Rules:**
- Polish document → Keep in Polish
- English document → Keep in English
- Mixed document → Ask user which to standardize to
- Only translate if user explicitly says "translate to [language]"

**Example:**
```
User: "Update photo viewer docs"
→ Document in Polish → Keep changes in Polish

User: "Update photo viewer docs and translate to English"
→ Document in Polish → Translate to English
```

### Step 7: Review with User Before Committing

**NEVER make documentation changes without user review.**

**Review Process:**
1. Make all changes to the file
2. Show user a summary of changes:
   - Original file size vs new file size
   - Key sections removed
   - Key sections kept
   - Status classification used
3. Optionally show git diff for detailed review
4. Ask: "Czy zatwierdzić te zmiany w dokumentacji?"
5. Wait for explicit confirmation
6. Only after YES → stage and commit changes

**Example Review Summary:**
```
Zaktualizowałem dokumentację feature-photo-viewer.md:

Zmiany:
- Usunięto szczegółowe checklisty zadań (150 linii)
- Usunięto fragmenty kodu (80 linii)
- Usunięto verbose testing procedures (60 linii)
- Zachowano architekturę i kluczowe decyzje techniczne
- Zachowano Future Considerations

Status: ✅ COMPLETED
Rozmiar: 478 linii → 85 linii (82% redukcja)

Czy zatwierdzić te zmiany w dokumentacji?
```

## Resources

This skill includes reference documentation in the `references/` directory:

### references/cleanup-guidelines.md
Detailed guidelines for what to keep and remove for each implementation status. Includes specific examples and strategies for condensing different types of content.

**Read this when:** You need specific guidance on what to remove or keep for a particular status level.

### references/feature-status-levels.md
Comprehensive definitions of all implementation statuses (COMPLETED, IN-PROGRESS, PLANNED, etc.) with indicators and classification criteria.

**Read this when:** You're unsure how to classify a feature's status or need to understand status transitions.

### references/examples.md
Before/after examples of documentation transformations for different statuses, showing actual file size reductions and specific changes made.

**Read this when:** You want to see concrete examples of the cleanup process or validate your approach.

## Important Reminders

1. **Always gather full context** - Don't rely on the feature file alone
2. **Be aggressive with COMPLETED features** - Remove 60-85% of content
3. **Preserve technical decisions** - These are gold for future work
4. **Keep language consistent** - Don't translate unless explicitly asked
5. **Always review with user** - Never auto-commit documentation changes
6. **Use references liberally** - Refer to cleanup-guidelines.md for specific guidance

## Quick Reference

| Status | Cleanup Level | Target Reduction | Key Focus |
|--------|---------------|------------------|-----------|
| ✅ COMPLETED | Aggressive | 60-85% | Architecture + decisions |
| ⏳ IN-PROGRESS | Moderate | 40-60% | Current work + context |
| 🔜 PLANNED | Light | 30-50% | Requirements + why |
| ⏸️ PAUSED | Moderate | 40-60% | Context for resume |
| 🗑️ DEPRECATED | Minimal | Archive | Historical reference |

## Common Pitfalls to Avoid

- ❌ Removing all technical decisions (these are crucial!)
- ❌ Deleting integration points (needed for related work)
- ❌ Auto-translating without user request
- ❌ Committing without user review
- ❌ Being too conservative with COMPLETED features
- ❌ Removing current context from IN-PROGRESS features
- ❌ Keeping speculative code in PLANNED features
