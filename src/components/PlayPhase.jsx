import { useState, useCallback, useEffect, useRef } from 'react';
import { playAudio } from '../utils/audio';

/* ═══════════════ DYNAMIC QUESTION GENERATORS ═══════════════ */

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const NAMES = ['John', 'Mike', 'Sarah', 'Yuki', 'Priya', 'Diego', 'Liam', 'Mei', 'Aisha', 'Carlos', 'Fatima'];
const OBJECTS = ['kite strut', 'bridge truss', 'roof truss', 'bike frame', 'sail panel', 'roller-coaster support', 'solar-panel frame', 'tent frame', 'geodesic panel'];

function classifySides(a, b, c) {
  const e = 0.5;
  if (Math.abs(a - b) < e && Math.abs(b - c) < e) return 'Equilateral';
  if (Math.abs(a - b) < e || Math.abs(b - c) < e || Math.abs(a - c) < e) return 'Isosceles';
  return 'Scalene';
}
function classifyAngles(angles) {
  const max = Math.max(...angles);
  if (max > 91) return 'Obtuse';
  if (max >= 89 && max <= 91) return 'Right';
  return 'Acute';
}

// Fisher-Yates used to make sure options are unique and shuffled
function makeOptions(correct, wrongs) {
  const opts = shuffle([correct, ...wrongs.slice(0, 3)]);
  return { options: opts, correctIdx: opts.indexOf(correct) };
}

