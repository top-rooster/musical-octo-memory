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

export type EffectTarget = "source" | "receiver";
export interface ChangeValueEffect { change: string; amount: number; target?: EffectTarget; }
export interface AddMarkerEffect { add: string; target: EffectTarget; }
export interface RemoveMarkerEffect { remove: string; target: EffectTarget; }
export interface DiscardEffect { discard: EffectTarget; }
export interface DrawEffect { draw: string; }
export interface GoEffect { go: string; }
export interface GameOverEffect { gameOver: true; }
export type ActionEffect = ChangeValueEffect | AddMarkerEffect | RemoveMarkerEffect |
  DiscardEffect | DrawEffect | GoEffect | GameOverEffect;
export interface ActionDefinition { name?: string; time: string; baseMinutes: number; effects: ActionEffect[]; }
export interface AcceptanceDefinition { card?: string; markers?: string[]; action: ActionDefinition; }
export interface ProcessDefinition { interval: string; intervalMinutes: number; effects: ActionEffect[]; }
export interface ThresholdDefinition { value: string; equals: number; effects: ActionEffect[]; }

export interface StorageEffect { size: ItemSize; count: number; phase?: GamePhase; }
export interface EquippedModifier { attribute: string; amount: number; }

export interface CardMaster {
  id: string;
  title: string;
  image: string;
  description?: string;
  attributes: CardAttribute[];
  size?: ItemSize;
  equipSlots: EquipmentSlot[];
  storage?: StorageEffect;
  whileEquipped: EquippedModifier[];
  accept: AcceptanceDefinition[];
  processes: ProcessDefinition[];
  when: ThresholdDefinition[];
}

export interface TravelDefinition { acceptedCardId: string; destinationRoomId: string; baseMinutes: number; }

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
  openingTakeLimit?: number;
  openingEscapeRoomId?: string;
  searchBack?: string;
}
