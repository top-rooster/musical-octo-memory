import type { DeckCardState, SearchDeckState } from "../domain/types";

export function shuffleOnce<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

export function drawFromDeck(
  deck: SearchDeckState,
): { drawn: DeckCardState | null; deck: SearchDeckState | null } {
  if (!deck.cards.length) return { drawn: null, deck: null };
  const [drawn, ...cards] = deck.cards;
  return { drawn, deck: cards.length ? { ...deck, cards } : null };
}
