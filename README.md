# Safe Room interaction prototype

Milestone 1 is a browser prototype for testing direct card manipulation between the Room and Inventory. Card masters are loaded from `data/cards.txt`; the prototype does not define a permanent level format.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- pnpm 11 or newer

## Install

```sh
pnpm install
```

## Run the development server

```sh
pnpm dev
```

Open the local URL printed by Vite.

## Run tests

```sh
pnpm test
```

## Build

```sh
pnpm build
```

The production bundle is written to `dist/`.
