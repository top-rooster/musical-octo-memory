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
export interface MarkerSelector { kind: "marker"; marker: string; }
export interface ValueSelector {
  kind: "value";
  value: string;
  operator: ComparisonOperator;
  operand: number;
}
export interface AndSelector { kind: "and"; selectors: ActionSelector[]; }
export interface OrSelector { kind: "or"; selectors: ActionSelector[]; }
export interface NotSelector { kind: "not"; selector: ActionSelector; }
export type ActionSelector = MarkerSelector | ValueSelector | AndSelector | OrSelector | NotSelector;

export interface ValueOperand { target: ActionRole; value: string; }
export interface AddMarkerEffect { kind: "add-marker"; target: ActionRole; marker: string; }
export interface RemoveMarkerEffect { kind: "remove-marker"; target: ActionRole; marker: string; }
export interface ChangeValueEffect {
  kind: "value";
  target: ActionRole;
  value: string;
  operator: "=" | "+=" | "-=";
  operand: number | ValueOperand;
}
export interface DiscardEffect { kind: "discard"; target: ActionRole; }
export interface SetRoomEffect { kind: "set-room"; target: ActionRole; reference: string; }
export interface SpendTimeEffect { kind: "spend-time"; operand: number | ValueOperand; }
export type ActionEffect = AddMarkerEffect | RemoveMarkerEffect | ChangeValueEffect |
  DiscardEffect | SetRoomEffect | SpendTimeEffect;
export interface ActionDefinition {
  id: string;
  name: string;
  applicable: { direction: "on" | "receive"; selector: ActionSelector };
  effects: ActionEffect[];
}
export interface ProcessDefinition { effects: ActionEffect[]; }

export interface EquippedModifier { attribute: string; amount: number; }

export interface CardMaster {
  id: string;
  title: string;
  image: string;
  description?: string;
  attributes: CardAttribute[];
  references: Record<string, string>;
  whileEquipped: EquippedModifier[];
  actions: ActionDefinition[];
  processes: ProcessDefinition[];
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
export interface SearchDeckState {
  id: string;
  definitionId: string;
  name: string;
  baseMinutes: number;
  position: Position;
  cards: DeckCardState[];
}
export interface RoomRuntimeState {
  id: string;
  name: string;
  background: string;
  light: LightLevel;
  discovered: boolean;
  decks: SearchDeckState[];
}

export interface GameState {
  masters: CardMaster[];
  cards: CardInstance[];
  phase?: GamePhase;
  currentRoomId?: string;
  rooms?: Record<string, RoomRuntimeState>;
  elapsedMinutes?: number;
  gameOver?: boolean;
  openingTakeLimit?: number;
  openingEscapeRoomId?: string;
  searchBack?: string;
}
