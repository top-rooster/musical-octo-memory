# Survival pressures and conditions

This document records the current decided representation of Nadir's ongoing survival pressures.

## DECIDED BY SIMON

Nadir is represented by one persistent **Nadir** card anchored to Inventory.

`Hydration` and `Satiation` are currently the permanent survival Values on that card. They are ordinary visible card attributes, not separate character-sheet bars or hidden survival systems.

Other survival pressures should normally be represented as condition cards rather than additional permanent Values on Nadir when they have their own identity and lifecycle.

Examples include fatigue, illness, injury, stress, and temperature-related problems. Their exact cards, attributes, Processes, and effects are defined individually as needed.

The purpose is to keep Nadir's permanent state compact and legible while allowing complexity to appear only when it matters.

### Visibility and readability

Routine survival decisions must be readable from the Nadir card itself.

When the player drags food, drink, medicine, or another source whose direct effect is understood, any affected visible Nadir Values should preview the result in place, for example:

- `Satiation 67 -> 82`
- `Hydration 50 -> 75`

The player should not need to remember hidden restoration values or consult a second survival panel to decide whether to eat or drink.

### Hidden survival state

Do not recreate Card Survival-style opacity by adding invisible hunger/fullness/stomach systems merely to increase simulation complexity.

Hidden Values exist in the general card model, but Nadir's routine survival state should remain visible unless a concrete future mechanic specifically benefits from being hidden.

### Hydration over time

Nadir starts with:

- `Hydration 50`
- `Satiation 50`

Hydration is currently the first recurring survival Process.

At each global quarter-hour world tick:

`Hydration -2`

Hydration 0 causes game over.

Do not invent additional Hydration sub-systems such as stomach contents, drinking frequency adaptation, or delayed absorption unless explicitly designed later.

### Satiation over time

No recurring Satiation decay is part of the current implementation contract.

Earlier drafts described `Satiation -1` every 30 minutes, but the current Action/Process foundation explicitly leaves Satiation decay undecided. Do not implement it until Simon chooses a concrete rule.
