import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { CardView } from "./components/CardView";
import { CARD_MASTERS } from "./data/cardMasters";
import type { Bounds, CardInstance, GameState, Position, Zone } from "./domain/types";
import { CARD_HEIGHT, CARD_WIDTH, INVENTORY_CAPACITY } from "./game/constants";
import { createInitialGameState } from "./game/initialState";
import {
  calculateInteractionOutcome,
  canInteract,
  canPlaceInZone,
  countInventoryCards,
  isWithinBounds,
  positionIsFree,
  resolveDrop,
  type DragOrigin,
} from "./game/rules";

interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Layout {
  room: ScreenRect;
  inventory: ScreenRect;
}

interface DragState {
  pointerId: number;
  sourceId: string;
  origin: DragOrigin;
  left: number;
  top: number;
  scale: number;
  pointerOffset: Position;
  hoveredTargetId?: string;
}

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.45;
const ZOOM_STEP = 0.15;

function fromDomRect(rect: DOMRect): ScreenRect {
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}

function localBounds(rect: ScreenRect): Bounds {
  return { x: 0, y: 0, width: rect.width, height: rect.height };
}

function cardScreenRect(card: CardInstance, layout: Layout, roomZoom: number): ScreenRect {
  const zone = layout[card.zone];
  if (card.zone === "inventory") {
    return {
      x: zone.x + card.position.x,
      y: zone.y + card.position.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    };
  }

  const centerX =
    zone.width / 2 +
    (card.position.x + CARD_WIDTH / 2 - zone.width / 2) * roomZoom;
  const centerY =
    zone.height / 2 +
    (card.position.y + CARD_HEIGHT / 2 - zone.height / 2) * roomZoom;
  return {
    x: zone.x + centerX - (CARD_WIDTH * roomZoom) / 2,
    y: zone.y + centerY - (CARD_HEIGHT * roomZoom) / 2,
    width: CARD_WIDTH * roomZoom,
    height: CARD_HEIGHT * roomZoom,
  };
}

function cardLocalStyle(card: CardInstance, layout: Layout, roomZoom: number): CSSProperties {
  const screen = cardScreenRect(card, layout, roomZoom);
  const zone = layout[card.zone];
  const scale = card.zone === "room" ? roomZoom : 1;
  return {
    position: "absolute",
    left: screen.x - zone.x,
    top: screen.y - zone.y,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };
}

