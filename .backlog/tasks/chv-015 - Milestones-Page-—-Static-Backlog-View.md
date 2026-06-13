---
id: CHV-015
title: Milestones Page — Static Backlog View
status: To Do
assignee: []
created_date: '2026-06-13 12:40'
updated_date: '2026-06-13 12:40'
labels:
  - site-pages
milestone: Site Pages
dependencies: []
documentation:
  - doc-010
priority: high
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build a read-only milestones page into the app that renders backlog task data from a pre-generated JSON file. Same pattern as the changelog page. Works on GitHub Pages with no server or CI/CD — just run npm run backlog:export before pushing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 scripts/generate-backlog-data.js reads .backlog/tasks/, .backlog/decisions/, .backlog/docs/ and outputs milestones/data.json
- [ ] #2 package.json has backlog:export script: node scripts/generate-backlog-data.js
- [ ] #3 milestones/index.html scaffolded with standard boilerplate (CDN versions, auth pattern, mobile-nav)
- [ ] #4 milestones/app.js fetches data.json and renders milestone cards with progress bar (done/total)
- [ ] #5 Each task row shows ID chip, title, status chip, priority badge
- [ ] #6 Expandable task drawer shows description, AC checklist (read-only), plan, final summary
- [ ] #7 Decisions section rendered at bottom of page
- [ ] #8 Generated-at timestamp shown in footer
- [ ] #9 Milestones entry added to mobile nav sheet and desktop topbar
- [ ] #10 milestones/data.json excluded from .gitignore (it is committed, not generated at runtime)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Write scripts/generate-backlog-data.js — parse frontmatter from .backlog/tasks/*.md (id, title, status, priority, labels, milestone, ac, dod, plan, finalSummary, description), group by milestone, output milestones/data.json
2. Add backlog:export to package.json scripts
3. Run npm run backlog:export once to seed data.json
4. Scaffold milestones/index.html using new-page skill (no auth required — read-only public page, skip getCredentials pattern)
5. Build milestones/app.js: fetch('./data.json') → parse → render MilestoneCard components
6. MilestoneCard: header row (title + done/total + progress bar), collapsible task list
7. TaskRow: ID chip, title, expandable drawer with description/AC/plan/finalSummary
8. DecisionsSection: render each decision title + context/decision/consequences
9. Footer: 'Generated at <timestamp>'
10. Add Milestones link to mobile-nav.js sheet and any desktop topbar nav
11. Add milestones/ to sw.js PRECACHE list
12. Test: run backlog:export, open page, verify all milestones/tasks/decisions render correctly
<!-- SECTION:PLAN:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 npm run backlog:export generates valid data.json with all current tasks and milestones
- [ ] #2 Milestones page renders correctly on desktop and mobile
- [ ] #3 All 4 milestones and 15 tasks visible with correct status chips and progress bars
- [ ] #4 Decisions section renders all 6 decisions
- [ ] #5 Milestones link appears in mobile nav sheet
- [ ] #6 data.json added to sw.js PRECACHE
- [ ] #7 Changelog updated
<!-- DOD:END -->
