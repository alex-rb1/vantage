# 005: Pinning PostgreSQL and guarding against image drift

## 1. What changed and why

This change closes the two gaps flagged in [004](004-dependabot.md). First, PostgreSQL is now pinned to the exact release `postgres:18.6-alpine` instead of `18-alpine`, so Dependabot can see minor releases and propose them as PRs. Second, a new test, `PostgresImageConsistencyTest`, fails if the Testcontainers image and the `docker-compose.yml` image ever differ, and the Backend workflow now runs on compose-only changes, so that test runs on Dependabot's PRs.

## 2. How it fits together

Here's what happens when PostgreSQL 18.7 comes out:

1. **Dependabot opens a PR.** The weekly `docker-compose` run in `.github/dependabot.yml` sees `postgres:18.6-alpine`, finds `18.7-alpine`, and opens a PR (in the `docker-compose-minor-and-patch` group). The PR changes **only** `docker-compose.yml`, because Dependabot can't see Java code.
2. **The Backend workflow triggers.** `.github/workflows/backend.yml` now lists `docker-compose.yml` under `paths`, so the PR starts `./mvnw verify`. Before this change, no workflow ran at all.
3. **The drift test runs.** Surefire runs `PostgresImageConsistencyTest.testcontainersImageMatchesDockerCompose()`:
   - `readComposePostgresImage()` opens `../docker-compose.yml`. Tests run from `backend/`, so `..` is the repo root.
   - SnakeYAML parses the file into nested `Map`s, and the method walks `services` → `postgres` → `image` to get `"postgres:18.7-alpine"`.
   - It compares that value with `TestcontainersConfiguration.POSTGRES_IMAGE` (`"postgres:18.6-alpine"`).
4. **CI fails, with instructions.** The assertion fails with:
   ```
   PostgreSQL image mismatch:
     docker-compose.yml:                         postgres:18.7-alpine
     TestcontainersConfiguration.POSTGRES_IMAGE: postgres:18.6-alpine
   Update both to the same tag so tests run against the database version used in development.
   ```
5. **You finish the PR.** You push a one-line change to the Dependabot branch that updates `POSTGRES_IMAGE`. CI runs again: the drift test passes, and `ApplicationIntegrationTest` now starts a real 18.7 container. That's the real evidence that the upgrade works. Then you merge.

A red CI here is **the intended outcome**. It turns "someone must remember to update the test image" into "the PR can't go green until they do".

## 3. Walkthrough, in reading order

**`docker-compose.yml`**: `image: postgres:18.6-alpine`. The comment now explains the exact pin (every environment runs the same release, and Dependabot can see minor releases). It keeps the note that major upgrades are deliberate, and names the constant and the test that must stay in sync.

**`backend/src/test/java/com/vantage/TestcontainersConfiguration.java`**
- `static final String POSTGRES_IMAGE = "postgres:18.6-alpine";` is the single Java-side source of truth, as you asked. It's package-private (no `public`), because only tests in `com.vantage` need it.
- `postgresContainer()` now uses `DockerImageName.parse(POSTGRES_IMAGE)` instead of a string literal.

**`backend/src/test/java/com/vantage/PostgresImageConsistencyTest.java`**
- It's a plain JUnit test with no `@SpringBootTest` and no Docker, so it runs in milliseconds and doesn't need Spring.
- `COMPOSE_FILE = Path.of("..", "docker-compose.yml")` is relative to the working directory. The comment says why that's the backend module.
- `readComposePostgresImage()` parses real YAML and navigates the structure. The `@SuppressWarnings("unchecked")` covers the casts: SnakeYAML returns an untyped `Map<String, Object>`, and we know the compose file's shape. The inner `assertThat(image)...isNotBlank()` gives a clear message if someone renames the service or removes `image:`.
- `withFailMessage(...)` with a Java text block produces the aligned, readable message shown above.

**`.github/workflows/backend.yml`**: `docker-compose.yml` was added to both the `push` and `pull_request` path lists, with a comment explaining why, and the header comment was updated.

**`.github/dependabot.yml`**: the comment on the `docker-compose` entry now describes the workflow in section 2: the PR fails until the constant is updated, and you push that fix to the Dependabot branch.

## 4. Design decisions

| Decision | Alternative | Why this one |
|---|---|---|
| **Pin `18.6-alpine`** (your spec) | `18-alpine` (floating) | A floating tag can mean 18.6 on your laptop and 18.9 in CI, depending on when each machine last pulled. An exact tag is reproducible, and upgrades become reviewed PRs instead of silent pulls. The cost is one PR per PostgreSQL minor release, about every three months. |
| **Keep the Alpine suffix without the Alpine version** (`18.6-alpine`, not `18.6-alpine3.24`) | Pin down to the Alpine release | Docker Hub also publishes `18.6-alpine3.24`. Pinning that deep would bring Dependabot noise for OS-level changes that don't matter here. Pinning a digest (`@sha256:…`) would be the fully immutable option, but it's unreadable, and it wasn't asked for. |
| **A test that detects drift** (your spec) | Make both read from one file, e.g. have the test load the image from `docker-compose.yml` directly | One source would remove the problem entirely. But Testcontainers would then depend on parsing a dev-tooling file at runtime, and the Java constant is easier to find. Detecting drift keeps each side simple and fails loudly. |
| **Parse YAML with SnakeYAML** | Regex on `image: postgres:(\S+)` | A regex can match commented-out lines or the wrong service. Parsing understands the structure. SnakeYAML is already a compile dependency of Spring Boot (it reads `application.yml`), so **no new dependency was added**. |
| **Don't redeclare SnakeYAML in `pom.xml`** | Declare it explicitly with `<scope>test</scope>` | A test-scoped declaration would *override* the transitive compile scope (Maven's "nearest wins" rule), remove SnakeYAML from the runtime classpath, and break loading `application.yml`. Leaving it transitive is the correct choice. |
| **A plain unit test, separate from `ApplicationIntegrationTest`** | Add an assertion to the integration test | This is a config consistency check, not app behavior. Keeping it separate keeps it fast, gives it a precise failure name, and doesn't depend on Docker. |

