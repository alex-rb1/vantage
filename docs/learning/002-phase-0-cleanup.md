# 002: Phase 0 cleanup

## 1. What changed and why

This change tightens the Phase 0 skeleton before its first commit:
- JPA's open-in-view is off, and a CLAUDE.md rule now covers it.
- The comment on the `.env` import now explains why it is optional.
- CI is split into two workflows that use GitHub's native path filters, with actions pinned to commit SHAs.
- The repository is initialized with Git.

Behavior is unchanged, apart from the startup warning being gone and CI being more locked down.

## 2. How it fits together

The most important effect is on how a future request will use the database. Here is a request under each setting, using a hypothetical `GET /api/accounts/1` whose `Account` entity has a lazy `transactions` list:

**With open-in-view ON (the Spring Boot default):**
1. The request arrives. `OpenEntityManagerInViewInterceptor` opens a Hibernate session *before* the controller runs.
2. The controller calls `AccountService.getAccount(1)`. The service's `@Transactional` method loads the `Account`, and its transaction commits. **The session stays open.**
3. Back in the controller, mapping `account.getTransactions()` into a DTO triggers a lazy load. Hibernate quietly runs another SQL query, outside any transaction, using a connection held for the whole request.
4. The session closes only after the response is written.

**With open-in-view OFF (now):**
1–2. Same as above, except no session opens up front, and the session closes when the service's transaction ends.
3. Touching `account.getTransactions()` outside the service now throws `LazyInitializationException`.
4. The fix is the one the CLAUDE.md rule asks for: the service loads everything the response needs (a fetch join, an entity graph, or a DTO projection) and returns it complete.

So the setting doesn't change what works today. It changes where a mistake shows up: as an immediate exception in a test, instead of an N+1 query problem you only notice in production.

## 3. Walkthrough, in reading order

**`backend/src/main/resources/application.yml`**
- `spring.jpa.open-in-view: false`, with a comment explaining the reasoning from section 2.
- The `spring.config.import` comment is rewritten. The value was already `optional:file:../.env[.properties]` from Phase 0, so only the explanation changed. It now says that CI and production have no `.env` file, that `optional:` is what lets the app start there, and that real environment variables win over `.env` values.

**`CLAUDE.md`**: one new bullet under *Backend architecture*, next to the related "controllers stay thin" rules.

**`.github/workflows/backend.yml`** and **`.github/workflows/frontend.yml`** (these replace `ci.yml`)
- `on.push.paths` / `on.pull_request.paths` list the project folder **and the workflow's own file**. Editing `backend.yml` triggers a backend run, so a broken workflow edit is caught right away.
- `push` is limited to `branches: [main]`. Pull requests from any branch still run through the `pull_request` trigger. This way a feature branch with an open PR doesn't run everything twice.
- `permissions: contents: read` gives the workflow's `GITHUB_TOKEN` the least access it needs. The old `changes` job needed `pull-requests: read` for the filter action. Nothing here does.
- `uses: actions/checkout@3d3c42e5… # v7.0.1`: SHA pinning, explained in section 4.
- The steps are the same as before: `./mvnw --batch-mode verify` for the backend, `npm ci` → lint → build for the frontend, with the same caching.

**Git**: `git init -b main`. The branch is named `main` to match the workflows' `branches: [main]`. Nothing is committed yet.

## 4. Design decisions

| Decision | Alternative | Why this one |
|---|---|---|
| **open-in-view off** | Leave the default on | On hides lazy-loading mistakes, holds a DB connection for the whole request, and runs queries outside transactions. Off fits the CLAUDE.md layering, where services own data access. **ADR-worthy:** it changes how every future service returns data. |
| **Two workflow files with native `paths`** | One workflow using `dorny/paths-filter` (the previous version) | Native filters need no third-party code with access to the repo, no extra job, and are easier to read. The trade-off: a skipped workflow reports no status at all. That matters if you later make a check "required" in branch protection (see section 7). |
| **Pin actions to commit SHAs** | Major-version tags like `@v7` | A tag is a movable pointer. If an action's repository were compromised, the attacker could re-point `v7` at malicious code, and your CI would run it with your secrets. A SHA is content-addressed and can't be moved. The `# v7.0.1` comment keeps it readable, and tools like Dependabot understand this format and can update both together. |
| **Workflow triggers on its own file** | Trigger only on project folders | Otherwise a change that breaks only the workflow file would go untested until the next code change. |

