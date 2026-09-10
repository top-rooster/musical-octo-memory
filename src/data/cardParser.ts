import type {
  CardAttribute,
  CardMaster,
  ChangeValueEffect,
  InteractionDefinition,
} from "../domain/types";

interface SourceLine {
  number: number;
  text: string;
}

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

function parserError(line: SourceLine, message: string): Error {
  return new Error(`cards.txt line ${line.number}: ${message} ("${line.text}")`);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitBlocks(source: string): SourceLine[][] {
  const blocks: SourceLine[][] = [];
  let current: SourceLine[] = [];

  source.split(/\r?\n/).forEach((raw, index) => {
    const text = raw.trim();
    if (text.startsWith("#")) return;
    if (text === "") {
      if (current.length > 0) {
        blocks.push(current);
        current = [];
      }
      return;
    }
    current.push({ number: index + 1, text });
  });

  if (current.length > 0) blocks.push(current);
  return blocks;
}

function parseAttribute(line: SourceLine): CardAttribute {
  const valueMatch = line.text.match(VALUE_LINE);
  if (!valueMatch) return { kind: "marker", name: line.text };

  const value = Number.parseInt(valueMatch[2], 10);
  if (!Number.isInteger(value)) {
    throw parserError(line, "Value must end with an integer");
  }
  return {
    kind: "value",
    name: valueMatch[1],
    value,
    min: 0,
    max: 100,
  };
}

function finalizeEat(draft: EatDraft | null, interactions: InteractionDefinition[]): void {
  if (!draft || !draft.supported) return;
  const changesValue = draft.effects.some((effect) => effect.kind === "change-value");
  const consumesSource = draft.effects.some((effect) => effect.kind === "consume-source");
  if (!changesValue || !consumesSource) return;
  if (interactions.some((interaction) => interaction.targetTitle === draft.targetTitle)) {
    throw new Error(
      `cards.txt line ${draft.line}: more than one supported interaction targets ${draft.targetTitle}`,
    );
  }
  interactions.push({ kind: "eat", targetTitle: draft.targetTitle, effects: draft.effects });
}

function parseCard(block: SourceLine[]): CardMaster {
  if (block.length < 2) {
    throw parserError(block[0], "A card master needs a title and picture path");
  }

  const [titleLine, imageLine, ...body] = block;
  const attributes: CardAttribute[] = [];
  const interactions: InteractionDefinition[] = [];
  let readingAttributes = true;
  let eatDraft: EatDraft | null = null;

  for (const line of body) {
    if (readingAttributes && !BEHAVIOR_START.test(line.text)) {
      attributes.push(parseAttribute(line));
      continue;
    }
    readingAttributes = false;

    if (/^eat\b/i.test(line.text)) {
      const match = line.text.match(/^eat\s+(.+)$/i);
      if (!match || match[1].trim() === "") {
        throw parserError(line, "Expected 'eat <target card title>'");
      }
      finalizeEat(eatDraft, interactions);
      eatDraft = {
        targetTitle: match[1].trim(),
        effects: [],
        supported: true,
        line: line.number,
      };
      continue;
    }

    if (!eatDraft) continue;

    const valueEffect = line.text.match(TARGET_VALUE_EFFECT);
    if (valueEffect) {
      const effect: ChangeValueEffect = {
        kind: "change-value",
        attribute: valueEffect[1],
        amount: Number.parseInt(valueEffect[2], 10),
        recipient: "target",
      };
      eatDraft.effects.push(effect);
      continue;
    }
    if (/\btarget$/i.test(line.text)) {
      throw parserError(line, "Expected '<Value> <signed integer> target'");
    }
    if (/^consume\b/i.test(line.text)) {
      if (!/^consume\s+self$/i.test(line.text)) {
        throw parserError(line, "The prototype supports only 'consume self'");
      }
      eatDraft.effects.push({ kind: "consume-source" });
      continue;
    }

    // Other authored effects are valid future data, but are outside the deliberately
    // small Milestone 1 interaction grammar. Do not expose a partial interaction.
    eatDraft.supported = false;
  }

  finalizeEat(eatDraft, interactions);
  return {
    id: slugify(titleLine.text),
    title: titleLine.text,
    image: imageLine.text,
    attributes,
    interactions,
  };
}

export function parseCardMasters(source: string): CardMaster[] {
  const blocks = splitBlocks(source);
  if (blocks.length === 0) throw new Error("cards.txt contains no card masters");

  const masters = blocks.map(parseCard);
  const seen = new Set<string>();
  for (const master of masters) {
    if (!master.id) throw new Error(`Card title "${master.title}" cannot form an id`);
    if (seen.has(master.id)) throw new Error(`Duplicate card master id: ${master.id}`);
    seen.add(master.id);
  }
  return masters;
}
