# Console Page

**File:** `console/app.js`  
**URL:** `/console/?id=<consoleId>`  
**Auth required:** Yes

## Data Fetched on Mount

- Console list via `fetchConsoles()` — used to resolve the console name from the ID
- Game list via `fetchConsoleGames(consoleId)` — full list of games for the console

## Constants

- `PUBLISHER_MAP` — maps publisher IDs to display names
- `ERA_MAP` — maps console IDs to historical era labels (e.g., "8-bit", "16-bit", "32-bit")

## Features

- Filterable/sortable game list
- Links to `/game/?id=<gameId>` for each game
- Shows achievement count per game

## Mobile

### Header

```jsx
<main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 pt-8 pb-5 md:pt-5">
```

### Game grid

`grid-cols-2 md:grid-cols-3` — two columns on mobile, three on desktop.

### Breadcrumb

The word "Consoles" in the breadcrumb is `hidden md:inline` — omitted on mobile to save space.
