import type {
  ActionDefinition,
  ActionEffect,
  ActionRole,
  ActionSelector,
  CardAttribute,
  CardMaster,
  ComparisonOperator,
  EquipmentSlot,
  LightLevel,
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

function minutes(duration: string): number {
  const match = duration.match(/^(\d+)(m|h)$/)!;
  return Number(match[1]) * (match[2] === "h" ? 60 : 1);
}

function attributes(card: JsonObject): CardAttribute[] {
  return [
    ...(card.markers ?? []).map((id: string) => ({ kind: "marker" as const, id })),
    ...Object.entries(card.values ?? {}).map(([id, value]) => ({
      kind: "value" as const, id, value: value as number, min: 0, max: 100,
    })),
  ];
}

function selector(raw: JsonObject): ActionSelector {
  if (raw.marker !== undefined) return { kind: "marker", marker: raw.marker };
  if (raw.value !== undefined) {
    const operator = ([">", ">=", "<", "<=", "=", "<>"] as ComparisonOperator[])
      .find((candidate) => raw[candidate] !== undefined)!;
    return { kind: "value", value: raw.value, operator, operand: raw[operator] };
  }
  if (raw.and !== undefined) return { kind: "and", selectors: raw.and.map(selector) };
  if (raw.or !== undefined) return { kind: "or", selectors: raw.or.map(selector) };
  return { kind: "not", selector: selector(raw.not) };
}

function operand(raw: number | JsonObject): number | ValueOperand {
  return typeof raw === "number" ? raw : { target: raw.target as ActionRole, value: raw.value };
}

function effect(raw: JsonObject): ActionEffect {
  if (raw["add-marker"] !== undefined) {
    return { kind: "add-marker", target: raw.target, marker: raw["add-marker"] };
  }
  if (raw["remove-marker"] !== undefined) {
    return { kind: "remove-marker", target: raw.target, marker: raw["remove-marker"] };
  }
  if (raw.value !== undefined) {
    const operator = (["=", "+=", "-="] as const).find((candidate) => raw[candidate] !== undefined)!;
    return { kind: "value", target: raw.target, value: raw.value, operator, operand: operand(raw[operator]) };
  }
  if (raw.discard !== undefined) return { kind: "discard", target: raw.target };
  if (raw["set-room"] !== undefined) {
    return {
      kind: "set-room",
      target: raw["set-room"].target,
      reference: raw["set-room"].reference,
    };
  }
  return { kind: "spend-time", operand: operand(raw["spend-time"]) };
}

function action(raw: JsonObject): ActionDefinition {
  const direction = raw.applicable.on !== undefined ? "on" : "receive";
  return {
    id: raw.id,
    name: raw.name,
    applicable: { direction, selector: selector(raw.applicable[direction]) },
    effects: raw.effects.map(effect),
  };
}

export function loadCardMasters(rawCards: unknown): CardMaster[] {
  return Object.entries(rawCards as JsonObject).map(([id, rawValue]) => {
    const raw = rawValue as JsonObject;
    return {
      id,
      title: raw.name,
      image: raw.image,
      description: raw.description,
      attributes: attributes(raw),
      references: { ...(raw.references ?? {}) },
      whileEquipped: raw.whileEquipped ?? [],
      actions: (raw.actions ?? []).map(action),
      processes: (raw.processes ?? []).map((process: JsonObject): ProcessDefinition => ({
        effects: process.effects.map(effect),
      })),
    };
  });
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
      decks: Object.entries(room.decks ?? {}).map(([deckId, deckValue]) => {
        const deck = deckValue as JsonObject;
        return {
          id: deckId,
          name: deck.name,
          baseMinutes: minutes(deck.time),
          cards: deck.cards.map((card: string | JsonObject) => instance(card, masters)),
        };
      }),
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
