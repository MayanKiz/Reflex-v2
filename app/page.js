'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrandBar, Footer } from '../components/color-rush/SharedUI';
import FullscreenScreen from '../components/color-rush/screens/FullscreenScreen';
import RulesScreen from '../components/color-rush/screens/RulesScreen';
import SetupScreen from '../components/color-rush/screens/SetupScreen';
import GameScreen from '../components/color-rush/screens/GameScreen';
import ResultScreen from '../components/color-rush/screens/ResultScreen';
import LeaderboardScreen from '../components/color-rush/screens/LeaderboardScreen';
import GuideModal from '../components/color-rush/modals/GuideModal';
import CountdownOverlay from '../components/color-rush/modals/CountdownOverlay';
import { initialGame, POINTS_CORRECT, POINTS_WRONG, QUESTION_TRANSITION_MS, TOTAL_QUESTIONS } from '../lib/color-rush/config';
import { getHostedProfiles, localProfiles, makeBoard, normalizeName, postScore, readCachedProfiles, scorePayload, writeCachedProfiles } from '../lib/color-rush/client-utils';

const CORRECT_AUDIO_FILES = Array.from({ length: 23 }, (_, index) => `/right/right${index + 1}.mp3`);
// Add future files as wrongN.mp3; the pool is intentionally larger than today's upload.
const WRONG_AUDIO_FILES = Array.from({ length: 40 }, (_, index) => `/wrong/wrong${index + 1}.mp3`);

function playRandomAudio(files, audioRef, lastIndexRef, fallback) {
  if (typeof window === 'undefined' || !files.length) return;
  let index = Math.floor(Math.random() * files.length);
  if (files.length > 1) while (index === lastIndexRef.current) index = Math.floor(Math.random() * files.length);
  lastIndexRef.current = index;
  audioRef.current?.pause();
  const audio = new Audio(files[index]);
  audio.volume = 0.62;
  audioRef.current = audio;
  audio.addEventListener('ended', () => { if (audioRef.current === audio) audioRef.current = null; }, { once: true });
  audio.addEventListener('error', () => { if (audioRef.current === audio) audioRef.current = null; fallback?.(); }, { once: true });
  void audio.play().catch(() => fallback?.());
}

function playWrongFallback() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sawtooth'; oscillator.frequency.value = 160;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
    oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.13);
  } catch {}
  if (navigator.vibrate) navigator.vibrate([35, 35, 70]);
}

