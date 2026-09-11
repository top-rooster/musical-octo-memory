import type {
  CardAttribute,
  CardMaster,
  ChangeValueEffect,
  EquipmentSlot,
  InteractionDefinition,
  ItemSize,
} from "../domain/types";

interface SourceLine { number: number; text: string; }
interface EatDraft {
  targetTitle: string;
  effects: InteractionDefinition["effects"];
  supported: boolean;
  line: number;
}

const BEHAVIOR_START =
  /^(?:process|at|action|discard|accept|draw|requires|remove|consume|eat|if)\b/i;
const VALUE_LINE = /^(.+?)\s+(-?\d+)$/;
const TARGET_VALUE_EFFECT = /^(.+?)\s+([+-]\d+)\s+target$/i;
const SIZES: ItemSize[] = ["Small", "Medium", "Large"];
const SLOTS: EquipmentSlot[] = [
  "Left Hand", "Right Hand", "Head", "Eyes", "Neck", "Chest", "Back", "Legs", "Feet",
];

function parserError(line: SourceLine, message: string): Error {
  return new Error(`cards.txt line ${line.number}: ${message} ("${line.text}")`);
}

export function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function splitBlocks(source: string): SourceLine[][] {
  const blocks: SourceLine[][] = [];
  let current: SourceLine[] = [];
  source.split(/\r?\n/).forEach((raw, index) => {
    const text = raw.trim();
    if (text.startsWith("#")) return;
    if (!text) {
      if (current.length) blocks.push(current);
      current = [];
    } else {
      current.push({ number: index + 1, text });
    }
  });
  if (current.length) blocks.push(current);
  return blocks;
}

function parseSize(text: string, line: SourceLine): ItemSize {
  if (!SIZES.includes(text as ItemSize)) throw parserError(line, "Expected Small, Medium, or Large");
  return text as ItemSize;
}

function parseSlot(text: string, line: SourceLine): EquipmentSlot[] {
  if (text === "Hand") return ["Left Hand", "Right Hand"];
  if (!SLOTS.includes(text as EquipmentSlot)) throw parserError(line, `Unknown equipment slot "${text}"`);
  return [text as EquipmentSlot];
}

function parseAttribute(line: SourceLine): CardAttribute {
  const valueMatch = line.text.match(VALUE_LINE);
  if (!valueMatch) return { kind: "marker", name: line.text };
  const value = Number.parseInt(valueMatch[2], 10);
  if (!Number.isInteger(value)) throw parserError(line, "Value must end with an integer");
  return { kind: "value", name: valueMatch[1], value, min: 0, max: 100 };
}

function finalizeEat(draft: EatDraft | null, interactions: InteractionDefinition[]): void {
  if (!draft?.supported) return;
  if (!draft.effects.some((effect) => effect.kind === "change-value") ||
      !draft.effects.some((effect) => effect.kind === "consume-source")) return;
  if (interactions.some((interaction) => interaction.targetTitle === draft.targetTitle)) {
    throw new Error(`cards.txt line ${draft.line}: more than one supported interaction targets ${draft.targetTitle}`);
  }
  interactions.push({ kind: "eat", targetTitle: draft.targetTitle, effects: draft.effects });
}

function parseCard(block: SourceLine[]): CardMaster {
  if (block.length < 2) throw parserError(block[0], "A card master needs a title and picture path");
  const [titleLine, imageLine, ...rawBody] = block;
  const body = [...rawBody];
  const description = body[0]?.text.startsWith(">") ? body.shift()!.text.slice(1).trim() : undefined;
  const attributes: CardAttribute[] = [];
  const interactions: InteractionDefinition[] = [];
  const equipSlots: EquipmentSlot[] = [];
  const whileEquipped: CardMaster["whileEquipped"] = [];
  let size: ItemSize | undefined;
  let storage: CardMaster["storage"];
  let readingAttributes = true;
  let eatDraft: EatDraft | null = null;

  for (const line of body) {
    const sizeMatch = line.text.match(/^size\s+(.+)$/i);
    if (sizeMatch) { size = parseSize(sizeMatch[1], line); continue; }
    const equipMatch = line.text.match(/^equip\s+(.+)$/i);
    if (equipMatch) { equipSlots.push(...parseSlot(equipMatch[1], line)); continue; }
    const storageMatch = line.text.match(/^storage\s+(\S+)\s+(\d+)(?:\s+(opening|main))?$/i);
    if (storageMatch) {
      storage = {
        size: parseSize(storageMatch[1], line),
        count: Number.parseInt(storageMatch[2], 10),
        phase: storageMatch[3]?.toLowerCase() as "opening" | "main" | undefined,
      };
      continue;
    }
    const modifierMatch = line.text.match(/^while-equipped\s+(.+?)\s+([+-]\d+)$/i);
    if (modifierMatch) {
      whileEquipped.push({ attribute: modifierMatch[1], amount: Number.parseInt(modifierMatch[2], 10) });
      continue;
    }
    if (/^(?:size|equip|storage|while-equipped)\b/i.test(line.text)) {
      throw parserError(line, "Malformed supported card metadata");
    }

    if (readingAttributes && !BEHAVIOR_START.test(line.text)) {
      attributes.push(parseAttribute(line));
      continue;
    }
    readingAttributes = false;
    if (/^eat\b/i.test(line.text)) {
      const match = line.text.match(/^eat\s+(.+)$/i);
      if (!match?.[1].trim()) throw parserError(line, "Expected 'eat <target card title>'");
      finalizeEat(eatDraft, interactions);
      eatDraft = { targetTitle: match[1].trim(), effects: [], supported: true, line: line.number };
      continue;
    }
    if (!eatDraft) continue;
    const valueEffect = line.text.match(TARGET_VALUE_EFFECT);
    if (valueEffect) {
      const effect: ChangeValueEffect = {
        kind: "change-value", attribute: valueEffect[1],
        amount: Number.parseInt(valueEffect[2], 10), recipient: "target",
      };
      eatDraft.effects.push(effect);
      continue;
    }
    if (/\btarget$/i.test(line.text)) throw parserError(line, "Expected '<Value> <signed integer> target'");
    if (/^consume\b/i.test(line.text)) {
      if (!/^consume\s+self$/i.test(line.text)) throw parserError(line, "The prototype supports only 'consume self'");
      eatDraft.effects.push({ kind: "consume-source" });
      continue;
    }
    eatDraft.supported = false;
  }
  finalizeEat(eatDraft, interactions);
  return {
    id: slugify(titleLine.text), title: titleLine.text, image: imageLine.text, description,
    attributes, interactions, size, equipSlots: [...new Set(equipSlots)], storage, whileEquipped,
  };
}

export function parseCardMasters(source: string): CardMaster[] {
  const blocks = splitBlocks(source);
  if (!blocks.length) throw new Error("cards.txt contains no card masters");
  const masters = blocks.map(parseCard);
  const seen = new Set<string>();
  for (const master of masters) {
    if (!master.id) throw new Error(`Card title "${master.title}" cannot form an id`);
    if (seen.has(master.id)) throw new Error(`Duplicate card master id: ${master.id}`);
    seen.add(master.id);
  }
  return masters;
}
