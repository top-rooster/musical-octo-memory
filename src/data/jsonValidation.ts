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
const LOGICAL_LITERALS = new Set(["in-inventory", "in-room", "equipped"]);

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

function validateTarget(value: unknown, location: string): void {
  if (value !== "self" && value !== "other") throw new Error(`${location} must be "self" or "other"`);
}

function validateOptionalTarget(value: JsonObject, location: string): void {
  if (value.target !== undefined) validateTarget(value.target, `${location}.target`);
}

function oneComparison(value: JsonObject, location: string, numeric = true): string {
  const operators = Object.keys(value).filter((key) => COMPARISONS.has(key));
  if (operators.length !== 1) throw new Error(`${location} must use exactly one comparison operator`);
  if (numeric) number(value[operators[0]], `${location}.${operators[0]}`);
  return operators[0];
}

function validateCondition(value: unknown, attributes: Set<string>, location: string): void {
  if (typeof value === "string") {
    if (!LOGICAL_LITERALS.has(value)) throw new Error(`${location} has unsupported logical literal "${value}"`);
    return;
  }
  const condition = object(value, location);
  const keys = Object.keys(condition);
  if (keys.includes("marker")) {
    exactKeys(condition, ["target", "marker"], location);
    validateOptionalTarget(condition, location);
    reference(condition.marker, attributes, `${location}.marker`);
    return;
  }
  if (keys.includes("value")) {
    const operator = oneComparison(condition, location);
    exactKeys(condition, ["target", "value", operator], location);
    validateOptionalTarget(condition, location);
    reference(condition.value, attributes, `${location}.value`);
    return;
  }
  if (keys.includes("literal")) {
    exactKeys(condition, ["target", "literal"], location);
    validateOptionalTarget(condition, location);
    string(condition.literal, `${location}.literal`);
    if (!LOGICAL_LITERALS.has(condition.literal)) {
      throw new Error(`${location}.literal has unsupported logical literal "${condition.literal}"`);
    }
    return;
  }
  if (keys.length === 1 && (keys[0] === "and" || keys[0] === "or")) {
    const children = array(condition[keys[0]], `${location}.${keys[0]}`);
    if (!children.length) throw new Error(`${location}.${keys[0]} must not be empty`);
    children.forEach((child, index) => validateCondition(child, attributes, `${location}.${keys[0]}[${index}]`));
    return;
  }
  if (keys.length === 1 && keys[0] === "not") {
    validateCondition(condition.not, attributes, `${location}.not`);
    return;
  }
  if (keys.includes("count")) {
    const operator = oneComparison(condition, location);
    exactKeys(condition, ["count", operator], location);
    validateCondition(condition.count, attributes, `${location}.count`);
    return;
  }
  if (keys.includes("deck_size")) {
    exactKeys(condition, ["target", "deck_size"], location);
    validateOptionalTarget(condition, location);
    const computed = object(condition.deck_size, `${location}.deck_size`);
    const operator = oneComparison(computed, `${location}.deck_size`);
    exactKeys(computed, [operator], `${location}.deck_size`);
    return;
  }
  if (keys.length === 1 && keys[0] === "time") {
    const time = object(condition.time, `${location}.time`);
    const operator = oneComparison(time, `${location}.time`, false);
    exactKeys(time, [operator], `${location}.time`);
    const clock = time[operator];
    string(clock, `${location}.time.${operator}`);
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clock)) {
      throw new Error(`${location}.time.${operator} must be a 24-hour HH:MM time`);
    }
    return;
  }
  throw new Error(`${location} is not a supported condition expression; card-ID matching is unsupported`);
}

function validateRole(value: unknown, location: string, process = false): void {
  if (value === undefined && process) return;
  validateTarget(value, location);
  if (process && value === "other") throw new Error(`${location} cannot use "other" in a Process`);
}

