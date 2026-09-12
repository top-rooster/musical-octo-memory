import type {
  AcceptanceDefinition,
  ActionEffect,
  CardAttribute,
  CardMaster,
  EquipmentSlot,
  GamePhase,
  ItemSize,
  LightLevel,
  ProcessDefinition,
  ThresholdDefinition,
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

function action(raw: JsonObject) {
  return {
    name: raw.name as string | undefined,
    time: raw.time as string,
    baseMinutes: minutes(raw.time),
    effects: raw.effects as ActionEffect[],
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
      size: raw.size as ItemSize | undefined,
      equipSlots: (raw.equip ?? []) as EquipmentSlot[],
      storage: raw.storage && {
        size: raw.storage.size as ItemSize,
        count: raw.storage.count,
        phase: raw.storage.phase as GamePhase | undefined,
      },
      whileEquipped: raw.whileEquipped ?? [],
      accept: (raw.accept ?? []).map((entry: JsonObject): AcceptanceDefinition => ({
        card: entry.card,
        markers: entry.markers,
        action: action(entry.action),
      })),
      processes: (raw.processes ?? []).map((process: JsonObject): ProcessDefinition => ({
        interval: process.interval,
        intervalMinutes: minutes(process.interval),
        effects: process.effects,
      })),
      when: (raw.when ?? []).map((entry: JsonObject): ThresholdDefinition => ({
        value: entry.value, equals: entry.equals, effects: entry.effects,
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
  return { masterId, attributes: result };
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
