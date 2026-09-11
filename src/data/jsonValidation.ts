type JsonObject = Record<string, unknown>;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLOT_IDS = new Set([
  "left-hand", "right-hand", "head", "eyes", "trinket-1", "trinket-2",
  "chest", "back", "legs", "feet",
]);

function object(value: unknown, location: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${location} must be an object`);
  }
  return value as JsonObject;
}

function id(value: string, location: string): void {
  if (!ID_PATTERN.test(value)) throw new Error(`${location} must be a lowercase kebab-case ID`);
}

function string(value: unknown, location: string): asserts value is string {
  if (typeof value !== "string" || !value) throw new Error(`${location} must be a non-empty string`);
}

function duration(value: unknown, location: string): void {
  string(value, location);
  if (!/^\d+(?:m|h)$/.test(value)) throw new Error(`${location} must be an explicit duration`);
}

function array(value: unknown, location: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${location} must be an array`);
  return value;
}

function reference(value: unknown, known: Set<string>, location: string): asserts value is string {
  string(value, location);
  if (!known.has(value)) throw new Error(`${location} references unknown ID "${value}"`);
}

function validateAttributeIds(value: unknown, attributes: Set<string>, location: string): void {
  for (const [attributeId] of Object.entries(object(value, location))) {
    id(attributeId, `${location}.${attributeId}`);
    reference(attributeId, attributes, `${location}.${attributeId}`);
  }
}

function validateEffects(
  value: unknown,
  cards: Set<string>,
  rooms: Set<string>,
  attributes: Set<string>,
  location: string,
): void {
  for (const [index, rawEffect] of array(value, location).entries()) {
    const effect = object(rawEffect, `${location}[${index}]`);
    if (effect.change !== undefined) reference(effect.change, attributes, `${location}[${index}].change`);
    if (effect.add !== undefined) reference(effect.add, attributes, `${location}[${index}].add`);
    if (effect.remove !== undefined) reference(effect.remove, attributes, `${location}[${index}].remove`);
    if (effect.draw !== undefined) reference(effect.draw, cards, `${location}[${index}].draw`);
    if (effect.go !== undefined) reference(effect.go, rooms, `${location}[${index}].go`);
    if (effect.target !== undefined && effect.target !== "source" && effect.target !== "receiver") {
      reference(effect.target, cards, `${location}[${index}].target`);
    }
  }
}

function validateInstance(
  raw: unknown,
  cards: JsonObject,
  cardIds: Set<string>,
  attributes: Set<string>,
  location: string,
): void {
  if (typeof raw === "string") {
    reference(raw, cardIds, location);
    return;
  }
  const instance = object(raw, location);
  reference(instance.card, cardIds, `${location}.card`);
  const master = object(cards[instance.card], `cards.${instance.card}`);
  if (instance.markers !== undefined) {
    for (const [index, marker] of array(instance.markers, `${location}.markers`).entries()) {
      reference(marker, attributes, `${location}.markers[${index}]`);
    }
  }
  if (instance.values !== undefined) {
    const masterValues = object(master.values ?? {}, `cards.${instance.card}.values`);
    for (const valueId of Object.keys(object(instance.values, `${location}.values`))) {
      reference(valueId, attributes, `${location}.values.${valueId}`);
      if (!(valueId in masterValues)) {
        throw new Error(`${location}.values.${valueId} does not exist on master "${instance.card}"`);
      }
    }
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
    if (card.markers !== undefined) {
      for (const [index, marker] of array(card.markers, `cards.${cardId}.markers`).entries()) {
        reference(marker, attributeIds, `cards.${cardId}.markers[${index}]`);
      }
    }
    if (card.values !== undefined) validateAttributeIds(card.values, attributeIds, `cards.${cardId}.values`);
    if (card.equip !== undefined) {
      for (const [index, slot] of array(card.equip, `cards.${cardId}.equip`).entries()) {
        reference(slot, SLOT_IDS, `cards.${cardId}.equip[${index}]`);
      }
    }
    if (card.whileEquipped !== undefined) {
      for (const [index, rawModifier] of array(card.whileEquipped, `cards.${cardId}.whileEquipped`).entries()) {
        const modifier = object(rawModifier, `cards.${cardId}.whileEquipped[${index}]`);
        reference(modifier.attribute, attributeIds, `cards.${cardId}.whileEquipped[${index}].attribute`);
      }
    }
    if (card.accept !== undefined) {
      for (const [index, rawAcceptance] of array(card.accept, `cards.${cardId}.accept`).entries()) {
        const acceptance = object(rawAcceptance, `cards.${cardId}.accept[${index}]`);
        if (acceptance.card !== undefined) reference(acceptance.card, cardIds, `cards.${cardId}.accept[${index}].card`);
        if (acceptance.markers !== undefined) {
          for (const [markerIndex, marker] of array(acceptance.markers, `cards.${cardId}.accept[${index}].markers`).entries()) {
            reference(marker, attributeIds, `cards.${cardId}.accept[${index}].markers[${markerIndex}]`);
          }
        }
        if (acceptance.requires !== undefined) {
          const requires = object(acceptance.requires, `cards.${cardId}.accept[${index}].requires`);
          for (const [markerIndex, marker] of array(requires.markers, `cards.${cardId}.accept[${index}].requires.markers`).entries()) {
            reference(marker, attributeIds, `cards.${cardId}.accept[${index}].requires.markers[${markerIndex}]`);
          }
        }
        const action = object(acceptance.action, `cards.${cardId}.accept[${index}].action`);
        duration(action.time, `cards.${cardId}.accept[${index}].action.time`);
        validateEffects(action.effects, cardIds, roomIds, attributeIds, `cards.${cardId}.accept[${index}].action.effects`);
      }
    }
    if (card.processes !== undefined) {
      for (const [index, rawProcess] of array(card.processes, `cards.${cardId}.processes`).entries()) {
        const process = object(rawProcess, `cards.${cardId}.processes[${index}]`);
        duration(process.interval, `cards.${cardId}.processes[${index}].interval`);
        if (process.effects !== undefined) validateEffects(process.effects, cardIds, roomIds, attributeIds, `cards.${cardId}.processes[${index}].effects`);
        if (process.change !== undefined) reference(process.change, attributeIds, `cards.${cardId}.processes[${index}].change`);
        if (process.amountByValue !== undefined) {
          const conditional = object(process.amountByValue, `cards.${cardId}.processes[${index}].amountByValue`);
          reference(conditional.value, attributeIds, `cards.${cardId}.processes[${index}].amountByValue.value`);
        }
      }
    }
    if (card.when !== undefined) {
      for (const [index, rawWhen] of array(card.when, `cards.${cardId}.when`).entries()) {
        const when = object(rawWhen, `cards.${cardId}.when[${index}]`);
        reference(when.value, attributeIds, `cards.${cardId}.when[${index}].value`);
        validateEffects(when.effects, cardIds, roomIds, attributeIds, `cards.${cardId}.when[${index}].effects`);
      }
    }
  }

  reference(world.start, roomIds, "rooms document.start");
  string(world.searchBack, "rooms document.searchBack");
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
      }
      array(opening.offered, `rooms.${roomId}.opening.offered`).forEach((instance, index) =>
        validateInstance(instance, cards, cardIds, attributeIds, `rooms.${roomId}.opening.offered[${index}]`));
    }
  }
}
