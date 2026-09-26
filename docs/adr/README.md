# Architecture Decision Records

An Architecture Decision Record (ADR) is a short document that captures one significant technical decision: the situation that forced it, what was chosen, what else was considered, and what follows from it. Vantage uses ADRs so that the reasoning behind the design survives alongside the code. Code shows *what* was built, but not *why*, or which options were rejected. When a decision is revisited, the old ADR is not edited; a new ADR supersedes it and the old one's status is updated to point to it. New ADRs start from [template.md](template.md) and take the next number in sequence.

| Number | Title | Status |
|---|---|---|
| [0001](0001-flyway-owns-database-schema.md) | Flyway owns the database schema | Accepted |
| [0002](0002-vite-dev-proxy-instead-of-cors.md) | Vite dev proxy instead of CORS in development | Accepted |
| [0003](0003-disable-open-session-in-view.md) | Disable Open Session in View | Accepted |