/* 10 question type generators — each returns {q, options, correct (index), explanation} */
const QUESTION_TYPES = [
  // Q1: Classify by sides
  () => {
    const type = pick(['Equilateral', 'Isosceles', 'Scalene']);
    let a, b, c, distractors;
    if (type === 'Equilateral') {
      a = rnd(3, 12); b = a; c = a;
      distractors = ['Isosceles', 'Scalene', 'Right'];
    } else if (type === 'Isosceles') {
      a = rnd(3, 12); b = a; c = rnd(3, 12);
      while (c === a) c = rnd(3, 12);
      distractors = ['Equilateral', 'Scalene', 'Acute'];
    } else {
      a = rnd(2, 10); b = rnd(2, 10); c = rnd(2, 10);
      while (b === a) b = rnd(2, 10);
      while (c === a || c === b) c = rnd(2, 10);
      // Ensure valid triangle
      while (a + b <= c || a + c <= b || b + c <= a) { a = rnd(2, 10); b = rnd(2, 10); c = rnd(2, 10); }
      distractors = ['Isosceles', 'Equilateral', 'Obtuse'];
    }
    const { options, correctIdx } = makeOptions(type, distractors);
    return { q: `A triangle has sides of length ${a}, ${b}, and ${c} units. How is it classified by its sides?`, options, correct: correctIdx, explanation: `${type} triangles have ${type === 'Equilateral' ? 'all 3 sides equal' : type === 'Isosceles' ? 'exactly 2 equal sides' : 'all 3 different sides'}.` };
  },
  // Q2: Classify by angles
  () => {
    const type = pick(['Acute', 'Right', 'Obtuse']);
    let angles;
    if (type === 'Right') {
      const a = rnd(20, 70); angles = [a, 90 - a, 90];
    } else if (type === 'Acute') {
      const a = rnd(40, 80), b = rnd(40, 80);
      const c = 180 - a - b;
      angles = c > 0 && c < 90 ? [a, b, c] : [60, 60, 60];
    } else {
      const a = rnd(20, 50), b = rnd(20, 50);
      const c = 180 - a - b;
      angles = c > 90 ? [a, b, c] : [30, 40, 110];
    }
    const { options, correctIdx } = makeOptions(type, ['Acute', 'Right', 'Obtuse'].filter(t => t !== type));
    return { q: `A triangle has angles of ${angles[0]}°, ${angles[1]}°, and ${angles[2]}°. What type is it by angles?`, options, correct: correctIdx, explanation: `${type} triangle: ${type === 'Right' ? 'one angle is exactly 90°' : type === 'Acute' ? 'all angles are less than 90°' : 'one angle exceeds 90°'}.` };
  },
  // Q3: Combined classification
  () => {
    const combos = [
      { sides: [6, 6, 9], angles: [42, 42, 96], sideName: 'Isosceles', angleName: 'Obtuse' },
      { sides: [5, 12, 13], angles: [22, 68, 90], sideName: 'Scalene', angleName: 'Right' },
      { sides: [7, 7, 7], angles: [60, 60, 60], sideName: 'Equilateral', angleName: 'Acute' },
      { sides: [3, 4, 6], angles: [26, 36, 118], sideName: 'Scalene', angleName: 'Obtuse' },
      { sides: [5, 5, 7], angles: [45, 45, 90], sideName: 'Isosceles', angleName: 'Right' },
    ];
    const c = pick(combos);
    const correct = `${c.sideName} ${c.angleName}`;
    const wrongs = ['Isosceles Acute', 'Scalene Right', 'Equilateral Obtuse', 'Scalene Acute'].filter(w => w !== correct);
    const { options, correctIdx } = makeOptions(correct, wrongs);
    return { q: `A triangle has sides ${c.sides.join(', ')} and angles ${c.angles.join('°, ')}°. What is its FULL classification?`, options, correct: correctIdx, explanation: `${c.sideName} (by sides) + ${c.angleName} (by angles) = ${correct} triangle.` };
  },
  // Q4: Missing angle
  () => {
    const type = pick(['Acute', 'Right', 'Obtuse']);
    let a, b, miss;
    if (type === 'Right') { a = rnd(20, 69); b = 90; miss = 180 - a - b; }
    else if (type === 'Acute') { a = rnd(40, 79); b = rnd(40, 79); miss = 180 - a - b; if (miss <= 0 || miss >= 90) { a = 60; b = 60; miss = 60; } }
    else { a = rnd(20, 49); b = rnd(20, 49); miss = 180 - a - b; if (miss <= 90) { a = 30; b = 40; miss = 110; } }
    const wrongs = [miss + 10, miss - 10, miss + 20].filter(w => w > 0 && w <= 180 && w !== miss);
    const { options, correctIdx } = makeOptions(`${miss}°`, wrongs.map(w => `${w}°`));
    return { q: `Two angles of a triangle are ${a}° and ${b}°. What is the third angle? (Angle Sum = 180°)`, options, correct: correctIdx, explanation: `180° − ${a}° − ${b}° = ${miss}°.` };
  },
  // Q5: Triangle Inequality
  () => {
    const valid = Math.random() > 0.45;
    let a, b, c;
    if (valid) { a = rnd(3, 12); b = rnd(3, 12); c = rnd(3, 12); while (a + b <= c || a + c <= b || b + c <= a) { a = rnd(3, 12); b = rnd(3, 12); c = rnd(3, 12); } }
    else { a = rnd(2, 6); b = rnd(2, 6); c = a + b + rnd(1, 5); }
    const correct = valid ? 'Yes, it can form a triangle' : 'No, it cannot form a triangle';
    const wrong = valid ? 'No, it cannot form a triangle' : 'Yes, it can form a triangle';
    const { options, correctIdx } = makeOptions(correct, [wrong, 'Not enough information', 'Only with an acute angle']);
    return { q: `Can three sides of length ${a} cm, ${b} cm, and ${c} cm form a triangle?`, options, correct: correctIdx, explanation: valid ? `Sum of any two sides (${a}+${b}=${a + b}) is greater than third (${c}). ✓` : `${a} + ${b} = ${a + b} which is NOT greater than ${c}. Triangle impossible!` };
  },
  // Q6: True/False hierarchy
  () => {
    const statements = [
      { text: 'Every equilateral triangle is also isosceles.', correct: 'True', exp: 'All equilateral triangles have 3 equal sides — certainly 2 equal sides, so isosceles too.' },
      { text: 'Every isosceles triangle is equilateral.', correct: 'False', exp: 'Isosceles only requires 2 equal sides. The third can differ.' },
      { text: 'A right triangle can be isosceles.', correct: 'True', exp: 'Yes — a 45°-45°-90° triangle is right AND isosceles.' },
      { text: 'An equilateral triangle is always acute.', correct: 'True', exp: 'All angles are 60°, which are all less than 90°.' },
      { text: 'An obtuse triangle can be equilateral.', correct: 'False', exp: 'Equilateral angles are always 60° — impossible to be obtuse.' },
      { text: 'A scalene triangle can be right-angled.', correct: 'True', exp: 'Yes! e.g. 3-4-5 triangle (37°-53°-90°) is both scalene and right.' },
    ];
    const s = pick(statements);
    const { options, correctIdx } = makeOptions(s.correct, ['True', 'False'].filter(v => v !== s.correct).concat(['Cannot tell', 'Sometimes']));
    return { q: `TRUE or FALSE: ${s.text}`, options, correct: correctIdx, explanation: s.exp };
  },
  // Q7: Word problem
  () => {
    const name = pick(NAMES);
    const obj = pick(OBJECTS);
    const type = pick(['Equilateral', 'Isosceles', 'Scalene', 'Right isosceles', 'Acute scalene']);
    const descriptions = {
      'Equilateral': () => { const s = rnd(5, 30); return { sides: [s, s, s], desc: `${name}'s ${obj} has three sides all measuring ${s} cm.` }; },
      'Isosceles': () => { const a = rnd(5, 25); let b = rnd(5, 25); while (b === a) b = rnd(5, 25); return { sides: [a, a, b], desc: `${name}'s ${obj} has sides ${a} cm, ${a} cm, and ${b} cm.` }; },
      'Scalene': () => { const a = rnd(4, 15), b = rnd(4, 15); let c = rnd(4, 15); while (a + b <= c || a + c <= b || b + c <= a || c === a || c === b) c = rnd(4, 15); return { sides: [a, b, c], desc: `${name}'s ${obj} has sides ${a} cm, ${b} cm, and ${c} cm.` }; },
      'Right isosceles': () => { const s = rnd(5, 20); return { sides: [s, s, Math.round(s * 1.41)], desc: `${name}'s ${obj} has two equal sides of ${s} cm and a 90° corner.` }; },
      'Acute scalene': () => { return { sides: [7, 8, 9], desc: `${name}'s ${obj} has sides 7, 8, and 9 cm.` }; },
    };
    const d = descriptions[type]();
    const sideCls = classifySides(...d.sides);
    const wrongs = ['Equilateral', 'Isosceles', 'Scalene'].filter(t => t !== sideCls);
    const { options, correctIdx } = makeOptions(sideCls, wrongs);
    return { q: `${d.desc} How is this triangle classified by its sides?`, options, correct: correctIdx, explanation: `${sideCls}: ${sideCls === 'Equilateral' ? 'all sides equal' : sideCls === 'Isosceles' ? 'two sides equal' : 'all sides different'}.` };
  },
  // Q8: Angle identification
  () => {
    const types = [
      { name: 'Acute', example: [55, 65, 60], wrong: ['Right', 'Obtuse'] },
      { name: 'Right', example: [30, 60, 90], wrong: ['Acute', 'Obtuse'] },
      { name: 'Obtuse', example: [40, 30, 110], wrong: ['Acute', 'Right'] },
    ];
    const t = pick(types);
    const { options, correctIdx } = makeOptions(t.name, t.wrong.concat(['Equilateral']));
    return { q: `A triangle has angles ${t.example.join('°, ')}°. The LARGEST angle is ${Math.max(...t.example)}°. What type of triangle is this by ANGLES?`, options, correct: correctIdx, explanation: `${t.name}: ${t.name === 'Acute' ? 'all angles < 90°' : t.name === 'Right' ? 'has exactly one 90° angle' : 'has one angle > 90°'}.` };
  },
  // Q9: Find missing angle + classify
  () => {
    const a = rnd(25, 80); const b = rnd(25, 80);
    const miss = 180 - a - b;
    const typeAng = classifyAngles([a, b, miss]);
    const wrongs = ['Acute', 'Right', 'Obtuse'].filter(t => t !== typeAng);
    const { options, correctIdx } = makeOptions(typeAng, wrongs.concat(['Equilateral']));
    return { q: `Two angles of a triangle are ${a}° and ${b}°. After finding the third angle, what type of triangle is it BY ANGLES?`, options, correct: correctIdx, explanation: `Third angle = 180° − ${a}° − ${b}° = ${miss}°. Largest = ${Math.max(a, b, miss)}° → ${typeAng}.` };
  },
  // Q10: Mixed challenge
  () => {
    const challenges = [
      { q: 'How many degrees do the interior angles of ANY triangle add up to?', options: ['90°', '180°', '270°', '360°'], correct: 1, explanation: 'The Angle Sum Property: every triangle\'s interior angles sum to exactly 180°.' },
      { q: 'Which combination of triangle classifications is IMPOSSIBLE?', options: ['Right Isosceles', 'Equilateral Acute', 'Obtuse Equilateral', 'Scalene Right'], correct: 2, explanation: 'Equilateral triangles always have 60° angles — they can never be obtuse.' },
      { q: 'In a triangle, if the exterior angle is 130°, what is the interior angle at that vertex?', options: ['130°', '50°', '180°', '80°'], correct: 1, explanation: 'Interior + Exterior = 180°. So interior = 180° − 130° = 50°.' },
      { q: 'Which triangle has the MOST lines of symmetry?', options: ['Scalene', 'Right Scalene', 'Isosceles', 'Equilateral'], correct: 3, explanation: 'Equilateral triangles have 3 lines of symmetry. Isosceles has 1. Scalene has none.' },
    ];
    const c = pick(challenges);
    const shuffled = shuffle(c.options);
    const correctIdx = shuffled.indexOf(c.options[c.correct]);
    return { q: c.q, options: shuffled, correct: correctIdx, explanation: c.explanation };
  },
];

