# 003: Architecture Decision Records

## 1. What changed and why

Three decisions made in Phase 0 now have written records in `docs/adr/`: Flyway owns the schema, the Vite dev proxy is used instead of CORS, and Open Session in View is disabled. There is also a template and an index. Before this, the *why* behind those choices existed only in code comments and chat. Now each decision has a short, permanent explanation stored next to the code.

## 2. How it fits together

Here's the life of one decision, using open-in-view as the example:

1. **A force appears.** Spring Boot logs a warning at startup that open-in-view is on by default. That's the *Context*.
2. **A choice is made and implemented.** `spring.jpa.open-in-view: false` goes into `application.yml`, and a rule goes into `CLAUDE.md`. Both landed in commit `3a0e3a5` on 2026-09-26. That commit date is the ADR's date.
3. **The choice is recorded.** `0003-disable-open-session-in-view.md` captures the *Decision*, the option that was rejected (*Alternatives considered*), and what the team now has to live with (*Consequences*).
4. **The record is indexed.** A row in `docs/adr/README.md` makes it findable.
5. **Later, someone questions it.** A new developer (or you in six months) wonders why `LazyInitializationException` keeps showing up. The ADR answers that it's intentional, explains why, and shows how to fetch data properly. If the decision really should change, you **write ADR 0004 that supersedes 0003** and set 0003's status to "Superseded by 0004". The old record is never rewritten.

The code tells you *what*. The comment next to the code tells you *why this line*. The ADR tells you *why this approach, and what we gave up*.

## 3. Walkthrough, in reading order

**`docs/adr/README.md`**: read this first. The paragraph explains what an ADR is and states the most important rule: ADRs are **immutable**, so you supersede them rather than edit them. The index table (number, title, status) gives you the whole decision history at a glance.

**`docs/adr/template.md`**: the shape every ADR shares. Each section answers one question:
- **Title**: a short statement of the decision itself ("Disable Open Session in View"), not a topic ("Open Session in View").
- **Status / Date**: whether the decision is still in force, and when it took effect.
- **Context**: the forces and constraints *before* the decision. It should be neutral; a reader should be able to see why this was a real choice.
- **Decision**: what we do, stated plainly, with pointers to where it lives in the code.
- **Alternatives considered**: the realistic options that were rejected, and why. This is the section that stops the same debate from happening again.
- **Consequences**: what follows, including the costs. A consequences list with no downsides is a warning sign.

**`docs/adr/0001-flyway-owns-database-schema.md`**: a good example of a Consequences section with honest costs ("migrations are written by hand in SQL") next to the benefits ("fail fast at startup"). It also links to a CLAUDE.md rule instead of repeating the reasoning.

**`docs/adr/0002-vite-dev-proxy-instead-of-cors.md`**: shows how to handle a decision that is **deliberately incomplete**. How production serves the app isn't decided yet, and the ADR says so openly ("That choice is made when deployment is set up") rather than guessing. That line marks where a future ADR will go. It also lists a practical consequence taken from the code: each new backend path prefix must be added to `server.proxy`.

**`docs/adr/0003-disable-open-session-in-view.md`**: the shortest one, with a single alternative. That's fine: the only real alternative to "turn it off" is "leave it on". Its last consequence says the decision has no effect on current code yet, which tells a reader not to go looking for impact that isn't there.

## 4. Design decisions

| Decision | Alternative | Why this one |
|---|---|---|
| **Date = the commit where the decision took effect** (your instruction) | The date the ADR was written | The ADR records when the decision took effect, which is what matters when you read history alongside `git log`. |
| **One file per decision, numbered `NNNN-kebab-title.md`** | One big `DECISIONS.md` | Separate files keep a clean Git history per decision and are easy to link from code comments or PRs. Four-digit numbers sort correctly and never get renumbered. |
| **Consistent with the code, not only the brief** | Transcribe the brief exactly | I checked each claim against the repo (for example, that `/actuator` is the only proxied path today, and that no entities exist yet) and added those details. A few wording changes are listed in section 7. |
| **Status stays in the ADR, not only the index** | Status only in the README table | The file must stand alone, because people often reach it through a direct link. |