export default function ColorRush() {
  const [screen, setScreen] = useState('fullscreen');
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [game, setGame] = useState(initialGame);
  const [result, setResult] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardSynced, setLeaderboardSynced] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [leaderboardReturn, setLeaderboardReturn] = useState('rules');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [shareFeedback, setShareFeedback] = useState('');
  const gameRef = useRef(game);
  const countdownRef = useRef(null);
  const correctAudioRef = useRef(null);
  const wrongAudioRef = useRef(null);
  const lastCorrectAudioRef = useRef(-1);
  const lastWrongAudioRef = useRef(-1);

  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => () => { clearTimeout(countdownRef.current); correctAudioRef.current?.pause(); wrongAudioRef.current?.pause(); }, []);

  const loadLeaderboard = useCallback(async (force = false) => {
    const cached = readCachedProfiles();
    if (cached.length && !force) setProfiles(cached);
    setLeaderboardLoading(true); setLeaderboardError(false);
    try { const hosted = await getHostedProfiles(); setProfiles(hosted); setLeaderboardSynced(true); writeCachedProfiles(hosted); }
    catch { const fallback = cached.length ? cached : localProfiles(); setProfiles(fallback); setLeaderboardSynced(false); setLeaderboardError(true); if (fallback.length) writeCachedProfiles(fallback); }
    finally { setLeaderboardLoading(false); }
  }, []);

  useEffect(() => { loadLeaderboard(false); }, [loadLeaderboard]);
  useEffect(() => {
    const onKey = (event) => { if (screen === 'game' && (event.key.toLowerCase() === 'p' || event.key === 'Escape')) togglePause(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });

  const showRules = () => setScreen('rules');
  const enterFullscreen = async () => { try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch {} showRules(); };
  const beginChallenge = () => { const cleanName = normalizeName(playerName); if (cleanName.length < 2 || cleanName.length > 15) { setNameError(true); return; } setNameError(false); if (window.localStorage.getItem('colorRushGuideSeen') !== '1') setGuideOpen(true); else openGameLobby(); };
  const openGameLobby = () => { clearTimeout(countdownRef.current); setCountdown(null); setGame(initialGame); setScreen('game'); };

  const startCountdown = () => {
    clearTimeout(countdownRef.current);
    const steps = ['3', '2', '1', 'GO']; let index = 0;
    setScreen('game'); setCountdown(steps[index]);
    const tick = () => { index += 1; if (index >= steps.length) { countdownRef.current = window.setTimeout(() => { setCountdown(null); startGame(); }, 400); return; } setCountdown(steps[index]); countdownRef.current = window.setTimeout(tick, 500); };
    countdownRef.current = window.setTimeout(tick, 500);
  };

  const startGame = () => { const question = makeBoard(); setGame({ ...initialGame, ...question, round: 1, running: true, questionStartedAt: performance.now() }); setShareFeedback(''); setScreen('game'); };
  const nextBoard = () => { const question = makeBoard(); setGame((current) => ({ ...current, ...question, round: current.round + 1, locked: false, questionStartedAt: performance.now(), delta: null, feedback: 'Read the command carefully.' })); };

  const finishGame = async (snapshot = gameRef.current) => {
    if (snapshot.submitted) return;
    const accuracy = snapshot.attempts ? Math.round((snapshot.hits / snapshot.attempts) * 100) : 0;
    const previousBest = Number(window.localStorage.getItem('colorRushBest') || 0);
    const bestScore = Math.max(previousBest, snapshot.score);
    window.localStorage.setItem('colorRushBest', String(bestScore));
    const payload = scorePayload(playerName, snapshot);
    const times = snapshot.responseTimes;
    const nextResult = { score: snapshot.score, hits: snapshot.hits, wrong: TOTAL_QUESTIONS - snapshot.hits, accuracy, bestScore, isNewBest: snapshot.score > previousBest, totalTime: times.reduce((sum, time) => sum + time, 0), averageTime: times.length ? times.reduce((sum, time) => sum + time, 0) / times.length : 0, fastest: times.length ? Math.min(...times) : 0, slowest: times.length ? Math.max(...times) : 0, bestStreak: snapshot.bestStreak };
    setGame((value) => ({ ...value, running: false, paused: false, submitted: true, locked: true })); setResult(nextResult); setScreen('result');
    try { const localScores = JSON.parse(window.localStorage.getItem('colorRushScores') || '[]'); localScores.push(payload); localScores.sort((a, b) => b.score - a.score); window.localStorage.setItem('colorRushScores', JSON.stringify(localScores.slice(0, 100))); } catch {}
    await postScore(payload); await loadLeaderboard(true);
  };

  const handleOrb = (color, node) => {
    const current = gameRef.current;
    if (!current.running || current.paused || current.locked || !current.target) return;
    const responseTime = Number(((performance.now() - current.questionStartedAt) / 1000).toFixed(2));
    const correct = color.symbol?.name === current.target.symbol?.name;
    if (node) node.classList.add(correct ? 'hit' : 'miss');
    const nextScore = Math.max(-999, current.score + (correct ? POINTS_CORRECT : -POINTS_WRONG));
    const nextStreak = correct ? current.streak + 1 : 0;
    const responseTimes = [...current.responseTimes, responseTime];
    const snapshot = { ...current, score: nextScore, streak: nextStreak, bestStreak: Math.max(current.bestStreak, nextStreak), hits: current.hits + (correct ? 1 : 0), attempts: current.attempts + 1, responseTimes, lastResponseTime: responseTime, locked: true, feedback: correct ? 'Correct. Next question loading.' : 'Wrong color. Read the next command carefully.' };
    gameRef.current = snapshot;
    setGame(snapshot);
    if (correct) playRandomAudio(CORRECT_AUDIO_FILES, correctAudioRef, lastCorrectAudioRef);
    else playRandomAudio(WRONG_AUDIO_FILES, wrongAudioRef, lastWrongAudioRef, playWrongFallback);
    if (current.round >= TOTAL_QUESTIONS) { window.setTimeout(() => finishGame(gameRef.current), 120); return; }
    window.setTimeout(() => { if (!gameRef.current.submitted) { setCountdown('NEXT ROUND'); countdownRef.current = window.setTimeout(() => { setCountdown(null); nextBoard(); }, QUESTION_TRANSITION_MS); } }, 220);
  };

  const togglePause = (force) => setGame((current) => ({ ...current, paused: typeof force === 'boolean' ? force : !current.paused }));
  const leaveGame = () => { clearTimeout(countdownRef.current); setCountdown(null); setGame((current) => ({ ...current, running: false, paused: false })); setScreen('setup'); };
  const openLeaderboard = (from) => { setLeaderboardReturn(from); setSelectedProfile(null); setScreen('leaderboard'); loadLeaderboard(true); };
  const goToSetup = () => { setScreen('setup'); window.setTimeout(() => document.getElementById('player-name')?.focus(), 50); };
  const playAgain = () => { goToSetup(); };
  const shareResult = async () => { const message = `I scored ${result?.score || 0} points in Color Rush! Can you beat me?`; try { await navigator.clipboard.writeText(message); setShareFeedback('Result copied. Send it to your squad.'); } catch { setShareFeedback(message); } };

  return <main className="app-shell"><BrandBar /><div className="content-stage">
    {screen === 'fullscreen' ? <FullscreenScreen onEnter={enterFullscreen} onContinue={showRules} /> : null}
    {screen === 'rules' ? <RulesScreen profiles={profiles} onEnterSetup={goToSetup} onViewLeaderboard={() => openLeaderboard('rules')} onSelectProfile={(profile) => { openLeaderboard('rules'); setSelectedProfile(profile); }} /> : null}
    {screen === 'setup' ? <SetupScreen playerName={playerName} setPlayerName={setPlayerName} error={nameError} onBack={showRules} onStart={beginChallenge} /> : null}
    {screen === 'game' ? <GameScreen game={game} playerName={playerName} onOrb={handleOrb} onPause={togglePause} onBack={leaveGame} onQuit={() => finishGame()} onStart={startCountdown} /> : null}
    {screen === 'result' && result ? <ResultScreen result={result} profiles={profiles} onViewLeaderboard={() => openLeaderboard('result')} onSelectProfile={(profile) => { openLeaderboard('result'); setSelectedProfile(profile); }} onPlayAgain={playAgain} onBack={goToSetup} onShare={shareResult} shareFeedback={shareFeedback} /> : null}
    {screen === 'leaderboard' ? <LeaderboardScreen profiles={profiles} loading={leaderboardLoading} synced={leaderboardSynced} error={leaderboardError} selectedProfile={selectedProfile} onSelect={setSelectedProfile} onCloseProfile={() => setSelectedProfile(null)} onPlayAgain={playAgain} onBack={() => { setSelectedProfile(null); setScreen(leaderboardReturn); }} /> : null}
  </div><Footer />{guideOpen ? <GuideModal onClose={() => { setGuideOpen(false); setScreen('setup'); }} onStart={() => { window.localStorage.setItem('colorRushGuideSeen', '1'); setGuideOpen(false); openGameLobby(); }} /> : null}{countdown ? <CountdownOverlay value={countdown} /> : null}</main>;
}
