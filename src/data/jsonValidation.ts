type JsonObject = Record<string, unknown>;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLOT_IDS = new Set([
  "left-hand", "right-hand", "head", "eyes", "trinket-1", "trinket-2",
  "chest", "back", "legs", "feet",
]);
const HAND_SLOT_IDS = new Set(["left-hand", "right-hand"]);
const SIZE_MARKERS = new Set(["small", "medium", "large"]);
const STORAGE_VALUES = new Set(["storage-small", "storage-medium", "storage-large"]);
const COMPARISONS = new Set([">", ">=", "<", "<=", "=", "<>"]);
const VALUE_OPERATORS = new Set(["=", "+=", "-="]);

function object(value: unknown, location: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${location} must be an object`);
  }
  return value as JsonObject;
}

function array(value: unknown, location: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${location} must be an array`);
  return value;
}

function exactKeys(value: JsonObject, allowed: readonly string[], location: string): void {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new Error(`${location} contains unsupported key "${unexpected[0]}"`);
}

function id(value: string, location: string): void {
  if (!ID_PATTERN.test(value)) throw new Error(`${location} must be a lowercase kebab-case ID`);
}

function string(value: unknown, location: string): asserts value is string {
  if (typeof value !== "string" || !value) throw new Error(`${location} must be a non-empty string`);
}

