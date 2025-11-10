# AI Development Methodology

> Complete guide to AI-assisted development in Photo Map MVP - Claude Code, GitHub Copilot, Gemini CLI, and prompt engineering best practices.

---

## 📖 Table of Contents

- [Overview](#overview)
- [Claude Code](#claude-code)
- [GitHub Copilot](#github-copilot)
- [Gemini CLI](#gemini-cli)
- [Prompt Engineering](#prompt-engineering)
- [Best Practices](#best-practices)

---

## 🤖 Overview

Photo Map MVP leverages multiple AI tools for development, each serving different purposes:

### AI Tools Stack

| Tool | Purpose | Use Cases |
|------|---------|-----------|
| **Claude Code** | Full-stack development, refactoring, documentation | Feature implementation, code review, architecture decisions |
| **GitHub Copilot** | Real-time code completion, inline suggestions | Writing boilerplate, test scaffolding, quick fixes |
| **Gemini CLI** | Large context analysis, codebase understanding | Analyzing entire codebase, finding patterns, architectural review |

### Why AI-Assisted Development?

**Benefits:**
- ✅ Faster prototyping and iteration
- ✅ Consistent code quality and patterns
- ✅ Comprehensive documentation generation
- ✅ Automated refactoring with context awareness
- ✅ Test generation and coverage improvement

**Approach:**
- AI as **assistant**, not replacement
- Human review of all AI-generated code
- Structured prompts with clear specifications
- Context-rich documentation (`.ai/`, `.decisions/` directories)

---

## 🧠 Claude Code

### Overview

**Claude Code** is the primary AI tool for Photo Map MVP development. Used for complex multi-file changes, feature implementation, and architectural decisions.

**Model:** Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
**Knowledge Cutoff:** January 2025

### Configuration

**Location:** `.claude/` directory

```
.claude/
├── CLAUDE.md              # Main workflow instructions
├── claude.md              # User-specific global config
└── skills/                # Custom skills for specific tasks
    ├── angular-frontend/  # Angular 18 patterns
    ├── spring-boot-backend/ # Spring Boot 3 patterns
    ├── code-review/       # Code quality checks
    └── ... (more skills)
```

### Core Context Files

**Always Read Before Implementation:**

| File | Purpose | When to Read |
|------|---------|-------------|
| `.ai/prd.md` | MVP requirements, user stories | Start of any feature |
| `.ai/tech-stack.md` | Technology specifications | Before backend/frontend work |
| `.ai/db-plan.md` | Database schema, migrations | Before data model changes |
| `.ai/api-plan.md` | REST API specification | Before endpoint implementation |
| `.ai/ui-plan.md` | Frontend architecture | Before UI component work |

**Decision Context (On-Demand):**

| File | Purpose | When to Read |
|------|---------|-------------|
| `.decisions/prd-context.md` | Business rationale | When questioning requirements |
| `.decisions/tech-decisions.md` | Technology choices | When considering alternatives |

### Workflow Instructions

**Key Guidelines from CLAUDE.md:**

1. **Language Policy:**
   - Communication with user: Polish
   - Code: English (all identifiers, class names, methods)
   - Documentation: English (all .md files, README, comments)
   - Scripts: English (comments, help messages, log messages)
   - Git commits: Conventional Commits format (English)

2. **Code Quality:**
   - Self-documenting code (clear names > comments)
   - Minimize comments (only for complex business logic)
   - TypeScript strict mode (all types explicit)

3. **Testing Policy:**
   - Unit tests before every commit (TDD-like approach)
   - Coverage >70% for new code
   - Integration tests at end of each phase

4. **Git Workflow:**
   - Small, focused commits
   - Test immediately before committing
   - Conventional Commits format
   - Always ask for confirmation before push

### MCP Tools Integration

**Chrome DevTools MCP:**
- Frontend verification after implementation
- Debugging console errors and network requests
- Performance analysis
- Responsive design testing

**MCP Ref (Documentation Search):**
- Search Angular, Spring Boot, Leaflet.js docs
- Used proactively for library-specific details
- Skip for obvious, simple changes

**Sequential Thinking MCP:**
- Complex algorithmic problems
- Multi-step debugging
- System architecture design
- NOT for simple CRUD operations

### Claude Skills

**Available Skills:**

| Skill | Description | Use Cases |
|-------|-------------|-----------|
| `angular-frontend` | Angular 18 standalone components, TypeScript services | Component implementation, routing, services |
| `spring-boot-backend` | Spring Boot 3 REST APIs, JPA entities, security | Controllers, services, repositories |
| `code-review` | Review code for security, performance, quality | Before commits, pull requests |
| `doc-update` | Update documentation files | Cleanup .ai/features/, README updates |
| `frontend-verification` | Verify Angular changes with Chrome DevTools | After UI implementation |
| `project-planning` | Break down features into implementable tasks | Feature planning, task breakdown |

**Using Skills:**

```bash
# Invoke skill from Claude Code
skill: angular-frontend
```

---

## 🤝 GitHub Copilot

### Overview

**GitHub Copilot** provides real-time code completion and inline suggestions during development.

**Model:** GPT-4 (OpenAI)
**IDE:** VS Code (frontend), IntelliJ IDEA (backend)

### Configuration

**Location:** `.github/copilot-instructions.md`

**Key Features:**
- Real-time code completion
- Inline suggestions (context-aware)
- Chat mode for quick questions
- Inline documentation generation

### Project-Specific Instructions

**Architecture Patterns:**

**Frontend (Angular 18):**
- Standalone components only (no NgModules)
- Routing in `app.routes.ts` with flat Routes array
- BehaviorSubject pattern for shared state
- Signals for component-local state
- Tailwind CSS 3.4 utility-first

**Backend (Spring Boot 3):**
- Photo processing pipeline with Spring Integration
- JWT tokens with Spring Security 6
- DTOs for request/response (never expose entities)
- Pagination with `Pageable` → `Page<T>` wrapped in `PageResponse<T>`

**Data Layer:**
- Flyway migrations in `backend/src/main/resources/db/migration/`
- JPA entities with `@ManyToOne`/`@OneToMany` relationships
- Repository pattern: Spring Data JPA

### Use Cases

**Copilot Excels At:**
- Writing boilerplate code (DTOs, entities, simple methods)
- Test scaffolding (unit test templates)
- Inline documentation generation
- Simple refactoring (rename, extract method)
- Quick bug fixes (null checks, validation)

**When to Use Claude Code Instead:**
- Multi-file changes
- Complex architectural decisions
- Feature implementation with dependencies
- Database schema changes
- API specification implementation

### MCP Server Integrations

**Chrome DevTools MCP:**
```bash
# Check if app is running
tail -n 20 scripts/.pid/backend.log
tail -n 20 scripts/.pid/frontend.log

# Start if not running
./scripts/start-dev.sh
```

**Common Use Cases:**
- "Verify login form works on localhost:4200"
- "Gallery photos not loading - diagnose the issue"
- "Analyze gallery performance and suggest optimizations"

**SonarCloud API Integration:**
```bash
# Fetch issues via API
Pobierz z SonarCloud blocker i critical issues

# Fix issues from working file
Napraw błędy z .sonarqube/CURRENT_ISSUES.md
```

---

## 🔬 Gemini CLI

### Overview

**Gemini CLI** (powered by Google Gemini 1.5 Pro) is used for large context analysis tasks where understanding the entire codebase is needed.

**Key Feature:** 2M token context window (entire codebase fits)

### Use Cases

**Codebase Analysis:**
- Finding patterns across all files
- Identifying architectural inconsistencies
- Detecting duplicate code
- Analyzing dependencies and imports

**Large-Scale Refactoring:**
- Planning multi-file refactoring
- Understanding impact of breaking changes
- Reviewing entire feature implementations

**Documentation Generation:**
- Generating comprehensive API documentation
- Creating architecture diagrams from code
- Writing feature specifications based on code

### When to Use

**Use Gemini CLI for:**
- ✅ Analyzing entire codebase (>100 files)
- ✅ Finding all instances of a pattern
- ✅ Planning large refactoring
- ✅ Reviewing architecture consistency

**Use Claude Code for:**
- ✅ Implementing features (actionable tasks)
- ✅ Writing code with file edits
- ✅ Real-time code generation
- ✅ Task execution (git commands, file operations)

---

## 📝 Prompt Engineering

### Structured Prompts

**Best Practice:** Provide context-rich prompts with clear specifications.

**Good Prompt Pattern:**
```
Task: Implement user authentication with JWT tokens

Context:
- Stack: Spring Boot 3 + Spring Security 6
- Database: PostgreSQL with existing users table
- Requirements: See .ai/api-plan.md section 2.1

Acceptance Criteria:
1. POST /api/auth/login endpoint
2. JWT token generation with 24h expiration
3. BCrypt password hashing
4. Unit tests with >70% coverage

Files to Modify:
- backend/src/main/java/com/photomap/controller/AuthController.java
- backend/src/main/java/com/photomap/service/AuthService.java
- backend/src/main/java/com/photomap/security/JwtTokenProvider.java

Follow:
- .ai/tech-stack.md for JWT configuration
- CLAUDE.md for testing policy
```

**Poor Prompt:**
```
Add login
```

### Feature Specifications

**Location:** `.ai/features/`

**Structure:**
```markdown
# Feature: User Authentication

## Status
🔄 IN-PROGRESS

## Requirements
- User can log in with email + password
- JWT token returned on success
- Token expires after 24h

## Acceptance Criteria
- [ ] POST /api/auth/login endpoint
- [ ] Unit tests passing
- [ ] Integration tests passing

## Implementation
### Phase 1: Backend (2h)
- JWT token provider
- Auth controller
- Auth service
- Unit tests

### Phase 2: Frontend (1h)
- Login component
- Auth service
- Route guards
```

### Decision Documentation

**Location:** `.decisions/`

**Purpose:** Document "why" behind technology and architecture choices.

**Example:**
```markdown
# Decision: Why Tailwind 3.x (not 4.x)?

**Date:** 2025-10-15
**Status:** Approved

**Context:**
- Angular 18 is incompatible with Tailwind 4
- Need utility-first CSS framework

**Decision:**
- Use Tailwind 3.4.17
- Do NOT upgrade to Tailwind 4 until Angular 19

**Consequences:**
- ✅ Stable, well-tested
- ✅ Good Angular 18 integration
- ❌ Missing some Tailwind 4 features
```

---

## 🏆 Best Practices

### Context Management

**For Claude Code:**

1. **Start with core docs:**
   - Read `.ai/prd.md`, `.ai/tech-stack.md`, `PROGRESS_TRACKER.md`
   - Read phase-specific plan (`.ai/db-plan.md`, `.ai/api-plan.md`, `.ai/ui-plan.md`)

2. **Monitor token usage:**
   - Use `/compact` when >150k tokens
   - Use `/clean` when switching phases
   - Save progress to `PROGRESS_TRACKER.md` before `/clean`

3. **Provide full context in prompts:**
   - Reference specific files and sections
   - Include acceptance criteria
   - Mention related decisions from `.decisions/`

### Code Review Workflow

**Before Committing:**

1. Review changes: `git diff --cached`
2. Run tests: `./scripts/run-all-tests.sh`
3. Check coverage: >70% for new code
4. Verify conventions: Code in English, docs in English, commits in English

**Before Pushing:**

1. Pre-push hook runs automatically (all tests)
2. If tests fail → fix and retry
3. Never bypass with `--no-verify` for main/master

### AI-Generated Code Review

**Always Review:**
- Security (SQL injection, XSS, hardcoded secrets)
- Error handling (null checks, exception handling)
- Performance (N+1 queries, unnecessary loops)
- Code quality (naming, comments, duplication)

**Red Flags:**
- ❌ Hardcoded passwords or secrets
- ❌ Missing input validation
- ❌ Incomplete error handling
- ❌ Missing tests

### Collaboration Between Tools

**Workflow:**

1. **Plan with Claude Code:**
   - Read specs from `.ai/`
   - Break down feature into tasks
   - Update `PROGRESS_TRACKER.md`

2. **Implement with GitHub Copilot:**
   - Real-time code completion
   - Test scaffolding
   - Inline documentation

3. **Verify with Claude Code:**
   - Code review with `code-review` skill
   - Run tests and verify coverage
   - Update documentation

4. **Analyze with Gemini CLI:**
   - Large-scale pattern analysis
   - Architecture consistency check
   - Refactoring planning

---

## 📚 Related Pages

- [Development Setup](Development-Setup) - Environment configuration
- [Architecture](Architecture) - System architecture overview
- [Contributing](Contributing) - Git workflow, code conventions
- [Testing & Quality](Testing-Quality) - Testing strategy

---

**Last Updated:** 2025-11-10

**Sources:**
- `CLAUDE.md` (Claude Code workflow instructions)
- `.github/copilot-instructions.md` (GitHub Copilot instructions)
- `.ai/prd.md`, `.ai/tech-stack.md` (Core specifications)
- `.decisions/` (Decision rationale)