## 5. Concepts to study

- **Open Session in View (OSIV)**: a pattern, which Spring Boot enables by default, that keeps the persistence context open for the whole web request. That's what allowed lazy loading in controllers.
- **Lazy loading and `LazyInitializationException`**: Hibernate loads associations only when you first access them, which requires an open session.
- **N+1 query problem**: one query for a list, then one more query per item as lazy relations get touched. OSIV makes it easy to cause without noticing.
- **Supply-chain security / action pinning**: trusting third-party code by immutable hash instead of by a mutable name.
- **Least-privilege tokens**: the `permissions:` block limits what a compromised step could do with `GITHUB_TOKEN`.
- **Git ignore rules**: `.env` is excluded by the root `.gitignore`, and `!.env.example` re-includes the template. `git check-ignore -v <file>` shows which rule matched.

## 6. Try it yourself

1. Run `git check-ignore -v .env frontend/.env.local backend/target` and explain which rule and which `.gitignore` file matched each path.
2. Temporarily set `open-in-view: true`, start the backend, and find the warning in the startup log. Then set it back.
3. Before pushing, predict which workflows would run for a PR that changes only `README.md`, only `frontend/src/App.tsx`, and only `.github/workflows/backend.yml`. Check your predictions after the first push.
4. Look at the `actions/checkout` repository on GitHub and find commit `3d3c42e5…`. Confirm it's the one tagged `v7.0.1`.

## 7. Review carefully

- **Skipped workflows vs required checks.** If you later protect `main` and mark "Backend" as a required check, a PR that only touches the frontend will wait forever for a backend check that never runs. Common fixes are to not mark path-filtered workflows as required, or to add a small always-run "summary" job. Nothing needs doing now; it matters once branch protection exists.
- **Changes outside both folders run no CI.** Changes to `docker-compose.yml` or the root `.gitignore`, for example, trigger neither workflow. That's reasonable today, but `docker-compose.yml` isn't used by CI at all, so nothing would catch a broken compose file.
- **SHA pins don't update themselves.** Without Dependabot or Renovate, these versions stay frozen, including against security fixes. Consider adding `.github/dependabot.yml` for `github-actions` (not done; out of scope).
- **The SHAs were resolved from the GitHub API** for the tags `v7.0.1`, `v6.0.1` and `v7.0.0`. They're correct as of today, but they haven't run on GitHub yet. The first push is the real test.
- **`docs/learning/001-project-skeleton.md` still describes `ci.yml` and `dorny/paths-filter`.** I left it as a historical record of Phase 0. This file supersedes that part.

## 8. Check your understanding

1. With open-in-view off, where exactly does the database session end for a request, and what happens if a controller touches a lazy relation after that point?
2. Why does each workflow list its own file in `paths`?
3. What concrete attack does pinning to a SHA prevent that pinning to `@v7.0.1` does not?
4. The `.env` import already had `optional:` before this change. What would happen in CI if it didn't?
5. A PR changes both `backend/pom.xml` and `frontend/package.json`. Which workflows run, and do they run in parallel?

<details>
<summary>Answers</summary>

1. When the outermost `@Transactional` service method returns and its transaction completes. Accessing an uninitialized lazy relation after that throws `LazyInitializationException`, because there's no open session to load it with.
2. So that a change to the workflow itself is tested right away. Otherwise a broken workflow edit would only surface on the next unrelated code change.
3. Tags are mutable: anyone with write access to the action's repository (including an attacker who compromised it) can move `v7.0.1` to point at different code. A commit SHA identifies exact content and can't be re-pointed, so your CI keeps running the code you reviewed.
4. Spring Boot would fail at startup with a `ConfigDataResourceNotFoundException`, because a non-optional import must exist. The integration tests would never get to run.
5. Both. They're separate workflows, each triggered by its own path filter, and GitHub runs them in parallel on separate runners.

</details>