function number(value: unknown, location: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${location} must be a finite number`);
}

function duration(value: unknown, location: string): void {
  string(value, location);
  if (!/^\d+(?:m|h)$/.test(value)) throw new Error(`${location} must be an explicit duration`);
}

function reference(value: unknown, known: Set<string>, location: string): asserts value is string {
  string(value, location);
  if (!known.has(value)) throw new Error(`${location} references unknown ID "${value}"`);
}

function validateSelector(value: unknown, attributes: Set<string>, location: string): void {
  const selector = object(value, location);
  const keys = Object.keys(selector);
  if (keys.length === 1 && keys[0] === "marker") {
    reference(selector.marker, attributes, `${location}.marker`);
    return;
  }
  if (keys.includes("value")) {
    const operators = keys.filter((key) => COMPARISONS.has(key));
    if (keys.length !== 2 || operators.length !== 1) {
      throw new Error(`${location} Value selector must use exactly one comparison operator`);
    }
    reference(selector.value, attributes, `${location}.value`);
    number(selector[operators[0]], `${location}.${operators[0]}`);
    return;
  }
  if (keys.length === 1 && (keys[0] === "and" || keys[0] === "or")) {
    array(selector[keys[0]], `${location}.${keys[0]}`).forEach((child, index) =>
      validateSelector(child, attributes, `${location}.${keys[0]}[${index}]`));
    return;
  }
  if (keys.length === 1 && keys[0] === "not") {
    validateSelector(selector.not, attributes, `${location}.not`);
    return;
  }
  throw new Error(`${location} must use marker, value, and, or, or not; card-ID matching is unsupported`);
}

function validateRole(value: unknown, location: string, process = false): void {
  if (value !== "self" && value !== "other") throw new Error(`${location} must be "self" or "other"`);
  if (process && value === "other") throw new Error(`${location} cannot use "other" in a Process`);
}

function validateOperand(
  value: unknown,
  attributes: Set<string>,
  location: string,
  process = false,
): void {
  if (typeof value === "number") {
    number(value, location);
    return;
  }
  const operand = object(value, location);
  exactKeys(operand, ["target", "value"], location);
  validateRole(operand.target, `${location}.target`, process);
  reference(operand.value, attributes, `${location}.value`);
}

function validateEffects(
  value: unknown,
  attributes: Set<string>,
  location: string,
  process = false,
): void {
  for (const [index, rawEffect] of array(value, location).entries()) {
    const effectLocation = `${location}[${index}]`;
    const effect = object(rawEffect, effectLocation);
    const keys = Object.keys(effect);
    if (keys.includes("add-marker") || keys.includes("remove-marker")) {
      const operation = keys.includes("add-marker") ? "add-marker" : "remove-marker";
      exactKeys(effect, ["target", operation], effectLocation);
      validateRole(effect.target, `${effectLocation}.target`, process);
      reference(effect[operation], attributes, `${effectLocation}.${operation}`);
      continue;
    }
    if (keys.includes("value")) {
      const operators = keys.filter((key) => VALUE_OPERATORS.has(key));
      if (operators.length !== 1) throw new Error(`${effectLocation} Value effect must use exactly one operation`);
      exactKeys(effect, ["target", "value", operators[0]], effectLocation);
      validateRole(effect.target, `${effectLocation}.target`, process);
      reference(effect.value, attributes, `${effectLocation}.value`);
      validateOperand(effect[operators[0]], attributes, `${effectLocation}.${operators[0]}`, process);
      continue;
    }
    if (keys.includes("discard")) {
      exactKeys(effect, ["target", "discard"], effectLocation);
      validateRole(effect.target, `${effectLocation}.target`, process);
      if (effect.discard !== true) throw new Error(`${effectLocation}.discard must be true`);
      continue;
    }
    if (keys.length === 1 && keys[0] === "set-room") {
      if (process) throw new Error(`${effectLocation} Processes cannot use set-room`);
      const setRoom = object(effect["set-room"], `${effectLocation}.set-room`);
      exactKeys(setRoom, ["target", "reference"], `${effectLocation}.set-room`);
      validateRole(setRoom.target, `${effectLocation}.set-room.target`);
      string(setRoom.reference, `${effectLocation}.set-room.reference`);
      id(setRoom.reference, `${effectLocation}.set-room.reference`);
      continue;
    }
    if (keys.length === 1 && keys[0] === "spend-time") {
      if (process) throw new Error(`${effectLocation} Processes cannot use spend-time`);
      validateOperand(effect["spend-time"], attributes, `${effectLocation}.spend-time`);
      if (typeof effect["spend-time"] === "number" && effect["spend-time"] < 0) {
        throw new Error(`${effectLocation}.spend-time must not be negative`);
      }
      continue;
    }
    throw new Error(`${effectLocation} is not a supported Action effect`);
  }
}

function validateInstance(
  raw: unknown,
  cards: JsonObject,
  cardIds: Set<string>,
  attributes: Set<string>,
  location: string,
): void {
  const instance = typeof raw === "string" ? undefined : object(raw, location);
  if (instance) exactKeys(instance, ["card", "markers", "values"], location);
  const masterId = typeof raw === "string" ? raw : instance!.card;
  reference(masterId, cardIds, typeof raw === "string" ? location : `${location}.card`);
  const master = object(cards[masterId], `cards.${masterId}`);
  if (instance?.markers !== undefined) {
    for (const [index, marker] of array(instance.markers, `${location}.markers`).entries()) {
      reference(marker, attributes, `${location}.markers[${index}]`);
    }
  }
  if (instance?.values !== undefined) {
    const masterValues = object(master.values ?? {}, `cards.${instance.card}.values`);
    for (const [valueId, value] of Object.entries(object(instance.values, `${location}.values`))) {
      reference(valueId, attributes, `${location}.values.${valueId}`);
      if (!(valueId in masterValues)) {
        throw new Error(`${location}.values.${valueId} does not exist on master "${instance.card}"`);
      }
      number(value, `${location}.values.${valueId}`);
    }
  }
  const markers = [
    ...array(master.markers ?? [], `cards.${masterId}.markers`),
    ...array(instance?.markers ?? [], `${location}.markers`),
  ];
  const sizes = markers.filter((marker) => typeof marker === "string" && SIZE_MARKERS.has(marker));
  if (sizes.length > 1) throw new Error(`${location} has multiple size Markers`);
  if (!markers.includes("anchored") && sizes.length !== 1) {
    throw new Error(`${location} requires exactly one authored size Marker for carried Inventory legality`);
  }
}

export function validateAuthoredData(
  rawCards: unknown,
  rawRooms: unknown,
  rawAttributes: unknown,
): void {
  const cards = object(rawCards, "cards");
  const world = object(rawRooms, "rooms document");
  const rooms = object(world.rooms, "rooms document.rooms");
  const attributes = object(rawAttributes, "attributes");
  const cardIds = new Set(Object.keys(cards));
  const roomIds = new Set(Object.keys(rooms));
  const attributeIds = new Set(Object.keys(attributes));
  const referenceTargets = new Set([...cardIds, ...roomIds, ...SLOT_IDS]);

  for (const attributeId of attributeIds) {
    id(attributeId, `attributes.${attributeId}`);
    const metadata = object(attributes[attributeId], `attributes.${attributeId}`);
    string(metadata.name, `attributes.${attributeId}.name`);
    string(metadata.description, `attributes.${attributeId}.description`);
  }

  for (const cardId of cardIds) {
    id(cardId, `cards.${cardId}`);
    const card = object(cards[cardId], `cards.${cardId}`);
    string(card.name, `cards.${cardId}.name`);
    string(card.image, `cards.${cardId}.image`);
    for (const legacy of ["size", "storage", "equip"] as const) {
      if (card[legacy] !== undefined) {
        throw new Error(`cards.${cardId}.${legacy} is a removed legacy representation`);
      }
    }
    if (card.accept !== undefined) throw new Error(`cards.${cardId}.accept is a removed legacy representation`);
    if (card.when !== undefined) throw new Error(`cards.${cardId}.when is a removed legacy representation`);
    exactKeys(card, [
      "name", "image", "description", "markers", "values", "references",
      "whileEquipped", "actions", "processes",
    ], `cards.${cardId}`);
    if (card.markers !== undefined) {
      const markers = array(card.markers, `cards.${cardId}.markers`);
      for (const [index, marker] of markers.entries()) {
        reference(marker, attributeIds, `cards.${cardId}.markers[${index}]`);
      }
      if (markers.filter((marker) => typeof marker === "string" && SIZE_MARKERS.has(marker)).length > 1) {
        throw new Error(`cards.${cardId}.markers contains multiple size Markers`);
      }
    }
    if (card.values !== undefined) {
      for (const [valueId, value] of Object.entries(object(card.values, `cards.${cardId}.values`))) {
        reference(valueId, attributeIds, `cards.${cardId}.values.${valueId}`);
        number(value, `cards.${cardId}.values.${valueId}`);
        if (valueId.startsWith("storage-") && !STORAGE_VALUES.has(valueId)) {
          throw new Error(`cards.${cardId}.values.${valueId} is not an approved storage Value`);
        }
        if (STORAGE_VALUES.has(valueId) && (!Number.isInteger(value) || value < 0)) {
          throw new Error(`cards.${cardId}.values.${valueId} must be a non-negative integer`);
        }
      }
    }
    if (card.references !== undefined) {
      for (const [referenceId, target] of Object.entries(object(card.references, `cards.${cardId}.references`))) {
        id(referenceId, `cards.${cardId}.references.${referenceId}`);
        string(target, `cards.${cardId}.references.${referenceId}`);
        id(target, `cards.${cardId}.references.${referenceId}`);
        reference(target, referenceTargets, `cards.${cardId}.references.${referenceId}`);
        if (referenceId === "destination") reference(target, roomIds, `cards.${cardId}.references.destination`);
        if (referenceId === "equip") {
          reference(target, SLOT_IDS, `cards.${cardId}.references.equip`);
          if (HAND_SLOT_IDS.has(target)) {
            throw new Error(`cards.${cardId}.references.equip must target a non-Hand equipment slot`);
          }
        }
      }
    }
    if (card.whileEquipped !== undefined) {
      for (const [index, rawModifier] of array(card.whileEquipped, `cards.${cardId}.whileEquipped`).entries()) {
        const modifier = object(rawModifier, `cards.${cardId}.whileEquipped[${index}]`);
        reference(modifier.attribute, attributeIds, `cards.${cardId}.whileEquipped[${index}].attribute`);
      }
    }
    if (card.actions !== undefined) {
      const actionIds = new Set<string>();
      const applicability = new Set<string>();
      for (const [index, rawAction] of array(card.actions, `cards.${cardId}.actions`).entries()) {
        const actionLocation = `cards.${cardId}.actions[${index}]`;
        const action = object(rawAction, actionLocation);
        exactKeys(action, ["id", "name", "applicable", "effects"], actionLocation);
        string(action.id, `${actionLocation}.id`);
        id(action.id, `${actionLocation}.id`);
        if (actionIds.has(action.id)) throw new Error(`${actionLocation}.id duplicates Action ID "${action.id}"`);
        actionIds.add(action.id);
        string(action.name, `${actionLocation}.name`);
        const applicable = object(action.applicable, `${actionLocation}.applicable`);
        const directions = Object.keys(applicable);
        if (directions.length !== 1 || (directions[0] !== "on" && directions[0] !== "receive")) {
          throw new Error(`${actionLocation}.applicable must contain exactly one of on or receive`);
        }
        validateSelector(applicable[directions[0]], attributeIds, `${actionLocation}.applicable.${directions[0]}`);
        const signature = `${directions[0]}:${JSON.stringify(applicable[directions[0]])}`;
        if (applicability.has(signature)) throw new Error(`${actionLocation}.applicable duplicates an overlapping selector`);
        applicability.add(signature);
        validateEffects(action.effects, attributeIds, `${actionLocation}.effects`);
      }
    }
    if (card.processes !== undefined) {
      for (const [index, rawProcess] of array(card.processes, `cards.${cardId}.processes`).entries()) {
        const processLocation = `cards.${cardId}.processes[${index}]`;
        const process = object(rawProcess, processLocation);
        exactKeys(process, ["effects"], processLocation);
        validateEffects(process.effects, attributeIds, `${processLocation}.effects`, true);
      }
    }
  }

  reference(world.start, roomIds, "rooms document.start");
  string(world.searchBack, "rooms document.searchBack");
  for (const [index, nadirCard] of array(world.nadir, "rooms document.nadir").entries()) {
    reference(nadirCard, cardIds, `rooms document.nadir[${index}]`);
  }
  for (const roomId of roomIds) {
    id(roomId, `rooms.${roomId}`);
    const room = object(rooms[roomId], `rooms.${roomId}`);
    string(room.name, `rooms.${roomId}.name`);
    string(room.background, `rooms.${roomId}.background`);
    if (room.cards !== undefined) {
      array(room.cards, `rooms.${roomId}.cards`).forEach((instance, index) =>
        validateInstance(instance, cards, cardIds, attributeIds, `rooms.${roomId}.cards[${index}]`));
    }
    if (room.decks !== undefined) {
      for (const [deckId, rawDeck] of Object.entries(object(room.decks, `rooms.${roomId}.decks`))) {
        id(deckId, `rooms.${roomId}.decks.${deckId}`);
        const deck = object(rawDeck, `rooms.${roomId}.decks.${deckId}`);
        string(deck.name, `rooms.${roomId}.decks.${deckId}.name`);
        duration(deck.time, `rooms.${roomId}.decks.${deckId}.time`);
        array(deck.cards, `rooms.${roomId}.decks.${deckId}.cards`).forEach((instance, index) =>
          validateInstance(instance, cards, cardIds, attributeIds, `rooms.${roomId}.decks.${deckId}.cards[${index}]`));
      }
    }
    if (room.opening !== undefined) {
      const opening = object(room.opening, `rooms.${roomId}.opening`);
      reference(opening.escape, roomIds, `rooms.${roomId}.opening.escape`);
      const equipped = object(opening.equipped, `rooms.${roomId}.opening.equipped`);
      for (const [slot, instance] of Object.entries(equipped)) {
        reference(slot, SLOT_IDS, `rooms.${roomId}.opening.equipped.${slot}`);
        validateInstance(instance, cards, cardIds, attributeIds, `rooms.${roomId}.opening.equipped.${slot}`);
        if (!HAND_SLOT_IDS.has(slot)) {
          const masterId = typeof instance === "string" ? instance : object(instance, `rooms.${roomId}.opening.equipped.${slot}`).card;
          string(masterId, `rooms.${roomId}.opening.equipped.${slot}.card`);
          const master = object(cards[masterId], `cards.${masterId}`);
          const references = object(master.references ?? {}, `cards.${masterId}.references`);
          if (references.equip !== slot) {
            throw new Error(`rooms.${roomId}.opening.equipped.${slot} requires references.equip = "${slot}"`);
          }
        }
      }
      array(opening.offered, `rooms.${roomId}.opening.offered`).forEach((instance, index) =>
        validateInstance(instance, cards, cardIds, attributeIds, `rooms.${roomId}.opening.offered[${index}]`));
    }
  }
}
