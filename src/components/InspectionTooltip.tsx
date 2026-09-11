import type { CardInstance } from "../domain/types";
import { ATTRIBUTE_DESCRIPTIONS } from "../data/attributeDescriptions";
import { displayAttributeName } from "../game/rules";

interface Props { card: CardInstance; x: number; y: number; }
export const MISSING_DESCRIPTION = "missing description";

export function InspectionTooltip({ card, x, y }: Props) {
  const width = 292;
  const offset = 16;
  const left = Math.min(x + offset, window.innerWidth - width - 8);
  const top = Math.min(y + offset, window.innerHeight - 260);
  return (
    <aside className="inspection-tooltip" style={{ left: Math.max(8, left), top: Math.max(8, top) }}>
      <strong>{card.title}</strong>
      <p>{card.description || MISSING_DESCRIPTION}</p>
      {card.attributes.length > 0 && (
        <dl>
          {card.attributes.map((attribute) => (
            <div key={attribute.name}>
              <dt>
                {displayAttributeName(attribute.name)}
                {attribute.kind === "value" ? ` ${attribute.value}` : ""}
              </dt>
              <dd>{ATTRIBUTE_DESCRIPTIONS[attribute.name] || MISSING_DESCRIPTION}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}
