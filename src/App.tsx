import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { CardView } from "./components/CardView";
import { InspectionTooltip } from "./components/InspectionTooltip";
import { CARD_MASTERS } from "./data/cardMasters";
import { WORLD_DEFINITION } from "./data/worldDefinition";
import type {
  Bounds,
  CardInstance,
  EquipmentSlot,
  GameState,
  Position,
  Zone,
} from "./domain/types";
import { CARD_HEIGHT, CARD_WIDTH, SEARCH_DECK_HEIGHT, SEARCH_DECK_WIDTH } from "./game/constants";
import { allocateCarriedCapacity, canCarryCard, canEquip, EQUIPMENT_SLOTS, openingSelectionCount } from "./game/equipment";
import { measureClientBox } from "./game/geometry";
import {
  applyInteraction,
  calculateInteractionOutcome,
  canInteract,
  hasMarker,
  isAnchored,
  isWithinBounds,
  positionIsFree,
  type DragOrigin,
} from "./game/rules";
import {
  canTravelWith,
  createWorldGameState,
  equipCard,
  escapeOpening,
  searchRoom,
  transitionRoom,
} from "./game/world";
import { effectiveVision } from "./game/vision";

interface ScreenRect { x: number; y: number; width: number; height: number; }
interface Layout {
  room: ScreenRect;
  carried: ScreenRect;
  slots: Partial<Record<EquipmentSlot, ScreenRect>>;
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
  hoveredSlot?: EquipmentSlot;
  ordinaryZone?: Zone;
  ordinaryLegal?: boolean;
}
interface InspectionState { card: CardInstance; x: number; y: number; }
interface DiscardGhost { card: CardInstance; left: number; top: number; scale: number; }
interface PlacementCheck { zone?: Zone; position?: Position; legal?: boolean; }

