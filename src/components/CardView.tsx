import { useEffect, useState, type CSSProperties, type PointerEvent } from "react";
import type { CardInstance } from "../domain/types";
import type { ValueChangePreview } from "../game/rules";
import { displayAttributeName } from "../game/rules";

interface CardViewProps {
  card: CardInstance;
  style: CSSProperties;
  legalTarget?: boolean;
  releaseReady?: boolean;
  incompatibleTarget?: boolean;
  dragging?: boolean;
  compact?: boolean;
  stackCount?: number;
  preview?: ValueChangePreview[];
  onPointerDown?: (event: PointerEvent<HTMLDivElement>, card: CardInstance) => void;
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLDivElement>) => void;
  onInspect?: (card: CardInstance | null, position?: { x: number; y: number }) => void;
}

function glyph(name: string): string {
  return name.split(/[\s-]+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
}
function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export function CardView({
  card, style, legalTarget = false, releaseReady = false, incompatibleTarget = false,
  dragging = false, compact = false, stackCount, preview = [], onPointerDown, onPointerMove,
  onPointerUp, onPointerCancel, onInspect,
}: CardViewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [card.image]);
  const className = [
    "card",
    legalTarget && "card--legal-target",
    releaseReady && "card--release-ready",
    incompatibleTarget && "card--incompatible-target",
    dragging && "card--dragging",
    compact && "card--compact",
    card.animation === "draw" && "card--drawn",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={className}
      style={style}
      role="button"
      tabIndex={0}
      aria-label={`${card.title} card`}
      data-card-id={card.id}
      onPointerEnter={(event) => !dragging && onInspect?.(card, { x: event.clientX, y: event.clientY })}
      onPointerLeave={() => onInspect?.(null)}
      onPointerDown={(event) => onPointerDown?.(event, card)}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!dragging) onInspect?.(card, { x: event.clientX, y: event.clientY });
      }}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {stackCount && <span className="card__stack-count" aria-label={`Stack of ${stackCount}`}>{stackCount}</span>}
      <div className="card__title">{card.title}</div>
      <div className="card__image" aria-hidden="true">
        {imageFailed ? (
          <span className="card__placeholder">{glyph(card.title)}</span>
        ) : (
          <img src={assetUrl(card.image)} alt="" draggable={false} onError={() => setImageFailed(true)} />
        )}
      </div>
      <div className="card__attributes">
        {card.attributes.map((attribute) => {
          const label = displayAttributeName(attribute.name);
          if (attribute.kind === "marker") {
            return (
              <span className="attribute attribute--marker" aria-label={label} key={attribute.name}>
                {glyph(label)}
              </span>
            );
          }
          const change = preview.find((item) => item.attribute === attribute.name);
          const valueText = change ? `${change.before} → ${change.after}` : attribute.value;
          return (
            <span
              className={`attribute attribute--value ${change ? "attribute--preview" : ""}`}
              aria-label={`${label} ${valueText}`}
              key={attribute.name}
            >
              <span className="attribute__icon">{glyph(label)}</span>
              <span className="attribute__value">{valueText}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