No ADR is needed. This follows from the Flyway/Testcontainers choices, but if you write a "Testcontainers instead of H2" ADR later, mention the drift test there.

## 5. Concepts to study

- **Reproducible environments**: exact version pins make development, CI and tests run identical software. The floating `18-alpine` tag was the opposite.
- **Docker image tags vs digests**: tags like `18.6-alpine` can be re-pushed, for example to rebuild on a patched Alpine. A digest is content-addressed and never changes. This is the same idea as action tags vs SHAs in [002](002-phase-0-cleanup.md).
- **Fitness functions / consistency tests**: tests that enforce a project rule ("these two values must match") rather than business behavior. `PostgresImageConsistencyTest` is one.
- **Maven dependency scopes and mediation**: `compile` vs `test` scope, and how the nearest declaration wins. That's why SnakeYAML isn't redeclared.
- **Working directory in tests**: relative paths like `../docker-compose.yml` resolve against the process's working directory, which Surefire sets to the module directory.
- **PostgreSQL versioning**: since version 10, the first number is the major version (it changes the on-disk format, so upgrading needs `pg_upgrade`). The second number is a minor release (bug and security fixes; it runs on the same data directory). That's why the 18.6 container reused the existing volume without trouble.

## 6. Try it yourself

1. Change `POSTGRES_IMAGE` (not the compose file) to `postgres:18.4-alpine` and run `./mvnw test -Dtest=PostgresImageConsistencyTest`. Before you run it, predict which value appears on which line of the message. Then restore it.
2. Comment out the `image:` line in `docker-compose.yml` and run the same test. Which assertion fails, and is the message helpful? What happens if you rename the `postgres` service instead? Restore it afterward.
3. Run `./mvnw test -Dtest=PostgresImageConsistencyTest` from the **repository root** using `-f backend/pom.xml`. Does it still find the compose file? Explain why.
4. Run `docker compose exec postgres psql -U vantage -d vantage -c 'select version()'` and confirm the running server is 18.6.

## 7. Review carefully

- **Red CI on Dependabot compose PRs is intended.** Every PostgreSQL minor bump will fail CI until you push the constant change. That's the design, but it means these PRs are never "just merge".
- **An NPE is possible if the compose structure changes.** If `services` or `services.postgres` is missing, `readComposePostgresImage()` throws a `NullPointerException` rather than a friendly message. Only a missing or blank `image` gets a custom message. The test still fails either way, and the stack trace points at the right line, but you could make it friendlier.
- **The working directory is assumed.** The test relies on Surefire running with `backend/` as the working directory. That's Maven's default, and CI uses it. Running the test from an IDE configured with the repo root as the working directory would fail with `NoSuchFileException` (exercise 3 explores the `-f` case).
- **The two "18.x" facts are verified.** Docker Hub lists `18.6-alpine` as the newest 18 tag (there is no `18.5` tag). The local `postgres:18-alpine` image already reported `PG_VERSION=18.6`, so the pin changed nothing for your existing data. The compose container was recreated and is healthy.
- **Verification done:** `./mvnw verify` passes (3 tests). Changing only the compose tag to `18.7-alpine` made the drift test fail with the message above. The file was then restored from a backup and confirmed byte-identical.

## 8. Check your understanding

1. Why does pinning `18.6-alpine` let Dependabot propose minor updates when `18-alpine` did not?
2. A Dependabot PR bumps compose to `18.7-alpine`. Walk through everything that happens until it's safe to merge.
3. Why would adding SnakeYAML to `pom.xml` with `<scope>test</scope>` break the application?
4. The drift test passes, and both values say `18.6-alpine`. Is it guaranteed that CI and your laptop run byte-identical PostgreSQL images? Why or why not?
5. Why is `PostgresImageConsistencyTest` not annotated with `@SpringBootTest`?

<details>
<summary>Answers</summary>

1. `18-alpine` contains only a major version, so the only "newer version" Dependabot could see was a new major (`19-alpine`). `18.6-alpine` exposes the minor version, so `18.7-alpine` is visible as a minor update.
2. The PR changes only `docker-compose.yml`. The Backend workflow triggers because of the new path filter. `PostgresImageConsistencyTest` fails with the mismatch message. You push a commit setting `POSTGRES_IMAGE` to `postgres:18.7-alpine`. CI runs again, the drift test passes, and `ApplicationIntegrationTest` runs the app and migrations against a real 18.7 container. Then you merge.
3. Maven's dependency mediation uses the nearest declaration, and your direct declaration is nearer than the transitive one through `spring-boot-starter`. So SnakeYAML would become test-only, and at runtime Spring Boot couldn't parse `application.yml`.
4. No. `18.6-alpine` is a tag, and the PostgreSQL maintainers can re-push it (for example, when rebuilding on a newer Alpine release). Machines that pulled at different times could have different builds of the same PostgreSQL version. Only a digest (`@sha256:…`) guarantees identical images.
5. It doesn't need Spring or a database; it only reads a file and a constant. Starting the application context would make it slower and dependent on Docker for no benefit.

</details>
