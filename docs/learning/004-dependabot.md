# 004: Dependabot

## 1. What changed and why

`.github/dependabot.yml` now tells GitHub's Dependabot to check four dependency ecosystems every week: the GitHub Actions in the workflows, the Maven dependencies in `backend/`, the npm packages in `frontend/`, and the PostgreSQL image in `docker-compose.yml`. It then opens pull requests when newer versions exist. Before this change, every version in the repo was frozen until someone noticed. That included the SHA-pinned actions from [002](002-phase-0-cleanup.md), which would never have received security fixes.

## 2. How it fits together

Here is one weekly run, using the Maven entry as the example:

1. **GitHub reads the config.** Once `.github/dependabot.yml` is on the default branch (`main`), GitHub schedules each `updates` entry. `schedule.interval: weekly` means one run per ecosystem per week.
2. **Dependabot scans the manifest.** For `package-ecosystem: maven` with `directory: /backend`, it reads `backend/pom.xml`. Most dependencies there have no `<version>`, because their versions come from the `spring-boot-starter-parent` BOM. So in practice the main thing Dependabot bumps is the **parent version** (e.g. `4.1.1` → `4.1.2`), which moves Spring, Hibernate, Flyway, Testcontainers and the rest together.
3. **It classifies each update by SemVer**: `4.1.1 → 4.1.2` is a patch, `4.1.1 → 4.2.0` is a minor, and `4.x → 5.0.0` is a major.
4. **It sorts updates into groups.** The group `maven-minor-and-patch` matches `patterns: ["*"]` (every dependency) *and* `update-types: [minor, patch]`. All matching updates go into **one** PR. A major update matches no group, and GitHub's rule is that ungrouped updates get **individual PRs**.
5. **It opens the PRs.** Each PR changes the manifest (and the lockfile, for npm). Opening a PR triggers the normal CI: `backend.yml` runs `./mvnw verify` because the PR touches `backend/**`. You review the PR, look at CI, and merge or close it.

For **GitHub Actions**, step 4 has one extra detail. The workflows reference actions as `uses: actions/checkout@3d3c42e5… # v7.0.1`. Dependabot resolves the new release's tag to its commit SHA, replaces the SHA, and updates every mention of the old version in the trailing comment. Pinning stays intact, and the comment stays accurate.

## 3. Walkthrough, in reading order

**`.github/dependabot.yml`**, top to bottom:
- `version: 2` is the config file format version. It is always 2.
- The top comment explains the grouping choice, as requested.
- **`github-actions`, `directory: /`**: for this ecosystem, `/` means "look in `.github/workflows/`". It covers both `backend.yml` and `frontend.yml`. The comment above it records the SHA-plus-comment behavior.
- **`maven`, `directory: /backend`** and **`npm`, `directory: /frontend`**: `directory` is where the manifest lives (`pom.xml`, `package.json`/`package-lock.json`). In a monorepo, each project gets its own entry.
- **`docker-compose`, `directory: /`**: scans `docker-compose.yml` at the root for `image:` lines. Its comment flags the one image it *can't* see (section 7).
- **Each `groups:` block** has a name (it shows up in the PR title, e.g. "Bump the npm-minor-and-patch group…"), plus `patterns: ["*"]` and `update-types: [minor, patch]`.

There are no other changes in this task.

## 4. Design decisions

| Decision | Alternative | Why this one |
|---|---|---|
| **Group minor + patch per ecosystem; majors separate** (your spec) | No grouping, one PR per dependency | npm alone could open a dozen PRs a week. Minor and patch releases promise backward compatibility, so one PR per ecosystem is reviewable, and CI checks them together. Majors can break things, and a separate PR lets you read one changelog, fix one breakage, or close just that one. |
| **Groups per ecosystem**, not one multi-ecosystem group | GitHub's multi-ecosystem groups (one PR for everything) | A failing backend update would block unrelated frontend updates in the same PR. Separate PRs also match the separate CI workflows. |
| **Explicit `patterns: ["*"]`** | Only `update-types` | The docs don't clearly say whether `patterns` can be left out. `["*"]` is the form GitHub's examples use, and it states "all dependencies" explicitly. |
| **`docker-compose` ecosystem** | The `docker` ecosystem | The `docker` ecosystem reads `Dockerfile`s, and there isn't one. The GitHub docs list `docker-compose` as a separate, supported ecosystem for version updates. |
| **Weekly** (your spec) | Daily | Weekly is often enough for a project this size and keeps the review load predictable. Security alerts are a separate mechanism and aren't delayed by the version-update schedule. |

This probably doesn't need an ADR on its own. If you later write one about supply-chain security (SHA pinning plus Dependabot), this config would be part of it.

## 5. Concepts to study

