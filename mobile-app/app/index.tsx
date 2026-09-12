import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { makeQuestion, isCorrect, updateScore, type Orb, type Question, TOTAL_QUESTIONS, TRANSITION_MS } from '../lib/game';

const { width } = Dimensions.get('window');
const RIGHT_AUDIO = [
  require('../assets/audio/right/right1.mp3'),
  require('../assets/audio/right/right2.mp3'),
  require('../assets/audio/right/right3.mp3'),
];

const colors = { bg: '#030817', panel: '#091329', panel2: '#0d1832', text: '#f6f5ff', muted: '#8d9ab9', line: '#213254', purple: '#a77bff', cyan: '#42caff', mint: '#52e2be', pink: '#ff5f9e', yellow: '#ffd85f' };

function Header({ question, onPause, paused }: { question: number; onPause: () => void; paused: boolean }) {
  return <View style={styles.header}><View style={styles.brand}><View style={styles.brandDot}><Text style={styles.brandDotText}>●</Text></View><Text style={styles.brandText}>COLOR <Text style={{ color: colors.pink }}>RUSH</Text></Text></View><View style={styles.headerRight}><Text style={styles.roundText}>ROUND {String(question).padStart(2, '0')}</Text><Pressable onPress={onPause} style={({ pressed }) => [styles.pauseButton, pressed && styles.pressed]}><Text style={styles.pauseText}>{paused ? '▶' : 'Ⅱ'}</Text></Pressable></View></View>;
}

function StatCard({ label, value, subline, wide }: { label: string; value: string; subline?: string; wide?: boolean }) {
  return <View style={[styles.statCard, wide && styles.statWide]}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value}</Text>{subline ? <Text style={styles.statSubline}>{subline}</Text> : null}</View>;
}

