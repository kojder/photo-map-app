# Cleanup Guidelines for Feature Documentation

This document provides detailed guidelines for cleaning up feature documentation based on implementation status.

## For COMPLETED Features

When a feature is fully implemented and deployed, the documentation should be condensed to preserve only essential information for future reference and maintenance.

### ✅ KEEP (Essential Information)

**Status and Overview:**
- Clear implementation status at the top (✅ Completed + date)
- Branch name if merged
- High-level feature overview (1-2 paragraphs)

**Architecture and Design:**
- Architecture overview diagram or description
- Component/service names and their responsibilities
- Integration points with other features/modules
- Data flow between components (high-level)

**Technical Decisions:**
- Key technical decisions with rationale (Decision Log section)
- Technology choices (libraries, frameworks, patterns)
- Why specific approaches were chosen
- Trade-offs that were considered
- Important constraints or limitations

**API/Interfaces:**
- Public API endpoints created
- Component interfaces and contracts
- Service method signatures (key ones only)

**Configuration:**
- Important configuration settings
- Environment variables introduced
- Feature flags or toggles

**Future Reference:**
- Links to related features
- Dependencies on this feature
- Known limitations or technical debt
- Potential future enhancements (brief list)

### ❌ REMOVE (Implementation Details)

**Code Artifacts:**
- All code snippets and examples
- Detailed method implementations
- Component template code
- Service logic code

**Implementation Process:**
- Step-by-step implementation instructions
- Detailed task checklists (keep only phase summary)
- Time estimates and hours spent
- Progress tracking tables
- "Currently Working On" sections

**Testing Details:**
- Verbose testing procedures (keep high-level strategy only)
- Detailed test case lists
- Manual testing checklists (keep acceptance criteria summary)
- Granular acceptance criteria (condense to key requirements)

**Development History:**
- Detailed commit history
- Bug fixes during development
- Iteration notes
- "Last Updated" timestamps (keep completion date only)

**Temporary Information:**
- TODO lists
- WIP notes
- Debugging logs
- Development notes

### 📝 Condensing Strategy

1. **Phases/Tasks**: Convert detailed task lists to brief summary
   - Before: "Phase 1: Core Viewer (5 tasks with checkboxes)"
   - After: "Phase 1: Implemented PhotoViewerComponent with keyboard navigation"

2. **Testing**: Summarize to test strategy only
   - Before: "36 unit tests covering: keyboard navigation, boundary conditions..."
   - After: "Full test coverage including unit, integration, and E2E tests"

3. **Acceptance Criteria**: Condense to key requirements
   - Before: Detailed checklist with 15 items
   - After: 3-5 bullet points of key functionality

4. **Decisions**: Keep rationale, remove verbose context
   - Keep: "Decision 1: CSS Fixed Position vs Browser Fullscreen API - chose CSS for better compatibility"
   - Remove: Long paragraphs explaining every detail

## For IN-PROGRESS Features

Features currently being developed need more detail than completed features, but should still avoid excessive clutter.

### ✅ KEEP

All items from COMPLETED section, plus:
- Current phase details and remaining tasks
- Active implementation notes
- Recent decisions and considerations
- Open questions or blockers
- Testing approach for current phase

### ❌ REMOVE

- Outdated implementation attempts
- Abandoned approaches
- Obsolete code snippets
- Resolved blockers
- Redundant information

### 📝 Strategy

- Keep last 1-2 completed phases in summary form
- Keep current phase in detail
- Keep next phase at planning level
- Remove phases that are 2+ steps back

## For PLANNED Features

Features not yet started should focus on planning and requirements.

### ✅ KEEP

- Feature requirements and user stories
- Proposed architecture (high-level)
- Technology evaluation results
- Estimated complexity and time
- Dependencies and prerequisites
- Planning notes

### ❌ REMOVE

- Speculative code examples
- Over-detailed implementation plans (keep high-level)
- Premature technical decisions
- Excessive alternative approaches (keep 2-3 max)

### 📝 Strategy

- Focus on WHAT and WHY, not HOW
- Keep requirements clear
- Avoid premature implementation details
- Preserve decision-making context

## Language Preservation

- **Always preserve original language** (Polish or English) unless user explicitly requests translation
- Check the file's current language from existing content
- Maintain consistent language throughout the document
- If file is mixed language, ask user which to standardize to

## File Organization

### Recommended Structure for COMPLETED features:

```markdown
# [Feature Name]

**Status:** ✅ Completed (YYYY-MM-DD)
**Branch:** [branch-name] (merged to main)

## Overview
[1-2 paragraph summary]

## Architecture
[Component overview, integration points]

## Key Components
- Component/Service 1: [responsibility]
- Component/Service 2: [responsibility]

## Technical Decisions
### Decision 1: [Title]
**Choice:** [What was chosen]
**Reasoning:** [Why - 2-3 sentences max]

## API Endpoints / Interfaces
[Key public APIs created]

## Integration Points
[How it connects to other features]

## Future Considerations
[Known limitations, potential enhancements]
```

## Special Cases

### Features with Multiple Sub-features
- Keep sub-feature structure for completed sections
- Condense each sub-feature independently
- Preserve relationships between sub-features

### Features with External Dependencies
- Always keep dependency information
- Document version requirements
- Note any breaking changes

### Features with Security Implications
- Keep security considerations
- Document authentication/authorization patterns
- Preserve security decision rationale
