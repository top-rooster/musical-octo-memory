export type Zone = "room" | "inventory";

export interface Position {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MarkerAttribute {
  kind: "marker";
  name: string;
}

export interface ValueAttribute {
  kind: "value";
  name: string;
  value: number;
  min: number;
  max: number;
}

export type CardAttribute = MarkerAttribute | ValueAttribute;

export interface ChangeValueEffect {
  kind: "change-value";
  attribute: string;
  amount: number;
  recipient: "target";
}

export interface ConsumeSourceEffect {
  kind: "consume-source";
}

export type InteractionEffect = ChangeValueEffect | ConsumeSourceEffect;

export interface InteractionDefinition {
  kind: "eat";
  targetTitle: string;
  effects: InteractionEffect[];
}

export interface CardMaster {
  id: string;
  title: string;
  image: string;
  attributes: CardAttribute[];
  interactions: InteractionDefinition[];
}

export interface CardInstance {
  id: string;
  masterId: string;
  title: string;
  image: string;
  attributes: CardAttribute[];
  zone: Zone;
  homeZone?: Zone;
  position: Position;
}

export interface GameState {
  masters: CardMaster[];
  cards: CardInstance[];
}
