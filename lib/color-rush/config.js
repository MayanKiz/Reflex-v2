export const COLORS = [
  { name: 'Red', hex: '#ff668a' },
  { name: 'Blue', hex: '#5bd9ff' },
  { name: 'Purple', hex: '#b995ff' },
  { name: 'Green', hex: '#7de8b7' },
  { name: 'Yellow', hex: '#ffe28a' },
  { name: 'Orange', hex: '#ffad74' },
];

export const TOTAL_QUESTIONS = 15;
export const GAME_DURATION = 30;
export const TOTAL_CIRCLES = 16;
export const POINTS_CORRECT = 5;
export const POINTS_WRONG = 3;
export const QUESTION_TRANSITION_MS = 2000;
export const LEADERBOARD_CACHE_KEY = 'colorRushLeaderboardCache';
export const LEADERBOARD_CACHE_AT_KEY = 'colorRushLeaderboardCacheAt';

export const initialGame = {
  score: 0,
  streak: 0,
  bestStreak: 0,
  hits: 0,
  attempts: 0,
  round: 0,
  target: null,
  displayColor: null,
  command: 'FIND THE COLOR SHOWN',
  board: [],
  running: false,
  paused: false,
  locked: false,
  submitted: false,
  questionStartedAt: null,
  responseTimes: [],
  lastResponseTime: null,
  feedback: 'Read the command, then find the matching orb.',
  delta: null,
};