/* ═══════════════ WORLD DATA ═══════════════ */
const WORLDS_DATA = [
  { id: 0, name: 'Kite Day — Chiang Mai', icon: '🪁', color: '#f59e0b', desc: 'Basics' },
  { id: 1, name: 'Bridge Workshop — Kyoto', icon: '🌉', color: '#2563eb', desc: 'Classify by Sides' },
  { id: 2, name: 'Rangoli Studio — Jaipur', icon: '🎨', color: '#8b5cf6', desc: 'Classify by Angles' },
  { id: 3, name: 'Dhow Sails — Muscat', icon: '⛵', color: '#0891b2', desc: 'Combined Types' },
  { id: 4, name: 'Iron Lattice — Paris', icon: '🗼', color: '#6d28d9', desc: 'Angle Sum Property' },
  { id: 5, name: 'Rope Bridge — Sacred Valley', icon: '🏔️', color: '#059669', desc: 'Triangle Inequality' },
  { id: 6, name: 'Coaster Yard — Ohio', icon: '🎢', color: '#dc2626', desc: 'Mixed Challenges' },
  { id: 7, name: 'Orbital Truss — ISS', icon: '🚀', color: '#6366f1', desc: 'Capstone' },
];

/* ═══════════════ GENERATE QUESTION BANK (80 unique questions) ═══════════════ */
function generateQuestionBank() {
  // 10 questions per world, using round-robin of all 10 types
  return WORLDS_DATA.map((world) =>
    Array.from({ length: 10 }, (_, i) => {
      const gen = QUESTION_TYPES[i % QUESTION_TYPES.length];
      return { ...gen(), worldId: world.id };
    })
  );
}

