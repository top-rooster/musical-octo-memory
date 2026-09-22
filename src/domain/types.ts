export type Zone = "room" | "inventory";
export type GamePhase = "opening" | "main";
export type ItemSize = "Small" | "Medium" | "Large";
export type LightLevel = "Bright" | "Dim" | "Twilight" | "Darkness";
export type EquipmentSlot =
  | "left-hand"
  | "right-hand"
  | "head"
  | "eyes"
  | "trinket-1"
  | "trinket-2"
  | "chest"
  | "back"
  | "legs"
  | "feet";

export interface Position { x: number; y: number; }
export interface Bounds { x: number; y: number; width: number; height: number; }
export interface MarkerAttribute { kind: "marker"; id: string; }
export interface ValueAttribute { kind: "value"; id: string; value: number; min: number; max: number; }
export type CardAttribute = MarkerAttribute | ValueAttribute;

export type ActionRole = "self" | "other";
export type ComparisonOperator = ">" | ">=" | "<" | "<=" | "=" | "<>";
export type PlacementLiteral = "in-inventory" | "in-room" | "equipped";
export interface MarkerCondition { kind: "marker"; target?: ActionRole; marker: string; }
export interface ValueCondition {
  kind: "value";
  target?: ActionRole;
  value: string;
  operator: ComparisonOperator;
  operand: number;
}
export interface LiteralCondition { kind: "literal"; target?: ActionRole; literal: PlacementLiteral; }
export interface AndCondition { kind: "and"; conditions: LogicCondition[]; }
export interface OrCondition { kind: "or"; conditions: LogicCondition[]; }
export interface NotCondition { kind: "not"; condition: LogicCondition; }
export interface CountCondition {
  kind: "count";
  condition: LogicCondition;
  operator: ComparisonOperator;
  operand: number;
}
export interface DeckSizeCondition {
  kind: "deck-size";
  target?: ActionRole;
  operator: ComparisonOperator;
  operand: number;
}
export interface TimeCondition {
  kind: "time";
  operator: ComparisonOperator;
  operandMinutes: number;
}
export type LogicCondition = MarkerCondition | ValueCondition | LiteralCondition |
  AndCondition | OrCondition | NotCondition | CountCondition | DeckSizeCondition | TimeCondition;
export type ActionSelector = LogicCondition;

export interface ValueOperand { target: ActionRole; value: string; }
export interface AddMarkerEffect { kind: "add-marker"; target?: ActionRole; marker: string; }
export interface RemoveMarkerEffect { kind: "remove-marker"; target?: ActionRole; marker: string; }
export interface ChangeValueEffect {
  kind: "value";
  target?: ActionRole;
  value: string;
  operator: "=" | "+=" | "-=";
  operand: number | ValueOperand;
}
export interface DiscardEffect { kind: "discard"; target?: ActionRole; }
export interface SetRoomEffect { kind: "set-room"; target: ActionRole; reference: string; }
export interface SpendTimeEffect { kind: "spend-time"; operand: number | ValueOperand; }
export interface AddRandomCardEffect {
  kind: "add-random-card";
  count: number;
  from: string[];
  to: "self.deck";
}
export type ActionEffect = AddMarkerEffect | RemoveMarkerEffect | ChangeValueEffect |
  DiscardEffect | SetRoomEffect | SpendTimeEffect | AddRandomCardEffect;
export interface ActionDefinition {
  id: string;
  name: string;
  applicable: { direction: "on" | "receive"; selector: ActionSelector };
  effects: ActionEffect[];
}
export interface ProcessDefinition { condition?: LogicCondition; effects: ActionEffect[]; }
export interface PassiveValueEffect {
  target: "nadir";
  value: string;
  operator: "+=";
  operand: number;
}
export interface PassiveDefinition { condition: LogicCondition; effects: PassiveValueEffect[]; }

export interface DeckCardDefinition {
  masterId: string;
  attributes: CardAttribute[];
  references: Record<string, string>;
}
export interface DeckDefinition {
  id: string;
  name: string;
  baseMinutes: number;
  cards: DeckCardDefinition[];
}

export interface CardMaster {
  id: string;
  title: string;
  image: string;
  description?: string;
  attributes: CardAttribute[];
  references: Record<string, string>;
  passives: PassiveDefinition[];
  actions: ActionDefinition[];
  processes: ProcessDefinition[];
  decks: DeckDefinition[];
}

export interface CardInstance {
  id: string;
  masterId: string;
  title: string;
  image: string;
  description?: string;
  attributes: CardAttribute[];
  references: Record<string, string>;
  zone: Zone;
  homeZone?: Zone;
  roomId?: string;
  equipmentSlot?: EquipmentSlot;
  stackRootId?: string;
  nadirState?: boolean;
  offered?: boolean;
  animation?: "draw";
  drawOrigin?: Position;
  position: Position;
}

export interface DeckCardState {
  id: string;
  masterId: string;
  attributes: CardAttribute[];
  references: Record<string, string>;
}
export interface DeckOwner { kind: "room" | "card"; id: string; }
export interface DeckState {
  id: string;
  definitionId: string;
  name: string;
  baseMinutes: number;
  owner: DeckOwner;
  position?: Position;
  cards: DeckCardState[];
}
export interface RoomRuntimeState {
  id: string;
  name: string;
  background: string;
  light: LightLevel;
  discovered: boolean;
}

export interface GameState {
  masters: CardMaster[];
  cards: CardInstance[];
  phase?: GamePhase;
  currentRoomId?: string;
  rooms?: Record<string, RoomRuntimeState>;
  decks?: DeckState[];
  elapsedMinutes?: number;
  nextEntitySerial?: number;
  gameOver?: boolean;
  openingTakeLimit?: number;
  openingEscapeRoomId?: string;
  searchBack?: string;
}
