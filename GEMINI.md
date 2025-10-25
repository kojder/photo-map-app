# Project Overview

This is a full-stack photo mapping application. The backend is a Spring Boot application that manages photos, extracts EXIF data, and serves a REST API. The frontend is an Angular application that allows users to upload photos, view them on a map, and browse a gallery.

**Backend:**
*   **Framework:** Spring Boot 3
*   **Language:** Java 17
*   **Database:** PostgreSQL 15 with Flyway for migrations
*   **Security:** Spring Security with JWT authentication

**Frontend:**
*   **Framework:** Angular 18
*   **Language:** TypeScript 5
*   **Styling:** Tailwind CSS 3
*   **Mapping:** Leaflet.js

# Current Status

The project is in a very advanced state. According to `PROGRESS_TRACKER.md`, Phases 1 through 4 are complete. The core MVP is functional.

*   **Last Completed:** Phase 4: Frontend - Gallery & Map.
*   **Next Action:** Manual testing of the complete E2E flow, followed by optional implementation of Phase 5 (Admin Panel).

The `PROGRESS_TRACKER.md` file is the single source of truth for the project's status.

# Workflow and Project Guidelines

These guidelines are adapted from `CLAUDE.md` and are essential for working on this project.

## 1. Core Documentation

Before starting any implementation, it is crucial to understand the project context.

*   **ALWAYS READ FIRST**:
    *   `PROGRESS_TRACKER.md`: To understand the current status, what was last completed, and what the next action is.
    *   `.ai/prd.md`: To understand the MVP requirements (WHAT we are building).
    *   `.ai/tech-stack.md`: To understand the technology specifications (HOW to implement).

*   **READ FOR SPECIFIC TASKS**:
    *   `.ai/db-plan.md`: When working on database schema or JPA entities.
    *   `.ai/api-plan.md`: When working on the backend API (endpoints, DTOs).
    *   `.ai/ui-plan.md`: When working on the frontend (components, services).

*   **READ ON-DEMAND**:
    *   `.decisions/`: Use the files in this directory if you need to understand the rationale behind a technical or product decision (e.g., "why was library X chosen over Y?").

## 2. Implementation Process

1.  **Understand the Goal**: Start by reading the core documentation mentioned above to have a full picture.
2.  **Follow the Plan**: Always implement according to the current phase outlined in `PROGRESS_TRACKER.md` or a specific instruction from the user.
3.  **Implement**: Write code following the project conventions.
4.  **Test**: Follow the testing policy before committing.
5.  **Commit**: Follow the Git workflow.
6.  **Update Tracker**: After a task is complete and verified, update `PROGRESS_TRACKER.md`.
7.  **Wait for Verification**: Do not proceed to the next major task or phase without user confirmation.

## 3. Development Environment

The project includes scripts to manage the development environment.

*   **Start Development Servers (Backend + Frontend):**
    ```bash
    ./scripts/start-dev.sh
    ```
*   **Stop Development Servers:**
    ```bash
    ./scripts/stop-dev.sh
    ```
*   **Database:** The PostgreSQL database is managed via `docker-compose.yml`. It should be started separately with `docker-compose up -d`. The dev scripts can also manage it if passed the `--with-db` flag.
*   **Logs:** Logs are available in `scripts/.pid/backend.log` and `scripts/.pid/frontend.log`.

## 4. Key Technical Guidelines

*   **Angular**: Use **Standalone Components**. Do not create `NgModules`.
*   **State Management (Frontend)**: Use the `BehaviorSubject` pattern in services for shared state. Do not use NgRx.
*   **Styling**: Use **Tailwind CSS 3.x**. Do not use version 4.x as it is incompatible with the current Angular setup.
*   **Test IDs**: All interactive UI elements must have a `data-testid` attribute for testing purposes.

## 5. Testing Policy

*   **Unit Tests (TDD-like approach)**:
    *   **When**: Before every commit.
    *   **What**: All service methods, utility classes, and complex business logic.
    *   **Coverage**: Aim for >70% for new code.
    *   **Commands**:
        *   Backend: `./mvnw test`
        *   Frontend: `ng test`
*   **Integration Tests**:
    *   **When**: At the end of each major phase.
    *   **What**: Full flow tests (e.g., API endpoints with a real database connection).

## 6. Git Workflow

*   **Commit Strategy**: Make small, focused commits. Test changes before committing.
*   **Commit Messages**: Use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format.
    *   Example: `feat(auth): implement JWT token validation`
*   **CRITICAL - Review Before Commit**:
    1.  Make changes to files.
    2.  Stage the changes (`git add <files>`).
    3.  Use `git status` and `git diff --cached` to review the changes.
    4.  Propose the commit to the user. The user will approve or deny the commit. **DO NOT** commit without user approval.

# Building and Running

The recommended way to run the application for development is to use the scripts in the `scripts/` directory.

### Recommended Workflow

1.  **Start the database (once per session):**
    ```bash
    docker-compose up -d
    ```

2.  **Start the backend and frontend:**
    ```bash
    ./scripts/start-dev.sh
    ```

3.  **Stop the backend and frontend:**
    ```bash
    ./scripts/stop-dev.sh
    ```

### Manual Commands

For more granular control, you can still use the individual commands for each part of the application.

**Backend:**
*   **Run:** `cd backend && ./mvnw spring-boot:run`
*   **Test:** `cd backend && ./mvnw test`
*   **Build:** `cd backend && ./mvnw clean package`

**Frontend:**
*   **Run:** `cd frontend && npm start`
*   **Test:** `cd frontend && npm test`
*   **Build:** `cd frontend && npm run build`