- **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`, where only a major release is allowed to break compatibility. It's the basis of the grouping rules.
- **Dependency drift**: pinned versions fall behind and pick up known vulnerabilities over time. Automated update PRs counter this.
- **BOM / parent POM version management**: `spring-boot-starter-parent` sets versions for all Boot-managed libraries. That's why most Maven updates arrive as a single parent bump.
- **Lockfiles**: `package-lock.json` pins exact npm versions. Dependabot updates it along with `package.json`, and `npm ci` in CI installs exactly what's in the lockfile.
- **Supply-chain security**: SHA pinning (from 002) prevents code from changing silently. Dependabot makes sure pinned code still gets updated, through reviewed PRs.

## 6. Try it yourself

1. After pushing to GitHub, open **Insights → Dependency graph → Dependabot** and find when each of the four ecosystems was last checked. Trigger a manual check for one of them.
2. Predict what Dependabot will do when PostgreSQL 19 is released: which ecosystem, grouped or separate, and what change to `docker-compose.yml`. Then read the comment in `docker-compose.yml` and explain why merging that PR isn't enough on its own.
3. When the first grouped npm PR arrives, open its description and find how Dependabot lists each dependency and its changelog.
4. In a scratch branch, change `actions/checkout` to an older SHA with its matching older version comment. Push it and watch the SHA and the comment in the Dependabot PR that follows.

## 7. Review carefully

- **Testcontainers image not covered.** `postgres:18-alpine` in `TestcontainersConfiguration.java` is a string in Java code, and Dependabot can't see it. When Dependabot bumps `docker-compose.yml`, you must update the test image by hand, or tests and development will silently use different database versions. The comment in `dependabot.yml` says this. Keeping one source of truth for the version would be a separate change.
- **What the Postgres tag means for updates.** The tag `18-alpine` contains only a major version. I expect Dependabot to propose only major bumps (`19-alpine`) for it, and never minor or patch ones. The image's minor and patch updates arrive when you `docker compose pull`, not through PRs. I'm fairly but not fully sure about Dependabot's tag parsing here; the first real PR will confirm.
- **PostgreSQL major upgrades need more than a merge.** A major version changes the on-disk format, so an existing `postgres-data` volume won't start on the new version without an upgrade step (`pg_upgrade`, or dump and restore). Treat that PR as a planned task.
- **Not covered by Dependabot:** `node-version: 24` and `java-version: '21'` in the workflows (these are action inputs, not dependencies), and the Maven wrapper's Maven version in `.mvn/wrapper/maven-wrapper.properties`. I didn't find clear documentation of wrapper support, so I'm not claiming it.
- **Known edge case with SHA pins.** Dependabot issue [#14716](https://github.com/dependabot/dependabot-core/issues/14716) reports that if the *current* SHA isn't exactly a tagged commit, Dependabot may move to the branch HEAD and leave the comment stale. All three current pins are the exact commits the release tags point to (checked in 002), so this shouldn't apply. Still, glance at the comment on the first Actions PR.
- **Open PR limit.** Dependabot opens at most 5 version-update PRs per ecosystem at a time by default. With grouping, you're unlikely to hit it.
- **Not verified locally.** Dependabot runs only on GitHub, so nothing here was run. I checked that the YAML parses and that each key matches GitHub's current docs:
  - [supported ecosystems](https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories)
  - [options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference)
  - [the SHA-comment changelog](https://github.blog/changelog/2022-10-31-dependabot-now-updates-comments-in-github-actions-workflows-referencing-action-versions/)

## 8. Check your understanding

1. A week brings three npm updates: two patches and one major. How many PRs does Dependabot open, and why?
2. Why does the Maven entry mostly produce PRs that change a single line in `pom.xml`?
3. What exactly changes in `backend.yml` when Dependabot updates `actions/setup-java`?
4. Dependabot opens a PR bumping `postgres:18-alpine` to `19-alpine` in `docker-compose.yml`. What CI runs on that PR, and what evidence do you have that the upgrade is safe?
5. What would go wrong if the npm entry used `directory: /` instead of `/frontend`?

<details>
<summary>Answers</summary>

1. Two: one grouped PR (`npm-minor-and-patch`) holding both patches, and one PR for the major update, which matches no group.
2. Nearly all backend dependencies get their versions from `spring-boot-starter-parent`. One parent version bump updates all of them.
3. The 40-character SHA after `@` changes to the new release's commit, and the version in the trailing comment (e.g. `# v6.0.1`) changes to the new tag.
4. None. The PR touches only `docker-compose.yml`, which matches neither workflow's `paths`, so no evidence comes from CI. Even if you ran the tests, they use the Testcontainers image, which Dependabot didn't change. And the local `postgres-data` volume holds version 18 data files that 19 can't open without an upgrade step.
5. Dependabot would look for `package.json` at the repository root, find none, and fail to update anything (it reports an error for that entry).

</details>
