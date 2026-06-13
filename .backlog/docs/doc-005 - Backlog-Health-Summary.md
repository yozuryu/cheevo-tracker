---
id: doc-005
title: Backlog Health Summary
type: specification
created_date: '2026-06-13 12:10'
updated_date: '2026-06-13 12:13'
---
## Overview

A compact stats strip at the top of the Backlog tab showing the breakdown across all backlog games. Data from `backlog` × `progress` × `games` IDB join — zero API calls.

## Metrics

| Metric | Description |
|---|---|
| Total | Total backlog games |
| Not started | 0 achievements earned |
| In progress | >0 but <100% achievements |
| Mastered | 100% achievements earned |
| Remaining | Sum of (numAchievements − earned) across all backlog games |

## Display

Horizontal stat chips in the backlog header row, same style as the existing "X games" count label.

## Data

Same join as Backlog × Progress Enrichment (doc-002) — reuse the same IDB read if both features are rendered on the same mount.
