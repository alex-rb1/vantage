# Vantage

Vantage is a full-stack personal finance app built around **review sessions**: structured reviews of a user's financial activity over a chosen period, later enhanced with AI-assisted insights.

This is a learning project. The developer designs features in a separate planning conversation and uses Claude Code to implement them, then reviews the code closely. Optimize for code that is **clear, conventional, and easy to learn from**, not clever.

## Stack

- **Backend:** Java 21, Spring Boot 4.x, Maven, Spring Web, Spring Data JPA (Hibernate), Spring Security, Bean Validation
- **Database:** PostgreSQL, schema managed by Flyway
- **Frontend:** React + TypeScript (Vite)
- **Node:** version is declared in `.nvmrc`; `@types/node`'s major version must match it.
- **Testing:** JUnit 5, AssertJ, Mockito, Testcontainers (PostgreSQL)
- **Infra:** Docker Compose for local development, GitHub Actions for CI

## Repository layout

```
/backend        Spring Boot application
/frontend       React + TypeScript application
/docs/adr       Architecture Decision Records
docker-compose.yml
```

## Commands

- Start local database: `docker compose up -d`
- Run backend: `cd backend && ./mvnw spring-boot:run`
- Run backend tests: `cd backend && ./mvnw test`
- Run frontend: `cd frontend && npm run dev`

(Update this section if commands change.)

## Backend architecture

- **Package by feature**, not by layer: `com.vantage.auth`, `com.vantage.account`, `com.vantage.transaction`, `com.vantage.budget`, `com.vantage.goal`, `com.vantage.review`, plus `com.vantage.common` for shared code.
- Inside each feature: `Controller` → `Service` → `Repository`. Controllers stay thin (HTTP in/out only). Business logic lives in services.
- **Never expose JPA entities from controllers.** Use request/response DTOs (Java records) and map explicitly.
- Validate all input with Bean Validation on request DTOs.
- Errors use one consistent JSON shape (RFC 9457 Problem Details) via a global `@RestControllerAdvice`.
- Use constructor injection only. No field injection.
- open-in-view is disabled. All data needed for a response must be loaded inside the service layer.

## Money rules (non-negotiable)

- **Never use `float` or `double` for money.** Use `BigDecimal` in Java and `NUMERIC(19,4)` in PostgreSQL.
- Every monetary amount is stored with a currency code (ISO 4217, e.g. `CAD`).
- Never mix currencies in arithmetic without an explicit conversion step.
- Rounding is explicit: always specify scale and `RoundingMode` (default `HALF_EVEN`).
- On the frontend, amounts are sent and received as strings, never JS numbers.

## Data integrity rules

- Timestamps are stored in UTC (`TIMESTAMPTZ`, `Instant` in Java). Transaction dates that are calendar dates use `LocalDate`.
- Financial records are not silently edited or hard-deleted. Prefer soft deletes and record changes in an audit log.
- Operations that could be repeated (e.g. CSV import) must be idempotent: importing the same data twice must not create duplicates.
- **Never modify a Flyway migration that has already been committed.** Always add a new migration.

## Security rules

- Passwords are hashed with a strong adaptive algorithm (BCrypt or Argon2 via Spring Security). Never log or return them.
- **Every query for user-owned data must be scoped to the authenticated user.** A request for another user's resource returns 404, not 403 (don't reveal it exists).
- Never log secrets, tokens, passwords, or full financial details.
- Secrets come from environment variables, never committed to the repo.

## Testing rules

- Business logic (money calculations, budgets, review analysis) gets unit tests, including edge cases (zero, negative, rounding, empty periods).
- Every endpoint gets an integration test using Testcontainers against real PostgreSQL. No H2.
- Every endpoint touching user-owned data has a test proving another user cannot access it.
- Test names describe behavior, e.g. `returnsNotFoundWhenAccountBelongsToAnotherUser`.
- All tests must pass before a task is considered done.

## How to work in this repo

- Implement **only** what the task asks for. If you think something else should change, mention it at the end instead of doing it.
- Do not add new dependencies without saying so and explaining why.
- Prefer standard, widely used Spring patterns over custom abstractions.
- Add short comments explaining **why** for any non-obvious decision. Don't comment what the code obviously does.
- When a task involves a significant design decision, note it so an ADR can be written in `docs/adr/`.
- At the end of every implementation task, use the `explain-changes` skill to write a learning walkthrough in `docs/learning/`.