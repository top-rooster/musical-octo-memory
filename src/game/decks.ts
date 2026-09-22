import type {
  CardAttribute,
  CardMaster,
  DeckCardState,
  DeckDefinition,
  DeckOwner,
  DeckState,
  GameState,
  Position,
} from "../domain/types";

function cloneAttributes(attributes: CardAttribute[]): CardAttribute[] {
  return attributes.map((attribute) => ({ ...attribute }));
}

export function shuffleOnce<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

export function drawFromDeck(
  deck: DeckState,
): { drawn: DeckCardState | null; deck: DeckState | null } {
  if (!deck.cards.length) return { drawn: null, deck: null };
  const [drawn, ...cards] = deck.cards;
  return { drawn, deck: cards.length ? { ...deck, cards } : null };
}

export function decksOwnedBy(state: GameState, owner: DeckOwner): DeckState[] {
  return (state.decks ?? []).filter(
    (deck) => deck.owner.kind === owner.kind && deck.owner.id === owner.id,
  );
}

export function deckOwnedByCard(state: GameState, cardId: string): DeckState | undefined {
  const decks = decksOwnedBy(state, { kind: "card", id: cardId });
  return decks.length === 1 ? decks[0] : undefined;
}

export function replaceDeck(state: GameState, deckId: string, deck: DeckState | null): GameState {
  const existing = state.decks ?? [];
  return {
    ...state,
    decks: deck
      ? existing.map((candidate) => candidate.id === deckId ? deck : candidate)
      : existing.filter((candidate) => candidate.id !== deckId),
  };
}

export function createOwnedDeckStates(
  masters: CardMaster[],
  definitions: DeckDefinition[],
  owner: DeckOwner,
  nextId: (prefix: string) => string,
  random: () => number,
  positions?: Position[],
): DeckState[] {
  const created: DeckState[] = [];
  for (const [index, definition] of definitions.entries()) {
    const cards = definition.cards.map((authored) => {
      const master = masters.find((candidate) => candidate.id === authored.masterId);
      if (!master) throw new Error(`Missing card master "${authored.masterId}"`);
      const card: DeckCardState = {
        id: nextId(`deck-card-${master.id}`),
        masterId: master.id,
        attributes: cloneAttributes(authored.attributes),
        references: { ...authored.references },
      };
      created.push(...createOwnedDeckStates(
        masters,
        master.decks,
        { kind: "card", id: card.id },
        nextId,
        random,
      ));
      return card;
    });
    created.push({
      id: nextId(`deck-${owner.id}`),
      definitionId: definition.id,
      name: definition.name,
      baseMinutes: definition.baseMinutes,
      owner,
      position: positions?.[index],
      cards: shuffleOnce(cards, random),
    });
  }
  return created;
}
