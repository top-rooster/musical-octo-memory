import type {
  ActionDefinition,
  ActionEffect,
  ActionRole,
  CardAttribute,
  CardMaster,
  ComparisonOperator,
  DeckDefinition,
  EquipmentSlot,
  LightLevel,
  LogicCondition,
  PassiveDefinition,
  PassiveValueEffect,
  PlacementLiteral,
  ProcessDefinition,
  ValueOperand,
} from "../domain/types";
import type {
  CardInstanceDefinition,
  EquippedDefinition,
  RoomDefinition,
  WorldDefinition,
} from "./worldDefinition";
import { validateAuthoredData } from "./jsonValidation";

type JsonObject = Record<string, any>;
const COMPARISONS: ComparisonOperator[] = [">", ">=", "<", "<=", "=", "<>"];

function minutes(duration: string): number {
  const match = duration.match(/^(\d+)(m|h)$/)!;
  return Number(match[1]) * (match[2] === "h" ? 60 : 1);
}

function clockMinutes(clock: string): number {
  const [hours, rest] = clock.split(":").map(Number);
  return hours * 60 + rest;
}

function attributes(card: JsonObject): CardAttribute[] {
  return [
    ...(card.markers ?? []).map((id: string) => ({ kind: "marker" as const, id })),
    ...Object.entries(card.values ?? {}).map(([id, value]) => ({
      kind: "value" as const, id, value: value as number, min: 0, max: 100,
    })),
  ];
}

function comparison(raw: JsonObject): { operator: ComparisonOperator; operand: number } {
  const operator = COMPARISONS.find((candidate) => raw[candidate] !== undefined)!;
  return { operator, operand: raw[operator] };
}

export function condition(raw: string | JsonObject): LogicCondition {
  if (typeof raw === "string") {
    return { kind: "literal", literal: raw as PlacementLiteral };
  }
  if (raw.marker !== undefined) return { kind: "marker", target: raw.target, marker: raw.marker };
  if (raw.value !== undefined) {
    return { kind: "value", target: raw.target, value: raw.value, ...comparison(raw) };
  }
  if (raw.literal !== undefined) {
    return { kind: "literal", target: raw.target, literal: raw.literal };
  }
  if (raw.and !== undefined) return { kind: "and", conditions: raw.and.map(condition) };
  if (raw.or !== undefined) return { kind: "or", conditions: raw.or.map(condition) };
  if (raw.not !== undefined) return { kind: "not", condition: condition(raw.not) };
  if (raw.count !== undefined) {
    return { kind: "count", condition: condition(raw.count), ...comparison(raw) };
  }
  if (raw.deck_size !== undefined) {
    return { kind: "deck-size", target: raw.target, ...comparison(raw.deck_size) };
  }
  const timeComparison = comparison(raw.time);
  return {
    kind: "time",
    operator: timeComparison.operator,
    operandMinutes: clockMinutes(raw.time[timeComparison.operator]),
  };
}

function operand(raw: number | JsonObject): number | ValueOperand {
  return typeof raw === "number" ? raw : { target: raw.target as ActionRole, value: raw.value };
}

function effect(raw: JsonObject, process = false): ActionEffect {
  const target = raw.target ?? (process ? "self" : undefined);
  if (raw["add-marker"] !== undefined) {
    return { kind: "add-marker", target, marker: raw["add-marker"] };
  }
  if (raw["remove-marker"] !== undefined) {
    return { kind: "remove-marker", target, marker: raw["remove-marker"] };
  }
  if (raw.value !== undefined) {
    const operator = (["=", "+=", "-="] as const).find((candidate) => raw[candidate] !== undefined)!;
    return { kind: "value", target, value: raw.value, operator, operand: operand(raw[operator]) };
  }
  if (raw.discard !== undefined) return { kind: "discard", target };
  if (raw["set-room"] !== undefined) {
    return {
      kind: "set-room",
      target: raw["set-room"].target,
      reference: raw["set-room"].reference,
    };
  }
  if (raw["add-random-card"] !== undefined) {
    return {
      kind: "add-random-card",
      count: raw["add-random-card"].count,
      from: [...raw["add-random-card"].from],
      to: raw["add-random-card"].to,
    };
  }
  return { kind: "spend-time", operand: operand(raw["spend-time"]) };
}

