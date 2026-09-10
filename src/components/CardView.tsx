import { useEffect, useState, type CSSProperties, type PointerEvent } from "react";
import type { CardInstance } from "../domain/types";
import type { ValueChangePreview } from "../game/rules";
import { displayAttributeName } from "../game/rules";

interface CardViewProps {
  card: CardInstance;
  style: CSSProperties;
  legalTarget?: boolean;
  hoveredTarget?: boolean;
  dragging?: boolean;
  preview?: ValueChangePreview[];
  onPointerDown?: (event: PointerEvent<HTMLDivElement>, card: CardInstance) => void;
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLDivElement>) => void;
}

function markerGlyph(name: string): string {
  return name
    .split(/[\s-]+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CardView({
  card,
  style,
  legalTarget = false,
  hoveredTarget = false,
  dragging = false,
  preview = [],
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: CardViewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [card.image]);

  const className = [
    "card",
    legalTarget && "card--legal-target",
    hoveredTarget && "card--hovered-target",
    dragging && "card--dragging",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      style={style}
      role="button"
      tabIndex={0}
      aria-label={`${card.title} card`}
      data-card-id={card.id}
      onPointerDown={(event) => onPointerDown?.(event, card)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="card__title">{card.title}</div>
      <div className="card__image" aria-hidden="true">
        {imageFailed ? (
          <span className="card__placeholder">{markerGlyph(card.title)}</span>
        ) : (
          <img
            src={`/${card.image}`}
            alt=""
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className="card__attributes">
        {card.attributes.map((attribute) => {
          const label = displayAttributeName(attribute.name);
          if (attribute.kind === "marker") {
            return (
              <span
                className="attribute attribute--marker"
                title={label}
                aria-label={label}
                key={attribute.name}
              >
                {markerGlyph(label)}
              </span>
            );
          }
          const change = preview.find((item) => item.attribute === attribute.name);
          const valueText = change ? `${change.before} → ${change.after}` : attribute.value;
          return (
            <span
              className={`attribute attribute--value ${change ? "attribute--preview" : ""}`}
              title={`${label} ${valueText}`}
              aria-label={`${label} ${valueText}`}
              key={attribute.name}
            >
              <span className="attribute__icon">{markerGlyph(label)}</span>
              <span className="attribute__value">{valueText}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
