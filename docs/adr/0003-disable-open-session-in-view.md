# ADR 0003: Disable Open Session in View

**Status:** Accepted | **Date:** 2026-09-26

## Context

Spring Boot enables Open Session in View (`spring.jpa.open-in-view`) by default, and logs a warning at startup when it is left unset. It keeps the Hibernate session open until the HTTP response is fully written, so lazy-loaded data can still be fetched after the service returns, for example in a controller or during JSON serialization.

## Decision

`spring.jpa.open-in-view: false`. All data a response needs is loaded inside the service layer, within a transaction. The rule is recorded in CLAUDE.md.

## Alternatives considered

- **Leave it enabled.** More convenient, because lazy loading "just works" anywhere. But it hides extra queries (the N+1 problem), and once the request touches the database it holds that connection until the response is written. It also lets data access leak into controllers and serialization.

## Consequences

- Accessing an unloaded lazy association outside the service layer throws `LazyInitializationException`. Services must fetch deliberately (fetch joins, `@EntityGraph`, or DTO projections) and return DTOs.
- Database access stays visible and contained in services, matching the Controller → Service → Repository layering in CLAUDE.md.
- There are no entities yet, so this has no effect on current code. It sets the rule before the first entity is written.
