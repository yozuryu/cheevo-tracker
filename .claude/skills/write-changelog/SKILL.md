---
name: write-changelog
description: Write or update the cheevo-tracker changelog after making code changes. Use this skill whenever you finish implementing a feature, bug fix, or refactor and need to record it in changelog.md. Also use it when the user says "update changelog", "write changelog entry", "add to changelog", or "log this change". This skill knows the exact version format, valid section names, section order rules, and duplicate-prevention workflow for this project.
---

# Write Changelog Entry

## Workflow

1. **Get today's version string.** Format: `vYY.MM.DD` (e.g., `v26.06.11`). Today's date is in the `currentDate` memory or use `date +%y.%m.%d` via Bash.

2. **Grep first — never assume.** Run:
   ```bash
   grep -n "^## v$(date +%y.%m.%d)" changelog.md
   ```
   - If a match exists → today's entry is already there. Read the lines around it to see which sections are already present. You'll be **adding to** the existing entry.
   - If no match → you'll be **creating a new entry** at the top of the file (right after `# Changelog`).

3. **Determine the section(s).** Pick from the valid list below. Every bullet goes under exactly one section. Never invent a new section name.

4. **Write the entry.** See rules below.

---

## Entry format

```
## vYY.MM.DD — Short Title

### Section Name

- Bullet describing the change. Write what changed and why it matters.
  Details can spill onto a continuation line with two-space indent.
- Another bullet.
```

**Title**: A short phrase capturing the theme of the day's changes (e.g., `Friends Feed Group Mode`, `Social Bug Fixes + Softcore Points`). If adding to an existing entry, keep the existing title.

**Bullets**: Each bullet covers one logical change. Explain *what* changed and, where non-obvious, *why*. Inline backticks for identifiers, function names, and values. Bold for UI labels. Em-dash (—) to join cause/effect.

---

## Valid sections and when to use them

| Section | Use for |
|---|---|
| `RetroAchievements API` | New or changed `ra-api.js` endpoint wrappers, `raFetch` calls, `transformData` changes, new API fields used |
| `Auth` | `getCredentials`, `handleAuthError`, login flow, session/localStorage auth state |
| `Cache` | IDB store schema, reads/writes, TTL logic, sessionStorage/localStorage cache behaviour |
| `Structure` | Code organisation, refactors, dead code removal, shared helpers, file layout changes |
| `Profile` | Profile page features, tabs, heatmap, activity timeline, game modal, compare modal, visitor mode |
| `Social` | Social tab, following/followers, friends activity feed, group modes, rich presence, social rows |
| `Game Page` | Game page features, achievement list, friend comparison, leaderboards |
| `Console Page` | Console page |
| `Achievement Page` | Achievement detail page |
| `Backlog` | Backlog tab, want-to-play list |
| `Settings` | Settings page |
| `Search` | Search page or search functionality |
| `Navigation` | Topbar, routing, URL params, breadcrumbs, tab bar, floating pill |
| `Polish` | Visual tweaks, animations, spacing, micro-interactions that don't fit a specific page |
| `User Page` | User page (if distinct from Profile) |

## Section order (when multiple sections appear in one entry)

`RetroAchievements API` → `Auth` → `Cache` → `Structure` → then page-specific sections in any order.

---

## Deduplication rules

- **Never create a duplicate `## vYY.MM.DD` header.** If today's entry exists, add to it.
- **Never create a duplicate `### Section` header within the same entry.** If today's entry already has `### Social`, append new bullets to the existing `### Social` block — don't add a second `### Social`.
- If the same section appears twice already in the file (like in the v26.05.31 entry that has two `### Profile` blocks) — that's a historical artifact. Don't repeat it going forward.

---

## When adding to an existing entry

Read the current state of today's entry carefully. Then use Edit to:
- Append bullets to an existing section, OR
- Insert a new `### Section` block in the correct order position within the entry.

Never rewrite the whole entry — use targeted edits.