function overlaps(first: ScreenRect, second: ScreenRect): boolean {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

function pointInside(x: number, y: number, rect: ScreenRect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function draggedRect(drag: DragState): ScreenRect {
  return {
    x: drag.left,
    y: drag.top,
    width: CARD_WIDTH * drag.scale,
    height: CARD_HEIGHT * drag.scale,
  };
}

function overlappingTarget(
  state: GameState,
  sourceId: string,
  dragRect: ScreenRect,
  layout: Layout,
  roomZoom: number,
): CardInstance | undefined {
  return [...state.cards].reverse().find((candidate) => {
    if (candidate.id === sourceId) return false;
    const rect = cardScreenRect(candidate, layout, roomZoom);
    const zoneRect = layout[candidate.zone];
    return overlaps(dragRect, rect) && overlaps(dragRect, zoneRect);
  });
}

function destinationZone(x: number, y: number, layout: Layout): Zone | undefined {
  if (pointInside(x, y, layout.room)) return "room";
  if (pointInside(x, y, layout.inventory)) return "inventory";
  return undefined;
}

function dropPosition(drag: DragState, zone: Zone, layout: Layout, roomZoom: number): Position {
  const rect = layout[zone];
  const visualCenterX = drag.left + (CARD_WIDTH * drag.scale) / 2;
  const visualCenterY = drag.top + (CARD_HEIGHT * drag.scale) / 2;
  if (zone === "inventory") {
    return {
      x: visualCenterX - rect.x - CARD_WIDTH / 2,
      y: visualCenterY - rect.y - CARD_HEIGHT / 2,
    };
  }
  return {
    x: rect.width / 2 + (visualCenterX - rect.x - rect.width / 2) / roomZoom - CARD_WIDTH / 2,
    y:
      rect.height / 2 +
      (visualCenterY - rect.y - rect.height / 2) / roomZoom -
      CARD_HEIGHT / 2,
  };
}

export function App() {
  const roomRef = useRef<HTMLElement>(null);
  const inventoryRef = useRef<HTMLElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [roomZoom, setRoomZoom] = useState(1);
  const [message, setMessage] = useState("Drag a card onto another card to test an interaction.");

  useLayoutEffect(() => {
    const room = roomRef.current;
    const inventory = inventoryRef.current;
    if (!room || !inventory) return;
    const measure = () =>
      setLayout({
        room: fromDomRect(room.getBoundingClientRect()),
        inventory: fromDomRect(inventory.getBoundingClientRect()),
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(room);
    observer.observe(inventory);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useLayoutEffect(() => {
    if (!layout || game || startupError) return;
    try {
      setGame(
        createInitialGameState(
          CARD_MASTERS,
          localBounds(layout.room),
          localBounds(layout.inventory),
        ),
      );
    } catch (error) {
      setStartupError(error instanceof Error ? error.message : "Could not initialize the prototype");
    }
  }, [game, layout, startupError]);

  const sourceCard = drag && game?.cards.find((card) => card.id === drag.sourceId);
  const legalTargetIds = useMemo(() => {
    if (!game || !sourceCard) return new Set<string>();
    return new Set(
      game.cards
        .filter((target) => target.id !== sourceCard.id && canInteract(game, sourceCard, target))
        .map((target) => target.id),
    );
  }, [game, sourceCard]);

  const hoveredPreview = useMemo(() => {
    if (!game || !sourceCard || !drag?.hoveredTargetId) return null;
    const target = game.cards.find((card) => card.id === drag.hoveredTargetId);
    return target ? calculateInteractionOutcome(game, sourceCard, target) : null;
  }, [drag?.hoveredTargetId, game, sourceCard]);

  const beginDrag = (event: PointerEvent<HTMLDivElement>, card: CardInstance) => {
    if (!layout) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    setDrag({
      pointerId: event.pointerId,
      sourceId: card.id,
      origin: { zone: card.zone, position: { ...card.position } },
      left: rect.left,
      top: rect.top,
      scale: rect.width / CARD_WIDTH,
      pointerOffset: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    });
    setMessage("Legal interaction targets are highlighted.");
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || !game || !layout || event.pointerId !== drag.pointerId) return;
    const next: DragState = {
      ...drag,
      left: event.clientX - drag.pointerOffset.x,
      top: event.clientY - drag.pointerOffset.y,
    };
    const target = overlappingTarget(game, drag.sourceId, draggedRect(next), layout, roomZoom);
    next.hoveredTargetId = target?.id;
    setDrag(next);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || !game || !layout || event.pointerId !== drag.pointerId) return;
    const finalDrag: DragState = {
      ...drag,
      left: event.clientX - drag.pointerOffset.x,
      top: event.clientY - drag.pointerOffset.y,
    };
    const source = game.cards.find((card) => card.id === drag.sourceId);
    const target = overlappingTarget(
      game,
      drag.sourceId,
      draggedRect(finalDrag),
      layout,
      roomZoom,
    );

    if (target) {
      const legal = source ? canInteract(game, source, target) : false;
      setGame(resolveDrop(game, drag.sourceId, drag.origin, { kind: "card", targetId: target.id }));
      setMessage(legal ? `${source?.title} interacted with ${target.title}.` : "Those cards do not interact.");
      setDrag(null);
      return;
    }

    const zone = destinationZone(event.clientX, event.clientY, layout);
    if (!zone || !source) {
      setGame(resolveDrop(game, drag.sourceId, drag.origin, { kind: "outside" }));
      setMessage("That placement is outside the play area.");
      setDrag(null);
      return;
    }

    const position = dropPosition(finalDrag, zone, layout, roomZoom);
    const placement = canPlaceInZone(source, zone, game.cards);
    const bounds = localBounds(layout[zone]);
    const fits = isWithinBounds(position, bounds);
    const isFree = positionIsFree(source.id, zone, position, game.cards);
    setGame(
      resolveDrop(game, drag.sourceId, drag.origin, {
        kind: "zone",
        zone,
        position,
        bounds,
      }),
    );
    if (!placement.legal && placement.reason === "anchored") {
      setMessage(`${source.title} is Anchored to ${source.homeZone}.`);
    } else if (!placement.legal && placement.reason === "capacity") {
      setMessage(`Inventory is full (${INVENTORY_CAPACITY} non-Anchored cards).`);
    } else if (!fits) {
      setMessage("The whole card must remain inside its zone.");
    } else if (!isFree) {
      setMessage("Cards cannot overlap in ordinary placement.");
    } else {
      setMessage(`Placed ${source.title} in ${zone === "room" ? "Room" : "Inventory"}.`);
    }
    setDrag(null);
  };

  const cancelDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || !game || event.pointerId !== drag.pointerId) return;
    setGame(resolveDrop(game, drag.sourceId, drag.origin, { kind: "outside" }));
    setDrag(null);
    setMessage("Drag cancelled; the card returned to its origin.");
  };

  const renderZoneCards = (zone: Zone) => {
    if (!game || !layout) return null;
    return game.cards
      .filter((card) => card.zone === zone)
      .map((card) => (
        <CardView
          key={card.id}
          card={card}
          style={{
            ...cardLocalStyle(card, layout, roomZoom),
            opacity: drag?.sourceId === card.id ? 0 : 1,
          }}
          legalTarget={legalTargetIds.has(card.id)}
          hoveredTarget={drag?.hoveredTargetId === card.id && legalTargetIds.has(card.id)}
          preview={hoveredPreview?.targetId === card.id ? hoveredPreview.valueChanges : []}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={cancelDrag}
        />
      ));
  };

  const inventoryCount = game ? countInventoryCards(game.cards) : 0;

  return (
    <main className="app">
      <section className="zone room" ref={roomRef} aria-label="Room">
        <header className="zone__header">
          <div>
            <span className="zone__eyebrow">CURRENT SPACE</span>
            <h1>Room</h1>
          </div>
          <div className="zoom-controls" aria-label="Room card zoom controls">
            <button
              type="button"
              aria-label="Zoom Room cards out"
              onClick={() => setRoomZoom((zoom) => Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
            >
              −
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              value={roomZoom}
              aria-label="Room card zoom"
              onChange={(event) => setRoomZoom(Number(event.target.value))}
            />
            <button
              type="button"
              aria-label="Zoom Room cards in"
              onClick={() => setRoomZoom((zoom) => Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
            >
              +
            </button>
            <output>{Math.round(roomZoom * 100)}%</output>
          </div>
        </header>
        <div className="zone__card-layer">{renderZoneCards("room")}</div>
      </section>

      <section className="zone inventory" ref={inventoryRef} aria-label="Inventory">
        <header className="zone__header inventory__header">
          <div>
            <span className="zone__eyebrow">PERSISTENT</span>
            <h2>Inventory</h2>
          </div>
          <div className="capacity" aria-label={`${inventoryCount} of ${INVENTORY_CAPACITY} carrying slots used`}>
            <span>Carried</span>
            <strong>{inventoryCount} / {INVENTORY_CAPACITY}</strong>
          </div>
        </header>
        <div className="zone__card-layer">{renderZoneCards("inventory")}</div>
      </section>

      {startupError && <div className="startup-error">{startupError}</div>}
      <div className="status" role="status">{message}</div>

      {drag && sourceCard && (
        <div className="drag-layer" aria-hidden="true">
          <CardView
            card={sourceCard}
            dragging
            style={{
              position: "fixed",
              left: drag.left,
              top: drag.top,
              transform: `scale(${drag.scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      )}
    </main>
  );
}
