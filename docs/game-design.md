# Safe Room

## Premise

Safe Room is a narrative survival/stealth game about isolation, preparation, and risk. Nadir Veylan is a good man shaped and damaged by a toxic military system. His flight from returning to military service must remain compatible with his genuine love for Elina rather than reducing her to an escape tool.

Nadir survives partly through self-deception about things he has done or caused. The narrative may explore the tension between player choices, past trauma, and the stories he tells himself without making him appear foolish.

## Intended experience

The interface should feel like a physical workspace. The player learns the world by arranging cards, understanding visible state, combining objects, preparing equipment, searching uncertain places, and deciding when time and risk are worth spending.

Complexity should emerge from interactions among a relatively small number of legible systems. Routine survival decisions should be understandable from the cards and world state in front of the player rather than from redundant bars, hidden accumulators, or special-purpose menus.

## Core workspace

The play space has two major areas:

- **Room** represents the currently viewed physical location and its local cards and objects.
- **Inventory** persists across travel and contains Nadir's carried items, equipment interface, and character state.

Rooms are stable spatial contexts rather than scrolling levels. Room state persists while off-screen. Search, routes, lighting, carried resources, and equipment make exploration a matter of preparation and consequence.

Cards are the primary language for interactable world entities and visible state. Their presentation may layer reusable physical-material frames with card-specific artwork and dynamic information so Food, Item, Path, and Feature roles are legible without becoming gameplay classes or authority. Other interface objects may exist when they are conceptually distinct. Decks remain distinct objects but may be owned by a Room or by an interactive card.

## Nadir

Nadir is represented by three persistent cards:

- **Body** for physical state and survival needs;
- **Mind** for perception and cognition;
- **Spirit** for emotional and spiritual state.

There is no generic Nadir card. Conditions with their own identity may appear as additional cards when they become relevant.

## Survival and exploration philosophy

Actions are deliberate work performed by Nadir. Time matters because the world and ongoing conditions continue to change while he acts. Equipment and light should open practical possibilities without turning exploration into arbitrary item gates.

The game should create foreseeable, learnable pressure. Severe danger should be communicated well enough that choices feel risky rather than capricious. Discovery may come from both explicit relationships and experimentation, but known direct consequences should be legible before commitment.

Permanent character state should remain compact. New systems, hidden state, and simulation detail should be introduced only when they create a concrete player decision that existing cards, attributes, or conditions cannot express cleanly.

## Design discipline

Simon owns product and design decisions. Open questions and ChatGPT suggestions are not requirements.

The detailed authoritative rules, implementation tasks, decisions, questions, acceptance criteria, superseded rules, and implementation history live in `docs/backlog.md`. The current implementation scope is defined only by the task IDs in `docs/next-iteration.md`.
