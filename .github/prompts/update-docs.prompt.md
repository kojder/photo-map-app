---
description: "Analyze recent commits and update project documentation (PROGRESS_TRACKER, .ai/, .decisions/, README)"
mode: agent
---

# Update Project Documentation

Analyze recent repository changes and update project documentation to keep it synchronized with the codebase.

## Workflow

### 1. Analyze Recent Commits

Check git log for recent commits since last documentation update:

```bash
git log --oneline --since="7 days ago" --pretty=format:"%h %s"
```

Categorize changes:
- `feat(backend):` → Check `.ai/api-plan.md`, `PROGRESS_TRACKER.md`
- `feat(frontend):` → Check `.ai/ui-plan.md`, `PROGRESS_TRACKER.md`
- `fix:`, `refactor:` → Check if `.decisions/tech-decisions.md` needs update
- `docs:` → Verify consistency

### 2. Update PROGRESS_TRACKER.md

**Check and update:**
- [ ] `Last Updated` timestamp → current date
- [ ] `Last Completed` section → mark finished tasks with ✅ and date
- [ ] `Currently Working On` → update to current phase/task
- [ ] `Next Action` → update next steps
- [ ] Task checkboxes `[x]` → mark completed tasks
- [ ] Phase status (Pending 🔜 → Completed ✅)

### 3. Update .ai/ Files

**When API endpoints changed** → update `.ai/api-plan.md`:
- Add new endpoints with method, path, request/response examples
- Mark deprecated endpoints
- Update authentication requirements

**When database schema changed** → update `.ai/db-plan.md`:
- Add new tables/columns
- Update relationships
- Add new indexes

**When components/services added** → update `.ai/ui-plan.md`:
- Add new components with props, state, behavior
- Update component hierarchy
- Document new services

**When architecture pattern changed** → update `.ai/tech-stack.md`:
- Document new libraries/dependencies
- Update patterns (e.g., BehaviorSubject usage)
- Change technology decisions

**When requirements evolved** → update `.ai/prd.md`:
- Update user stories
- Modify acceptance criteria
- Change scope

### 4. Update .decisions/ Files

**When important tech decision made** → update `.decisions/tech-decisions.md`:

Add entry with:
- Decision title and date
- Rationale (why this choice?)
- Trade-offs (pros/cons)
- Alternatives considered
- Future considerations

**When PRD scope changed** → update `.decisions/prd-context.md`:
- Document scope changes (added/removed features)
- Explain business rationale
- Impact on timeline

### 5. Update README.md

**Update sections:**
- `Status Projektu` → Overall progress percentage, completed phases
- `Stack Technologiczny` → Add new libraries/tools
- `Prerequisites` → New tools/versions required
- `Instalacja` → Changed setup steps
- `Development` → New commands/scripts

## Output Format

Provide concise summary of updates:

```markdown
## Documentation Updated (YYYY-MM-DD)

### PROGRESS_TRACKER.md
- ✅ Marked Phase X as completed
- ✅ Updated Current Status section
- ✅ Updated Last Updated timestamp

### .ai/api-plan.md
- ✅ Added photo filtering endpoints
- ✅ Documented rating API (PUT/DELETE)

### .ai/ui-plan.md
- ✅ Added FilterBarComponent specification

### README.md
- ✅ Updated project status
- ✅ Added Leaflet.js to stack

### .decisions/tech-decisions.md
- ✅ Documented Spring Integration choice

---
No updates needed for:
- .ai/db-plan.md (schema unchanged)
- .ai/prd.md (requirements unchanged)
```

## Best Practices

1. **Be specific** - Include dates, commit hashes, version numbers
2. **Explain why** - Especially in `.decisions/` files
3. **Keep concise** - Focus on what changed, not implementation details
4. **Cross-reference** - Link related updates across files
5. **Update after each phase** - Don't let docs drift

## Variables

- `${workspaceFolder}` - Project root
- `${input:since}` - Optional: analyze commits since specific date/commit

## Example Usage

```
/update-docs
/update-docs since=HEAD~10
/update-docs since=2025-10-20
```
