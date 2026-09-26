# ADR 0002: Vite dev proxy instead of CORS in development

**Status:** Accepted | **Date:** 2026-09-26

## Context

In development the frontend runs on `localhost:5173` (Vite) and the backend on `localhost:8080` (Spring Boot). Different ports are different origins, so the browser's same-origin policy would block the frontend from reading the backend's responses.

## Decision

The Vite dev server proxies backend paths to port 8080 (`server.proxy` in `frontend/vite.config.ts`; today only `/actuator`). The frontend calls the backend only through relative URLs such as `/actuator/health`, so the browser sees a single origin.

## Alternatives considered

- **Configure CORS on the backend.** This works, but it adds security configuration that must be kept correct and risks being made too permissive. It also gets more complex once cookies or other credentials are involved.
- **Serve the built frontend from Spring during development.** This gives a single origin too, but loses Vite's fast hot reload.

## Consequences

- The proxy exists only in development. `npm run build` produces static files with no proxy.
- Production must also serve the frontend and backend from the same origin, for example through a reverse proxy or by having Spring serve the static files. That choice is made when deployment is set up.
- Same-origin keeps cookie-based authentication simple in Phase 2.
- The frontend must never hardcode backend hosts. Each new backend path prefix must be added to the proxy.