function action(raw: JsonObject): ActionDefinition {
  const direction = raw.applicable.on !== undefined ? "on" : "receive";
  return {
    id: raw.id,
    name: raw.name,
    applicable: { direction, selector: condition(raw.applicable[direction]) },
    effects: raw.effects.map((rawEffect: JsonObject) => effect(rawEffect)),
  };
}

function passive(raw: JsonObject): PassiveDefinition {
  return {
    condition: condition(raw.if),
    effects: raw.effects.map((rawEffect: JsonObject): PassiveValueEffect => ({
      target: rawEffect.target,
      value: rawEffect.value,
      operator: "+=",
      operand: rawEffect["+="],
    })),
  };
}

function instance(raw: string | JsonObject, masters: CardMaster[]): CardInstanceDefinition {
  const masterId = typeof raw === "string" ? raw : raw.card;
  const master = masters.find((candidate) => candidate.id === masterId)!;
  const result = master.attributes.map((attribute) => ({ ...attribute }));
  if (typeof raw !== "string") {
    for (const marker of raw.markers ?? []) {
      if (!result.some((attribute) => attribute.kind === "marker" && attribute.id === marker)) {
        result.push({ kind: "marker", id: marker });
      }
    }
    for (const [valueId, value] of Object.entries(raw.values ?? {})) {
      const current = result.find((attribute) => attribute.kind === "value" && attribute.id === valueId);
      if (current?.kind === "value") current.value = value as number;
    }
  }
  return { masterId, attributes: result, references: { ...master.references } };
}

function deckDefinitions(rawDecks: JsonObject | undefined, masters: CardMaster[]): DeckDefinition[] {
  return Object.entries(rawDecks ?? {}).map(([id, rawValue]) => {
    const raw = rawValue as JsonObject;
    return {
      id,
      name: raw.name,
      baseMinutes: minutes(raw.time),
      cards: raw.cards.map((card: string | JsonObject) => instance(card, masters)),
    };
  });
}

export function loadCardMasters(rawCards: unknown): CardMaster[] {
  const entries = Object.entries(rawCards as JsonObject);
  const masters: CardMaster[] = entries.map(([id, rawValue]) => {
    const raw = rawValue as JsonObject;
    return {
      id,
      title: raw.name,
      image: raw.image,
      description: raw.description,
      attributes: attributes(raw),
      references: { ...(raw.references ?? {}) },
      passives: (raw.passives ?? []).map(passive),
      actions: (raw.actions ?? []).map(action),
      processes: (raw.processes ?? []).map((process: JsonObject): ProcessDefinition => ({
        condition: process.if === undefined ? undefined : condition(process.if),
        effects: process.effects.map((rawEffect: JsonObject) => effect(rawEffect, true)),
      })),
      decks: [],
    };
  });
  return masters.map((master) => ({
    ...master,
    decks: deckDefinitions((rawCards as JsonObject)[master.id].decks, masters),
  }));
}

export function loadWorldDefinition(rawWorld: unknown, masters: CardMaster[]): WorldDefinition {
  const raw = rawWorld as JsonObject;
  const rooms: RoomDefinition[] = Object.entries(raw.rooms as JsonObject).map(([id, value]) => {
    const room = value as JsonObject;
    const opening = room.opening as JsonObject | undefined;
    const equipped: EquippedDefinition[] = Object.entries(opening?.equipped ?? {}).map(([slot, card]) => ({
      ...instance(card as string | JsonObject, masters), slot: slot as EquipmentSlot,
    }));
    return {
      id,
      name: room.name,
      background: room.background,
      light: room.light as LightLevel,
      takeLimit: opening?.takeLimit,
      escapeRoomId: opening?.escape,
      nadir: id === raw.start ? raw.nadir.map((card: string | JsonObject) => instance(card, masters)) : [],
      equipped,
      offered: (opening?.offered ?? []).map((card: string | JsonObject) => instance(card, masters)),
      cards: (room.cards ?? []).map((card: string | JsonObject) => instance(card, masters)),
      decks: deckDefinitions(room.decks, masters),
    };
  });
  return { startRoomId: raw.start, searchBack: raw.searchBack, rooms };
}

export function loadAuthoredData(rawCards: unknown, rawRooms: unknown, rawAttributes: unknown) {
  validateAuthoredData(rawCards, rawRooms, rawAttributes);
  const masters = loadCardMasters(rawCards);
  return {
    masters,
    world: loadWorldDefinition(rawRooms, masters),
    attributes: rawAttributes as Record<string, { name: string; description: string }>,
  };
}
