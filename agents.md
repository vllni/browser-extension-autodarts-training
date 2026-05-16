# Autodarts Training Plans – Browser Extension

## Overview

Browser extension that adds a training plans overlay to `play.autodarts.io`. A training plan is an ordered list of games (any variant) played back-to-back. The extension creates a private lobby with predefined settings automatically, so the user only needs to click "Start game". All plans and user data are stored in browser `localStorage`.

## Architecture

| File | Purpose |
|------|---------|
| `src/content.js` | Single IIFE content script — captures auth token, injects overlay UI, manages training plans, creates lobbies via REST API |
| `src/content.css` | Styles matching the Autodarts dark theme |
| `src/injected.js` | Firefox-only page-world script (web_accessible_resource) — wraps XHR/fetch in the page's own JS context and dispatches `CustomEvent('__adtp_token__')` so content.js can receive the auth token |
| `src/manifest.chrome.json` | Chrome MV3 manifest (`"world": "MAIN"` — runs in page context directly) |
| `src/manifest.firefox.json` | Firefox MV2 manifest (gecko ID + `browser_specific_settings`, declares `injected.js` as web_accessible_resource, `https://api.autodarts.io/*` permission) |
| `build.sh` | Builds `dist/chrome/` and `dist/firefox/` and zips both; copies `injected.js` to `dist/firefox/` only |
| `tests/content.test.js` | Jest + jsdom tests for the content script (25 tests) |

## Build & Test

```bash
npm install       # install Jest + jsdom
npm test          # run tests
bash build.sh     # produces dist/chrome/ dist/firefox/ and .zip packages
```

## Key Conventions

- **Match pattern** is `https://play.autodarts.io/*` — the play app runs at this origin.
- **run_at**: `document_start` — the content script must load before app JS to install the fetch interceptor.
- **Design tokens** (dark bg `#1a202c`, accent green `rgb(154,230,180)`, border `rgba(255,255,255,0.16)`) must be preserved to match the Autodarts Chakra UI dark theme.
- **Auth token capture**: The Autodarts login flow uses **XHR** (not fetch) to POST to `https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token`. The extension intercepts the XHR response to read `access_token`. The token expires in 300 s; re-capture on each fresh response.
  - **Chrome**: content script runs in `"world": "MAIN"`, so it wraps `window.XMLHttpRequest.prototype.open/send` and `window.fetch` directly.
  - **Firefox**: content script runs in an isolated sandbox. At `document_start` when `document.documentElement` is `null`, inject `injected.js` via `document.write('<script src="moz-extension://…/injected.js">')`. `injected.js` runs in the page's own JS world, wraps XHR/fetch, and dispatches `CustomEvent('__adtp_token__', { detail: token })` on `window`. The content script listens with `window.addEventListener('__adtp_token__', …)`.
- **UserId / username**: Decode the JWT payload (middle base64 segment) to read `sub` (userId) and `preferred_username` (name). No API call needed.
- **BoardId**: `GET https://api.autodarts.io/bs/v0/boards` returns array of boards. The extension should let the user pick one (or default to the first connected board).
- **Storage key**: `adtp-plans-{userId}` in `localStorage` stores the JSON array of training plans.
- **Plan execution flow**:
  1. User clicks "Start plan" → extension picks the next pending game step.
  2. `POST /gs/v0/lobbies` with game settings → returns `{ id }`.
  3. `POST /gs/v0/lobbies/{id}/players` with `{ name, userId, boardId }`.
  4. `window.location.href = /lobbies/{id}` — user is taken to the lobby and clicks "Start game".
  5. After game ends the URL changes to `/matches/{matchId}` or user navigates home. Extension detects this URL change and shows "Start next game" prompt.
- Both manifests must stay in sync (version, match patterns, file list). `build.sh` stamps the release tag version into both at release time.

## API Reference

All requests to `api.autodarts.io` require `Authorization: Bearer <access_token>`.

### Auth
- Token endpoint: `POST https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token`
  - Response: `{ access_token, refresh_token, expires_in: 300 }`
  - The content script intercepts this response to capture `access_token`.
  - JWT payload (base64 decoded): `sub` = userId, `preferred_username` = name.

### Boards
- `GET https://api.autodarts.io/bs/v0/boards` — returns array of board objects: `[{ id, name, state: { connected } }, ...]`

### Lobby lifecycle
- `POST https://api.autodarts.io/gs/v0/lobbies` — create lobby (body described per variant below) → `{ id, ... }`
- `POST https://api.autodarts.io/gs/v0/lobbies/{id}/players` — join lobby: `{ "name": "<username>", "userId": "<sub>", "boardId": "<boardId>" }`
- `GET https://api.autodarts.io/gs/v0/lobbies/{id}` — poll lobby state

## Game Variants & Lobby Payloads

All payloads share the envelope `{ "variant": "...", "settings": { ... }, "bullOffMode": "Off|Normal|Official", "isPrivate": false }`.

### X01
URL slug: `/lobbies/new/x01`
```json
{
  "variant": "X01",
  "settings": {
    "baseScore": 501,
    "inMode": "Straight",
    "outMode": "Double",
    "bullMode": "25/50",
    "maxRounds": 50
  },
  "bullOffMode": "Off",
  "isPrivate": false
}
```
Options — `baseScore`: 121 / 170 / 301 / 501 / 701 / 901 · `inMode` / `outMode`: `"Straight"` / `"Double"` / `"Master"` · `bullMode`: `"25/50"` / `"50/50"` · `maxRounds`: 15 / 20 / 50 / 80 · `bullOffMode`: `"Off"` / `"Normal"` / `"Official"`

