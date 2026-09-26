# Vantage

Vantage is a personal finance app built around **review sessions**: structured
reviews of your financial activity over a chosen period, later enhanced with
AI-assisted insights. It is a Spring Boot + PostgreSQL backend with a React +
TypeScript frontend.

## Prerequisites

- Java 21 (Maven is not required; the backend uses the Maven wrapper)
- Node.js 24 and npm
- Docker (Docker Desktop or equivalent), for the database and for tests

## Run locally

1. **Configure environment.** Copy the example file and set a password:

   ```sh
   cp .env.example .env
   ```

2. **Start the database** (PostgreSQL 18, data kept in a named Docker volume):

   ```sh
   docker compose up -d
   ```

3. **Start the backend** on http://localhost:8080. It reads `../.env`
   automatically, and Flyway applies migrations on startup:

   ```sh
   cd backend
   ./mvnw spring-boot:run
   ```

   Check it: http://localhost:8080/actuator/health

4. **Start the frontend** on http://localhost:5173. It shows whether the
   backend is up:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

## Tests

Backend tests start their own throwaway PostgreSQL with Testcontainers, so
Docker must be running, but `docker compose` and `.env` are not needed:

```sh
cd backend
./mvnw verify
```

Frontend lint and build:

```sh
cd frontend
npm run lint
npm run build
```