/* ═══════════════ PLAY PHASE ═══════════════ */
export default function PlayPhase({ onComplete }) {
  const questionBank = useRef(generateQuestionBank());
  const [worldIdx, setWorldIdx] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [xp, setXp] = useState(0);
  const [worldResults, setWorldResults] = useState({});
  const [xpPops, setXpPops] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const [worldScore, setWorldScore] = useState(0);
  const [attemptsThisQ, setAttemptsThisQ] = useState(0);
  const [hint, setHint] = useState(null);

  const currentQuestions = worldIdx !== null ? questionBank.current[worldIdx] : [];
  const currentQ = worldIdx !== null ? currentQuestions[qIdx] : null;
  const world = worldIdx !== null ? WORLDS_DATA[worldIdx] : null;

  const startWorld = (idx) => {
    // Regenerate this world's questions fresh each time
    questionBank.current[idx] = Array.from({ length: 10 }, (_, i) => {
      const gen = QUESTION_TYPES[i % QUESTION_TYPES.length];
      return { ...gen(), worldId: idx };
    });
    setWorldIdx(idx);
    setQIdx(0);
    setSelected(null);
    setShowFeedback(false);
    setWorldScore(0);
    setAttemptsThisQ(0);
    setHint(null);
  };

  const popXp = useCallback((amount, correct) => {
    const id = Date.now();
    setXpPops(prev => [...prev, { id, amount, correct }]);
    setTimeout(() => setXpPops(prev => prev.filter(p => p.id !== id)), 1500);
  }, []);

  const triggerConfetti = useCallback(() => {
    const pieces = Array.from({ length: 35 }, (_, i) => ({
      id: i, x: 30 + Math.random() * 40,
      color: ['#f59e0b', '#10b981', '#2563eb', '#8b5cf6', '#ef4444', '#06b6d4'][i % 6],
      size: 6 + Math.random() * 10, duration: 2 + Math.random() * 2, delay: Math.random() * 0.5,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 4000);
  }, []);

  const handleSelect = useCallback((optIdx) => {
    if (showFeedback) return;
    setSelected(optIdx);
    const isCorrect = optIdx === currentQ.correct;

    if (isCorrect) {
      const xpGain = attemptsThisQ === 0 ? 10 : attemptsThisQ === 1 ? 7 : 5;
      setXp(x => x + xpGain);
      popXp(xpGain, true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(ms => Math.max(ms, newStreak));
      setWorldScore(s => s + 1);
      playAudio("very_good");
      setShowFeedback(true);
    } else {
      const newAttempts = attemptsThisQ + 1;
      setAttemptsThisQ(newAttempts);
      setStreak(0);
      if (newAttempts >= 2) {
        // Show hint on 2nd wrong
        setHint(currentQ.explanation);
      }
      if (newAttempts >= 3) {
        // Reveal after 3 wrong
        setShowFeedback(true);
        setHearts(h => Math.max(0, h - 1));
        playAudio("incorrect");
      }
      setSelected(null); // Let them try again
    }
  }, [showFeedback, currentQ, attemptsThisQ, streak, popXp]);

  const handleNext = useCallback(() => {
    if (qIdx >= currentQuestions.length - 1) {
      // End of world
      const score = worldScore + (selected === currentQ?.correct ? 1 : 0);
      const stars = score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0;
      setWorldResults(r => ({ ...r, [worldIdx]: { score, stars } }));
      if (stars >= 1) triggerConfetti();
      setWorldIdx(null);
    } else {
      setQIdx(q => q + 1);
      setSelected(null);
      setShowFeedback(false);
      setAttemptsThisQ(0);
      setHint(null);
    }
  }, [qIdx, currentQuestions, worldScore, selected, currentQ, worldIdx, triggerConfetti]);

  const allWorldsDone = Object.keys(worldResults).length >= WORLDS_DATA.length;

  // Star display
  const StarDisplay = ({ count }) => (
    <span>{Array.from({ length: 3 }, (_, i) => (
      <span key={i} style={{ fontSize: '0.9rem', opacity: i < count ? 1 : 0.25 }}>⭐</span>
    ))}</span>
  );

  if (worldIdx === null) {
    // World map
    return (
      <div className="play-screen">
        {/* XP pops */}
        {xpPops.map(p => (
          <div key={p.id} className="xp-pop" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            +{p.amount} XP
          </div>
        ))}
        {/* Confetti */}
        {confetti.map(c => (
          <div key={c.id} className="confetti-piece" style={{
            left: `${c.x}%`, top: '-20px', width: c.size, height: c.size,
            background: c.color, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s`,
          }} />
        ))}

        {/* HUD */}
        <div className="hud">
          <div className="hud-item">⭐ {Object.values(worldResults).reduce((a, r) => a + (r?.stars || 0), 0)} Stars</div>
          <div className="hud-item">✨ {xp} XP</div>
          <div className="hud-item">🔥 {maxStreak} Best Streak</div>
          <div className="hud-item">
            <div className="hearts">
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className={`heart ${i >= hearts ? 'lost' : ''}`}>❤️</span>
              ))}
            </div>
          </div>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: 6, textAlign: 'center' }}>
          🌍 Triangle Trek: Around the World
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, textAlign: 'center', maxWidth: 560 }}>
          8 global destinations · 10 questions each · Score ≥ 5/10 to unlock the next world!
        </p>

        <div className="play-worlds-grid">
          {WORLDS_DATA.map((w, i) => {
            const res = worldResults[w.id];
            const prevRes = i === 0 ? { stars: 1 } : worldResults[WORLDS_DATA[i - 1]?.id];
            const unlocked = i === 0 || (prevRes && prevRes.stars >= 1);
            return (
              <div
                key={w.id}
                className={`world-card ${res ? 'completed' : ''} ${!unlocked ? 'locked' : ''}`}
                style={{ borderColor: res ? w.color : undefined }}
                onClick={() => unlocked && startWorld(w.id)}
                id={`world-card-${w.id}`}
              >
                {!unlocked && <div className="world-lock">🔒</div>}
                <div className="world-icon">{w.icon}</div>
                <div className="world-name" style={{ color: res ? w.color : 'var(--text-secondary)' }}>{w.name}</div>
                <div className="world-desc">{w.desc}</div>
                <div className="world-stars">
                  {res ? <StarDisplay count={res.stars} /> : <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unlocked ? 'Tap to play' : 'Locked'}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {allWorldsDone && (
          <button className="btn btn-primary btn-lg" style={{ marginTop: 12 }} onClick={() => onComplete({ xp, maxStreak, worldResults, totalQ: 80 })} id="play-complete-btn">
            🎓 Complete Your Journey →
          </button>
        )}
      </div>
    );
  }

  // Question view
  const isCorrect = selected === currentQ?.correct;
  const isAnswered = showFeedback;
  const progressPct = ((qIdx) / currentQuestions.length) * 100;

  return (
    <div className="play-screen">
      {/* XP pops */}
      {xpPops.map(p => (
        <div key={p.id} className="xp-pop" style={{ top: '30%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          +{p.amount} XP
        </div>
      ))}

      {/* HUD */}
      <div className="hud">
        <div className="hud-item" style={{ color: world.color }}>
          {world.icon} {world.name}
        </div>
        <div className="hud-item">✨ {xp} XP</div>
        <div className="hud-item">🔥 {streak}</div>
        <div className="hud-item">
          <div className="hearts">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`heart ${i >= hearts ? 'lost' : ''}`}>❤️</span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-container" style={{ maxWidth: 700, width: '100%', marginBottom: 12 }}>
        <div className="progress-bar-label">
          <span>Question {qIdx + 1} of {currentQuestions.length}</span>
          <span>{worldScore} correct</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="question-area">
        <div className="question-card">
          <div className="question-number">Q{qIdx + 1} · {world.name}</div>
          <div className="question-text">{currentQ?.q}</div>
          <div className="options-grid">
            {currentQ?.options.map((opt, i) => {
              let cls = 'option-btn';
              if (isAnswered) {
                if (i === currentQ.correct) cls += ' correct';
                else if (i === selected) cls += ' wrong';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleSelect(i)}
                  disabled={isAnswered}
                  id={`option-${i}`}
                >
                  <span className="option-letter">{['A', 'B', 'C', 'D'][i]}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hint */}
        {hint && !showFeedback && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
            color: 'var(--amber)', fontSize: '0.9rem', fontWeight: 600,
            animation: 'fadeIn 0.3s ease',
          }}>
            💡 Hint: {hint}
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className={`feedback-area ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            {isCorrect ? '✅ ' : '❌ '}
            {isCorrect ? (attemptsThisQ === 0 ? 'Excellent!' : 'Correct!') : `The answer was: ${currentQ?.options[currentQ?.correct]}`}
            {' '}— {currentQ?.explanation}
          </div>
        )}

        {/* Next button */}
        {showFeedback && (
          <button className="btn btn-primary" onClick={handleNext} id="next-question-btn">
            {qIdx >= currentQuestions.length - 1 ? `🏆 Finish World →` : 'Next Question →'}
          </button>
        )}

        {/* Attempts counter */}
        {!showFeedback && attemptsThisQ > 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {3 - attemptsThisQ} attempt{3 - attemptsThisQ !== 1 ? 's' : ''} remaining
          </div>
        )}
      </div>
    </div>
  );
}