export default function HomeScreen() {
  const [mode, setMode] = useState<'home' | 'game' | 'results'>('home');
  const [question, setQuestion] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [transition, setTransition] = useState(false);
  const startedAt = useRef(0);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSound = useRef<Audio.Sound | null>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); currentSound.current?.unloadAsync(); }, []);

  const totalTime = responseTimes.reduce((sum, time) => sum + time, 0);
  const averageTime = responseTimes.length ? totalTime / responseTimes.length : 0;
  const fastest = responseTimes.length ? Math.min(...responseTimes) : 0;
  const accuracy = responseTimes.length ? Math.round((hits / responseTimes.length) * 100) : 0;

  const playCorrectSound = async () => {
    try {
      await currentSound.current?.unloadAsync();
      const source = RIGHT_AUDIO[Math.floor(Math.random() * RIGHT_AUDIO.length)];
      const result = await Audio.Sound.createAsync(source, { shouldPlay: true, volume: 0.58 });
      currentSound.current = result.sound;
    } catch { /* audio is optional */ }
  };

  const startGame = () => {
    const next = makeQuestion();
    setQuestion(next); setRound(1); setScore(0); setStreak(0); setBestStreak(0); setHits(0); setResponseTimes([]); setLocked(false); setPaused(false); setTransition(false); setMode('game'); startedAt.current = Date.now();
    Animated.spring(pulse, { toValue: 1.04, useNativeDriver: true, speed: 16 }).start(() => Animated.spring(pulse, { toValue: 1, useNativeDriver: true }).start());
  };

  const finish = () => { setMode('results'); setQuestion(null); setLocked(true); };
  const nextRound = () => {
    if (round >= TOTAL_QUESTIONS) { finish(); return; }
    const next = makeQuestion(); setQuestion(next); setRound((value) => value + 1); setLocked(false); setTransition(false); startedAt.current = Date.now();
  };

  const onOrb = async (orb: Orb) => {
    if (!question || locked || paused || transition) return;
    setLocked(true);
    const elapsed = Number(((Date.now() - startedAt.current) / 1000).toFixed(2));
    const correct = isCorrect(orb, question);
    const next = updateScore(score, streak, correct);
    setResponseTimes((values) => [...values, elapsed]); setScore(next.score); setStreak(next.streak); setBestStreak((value) => Math.max(value, next.streak)); if (correct) setHits((value) => value + 1);
    if (correct) { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await playCorrectSound(); } else await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTransition(true);
    transitionTimer.current = setTimeout(nextRound, TRANSITION_MS);
  };

  const pause = () => setPaused((value) => !value);

  if (mode === 'home') return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.homeContent}><View style={styles.homeOrb}><Text style={styles.homeGlyph}>★</Text></View><Text style={styles.kicker}>REFLEX ARENA / MOBILE</Text><Text style={styles.title}>COLOR <Text style={{ color: colors.pink }}>RUSH</Text></Text><Text style={styles.homeCopy}>Read the command. Ignore the distraction. Find the matching symbol before your reflexes cool down.</Text><View style={styles.featureRow}><View><Text style={styles.featureValue}>15</Text><Text style={styles.featureLabel}>QUESTIONS</Text></View><View><Text style={styles.featureValue}>4×4</Text><Text style={styles.featureLabel}>SYMBOL GRID</Text></View><View><Text style={styles.featureValue}>+5</Text><Text style={styles.featureLabel}>CORRECT</Text></View></View><Pressable onPress={startGame} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><LinearGradient colors={[colors.purple, colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryGradient}><Text style={styles.primaryText}>START CHALLENGE</Text><Text style={styles.primaryArrow}>→</Text></LinearGradient></Pressable><Text style={styles.homeHint}>Smooth haptics · sound feedback · instant replay</Text></ScrollView></SafeAreaView>;

  if (mode === 'results') return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.resultsContent}><Text style={styles.kicker}>REFLEX ARENA / COMPLETE</Text><Text style={styles.resultsTitle}>RUN <Text style={{ color: colors.mint }}>COMPLETE</Text></Text><View style={styles.scoreHero}><Text style={styles.statLabel}>FINAL SCORE</Text><Text style={styles.finalScore}>{score}</Text><Text style={styles.statSubline}>POINTS</Text></View><View style={styles.statsGrid}><StatCard label="CORRECT" value={`${hits} / ${TOTAL_QUESTIONS}`} /><StatCard label="ACCURACY" value={`${accuracy}%`} /><StatCard label="TOTAL TIME" value={`${totalTime.toFixed(2)}s`} /><StatCard label="AVERAGE" value={`${averageTime.toFixed(2)}s`} /><StatCard label="FASTEST" value={`${fastest.toFixed(2)}s`} /><StatCard label="BEST STREAK" value={String(bestStreak)} /></View><Pressable onPress={startGame} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><LinearGradient colors={[colors.purple, colors.pink]} style={styles.primaryGradient}><Text style={styles.primaryText}>PLAY AGAIN</Text><Text style={styles.primaryArrow}>↻</Text></LinearGradient></Pressable></ScrollView></SafeAreaView>;

  if (!question) return null;
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.gameContent}><Header question={round} onPause={pause} paused={paused} /><View style={styles.playerLine}><Text style={styles.playerDot}>●</Text><Text style={styles.playerName}>PLAYER ONE</Text><Text style={styles.questionCount}>{round} / {TOTAL_QUESTIONS}</Text></View><LinearGradient colors={['#162446', '#0b1328']} style={styles.targetCard}><Text style={styles.targetKicker}>FIND THE</Text><View style={styles.targetBody}><Animated.Text style={[styles.targetGlyph, { color: question.displayColor, transform: [{ scale: pulse }] }]}>{question.displaySymbol.glyph}</Animated.Text><View><Text style={[styles.targetName, { color: question.displayColor }]}>{question.target.symbol.name.toUpperCase()}</Text><Text style={styles.targetHint}>text and color do not always match</Text></View></View></LinearGradient><View style={styles.timerCard}><View style={styles.timerTop}><Text style={styles.statLabel}>◷  TIME / RESPONSE</Text><Text style={styles.timerValue}>{locked ? 'LOCKED' : 'LIVE'}</Text></View><View style={styles.timerTrack}><View style={[styles.timerFill, { width: locked ? '100%' : '72%' }]} /></View></View><View style={styles.statsGrid}><StatCard label="SCORE" value={String(score)} /><StatCard label="STREAK" value={String(streak)} subline={streak >= 3 ? '🔥 keep going' : 'build it'} /></View><View style={styles.arena}><View style={styles.arenaTop}><Text style={styles.statLabel}>SELECT THE MATCHING SYMBOL</Text><Text style={styles.statLabel}>{locked ? 'WAIT' : 'LIVE'}</Text></View><View style={styles.board}>{question.board.map((orb, index) => <Pressable key={`${round}-${index}`} disabled={locked || paused} onPress={() => onOrb(orb)} style={({ pressed }) => [styles.orb, { backgroundColor: orb.hex }, pressed && styles.orbPressed, locked && styles.orbLocked]}><Text style={styles.orbGlyph}>{orb.symbol.glyph}</Text></Pressable>)}</View>{(paused || transition) && <View style={styles.overlay}><View style={styles.hourglass}><Text>{paused ? 'Ⅱ' : '⌛'}</Text></View><Text style={styles.overlayTitle}>{paused ? 'TAKE A BREATH' : 'GET READY...'}</Text><Text style={styles.overlayCopy}>{paused ? 'Your board is waiting.' : 'Next round in 1.0s'}</Text>{paused && <Pressable onPress={pause} style={styles.resumeButton}><Text style={styles.resumeText}>RESUME</Text></Pressable>}</View>}</View><View style={styles.footer}><Text style={styles.footerCopy}>{question.command}</Text><Pressable onPress={finish}><Text style={styles.endText}>END</Text></Pressable></View></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.bg }, homeContent: { flexGrow: 1, justifyContent: 'center', padding: 26, paddingBottom: 44 }, gameContent: { padding: 16, paddingBottom: 28 }, resultsContent: { flexGrow: 1, padding: 26, justifyContent: 'center' }, homeOrb: { alignSelf: 'center', width: 112, height: 112, borderRadius: 40, backgroundColor: '#162442', borderWidth: 1, borderColor: colors.purple, alignItems: 'center', justifyContent: 'center', shadowColor: colors.purple, shadowOpacity: .5, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 9 }, homeGlyph: { color: colors.purple, fontSize: 66 }, kicker: { marginTop: 28, color: colors.mint, fontSize: 10, fontWeight: '700', letterSpacing: 2.4 }, title: { marginTop: 9, color: colors.text, fontSize: 42, fontWeight: '800', letterSpacing: -2 }, homeCopy: { marginTop: 16, maxWidth: 390, color: colors.muted, fontSize: 15, lineHeight: 23 }, featureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 34, paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line }, featureValue: { color: colors.text, fontSize: 21, fontWeight: '800' }, featureLabel: { marginTop: 5, color: colors.muted, fontSize: 9, letterSpacing: 1.2 }, primaryButton: { marginTop: 26, overflow: 'hidden', borderRadius: 16 }, primaryGradient: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryText: { color: '#080b18', fontSize: 13, fontWeight: '900', letterSpacing: 1.2 }, primaryArrow: { color: '#080b18', fontSize: 25 }, homeHint: { marginTop: 14, color: '#5f6b8e', textAlign: 'center', fontSize: 11 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, brandDot: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, borderColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }, brandDotText: { color: colors.yellow, fontSize: 10 }, brandText: { color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 1.5 }, headerRight: { flexDirection: 'row', alignItems: 'center', gap: 9 }, roundText: { color: colors.muted, fontSize: 11, letterSpacing: 1.2 }, pauseButton: { width: 45, height: 38, borderRadius: 13, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel2 }, pauseText: { color: colors.yellow, fontSize: 20 }, playerLine: { flexDirection: 'row', alignItems: 'center', marginTop: 21, gap: 6 }, playerDot: { color: colors.purple, fontSize: 13 }, playerName: { color: colors.muted, fontSize: 11, letterSpacing: 1.6, fontWeight: '700' }, questionCount: { marginLeft: 'auto', color: colors.muted, fontSize: 11, letterSpacing: 1 }, targetCard: { marginTop: 17, padding: 16, borderRadius: 17, borderWidth: 1, borderColor: colors.cyan, overflow: 'hidden' }, targetKicker: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 2.1 }, targetBody: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 10 }, targetGlyph: { width: 64, height: 64, textAlign: 'center', textAlignVertical: 'center', borderRadius: 17, backgroundColor: 'rgba(255,255,255,.10)', fontSize: 48, overflow: 'hidden' }, targetName: { fontSize: 28, fontWeight: '800', letterSpacing: 1 }, targetHint: { marginTop: 4, color: colors.muted, fontSize: 11 }, timerCard: { marginTop: 10, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel }, timerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, timerValue: { color: colors.text, fontSize: 18, fontWeight: '800' }, timerTrack: { height: 5, marginTop: 12, backgroundColor: '#1b2944', borderRadius: 5, overflow: 'hidden' }, timerFill: { height: 5, borderRadius: 5, backgroundColor: colors.mint }, statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 10 }, statCard: { flex: 1, minWidth: (width - 50) / 2, padding: 14, minHeight: 76, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel }, statWide: { flexBasis: '100%' }, statLabel: { color: colors.muted, fontSize: 10, letterSpacing: 1.4 }, statValue: { marginTop: 5, color: colors.text, fontSize: 26, fontWeight: '800' }, statSubline: { marginTop: 4, color: colors.muted, fontSize: 11 }, arena: { position: 'relative', marginTop: 10, padding: 11, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: '#050d20' }, arenaTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2, paddingBottom: 11 }, board: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }, orb: { width: (width - 64) / 4, height: (width - 64) / 4, maxWidth: 85, maxHeight: 85, borderRadius: 99, alignItems: 'center', justifyContent: 'center', shadowColor: '#fff', shadowOpacity: .25, shadowRadius: 11, shadowOffset: { width: 0, height: 4 }, elevation: 5 }, orbGlyph: { color: 'rgba(4,9,26,.65)', fontSize: 32, fontWeight: '900' }, orbPressed: { transform: [{ scale: .9 }], opacity: .82 }, orbLocked: { opacity: .55 }, overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 18, backgroundColor: 'rgba(3,8,20,.82)', alignItems: 'center', justifyContent: 'center' }, hourglass: { width: 74, height: 74, borderRadius: 38, borderWidth: 1, borderColor: colors.cyan, alignItems: 'center', justifyContent: 'center' }, overlayTitle: { marginTop: 15, color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: 1.8 }, overlayCopy: { marginTop: 7, color: colors.muted, fontSize: 12 }, resumeButton: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.purple }, resumeText: { color: '#090c1d', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }, footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingHorizontal: 3 }, footerCopy: { color: colors.muted, fontSize: 11 }, endText: { color: colors.pink, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, pressed: { opacity: .78, transform: [{ scale: .98 }] }, resultsTitle: { marginTop: 8, color: colors.text, fontSize: 38, fontWeight: '800' }, scoreHero: { marginTop: 25, paddingVertical: 18, borderBottomWidth: 1, borderColor: colors.line }, finalScore: { marginTop: 4, color: colors.yellow, fontSize: 72, fontWeight: '900', letterSpacing: -4 } });
