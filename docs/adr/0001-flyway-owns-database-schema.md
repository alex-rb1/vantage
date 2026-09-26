# ADR 0001: Flyway owns the database schema

**Status:** Accepted | **Date:** 2026-09-26

## Context

Vantage's database will hold users' financial data. Its schema will change many times as features are added, and each change has to be safe for existing data and reviewable before it runs. We need one clear answer to the question "how does the schema change?"

## Decision

Versioned SQL migrations run by Flyway are the only way the schema changes. They live in `backend/src/main/resources/db/migration` and are applied automatically at startup; `V1__baseline.sql` establishes the baseline. Hibernate runs with `spring.jpa.hibernate.ddl-auto: validate`: at startup it checks that the entities match the schema, but it never modifies the schema.

## Alternatives considered

- **Hibernate `ddl-auto: update` or `create`.** Convenient, since the schema follows the entity classes automatically. But the changes are generated implicitly, so they can't be reviewed and leave no history, and they can make destructive or surprising changes to real data.
- **Liquibase.** Offers more, such as rollbacks and database-agnostic changelogs, but is more complex. Vantage uses a single database (PostgreSQL), so plain SQL with Flyway is simpler and sufficient.

## Consequences

- Migrations are written by hand in SQL, and every schema change appears in code review.
- An applied migration is never edited: Flyway stores a checksum of each one and fails startup if the file changes. Changes always go in a new migration (this is also a CLAUDE.md rule).
- If the entities and the schema disagree, the application fails fast at startup instead of at the first query that hits the mismatch.
