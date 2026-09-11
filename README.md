# Safe Room playable world prototype

Milestone 2 turns the direct-manipulation card prototype into a small playable
world slice: evacuate the opening room with up to five offered items, equip and
carry them, enter the Tunnels, Search finite room-local decks, discover routes,
and travel among persistent rooms. Lighting, effective Vision, Search/travel
time, equipment activity, and Small/Medium/Large storage are handled by the game
rules rather than the React presentation.

Card masters and descriptions are authored in `data/cards.txt`, shared
attribute help in `data/attributes.txt`, and the room graph, starting state,
backgrounds, light, routes, and Search decks in `data/rooms.txt`.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- pnpm `11.19.0`

## Install

```sh
pnpm install
```

## Run locally

```sh
pnpm dev
```

Open the local URL printed by Vite.

## Test

```sh
pnpm test
```

## Build

```sh
pnpm build
```

The production bundle is written to `dist/` and uses the project Pages base
path `/musical-octo-memory/`. Local development continues to use `/`.

## GitHub Pages

Pushes to `main` run `.github/workflows/deploy-pages.yml`, which installs the
locked pnpm dependencies, tests, builds, uploads `dist/`, and deploys it.
Repository Settings → Pages must use **GitHub Actions** as the source.

Public prototype URL:
[https://top-rooster.github.io/musical-octo-memory/](https://top-rooster.github.io/musical-octo-memory/)

If an authored image is absent, the prototype uses a readable fallback without
hiding card titles or mechanics.

During the opening, either Hand can hold any ordinary movable item without using
carried capacity. Held offered cards still count toward the five-card evacuation
limit; flat carried Inventory remains governed by equipped storage capacity.
