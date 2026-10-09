import { useState, useCallback, useEffect } from 'react';
import { playAudio } from '../utils/audio';

const REFLECT_QUESTIONS = [
  {
    q: "What does 'Isosceles' mean in terms of triangle sides?",
    options: [
      { text: "Exactly 2 equal sides", correct: true, emoji: "✅" },
      { text: "All 3 sides equal", correct: false, emoji: "❌" },
      { text: "All 3 sides different", correct: false, emoji: "❌" },
    ]
  },
  {
    q: "The interior angles of any triangle always sum to…?",
    options: [
      { text: "360°", correct: false, emoji: "❌" },
      { text: "90°", correct: false, emoji: "❌" },
      { text: "180°", correct: true, emoji: "✅" },
    ]
  },
  {
    q: "Which of these CAN form a valid triangle?",
    options: [
      { text: "Sides 2, 3, 8", correct: false, emoji: "❌" },
      { text: "Sides 5, 7, 11", correct: true, emoji: "✅" },
      { text: "Sides 1, 2, 4", correct: false, emoji: "❌" },
    ]
  },
  {
    q: "Every equilateral triangle is secretly also…?",
    options: [
      { text: "Scalene", correct: false, emoji: "❌" },
      { text: "Isosceles", correct: true, emoji: "✅" },
      { text: "Obtuse", correct: false, emoji: "❌" },
    ]
  },
];

const CONFIDENCE_LEVELS = [
  { emoji: '🏆', label: "I can classify any triangle!", color: '#10b981' },
  { emoji: '😊', label: 'I understand most classifications!', color: '#f59e0b' },
  { emoji: '📚', label: "I'm still building my skills", color: '#2563eb' },
];

