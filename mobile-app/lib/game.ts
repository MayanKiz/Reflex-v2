export const TOTAL_QUESTIONS = 15;
export const POINTS_CORRECT = 5;
export const POINTS_WRONG = 3;
export const TRANSITION_MS = 1000;

export const COLORS = [
  { name: 'Pink', hex: '#ff5f9e' },
  { name: 'Blue', hex: '#42caff' },
  { name: 'Mint', hex: '#52e2be' },
  { name: 'Yellow', hex: '#ffd85f' },
  { name: 'Purple', hex: '#a77bff' },
  { name: 'Orange', hex: '#ffab65' },
];

export const SYMBOLS = [
  { name: 'Crown', glyph: '♛' }, { name: 'Moon', glyph: '☾' }, { name: 'Star', glyph: '★' },
  { name: 'Diamond', glyph: '◆' }, { name: 'Triangle', glyph: '▲' }, { name: 'Hexagon', glyph: '⬡' },
  { name: 'Heart', glyph: '♥' }, { name: 'Clover', glyph: '♣' }, { name: 'Circle', glyph: '○' },
  { name: 'Plus', glyph: '+' }, { name: 'Bolt', glyph: 'ϟ' }, { name: 'Cross', glyph: '×' },
  { name: 'Square', glyph: '□' }, { name: 'Sun', glyph: '☀' }, { name: 'Spiral', glyph: '◎' },
];

export type SymbolItem = { name: string; glyph: string };
export type Orb = { name: string; hex: string; symbol: SymbolItem };
export type Question = { target: Orb; displayColor: string; displaySymbol: SymbolItem; command: string; board: Orb[] };

const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export function makeQuestion(): Question {
  const targetColor = pick(COLORS);
  const targetSymbol = pick(SYMBOLS);
  const displayColor = pick(COLORS.filter((item) => item.name !== targetColor.name));
  const displaySymbol = pick(SYMBOLS.filter((item) => item.name !== targetSymbol.name));
  const board = Array.from({ length: 16 }, () => ({ ...pick(COLORS), symbol: pick(SYMBOLS) }));
  const target = { ...targetColor, symbol: targetSymbol };
  board[Math.floor(Math.random() * board.length)] = target;
  const command = `${pick(['FIND THE', 'MATCH THE', 'FIND ONLY'])} ${targetSymbol.name.toUpperCase()}`;
  return { target, displayColor: displayColor.hex, displaySymbol, command, board };
}

export function isCorrect(orb: Orb, question: Question) {
  return orb.symbol.name === question.target.symbol.name;
}

export function updateScore(score: number, streak: number, correct: boolean) {
  const nextStreak = correct ? streak + 1 : 0;
  return { score: Math.max(-999, score + (correct ? POINTS_CORRECT : -POINTS_WRONG)), streak: nextStreak };
}