### Cricket / Tactics
URL slug: `/lobbies/new/cricket`
```json
{
  "variant": "Cricket",
  "settings": {
    "gameMode": "Cricket",
    "scoringMode": "Standard",
    "maxRounds": 50
  },
  "bullOffMode": "Off",
  "isPrivate": false
}
```
Options — `gameMode`: `"Cricket"` / `"Tactics"` · `scoringMode`: `"Standard"` / `"CutThroat"` / `"NoScore"` · `maxRounds`: 15 / 20 / 50 / 80

### ATC (Around the Clock)
URL slug: `/lobbies/new/atc`
```json
{
  "variant": "ATC",
  "settings": {
    "mode": "Full",
    "order": "1-20-Bull",
    "hits": 1
  },
  "bullOffMode": "Off",
  "isPrivate": false
}
```
Options — `mode`: `"Full"` / `"OuterSingle"` / `"Single"` / `"Double"` / `"Triple"` · `order`: `"1-20-Bull"` / `"20-1-Bull"` / `"Random-Bull"` · `hits`: 1 / 2 / 3

### Segment Training
URL slug: `/lobbies/new/segment-training`
```json
{
  "variant": "Segment Training",
  "settings": {
    "mode": "Double",
    "segment": "20",
    "hits": 5
  },
  "bullOffMode": "Off",
  "isPrivate": false
}
```
Options — `mode`: `"Single"` / `"OuterSingle"` / `"Double"` / `"Triple"` / `"Random"` · `segment`: `"1"`–`"20"` / `"Bull"` · `hits`: any positive integer (ends after N successful hits)

### Bob's 27
URL slug: `/lobbies/new/bobs27`
```json
{
  "variant": "Bob's 27",
  "settings": {
    "mode": "Normal",
    "order": "1-20-Bull"
  },
  "bullOffMode": "Off",
  "isPrivate": false
}
```
Options — `mode`: `"Normal"` / `"AllowNegativeScore"` · `order`: `"1-20-Bull"` / `"1-20"`

### Bermuda
URL slug: `/lobbies/new/bermuda`
```json
{ "variant": "Bermuda", "settings": {}, "bullOffMode": "Off", "isPrivate": false }
```
No configurable settings.

### Gotcha
URL slug: `/lobbies/new/gotcha`
```json
{
  "variant": "Gotcha",
  "settings": {
    "targetScore": 301,
    "outMode": "Straight",
    "maxRounds": 50
  },
  "bullOffMode": "Off",
  "isPrivate": false
}
```
Options — `targetScore`: 301 / 401 / 501 / 601 / 701 · `outMode`: `"Straight"` / `"Double"` / `"Master"` · `maxRounds`: 15 / 20 / 50 / 80

### Shanghai
URL slug: `/lobbies/new/shanghai`
```json
{
  "variant": "Shanghai",
  "settings": { "mode": "1-20" },
  "bullOffMode": "Off",
  "isPrivate": false
}
```

### Round the World (RTW)
URL slug: `/lobbies/new/rtw`
```json
{
  "variant": "RTW",
  "settings": { "order": "1-20-Bull" },
  "bullOffMode": "Off",
  "isPrivate": false
}
```

### Random Checkout
URL slug: `/lobbies/new/random-checkout`
```json
{
  "variant": "Random Checkout",
  "settings": {
    "low": 61,
    "high": 180,
    "outMode": "Double",
    "maxRounds": 9
  },
  "bullOffMode": "Off",
  "isPrivate": false
}
```

### Count Up
URL slug: `/lobbies/new/count-up`
```json
{
  "variant": "CountUp",
  "settings": { "maxRounds": 8 },
  "bullOffMode": "Off",
  "isPrivate": false
}
```

## Data Model (localStorage)

Key: `adtp-plans-{userId}`

```json
[
  {
    "id": "uuid",
    "name": "My Training Plan",
    "steps": [
      { "variant": "X01", "settings": { "baseScore": 501, "outMode": "Double", "inMode": "Straight", "bullMode": "25/50", "maxRounds": 50 }, "bullOffMode": "Off", "isPrivate": false },
      { "variant": "Segment Training", "settings": { "mode": "Double", "segment": "20", "hits": 5 }, "bullOffMode": "Off", "isPrivate": false }
    ]
  }
]
```

Active session state — persisted in `sessionStorage` under key `adtp-session` (cleared on tab close):
```json
{ "planId": "uuid", "stepIndex": 0, "boardId": "uuid" }
```

On first auth, if `adtp-plans` (anonymous key) exists in `localStorage`, its contents are migrated to `adtp-plans-{userId}` and the old key is removed.

## Browser Interaction & Screenshots

When any agent task requires opening or interacting with `play.autodarts.io` in a browser:

- **Use the Playwright MCP tools** (`mcp_playwright_browser_*`) for all browser interaction — navigation, clicking, JavaScript evaluation, and taking screenshots. Do not use other browser automation approaches.
- **Screenshot dimensions**: all screenshots must be **1280 × 800 px**. Set the viewport before navigating:
  ```js
  await page.setViewportSize({ width: 1280, height: 800 });
  ```
- Screenshots are saved to `screenshots/` and follow the naming convention `NN-description.png` (e.g. `01-sidebar.png`).
- To interact with the extension overlay when it may be blocking a button, use `page.evaluate()` to remove the overlay element from the DOM before clicking, rather than fighting the intercepted pointer events.