function validateOperand(value: unknown, attributes: Set<string>, location: string, process = false): void {
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
  cardIds: Set<string>,
  location: string,
  process = false,
  ownerDeckCount = 0,
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
    if (keys.length === 1 && keys[0] === "add-random-card") {
      const add = object(effect["add-random-card"], `${effectLocation}.add-random-card`);
      exactKeys(add, ["count", "from", "to"], `${effectLocation}.add-random-card`);
      number(add.count, `${effectLocation}.add-random-card.count`);
      if (!Number.isInteger(add.count) || add.count <= 0) {
        throw new Error(`${effectLocation}.add-random-card.count must be a positive integer`);
      }
      const source = array(add.from, `${effectLocation}.add-random-card.from`);
      if (!source.length) throw new Error(`${effectLocation}.add-random-card.from must not be empty`);
      source.forEach((masterId, sourceIndex) =>
        reference(masterId, cardIds, `${effectLocation}.add-random-card.from[${sourceIndex}]`));
      if (add.to !== "self.deck") throw new Error(`${effectLocation}.add-random-card.to must be "self.deck"`);
      if (ownerDeckCount !== 1) {
        throw new Error(`${effectLocation}.add-random-card requires its owning card to define exactly one deck`);
      }
      continue;
    }
    throw new Error(`${effectLocation} is not a supported Action or Process effect`);
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
    const masterValues = object(master.values ?? {}, `cards.${masterId}.values`);
    for (const [valueId, value] of Object.entries(object(instance.values, `${location}.values`))) {
      reference(valueId, attributes, `${location}.values.${valueId}`);
      if (!(valueId in masterValues)) {
        throw new Error(`${location}.values.${valueId} does not exist on master "${masterId}"`);
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

function validateDecks(
  rawDecks: unknown,
  cards: JsonObject,
  cardIds: Set<string>,
  attributes: Set<string>,
  location: string,
): number {
  if (rawDecks === undefined) return 0;
  const decks = object(rawDecks, location);
  for (const [deckId, rawDeck] of Object.entries(decks)) {
    id(deckId, `${location}.${deckId}`);
    const deck = object(rawDeck, `${location}.${deckId}`);
    exactKeys(deck, ["name", "time", "cards"], `${location}.${deckId}`);
    string(deck.name, `${location}.${deckId}.name`);
    duration(deck.time, `${location}.${deckId}.time`);
    array(deck.cards, `${location}.${deckId}.cards`).forEach((instance, index) =>
      validateInstance(instance, cards, cardIds, attributes, `${location}.${deckId}.cards[${index}]`));
  }
  return Object.keys(decks).length;
}

export function validateAuthoredData(rawCards: unknown, rawRooms: unknown, rawAttributes: unknown): void {
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
    for (const legacy of ["size", "storage", "equip", "whileEquipped"] as const) {
      if (card[legacy] !== undefined) throw new Error(`cards.${cardId}.${legacy} is a removed legacy representation`);
    }
    if (card.accept !== undefined || card.when !== undefined) {
      throw new Error(`cards.${cardId} contains a removed legacy representation`);
    }
    exactKeys(card, [
      "name", "image", "description", "markers", "values", "references",
      "passives", "actions", "processes", "decks",
    ], `cards.${cardId}`);
    if (card.markers !== undefined) {
      const markers = array(card.markers, `cards.${cardId}.markers`);
      markers.forEach((marker, index) => reference(marker, attributeIds, `cards.${cardId}.markers[${index}]`));
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
    const deckCount = validateDecks(card.decks, cards, cardIds, attributeIds, `cards.${cardId}.decks`);
    if (card.passives !== undefined) {
      for (const [index, rawPassive] of array(card.passives, `cards.${cardId}.passives`).entries()) {
        const passiveLocation = `cards.${cardId}.passives[${index}]`;
        const passive = object(rawPassive, passiveLocation);
        exactKeys(passive, ["if", "effects"], passiveLocation);
        validateCondition(passive.if, attributeIds, `${passiveLocation}.if`);
        for (const [effectIndex, rawEffect] of array(passive.effects, `${passiveLocation}.effects`).entries()) {
          const effectLocation = `${passiveLocation}.effects[${effectIndex}]`;
          const effect = object(rawEffect, effectLocation);
          exactKeys(effect, ["target", "value", "+="], effectLocation);
          if (effect.target !== "nadir") throw new Error(`${effectLocation}.target must be "nadir"`);
          reference(effect.value, attributeIds, `${effectLocation}.value`);
          number(effect["+="], `${effectLocation}.+=`);
        }
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
        validateCondition(applicable[directions[0]], attributeIds, `${actionLocation}.applicable.${directions[0]}`);
        const signature = `${directions[0]}:${JSON.stringify(applicable[directions[0]])}`;
        if (applicability.has(signature)) throw new Error(`${actionLocation}.applicable duplicates an overlapping selector`);
        applicability.add(signature);
        validateEffects(action.effects, attributeIds, cardIds, `${actionLocation}.effects`, false, deckCount);
      }
    }
    if (card.processes !== undefined) {
      for (const [index, rawProcess] of array(card.processes, `cards.${cardId}.processes`).entries()) {
        const processLocation = `cards.${cardId}.processes[${index}]`;
        const process = object(rawProcess, processLocation);
        exactKeys(process, ["if", "effects"], processLocation);
        if (process.if !== undefined) validateCondition(process.if, attributeIds, `${processLocation}.if`);
        validateEffects(process.effects, attributeIds, cardIds, `${processLocation}.effects`, true, deckCount);
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
      array(room.cards, `rooms.${roomId}.cards`).forEach((entry, index) =>
        validateInstance(entry, cards, cardIds, attributeIds, `rooms.${roomId}.cards[${index}]`));
    }
    validateDecks(room.decks, cards, cardIds, attributeIds, `rooms.${roomId}.decks`);
    if (room.opening !== undefined) {
      const opening = object(room.opening, `rooms.${roomId}.opening`);
      reference(opening.escape, roomIds, `rooms.${roomId}.opening.escape`);
      const equipped = object(opening.equipped, `rooms.${roomId}.opening.equipped`);
      for (const [slot, entry] of Object.entries(equipped)) {
        reference(slot, SLOT_IDS, `rooms.${roomId}.opening.equipped.${slot}`);
        validateInstance(entry, cards, cardIds, attributeIds, `rooms.${roomId}.opening.equipped.${slot}`);
        if (!HAND_SLOT_IDS.has(slot)) {
          const masterId = typeof entry === "string" ? entry : object(entry, `rooms.${roomId}.opening.equipped.${slot}`).card;
          string(masterId, `rooms.${roomId}.opening.equipped.${slot}.card`);
          const references = object(object(cards[masterId], `cards.${masterId}`).references ?? {}, `cards.${masterId}.references`);
          if (references.equip !== slot) {
            throw new Error(`rooms.${roomId}.opening.equipped.${slot} requires references.equip = "${slot}"`);
          }
        }
      }
      array(opening.offered, `rooms.${roomId}.opening.offered`).forEach((entry, index) =>
        validateInstance(entry, cards, cardIds, attributeIds, `rooms.${roomId}.opening.offered[${index}]`));
    }
  }
}