## 5. Concepts to study

- **Architecture Decision Record**: a short, immutable document recording one significant decision along with its context, the alternatives, and the consequences. That's the whole of `docs/adr/`.
- **Supersession**: changing a decision by writing a new ADR and marking the old one "Superseded". Described in `docs/adr/README.md`.
- **Trade-off thinking**: every decision has costs, and naming them is what separates an ADR from a sales pitch. See the Consequences sections.
- **Docs as code**: decisions live in the repository, change through commits, and get reviewed in PRs like code.
- The technical concepts inside the ADRs (Flyway checksums, same-origin policy, lazy loading) are covered in [001](001-project-skeleton.md) and [002](002-phase-0-cleanup.md).

## 6. Try it yourself

1. Pick a Phase 0 decision that didn't get an ADR, for example "Testcontainers instead of H2" or "SHA-pinned GitHub Actions", and write ADR 0004 from `template.md` in under 20 minutes. Then check it: does the Context make the choice feel real? Do the Consequences include a cost?
2. Read ADR 0002 and write down, in one sentence, a situation that would justify superseding it. Then draft only the *Context* section of that future ADR.
3. Cover the Decision section of ADR 0001 and try to predict it from the Context alone. If you can, the Context is doing its job.

## 7. Review carefully

Places where the ADRs differ slightly from your brief. Please confirm each one:
- **ADR 0003, connection holding.** The brief said open-in-view "holds database connections for the whole request". More precisely, the connection is acquired the first time the request touches the database and then held until the response is written. A request that never queries takes no connection. I wrote the precise version.
- **ADR 0003, "within a transaction".** This is kept as in your brief. Note that nothing enforces it yet: no services exist, and `@Transactional` usage is a Phase 1+ convention to establish.
- **Extra facts I added from the code** (not in the brief):
  - The migration folder path and `V1__baseline.sql` (0001).
  - That `/actuator` is currently the only proxied path, and that new prefixes must be added (0002).
  - That no entities exist yet, so 0003 has no current effect.
  - That the startup warning appears "when it is left unset" (0003).
- **ADR 0001, "Vantage uses a single database (PostgreSQL)".** Your brief said "a single-database app". I read that as one database *type*, which matches the stack. Correct me if you meant something else.
- **Nothing in the brief looked wrong.** One minor point: Liquibase *rollbacks* are a real differentiator mainly because Flyway's undo migrations are a paid feature. I didn't add that, since it's outside what you gave me.
- **Uncommitted docs:** `docs/learning/002-phase-0-cleanup.md` is still uncommitted from the previous task, alongside everything created here.

## 8. Check your understanding

1. Why is an accepted ADR never edited when the decision changes, and what do you do instead?
2. Which section of an ADR prevents the same debate from being reopened every few months, and why?
3. ADR 0002 leaves production hosting undecided. Is that a weakness of the ADR? Why or why not?
4. What's the difference between the comment above `open-in-view: false` in `application.yml` and ADR 0003? Why keep both?
5. If a Consequences section lists only benefits, what should you suspect?

<details>
<summary>Answers</summary>

1. The ADR is a historical record of what was decided and why *at that time*. Editing it erases that history. Instead, you write a new ADR that supersedes it and change the old one's status to "Superseded by NNNN".
2. *Alternatives considered*. It records which options were weighed and why they lost, so the next person can see whether their idea was already evaluated, and only reopen the question if the context has changed.
3. No. An ADR should record what was actually decided. Stating the open question explicitly is honest, and it marks where a future ADR belongs. Inventing a production setup would record a decision nobody made.
4. The comment explains this one line to someone reading the config. The ADR explains the approach, the alternative, and the consequences for the whole codebase (for example, how services must fetch data). The comment is local and brief. The ADR is the full reasoning, and the comment points readers toward it.
5. That the trade-offs weren't thought through, or were left out. Every real decision has a cost, even if it's only "more code to write" or "less convenient".

</details>
