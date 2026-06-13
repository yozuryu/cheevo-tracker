---
id: doc-010
title: Milestones Page — Static Backlog View
type: specification
created_date: '2026-06-13 12:39'
updated_date: '2026-06-13 12:39'
---
## Overview

A read-only milestones/backlog page built into the cheevo-tracker app, following the same pattern as the changelog page. Renders task data from a pre-generated JSON file so it works on GitHub Pages without any server or CI/CD.

## Architecture

### Data pipeline

`scripts/generate-backlog-data.js` — a Node.js script (no external deps, uses only fs + path) that:
1. Reads all `.backlog/tasks/*.md` files
2. Reads all `.backlog/decisions/*.md` files  
3. Reads all `.backlog/docs/*.md` files
4. Reads milestone assignments from task frontmatter
5. Outputs `milestones/data.json` with shape:

```json
{
  "milestones": [
    {
      "id": "IDB Migration",
      "title": "IDB Migration",
      "tasks": [...],
      "total": 6,
      "done": 6
    }
  ],
  "unassigned": [...],
  "decisions": [...],
  "generatedAt": 1234567890
}
```

Task shape per item:
```json
{
  "id": "CHV-001",
  "title": "...",
  "status": "Done",
  "priority": "high",
  "labels": ["idb-migration"],
  "description": "...",
  "ac": [{ "text": "...", "checked": true }],
  "dod": [{ "text": "...", "checked": true }],
  "plan": "...",
  "finalSummary": "..."
}
```

### npm script

Add to `package.json`:
```json
{ "scripts": { "backlog:export": "node scripts/generate-backlog-data.js" } }
```

Run before pushing: `npm run backlog:export` → commits updated `milestones/data.json`.

### Page

`milestones/index.html` + `milestones/app.js` — same boilerplate as changelog page.

`app.js` fetches `./data.json` and renders:
- Header with total task count and milestone count
- One card per milestone: title, progress bar (done/total), task rows
- Each task row: ID chip, title, status chip, priority badge
- Expandable task drawer: description, AC checklist (read-only), plan, final summary
- Decisions section at the bottom: title + context/decision/consequences rendered as markdown
- Generated-at timestamp in footer

## Visual Design

- Dark Steam theme consistent with rest of app
- Milestone card: `bg-[#1b2838]` with `border border-[#2a475e]` and rounded corners
- Progress bar: blue fill (`#1a9fff`) for done/total ratio; gold when 100%
- Status chips: gray (To Do), blue (In Progress), green (Done)
- Priority badge: red (high), yellow (medium), gray (low)
- AC items shown as dimmed checklist rows — checked items have strikethrough

## Navigation

Add Milestones entry to the mobile nav sheet in `assets/mobile-nav.js` and to the desktop topbar where present.
