---
id: doc-004
title: Unlock Statistics — Day / Week / Month
type: specification
created_date: '2026-06-13 12:10'
updated_date: '2026-06-13 12:12'
---
## Overview

Personal analytics computed entirely from the `progress` IDB store. No API calls. Placed as a Stats sub-section in the Activity tab (beneath the heatmap) or a dedicated Stats tab — Stats tab preferred if the Activity tab is already dense.

## Metrics

All computable from achievement `date` fields in the progress store:

- Points and achievement count **per day** (last 30 days) — bar chart or table
- Points and achievement count **per week** (last 12 weeks)
- Points and achievement count **per month** (last 12 months)
- **Current unlock streak** — consecutive days with ≥1 unlock
- **Best streak** — all-time from available data
- **Most active day of the week** — Mon–Sun average
- **Average unlocks per active day**

## Implementation

Single `idbGetAllByIndex('progress', 'username', username)` → flatten all achievement dates → compute all metrics in-memory. No secondary API calls.

## Placement

New "Stats" sub-section within the Activity tab (beneath the heatmap), or a dedicated Stats tab. Stats tab preferred if the Activity tab is already dense.
