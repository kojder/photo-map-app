# Feature Status Levels

This document defines the implementation status levels for features and provides criteria for classification.

## Status Definitions

### ✅ COMPLETED

**Definition:** Feature is fully implemented, tested, and deployed to production or merged to main branch.

**Characteristics:**
- All planned functionality implemented
- Tests passing (unit, integration, E2E)
- Code merged to main/master branch
- Deployed to production or ready for deployment
- No major outstanding issues or blockers
- Documentation can be condensed aggressively

**Documentation Approach:**
- Remove implementation details
- Keep architecture and key decisions
- Focus on maintenance and future reference

**Indicators in Documentation:**
- Status marked as "✅ Completed" with date
- All phases/tasks marked complete
- "Ready for deployment" or "Deployed" status
- Branch merged to main
- Acceptance criteria all met

**Example Files:**
- `feature-photo-viewer.md` - Photo viewer fully implemented
- Features listed in PROGRESS_TRACKER.md "Last Completed" section

---

### ⏳ IN-PROGRESS

**Definition:** Feature is actively being developed with some parts complete and others pending.

**Characteristics:**
- Some phases/components implemented
- Active development happening
- May have completed and pending tasks mixed
- Tests partially written or passing
- May be on feature branch
- Documentation should maintain current context

**Documentation Approach:**
- Keep current phase details
- Summarize completed phases
- Maintain active implementation notes
- Keep next steps clear

**Indicators in Documentation:**
- Status marked as "⏳ In Progress" or "🔧 Currently Working On"
- Mixed completion status (some ✅, some ⏸️ or 🔜)
- Has "Currently Working On" or "Next Steps" sections
- Recent "Last Updated" timestamp
- Active branch reference

**Sub-statuses:**
- **Blocked (🚫):** Implementation paused due to dependencies or blockers
- **Paused (⏸️):** Intentionally postponed, may resume later
- **Testing/Verification:** Implementation complete, verification in progress

**Example Indicators:**
```markdown
**Status:** ⏳ In Progress - Phase 2 of 4
**Status:** 🚫 Blocked - Waiting for API changes
**Status:** ⏸️ Paused - Awaiting deployment for mobile testing
```

---

### 🔜 PLANNED

**Definition:** Feature is designed and specified but implementation has not started.

**Characteristics:**
- No code written yet
- Planning and requirements defined
- May have architecture proposals
- Time estimates may exist
- Listed in "Future" or "Post-MVP" sections

**Documentation Approach:**
- Keep requirements and planning details
- Focus on WHAT and WHY, not HOW
- Avoid speculative implementation details
- Preserve decision context

**Indicators in Documentation:**
- Status marked as "🔜 Planned" or "Post-MVP"
- No completion dates
- Estimated time noted
- Listed in PROGRESS_TRACKER.md under "Opcjonalne Fazy (Post-MVP)"
- No implementation phases started

**Example Files:**
- `feature-email-system.md` - Planned for post-MVP
- `feature-public-sharing.md` - Not yet started
- `feature-temporal-spatial-filters.md` - Future enhancement

---

### 🗑️ DEPRECATED

**Definition:** Feature was started but abandoned, or completed feature being phased out.

**Characteristics:**
- No longer relevant or maintained
- May have been replaced by different approach
- Code may have been removed
- Kept for historical reference

**Documentation Approach:**
- Add deprecation notice at top
- Keep brief summary of what was attempted
- Note why it was deprecated
- Link to replacement if applicable
- Consider archiving the file

**Indicators:**
```markdown
**Status:** 🗑️ DEPRECATED (YYYY-MM-DD)
**Reason:** [Brief explanation]
**Replacement:** [Link to new approach if applicable]
```

---

## Determining Status from Multiple Sources

When updating documentation, determine status by checking:

### 1. Feature File Itself
- Look for explicit status markers
- Check phase completion (all ✅ vs mixed)
- Review "Last Updated" date
- Look for "Next Steps" sections

### 2. PROGRESS_TRACKER.md
- Check "Last Completed" section
- Check "Currently Working On" section
- Check "Opcjonalne Fazy (Post-MVP)" section
- Review overall project phase status

### 3. Git History
```bash
# Check recent commits mentioning the feature
git log --all --grep="feature-name" --oneline

# Check if feature branch exists
git branch -a | grep feature-name

# Check if feature branch merged
git log --merges --grep="feature-name"
```

### 4. Code Existence
- Check if components/services mentioned exist
- Verify if tests exist and pass
- Look for feature implementation in codebase

### 5. CLAUDE.md
- Check if feature mentioned in tech stack
- Look for references in workflow sections

## Status Transition Patterns

Common progression:
```
🔜 PLANNED
   ↓
⏳ IN-PROGRESS
   ↓
⏸️ PAUSED (optional - may resume to IN-PROGRESS)
   ↓
⏳ IN-PROGRESS
   ↓
✅ COMPLETED
   ↓
🗑️ DEPRECATED (rare - only if replaced/removed)
```

## Edge Cases

### Partially Deployed
If feature is deployed but has known limitations:
- Status: ✅ COMPLETED (with limitations noted)
- Document known limitations clearly
- Note planned improvements

### MVP vs Full Implementation
If feature implemented for MVP but has planned enhancements:
- Status: ✅ COMPLETED (MVP)
- Keep "Future Enhancements" section
- Treat enhancements as separate mini-features

### Multiple Versions
If feature has v1 complete and v2 planned:
- Mark v1 as ✅ COMPLETED
- Add v2 section as 🔜 PLANNED
- Keep them in same document with clear separation

## Quick Reference Table

| Status | Symbol | Documentation Needs | Cleanup Level |
|--------|--------|-------------------|---------------|
| Completed | ✅ | Architecture, decisions | Aggressive - remove code/details |
| In-Progress | ⏳ | Current context, next steps | Moderate - keep relevant info |
| Planned | 🔜 | Requirements, planning | Light - remove speculation |
| Blocked | 🚫 | Blocker info, dependencies | Keep context for resolution |
| Paused | ⏸️ | Pause reason, resume criteria | Keep planning for resume |
| Deprecated | 🗑️ | Historical reference only | Archive or minimal info |