export default function ReflectPhase({ stats, onRestart, onGoHome }) {
  const [step, setStep] = useState(0);
  const [teachIdx, setTeachIdx] = useState(0);
  const [teachAnswered, setTeachAnswered] = useState(false);
  const [teachCorrect, setTeachCorrect] = useState(0);
  const [confidence, setConfidence] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const [journalText, setJournalText] = useState('');

  const { xp = 0, maxStreak = 0, worldResults = {}, totalQ = 80 } = stats || {};
  const totalStars = Object.values(worldResults).reduce((a, r) => a + (r?.stars || 0), 0);
  const worldsCompleted = Object.values(worldResults).filter(r => r?.stars >= 1).length;
  const totalScore = Object.values(worldResults).reduce((a, r) => a + (r?.score || 0), 0);
  const pct = totalQ > 0 ? Math.round((totalScore / (worldsCompleted * 10 || 1)) * 100) : 0;

  useEffect(() => {
    playAudio('reflect');
    setTimeout(() => setShowConfetti(true), 500);
  }, []);

  useEffect(() => {
    if (showConfetti) {
      const pieces = Array.from({ length: 45 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        color: ['#f59e0b', '#10b981', '#2563eb', '#8b5cf6', '#ef4444', '#06b6d4'][i % 6],
        size: 7 + Math.random() * 10,
        duration: 2.5 + Math.random() * 2,
      }));
      setConfettiPieces(pieces);
    }
  }, [showConfetti]);

  const handleTeachAnswer = useCallback((option) => {
    if (teachAnswered) return;
    setTeachAnswered(true);
    if (option.correct) {
      setTeachCorrect(c => c + 1);
      playAudio("very_good");
    }
  }, [teachAnswered]);

  const nextTeach = useCallback(() => {
    if (teachIdx < REFLECT_QUESTIONS.length - 1) {
      setTeachIdx(i => i + 1);
      setTeachAnswered(false);
    } else {
      setStep(2);
    }
  }, [teachIdx]);

  // Badges earned
  const badges = [];
  if (worldsCompleted >= 1) badges.push({ icon: '🏅', name: 'Shape Scout', desc: 'Completed Wonder & Story' });
  if (worldsCompleted >= 3) badges.push({ icon: '🥈', name: 'Triangle Architect', desc: 'Completed all Simulation stations' });
  if (pct >= 80) badges.push({ icon: '🥇', name: 'Classification Champion', desc: 'Scored ≥80% in Practice' });
  if (maxStreak >= 10) badges.push({ icon: '🔥', name: 'Streak Master', desc: '10 correct in a row!' });
  if (totalStars >= 16) badges.push({ icon: '🌟', name: 'Full Journey', desc: 'Completed all phases' });
  badges.push({ icon: '📐', name: 'Junior Engineer', desc: 'Completed this module!' });

  return (
    <div className="reflect-screen">
      {/* Confetti */}
      {confettiPieces.map(c => (
        <div
          key={c.id}
          className="confetti-piece"
          style={{
            left: `${c.x}%`, top: '-20px',
            width: c.size, height: c.size,
            background: c.color,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      {/* Step 0: Stats summary */}
      {step === 0 && (
        <div style={{ width: '100%', maxWidth: 700, animation: 'fadeInUp 0.6s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>🎓</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--amber)' }}>
              Mission Complete!
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: '1.05rem' }}>
              You've completed the <strong style={{ color: 'var(--teal-light)' }}>Classifications of Triangles</strong> module!
            </p>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, width: '100%' }}>
            {[
              { icon: '✨', label: 'XP Earned', value: xp, color: '#f59e0b' },
              { icon: '⭐', label: 'Stars Collected', value: `${totalStars} / ${REFLECT_QUESTIONS.length * 6}`, color: '#fbbf24' },
              { icon: '🔥', label: 'Best Streak', value: `${maxStreak} correct`, color: '#f97316' },
              { icon: '🌍', label: 'Worlds Explored', value: `${worldsCompleted} / 8`, color: '#10b981' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-card)', border: `1px solid ${s.color}44`,
                borderRadius: 'var(--radius-md)', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 16,
                backdropFilter: 'blur(20px)',
              }}>
                <div style={{ fontSize: '2rem' }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, textAlign: 'center' }}>
              Badges Earned
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {badges.map((b, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-md)', padding: '10px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  animation: `fadeInUp 0.4s ease ${i * 0.1}s backwards`,
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{b.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{b.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={() => setStep(1)} id="reflect-next-btn">
            📝 Teach It Back →
          </button>
        </div>
      )}

      {/* Step 1: Teach it back (mini quiz) */}
      {step === 1 && (
        <div style={{ width: '100%', maxWidth: 600, animation: 'fadeInUp 0.5s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🤖</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
              Teach It Back!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: 4 }}>
              The best way to remember is to teach. Can you answer like an expert?
            </p>
          </div>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 6 }}>
            {REFLECT_QUESTIONS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 3, transition: 'all 0.3s',
                background: i < teachIdx ? 'var(--green)' : i === teachIdx ? 'var(--amber)' : 'rgba(255,255,255,0.1)',
              }} />
            ))}
          </div>

          {/* Question */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-lg)', padding: '24px 28px', backdropFilter: 'blur(20px)',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>
              Question {teachIdx + 1} / {REFLECT_QUESTIONS.length}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 20, lineHeight: 1.5 }}>
              {REFLECT_QUESTIONS[teachIdx].q}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {REFLECT_QUESTIONS[teachIdx].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleTeachAnswer(opt)}
                  disabled={teachAnswered}
                  id={`reflect-option-${i}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: teachAnswered
                      ? (opt.correct ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)')
                      : 'rgba(255,255,255,0.07)',
                    border: `2px solid ${teachAnswered ? (opt.correct ? 'var(--green)' : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 'var(--radius-md)', padding: '14px 18px',
                    color: teachAnswered ? (opt.correct ? 'var(--green-light)' : 'var(--text-muted)') : 'var(--text-primary)',
                    cursor: teachAnswered ? 'default' : 'pointer',
                    fontWeight: 600, fontSize: '0.95rem', fontFamily: 'var(--font-body)',
                    transition: 'all 0.2s', textAlign: 'left', width: '100%',
                  }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: teachAnswered ? (opt.correct ? 'var(--green)' : 'rgba(255,255,255,0.08)') : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem',
                  }}>
                    {teachAnswered ? opt.emoji : ['A', 'B', 'C'][i]}
                  </span>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>

          {teachAnswered && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={nextTeach} id="reflect-next-q-btn">
                {teachIdx < REFLECT_QUESTIONS.length - 1 ? 'Next Question →' : `See Final Results (${teachCorrect + (REFLECT_QUESTIONS[teachIdx].options.find(o => o.correct)?.correct ? 1 : 0)}/${REFLECT_QUESTIONS.length}) →`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Confidence + Journal + Final */}
      {step === 2 && (
        <div style={{ width: '100%', maxWidth: 660, animation: 'fadeInUp 0.5s ease', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>📓</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--amber)' }}>
              Teach-Back: {teachCorrect}/{REFLECT_QUESTIONS.length}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              {teachCorrect >= 3 ? '🎉 Outstanding! You really understand triangles!' : '📚 Keep practicing — you\'re getting there!'}
            </p>
          </div>

          {/* Confidence check */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, textAlign: 'center' }}>
              How confident do you feel now?
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {CONFIDENCE_LEVELS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setConfidence(i)}
                  id={`confidence-${i}`}
                  style={{
                    padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '2px solid',
                    borderColor: confidence === i ? c.color : 'rgba(255,255,255,0.15)',
                    background: confidence === i ? `${c.color}22` : 'rgba(255,255,255,0.06)',
                    color: confidence === i ? c.color : 'var(--text-secondary)',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    fontSize: '0.9rem', textAlign: 'center', minWidth: 160,
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{c.emoji}</div>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Journal prompt */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              📝 Journal Prompt (optional)
            </div>
            <div style={{
              background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: 10,
              fontSize: '0.9rem', color: 'var(--teal-light)', fontStyle: 'italic', lineHeight: 1.6,
            }}>
              "Explain to a friend: why is every equilateral triangle secretly also isosceles — but not every isosceles triangle is equilateral?"
            </div>
            <textarea
              placeholder="Write your explanation here..."
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              id="reflect-journal"
              style={{
                width: '100%', minHeight: 100, padding: '14px 16px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 'var(--radius-md)', color: 'white',
                fontFamily: 'var(--font-body)', fontSize: '0.95rem', resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Lesson complete badge */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(16,185,129,0.15))',
            border: '2px solid var(--amber)', borderRadius: 'var(--radius-lg)',
            padding: '20px 28px', textAlign: 'center', width: '100%',
            animation: 'glow 3s ease infinite',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>🌟</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--amber)', marginBottom: 4 }}>
              Full Journey Badge Unlocked!
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Classifications of Triangles · Grade 7 · Unit 6: Triangles &amp; Polygons
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={onRestart} id="reflect-restart-btn">
              🔄 Try Again
            </button>
            <button className="btn btn-green" onClick={onGoHome} id="reflect-home-btn">
              🏠 Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
