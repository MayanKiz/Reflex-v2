import assert from 'node:assert/strict';

const TOTAL_QUESTIONS = 15;
const symbols = ['Crown', 'Moon', 'Star', 'Diamond', 'Triangle', 'Hexagon', 'Heart', 'Clover', 'Circle', 'Plus', 'Bolt', 'Cross', 'Square', 'Sun', 'Spiral'];
const colors = ['Pink', 'Blue', 'Mint', 'Yellow', 'Purple', 'Orange'];

function updateScore(score, streak, correct) {
  const nextStreak = correct ? streak + 1 : 0;
  return { score: Math.max(-999, score + (correct ? 5 : -3)), streak: nextStreak };
}

function makeQuestion() {
  const targetSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  const board = Array.from({ length: 16 }, (_, index) => ({ color: colors[index % colors.length], symbol: symbols[index % symbols.length] }));
  board[0] = { color: colors[0], symbol: targetSymbol };
  return { targetSymbol, board, command: `FIND THE ${targetSymbol.toUpperCase()}` };
}

for (let index = 0; index < TOTAL_QUESTIONS; index += 1) {
  const question = makeQuestion();
  assert.equal(question.board.length, 16);
  assert.ok(question.board.some((orb) => orb.symbol === question.targetSymbol));
  assert.match(question.command, new RegExp(question.targetSymbol.toUpperCase()));
}
assert.deepEqual(updateScore(0, 0, true), { score: 5, streak: 1 });
assert.deepEqual(updateScore(5, 1, false), { score: 2, streak: 0 });
assert.deepEqual(updateScore(-999, 0, false), { score: -999, streak: 0 });
console.log('game logic tests passed');
