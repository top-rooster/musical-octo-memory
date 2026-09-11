export type Zone = "room" | "inventory";
export type GamePhase = "opening" | "main";
export type ItemSize = "Small" | "Medium" | "Large";
export type LightLevel = "Bright" | "Dim" | "Twilight" | "Darkness";
export type EquipmentSlot =
  | "Left Hand"
  | "Right Hand"
  | "Head"
  | "Eyes"
  | "Neck"
  | "Chest"
  | "Back"
  | "Legs"
  | "Feet";

export interface Position { x: number; y: number; }
export interface Bounds { x: number; y: number; width: number; height: number; }
export interface MarkerAttribute { kind: "marker"; name: string; }
export interface ValueAttribute { kind: "value"; name: string; value: number; min: number; max: number; }
export type CardAttribute = MarkerAttribute | ValueAttribute;

export interface ChangeValueEffect {
  kind: "change-value";
  attribute: string;
  amount: number;
  recipient: "target";
}
export interface ConsumeSourceEffect { kind: "consume-source"; }
export type InteractionEffect = ChangeValueEffect | ConsumeSourceEffect;
export interface InteractionDefinition {
  kind: "eat";
  targetTitle: string;
  effects: InteractionEffect[];
}

export interface StorageEffect { size: ItemSize; count: number; phase?: GamePhase; }
export interface EquippedModifier { attribute: string; amount: number; }

export interface CardMaster {
  id: string;
  title: string;
  image: string;
  description?: string;
  attributes: CardAttribute[];
  interactions: InteractionDefinition[];
  size?: ItemSize;
  equipSlots: EquipmentSlot[];
  storage?: StorageEffect;
  whileEquipped: EquippedModifier[];
}

export interface TravelDefinition { destinationRoomId: string; baseMinutes: number; }

export interface CardInstance {
  id: string;
  masterId: string;
  title: string;
  image: string;
  description?: string;
  attributes: CardAttribute[];
  zone: Zone;
  homeZone?: Zone;
  roomId?: string;
  equipmentSlot?: EquipmentSlot;
  stackRootId?: string;
  offered?: boolean;
  travel?: TravelDefinition;
  animation?: "draw";
  drawOrigin?: Position;
  position: Position;
}

export interface DeckCardState {
  id: string;
  masterId: string;
  attributes: CardAttribute[];
  travel?: TravelDefinition;
}
export interface SearchDeckState {
  id: string;
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
  openingTakeLimit?: number;
  openingEscapeRoomId?: string;
  searchBack?: string;
}
