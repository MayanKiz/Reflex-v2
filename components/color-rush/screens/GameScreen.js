'use client';

import { ArrowLeft, Flame, Pause, Play } from 'lucide-react';
import { Button, Eyebrow } from '../SharedUI';
import { TOTAL_QUESTIONS } from '../../../lib/color-rush/config';

export default function GameScreen({ game, playerName, onOrb, onPause, onBack, onQuit, onStart }) {
  if (!game.running && !game.target) return <section className="screen-card game-lobby"><Eyebrow number="03">ROUND READY</Eyebrow><div className="lobby-layout"><div><h2>Ready to<br /><em>rush?</em></h2><p className="section-copy">Read each command. The word color may try to distract you.</p></div><div className="lobby-orb-cluster"><span /><span /><span /><span /><span /></div></div><div className="lobby-meta"><span><strong>15</strong> questions</span><span><strong>+5</strong> correct</span><span><strong>−3</strong> miss</span></div><Button onClick={onStart}>Start challenge <Play size={17} /></Button><button className="quiet-button" type="button" onClick={onBack}><ArrowLeft size={14} /> Back to setup</button></section>;

  const targetColor = game.target?.hex || '#b995ff';
  const distractColor = game.displayColor?.hex || targetColor;
  const targetName = game.target?.name?.toUpperCase() || 'READY';
  return <section className="game-screen">
    <div className="game-topline"><div className="game-context"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={15} /> Back</button><span className="player-chip"><span /> {playerName || 'Player'}</span></div><div className="game-round-meta"><span className="round-chip">QUESTION {String(game.round).padStart(2, '0')} / {TOTAL_QUESTIONS}</span><button className="icon-button" type="button" onClick={onPause} aria-label={game.paused ? 'Resume game' : 'Pause game'}>{game.paused ? <Play size={16} /> : <Pause size={16} />}</button></div></div>
    <div className="command-panel" aria-live="polite"><span className="command-kicker">READ THE COMMAND</span><strong style={{ color: distractColor }}>{game.command}</strong><small>The text color is only a distraction. Follow the word.</small></div>
    <div className="hud-grid"><div className="hud-card"><span className="hud-label">SCORE</span><strong>{game.score}</strong>{game.delta ? <span className={`score-delta ${game.delta > 0 ? 'positive' : 'negative'}`}>{game.delta > 0 ? '+' : '−'}{Math.abs(game.delta)}</span> : null}</div><div className="hud-card"><span className="hud-label">RESPONSE</span><strong>{game.lastResponseTime ? `${game.lastResponseTime.toFixed(2)}s` : '—'}</strong></div><div className="hud-card"><span className="hud-label">STREAK</span><strong>{game.streak}</strong><span className="hud-subline"><Flame size={12} /> {game.streak >= 3 ? 'on fire' : 'build it'}</span></div></div>
    <div className="arena-wrap"><div className="arena-caption"><span>SELECT: {targetName}</span><span>{game.locked ? 'LOCKED' : 'LIVE'}</span></div><div className="grid-board" aria-label="Color matching game board">{game.board.map((color, index) => <button key={`${game.round}-${index}`} className="color-orb" type="button" aria-label={`${color.name} orb`} style={{ '--orb-color': color.hex, '--delay': `${(index % 4) * 18}ms` }} onPointerDown={(event) => { event.preventDefault(); onOrb(color, event.currentTarget); }} />)}</div>{game.paused ? <div className="pause-overlay"><span className="pause-icon"><Pause size={17} /></span><strong>Take a breath.</strong><span>Your board is waiting.</span><Button onClick={() => onPause(false)}>Resume <Play size={15} /></Button></div> : null}</div>
    <div className="game-footer"><span aria-live="polite">{game.feedback}</span><button className="quiet-button danger" type="button" onClick={onQuit}>End challenge</button></div>
  </section>;
}