const MIN_ZOOM = 0.7;
const MAX_ZOOM = 1.45;
const ZOOM_STEP = 0.15;
const EQUIPMENT_SCALE = 0.4;
const SLOT_CARD_LEFT = 10;
const SLOT_CARD_TOP = 2;

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
function localBounds(rect: ScreenRect): Bounds {
  return { x: 0, y: 0, width: rect.width, height: rect.height };
}
function pointInside(x: number, y: number, rect: ScreenRect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
function roomObjectRect(
  position: Position,
  width: number,
  height: number,
  room: ScreenRect,
  zoom: number,
): ScreenRect {
  const centerX = room.width / 2 + (position.x + width / 2 - room.width / 2) * zoom;
  const centerY = room.height / 2 + (position.y + height / 2 - room.height / 2) * zoom;
  return {
    x: room.x + centerX - width * zoom / 2,
    y: room.y + centerY - height * zoom / 2,
    width: width * zoom,
    height: height * zoom,
  };
}
function cardScreenRect(card: CardInstance, layout: Layout, zoom: number): ScreenRect {
  if (card.equipmentSlot) {
    const slot = layout.slots[card.equipmentSlot];
    if (!slot) return { x: 0, y: 0, width: 0, height: 0 };
    return {
      x: slot.x + SLOT_CARD_LEFT,
      y: slot.y + SLOT_CARD_TOP,
      width: CARD_WIDTH * EQUIPMENT_SCALE,
      height: CARD_HEIGHT * EQUIPMENT_SCALE,
    };
  }
  if (card.zone === "inventory") {
    return {
      x: layout.carried.x + card.position.x,
      y: layout.carried.y + card.position.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    };
  }
  return roomObjectRect(card.position, CARD_WIDTH, CARD_HEIGHT, layout.room, zoom);
}
function localCardStyle(card: CardInstance, layout: Layout, zoom: number): CSSProperties {
  if (card.equipmentSlot) {
    return {
      position: "absolute",
      left: SLOT_CARD_LEFT,
      top: SLOT_CARD_TOP,
      transform: `scale(${EQUIPMENT_SCALE})`,
      transformOrigin: "top left",
    };
  }
  const screen = cardScreenRect(card, layout, zoom);
  const zone = card.zone === "room" ? layout.room : layout.carried;
  const scale = card.zone === "room" ? zoom : 1;
  const style = {
    position: "absolute",
    left: screen.x - zone.x,
    top: screen.y - zone.y,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    "--card-scale": scale,
  } as CSSProperties;
  if (card.animation === "draw" && card.drawOrigin && card.zone === "room") {
    Object.assign(style, {
      "--draw-x": `${(card.drawOrigin.x - card.position.x) * zoom}px`,
      "--draw-y": `${(card.drawOrigin.y - card.position.y) * zoom}px`,
    });
  }
  return style;
}
function dropPosition(drag: DragState, zone: Zone, layout: Layout, zoom: number): Position {
  const rect = zone === "room" ? layout.room : layout.carried;
  const centerX = drag.left + CARD_WIDTH * drag.scale / 2;
  const centerY = drag.top + CARD_HEIGHT * drag.scale / 2;
  if (zone === "inventory") {
    return { x: centerX - rect.x - CARD_WIDTH / 2, y: centerY - rect.y - CARD_HEIGHT / 2 };
  }
  return {
    x: rect.width / 2 + (centerX - rect.x - rect.width / 2) / zoom - CARD_WIDTH / 2,
    y: rect.height / 2 + (centerY - rect.y - rect.height / 2) / zoom - CARD_HEIGHT / 2,
  };
}
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest.toString().padStart(2, "0")}m` : `${rest}m`;
}

function SearchDeck({
  name, image, style, disabled, onSearch,
}: { name: string; image: string; style: CSSProperties; disabled: boolean; onSearch: () => void }) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      className={`search-deck ${disabled ? "search-deck--disabled" : ""}`}
      style={style}
      type="button"
      aria-label={`Search ${name}`}
      onClick={onSearch}
    >
      {!failed && <img src={assetUrl(image)} alt="" onError={() => setFailed(true)} />}
      <span>{failed ? "SEARCH" : name}</span>
    </button>
  );
}

export function App() {
  const roomRef = useRef<HTMLElement>(null);
  const inventoryRef = useRef<HTMLElement>(null);
  const carriedRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [inspection, setInspection] = useState<InspectionState | null>(null);
  const [discardGhost, setDiscardGhost] = useState<DiscardGhost | null>(null);
  const [roomZoom, setRoomZoom] = useState(1);
  const [message, setMessage] = useState("Choose up to five offered cards, then escape.");

  useLayoutEffect(() => {
    const room = roomRef.current;
    const inventory = inventoryRef.current;
    const carried = carriedRef.current;
    if (!room || !inventory || !carried) return;
    const measure = () => {
      const slots: Layout["slots"] = {};
      inventory.querySelectorAll<HTMLElement>("[data-equipment-slot]").forEach((element) => {
        slots[element.dataset.equipmentSlot as EquipmentSlot] = measureClientBox(element);
      });
      setLayout({ room: measureClientBox(room), carried: measureClientBox(carried), slots });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(room);
    observer.observe(inventory);
    observer.observe(carried);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useLayoutEffect(() => {
    if (!layout || game || startupError) return;
    try {
      setGame(createWorldGameState(CARD_MASTERS, WORLD_DEFINITION, localBounds(layout.room)));
    } catch (error) {
      setStartupError(error instanceof Error ? error.message : "Could not initialize the prototype");
    }
  }, [game, layout, startupError]);

  const currentRoom = game?.currentRoomId ? game.rooms?.[game.currentRoomId] : undefined;
  const visibleCards = useMemo(() => {
    if (!game) return [];
    return game.cards.filter((card) =>
      card.zone === "inventory" ||
      (card.zone === "room" && card.roomId === game.currentRoomId),
    );
  }, [game]);
  const sourceCard = drag && game?.cards.find((card) => card.id === drag.sourceId);
  const legalTargetIds = useMemo(() => {
    if (!game || !sourceCard) return new Set<string>();
    return new Set(visibleCards
      .filter((target) => target.id !== sourceCard.id && canInteract(game, sourceCard, target))
      .map((target) => target.id));
  }, [game, sourceCard, visibleCards]);
  const previews = useMemo(() => {
    const results = new Map<string, ReturnType<typeof calculateInteractionOutcome>>();
    if (!game || !sourceCard) return results;
    for (const target of visibleCards) {
      const outcome = calculateInteractionOutcome(game, sourceCard, target);
      if (outcome) results.set(target.id, outcome);
    }
    return results;
  }, [game, sourceCard, visibleCards]);

  const targetAtPoint = (x: number, y: number, sourceId: string) => {
    if (!layout) return undefined;
    return [...visibleCards].reverse().find((candidate) =>
      candidate.id !== sourceId && pointInside(x, y, cardScreenRect(candidate, layout, roomZoom)),
    );
  };
  const slotAtPoint = (x: number, y: number): EquipmentSlot | undefined => {
    if (!layout) return undefined;
    return EQUIPMENT_SLOTS.find((slot) => {
      const rect = layout.slots[slot];
      return rect && pointInside(x, y, rect);
    });
  };
  const canDropInSlot = (state: GameState, card: CardInstance, slot: EquipmentSlot): boolean => {
    const master = state.masters.find((candidate) => candidate.id === card.masterId);
    return Boolean(
      master && canEquip(master, slot) &&
      !state.cards.some((candidate) => candidate.id !== card.id && candidate.equipmentSlot === slot) &&
      (card.zone === "inventory" || state.phase !== "opening" ||
        !card.offered || openingSelectionCount(state) < (state.openingTakeLimit ?? 0)),
    );
  };
  const ordinaryPlacement = (
    state: GameState,
    card: CardInstance,
    nextDrag: DragState,
    pointerX: number,
    pointerY: number,
  ): PlacementCheck => {
    if (!layout) return {};
    const zone: Zone | undefined = pointInside(pointerX, pointerY, layout.room)
      ? "room"
      : pointInside(pointerX, pointerY, layout.carried) ? "inventory" : undefined;
    if (!zone) return {};
    const position = dropPosition(nextDrag, zone, layout, roomZoom);
    const bounds = localBounds(zone === "room" ? layout.room : layout.carried);
    const anchored = isAnchored(card) && card.homeZone !== zone;
    const capacity = zone === "inventory" ? canCarryCard(state, card).legal : true;
    const free = positionIsFree(card.id, zone, position, state.cards, zone === "room" ? state.currentRoomId : undefined);
    return {
      zone,
      position,
      legal: !anchored && capacity && isWithinBounds(position, bounds) && free,
    };
  };

  const beginDrag = (event: PointerEvent<HTMLDivElement>, card: CardInstance) => {
    if (!layout) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.getBoundingClientRect();
    setInspection(null);
    setDrag({
      pointerId: event.pointerId,
      sourceId: card.id,
      origin: {
        zone: card.zone,
        position: { ...card.position },
        roomId: card.roomId,
        equipmentSlot: card.equipmentSlot,
      },
      left: rect.left,
      top: rect.top,
      scale: rect.width / CARD_WIDTH,
      pointerOffset: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    });
    setMessage("Legal receivers are green. A ready receiver turns yellow.");
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || !game || !sourceCard || event.pointerId !== drag.pointerId) return;
    const next: DragState = {
      ...drag,
      left: event.clientX - drag.pointerOffset.x,
      top: event.clientY - drag.pointerOffset.y,
      hoveredTargetId: undefined,
      hoveredSlot: undefined,
      ordinaryZone: undefined,
      ordinaryLegal: false,
    };
    const target = targetAtPoint(event.clientX, event.clientY, drag.sourceId);
    if (target) next.hoveredTargetId = target.id;
    else {
      const slot = slotAtPoint(event.clientX, event.clientY);
      if (slot) next.hoveredSlot = slot;
      else {
        const placement = ordinaryPlacement(game, sourceCard, next, event.clientX, event.clientY);
        next.ordinaryZone = placement.zone;
        next.ordinaryLegal = placement.legal;
      }
    }
    setDrag(next);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || !game || !layout || !sourceCard || event.pointerId !== drag.pointerId) return;
    const finalDrag = {
      ...drag,
      left: event.clientX - drag.pointerOffset.x,
      top: event.clientY - drag.pointerOffset.y,
    };
    const target = targetAtPoint(event.clientX, event.clientY, drag.sourceId);
    if (target) {
      if (!canInteract(game, sourceCard, target)) {
        setMessage("Those cards do not interact; the card returned exactly to its origin.");
      } else if (canTravelWith(sourceCard, target) && target.travel) {
        const next = transitionRoom(game, target.travel.destinationRoomId, target.travel.baseMinutes);
        const minutes = (next.elapsedMinutes ?? 0) - (game.elapsedMinutes ?? 0);
        setGame(next);
        setMessage(`Travelled to ${next.rooms?.[next.currentRoomId!]?.name} in ${minutes}m.`);
      } else {
        setDiscardGhost({ card: sourceCard, left: finalDrag.left, top: finalDrag.top, scale: finalDrag.scale });
        setGame(applyInteraction(game, sourceCard.id, target.id));
        window.setTimeout(() => setDiscardGhost(null), 420);
        setMessage(`${sourceCard.title} was used on ${target.title}.`);
      }
      setDrag(null);
      return;
    }
    const slot = slotAtPoint(event.clientX, event.clientY);
    if (slot) {
      if (canDropInSlot(game, sourceCard, slot)) {
        setGame(equipCard(game, sourceCard.id, slot));
        setMessage(`Equipped ${sourceCard.title} in ${slot}.`);
      } else {
        setMessage("That equipment slot cannot receive this card.");
      }
      setDrag(null);
      return;
    }
    const placement = ordinaryPlacement(game, sourceCard, finalDrag, event.clientX, event.clientY);
    if (!placement.zone || !placement.position || !placement.legal) {
      setMessage("Illegal placement; the card returned exactly to its drag origin.");
      setDrag(null);
      return;
    }
    const destinationZone: Zone = placement.zone;
    const destinationPosition: Position = placement.position;
    setGame({
      ...game,
      cards: game.cards.map((card) => card.id === sourceCard.id ? {
        ...card,
        zone: destinationZone,
        position: destinationPosition,
        roomId: destinationZone === "room" ? game.currentRoomId : undefined,
        equipmentSlot: undefined,
      } : card),
    });
    setMessage(`Placed ${sourceCard.title} in ${destinationZone === "room" ? "Room" : "carried Inventory"}.`);
    setDrag(null);
  };
  const cancelDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    setDrag(null);
    setMessage("Drag cancelled; the card returned exactly to its origin.");
  };

  const inspect = (card: CardInstance | null, position?: Position) => {
    if (drag || !card || !position) setInspection(null);
    else setInspection({ card, x: position.x, y: position.y });
  };
  const renderCard = (card: CardInstance) => {
    if (!layout) return null;
    const hovered = drag?.hoveredTargetId === card.id;
    const preview = previews.get(card.id);
    return (
      <CardView
        key={card.id}
        card={card}
        style={{ ...localCardStyle(card, layout, roomZoom), opacity: drag?.sourceId === card.id ? 0 : 1 }}
        legalTarget={legalTargetIds.has(card.id)}
        releaseReady={hovered && legalTargetIds.has(card.id) && !hasMarker(card, "Stack")}
        incompatibleTarget={hovered && !legalTargetIds.has(card.id)}
        dragging={drag?.sourceId === card.id}
        compact={Boolean(card.equipmentSlot)}
        preview={preview?.valueChanges ?? []}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={cancelDrag}
        onInspect={inspect}
      />
    );
  };

  const performSearch = (deckId: string) => {
    if (!game || !layout) return;
    const result = searchRoom(game, deckId, localBounds(layout.room));
    if (result.reason === "too-dark") setMessage("It is too dark to Search. Leaving remains possible.");
    else if (result.reason === "no-space") setMessage("There is no legal free Room position beside the Search deck.");
    else if (result.drawnCardId) {
      const drawn = result.state.cards.find((card) => card.id === result.drawnCardId);
      setGame(result.state);
      setMessage(`Searched for ${result.minutes}m and found ${drawn?.title}.`);
      window.setTimeout(() => setGame((current) => current ? {
        ...current,
        cards: current.cards.map((card) => card.id === result.drawnCardId
          ? { ...card, animation: undefined, drawOrigin: undefined }
          : card),
      } : current), 560);
    }
  };
  const leaveOpening = () => {
    if (!game) return;
    const result = escapeOpening(game);
    if (result.reason === "capacity") {
      setMessage("That loadout will not fit after evacuation. Equip the backpack or return carried cards.");
    } else {
      setGame(result.state);
      setMessage("Evacuated into the Tunnels. Search to reveal routes and supplies.");
    }
  };

  const allocation = game
    ? allocateCarriedCapacity(game.cards, game.masters, game.phase ?? "main")
    : { capacity: { Small: 0, Medium: 0, Large: 0 }, used: { Small: 0, Medium: 0, Large: 0 }, unplacedIds: [] };
  const vision = game ? effectiveVision(game) : 0;
  const selected = game ? openingSelectionCount(game) : 0;
  const lightClass = currentRoom?.light.toLowerCase() ?? "bright";

  return (
    <main className="app">
      <section
        className={`zone room room--${lightClass} ${drag?.ordinaryZone === "room" && drag.ordinaryLegal ? "zone--drop-legal" : ""}`}
        ref={roomRef}
        aria-label="Room"
        style={currentRoom ? {
          backgroundImage: `linear-gradient(rgba(12,16,17,.18),rgba(12,16,17,.22)), url("${assetUrl(currentRoom.background)}")`,
        } : undefined}
      >
        <div className="room__light-filter" />
        <header className="zone__header">
          <div>
            <span className="zone__eyebrow">{game?.phase === "opening" ? "EVACUATION" : currentRoom?.light}</span>
            <h1>{currentRoom?.name ?? "Loading Room"}</h1>
          </div>
          <div className="room-stats">
            <span>Vision <strong>{vision}</strong></span>
            <span>Elapsed <strong>{formatTime(game?.elapsedMinutes ?? 0)}</strong></span>
          </div>
          <div className="zoom-controls" aria-label="Room card zoom controls">
            <button type="button" aria-label="Zoom Room cards out" onClick={() => setRoomZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}>−</button>
            <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={ZOOM_STEP} value={roomZoom}
              aria-label="Room card zoom" onChange={(event) => setRoomZoom(Number(event.target.value))} />
            <button type="button" aria-label="Zoom Room cards in" onClick={() => setRoomZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}>+</button>
            <output>{Math.round(roomZoom * 100)}%</output>
          </div>
        </header>
        <div className="zone__card-layer">
          {currentRoom?.decks.map((deck) => {
            if (!layout) return null;
            const rect = roomObjectRect(deck.position, SEARCH_DECK_WIDTH, SEARCH_DECK_HEIGHT, layout.room, roomZoom);
            return (
              <SearchDeck
                key={deck.id}
                name={deck.name}
                image={game?.searchBack ?? ""}
                disabled={vision <= 0}
                onSearch={() => performSearch(deck.id)}
                style={{
                  position: "absolute",
                  left: rect.x - layout.room.x,
                  top: rect.y - layout.room.y,
                  transform: `scale(${roomZoom})`,
                  transformOrigin: "top left",
                }}
              />
            );
          })}
          {visibleCards.filter((card) => card.zone === "room").map(renderCard)}
        </div>
        {game?.phase === "opening" && (
          <div className="opening-controls">
            <span>Selected <strong>{selected} / {game.openingTakeLimit}</strong></span>
            <button type="button" onClick={leaveOpening}>Escape to Tunnels</button>
          </div>
        )}
      </section>

      <section
        className={`zone inventory ${drag?.ordinaryZone === "inventory" && drag.ordinaryLegal ? "zone--drop-legal" : ""}`}
        ref={inventoryRef}
        aria-label="Inventory"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10,12,13,.24), rgba(10,12,13,.48)), url("${assetUrl("images/inventory-background.jpg")}")`,
        }}
      >
        <header className="zone__header inventory__header">
          <div><span className="zone__eyebrow">PERSISTENT</span><h2>Inventory & equipment</h2></div>
          <div className="capacity" aria-label="Carried capacity">
            {(["Small", "Medium", "Large"] as const).map((size) => (
              <span key={size}>{size} <strong>{allocation.used[size]} / {allocation.capacity[size]}</strong></span>
            ))}
          </div>
        </header>
        <div className="inventory__content">
          <div className="equipment-rack" aria-label="Equipment slots">
            {EQUIPMENT_SLOTS.map((slot) => {
              const equipped = game?.cards.find((card) => card.equipmentSlot === slot);
              const hovered = drag?.hoveredSlot === slot;
              const slotLegal = Boolean(game && sourceCard && canDropInSlot(game, sourceCard, slot));
              return (
                <div
                  className={`equipment-slot ${drag && slotLegal ? "equipment-slot--legal" : ""} ${hovered && slotLegal ? "equipment-slot--ready" : ""} ${hovered && !slotLegal ? "equipment-slot--invalid" : ""}`}
                  data-equipment-slot={slot}
                  key={slot}
                >
                  <span>{slot}</span>
                  {equipped && renderCard(equipped)}
                </div>
              );
            })}
          </div>
          <div className="carried-area" ref={carriedRef} aria-label="Carried Inventory">
            <span className="carried-area__label">Carried cards</span>
            <div className="zone__card-layer">
              {visibleCards.filter((card) => card.zone === "inventory" && !card.equipmentSlot).map(renderCard)}
            </div>
          </div>
        </div>
      </section>

      {startupError && <div className="startup-error">{startupError}</div>}
      <div className="status" role="status">{message}</div>
      {inspection && !drag && <InspectionTooltip {...inspection} />}
      {drag && sourceCard && (
        <div className="drag-layer" aria-hidden="true">
          <CardView
            card={sourceCard}
            dragging
            style={{
              position: "fixed", left: drag.left, top: drag.top,
              transform: `scale(${drag.scale})`, transformOrigin: "top left",
            }}
          />
        </div>
      )}
      {discardGhost && (
        <div className="discard-ghost" aria-hidden="true">
          <CardView
            card={discardGhost.card}
            style={{
              position: "fixed", left: discardGhost.left, top: discardGhost.top,
              transform: `scale(${discardGhost.scale})`, transformOrigin: "top left",
            }}
          />
        </div>
      )}
    </main>
  );
}
