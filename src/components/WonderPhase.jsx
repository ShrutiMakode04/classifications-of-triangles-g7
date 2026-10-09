import { useState, useEffect, useCallback } from 'react';
import { playAudio } from '../utils/audio';

const WONDER_DATA = {
  question: "Three bridge trusses collapsed in testing. Three held. Same wood, same glue — the ONLY difference was the TRIANGLE. Can you spot the pattern?",
  subtext: "John, Mike, and Sarah are on the case. What makes some triangles stronger than others?",
  emoji: "🌉",
  bgEmojis: ["△", "▲", "▽", "▸", "◻", "🔺", "📐", "✨"],
};

// Animated truss triangles - weak vs strong
const WEAK_TRUSSES = [
  { pts: '0,68 90,68 12,5', color: '#ef4444' },
  { pts: '5,68 82,60 40,5', color: '#f97316' },
  { pts: '8,65 88,65 15,8', color: '#eab308' },
];
const STRONG_TRUSSES = [
  { pts: '10,68 90,68 50,5', color: '#10b981' },
  { pts: '5,68 85,68 45,5', color: '#2563eb' },
  { pts: '8,68 88,68 48,5', color: '#8b5cf6' },
];

function TrussCard({ pts, color, label, isWeak }) {
  return (
    <div className={`truss-card ${isWeak ? 'truss-weak' : 'truss-strong'}`}
      style={{ borderColor: isWeak ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)' }}>
      <svg viewBox="0 0 100 80" width={90} height={72}>
        <polygon points={pts} fill={`${color}22`} stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {isWeak && (
          <>
            {/* wobble lines */}
            <line x1="20" y1="45" x2="28" y2="52" stroke={color} strokeWidth="1.5" opacity="0.5" />
            <line x1="70" y1="40" x2="62" y2="48" stroke={color} strokeWidth="1.5" opacity="0.5" />
          </>
        )}
        {!isWeak && (
          <text x="50" y="50" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">✓</text>
        )}
      </svg>
      <div className="truss-label">{label}</div>
    </div>
  );
}

export default function WonderPhase({ onComplete }) {
  const [stage, setStage] = useState(0);
  const [particles, setParticles] = useState([]);
  

  useEffect(() => {
    const p = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: WONDER_DATA.bgEmojis[i % WONDER_DATA.bgEmojis.length],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 10 + Math.random() * 10,
      size: 1 + Math.random() * 1.8,
    }));
    setParticles(p);

    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 900);
    const t3 = setTimeout(() => setStage(3), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => { playAudio('wonder'); }, []);

  return (
    <div className="wonder-screen" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
            fontSize: `${p.size}rem`, opacity: 0.06,
            animationName: 'pulse', animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`, animationIterationCount: 'infinite',
            userSelect: 'none', fontWeight: 900,
          }}>{p.emoji}</div>
        ))}
      </div>

      {/* Main icon */}
      {stage >= 1 && (
        <div className="wonder-icon-wrap" style={{ fontSize: '3rem' }}>
          {WONDER_DATA.emoji}
        </div>
      )}

      {/* Hook question */}
      {stage >= 1 && (
        <h2 className="wonder-hook" style={{ animation: 'fadeInUp 0.6s ease' }}>
          {WONDER_DATA.question}
        </h2>
      )}

      {/* Truss showcase */}
      {stage >= 2 && (
        <div className="wonder-truss-showcase" style={{ animation: 'fadeInUp 0.6s ease' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--red-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              ⚠️ These Collapsed
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {WEAK_TRUSSES.map((t, i) => (
                <TrussCard key={i} {...t} label={`Truss ${i + 1}`} isWeak={true} />
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--green-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              ✅ These Held Strong
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {STRONG_TRUSSES.map((t, i) => (
                <TrussCard key={i} {...t} label={`Truss ${i + 4}`} isWeak={false} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtext */}
      {stage >= 2 && (
        <p className="wonder-sub" style={{ animation: 'fadeInUp 0.6s ease' }}>
          {WONDER_DATA.subtext}
        </p>
      )}

      {/* Reveal hint */}
      

      {/* Reveal */}
      {stage >= 3 && (
        <div style={{ animation: 'scaleIn 0.5s ease', textAlign: 'center', maxWidth: 600 }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(8,145,178,0.2))',
            border: '1px solid rgba(37,99,235,0.4)', borderRadius: 'var(--radius-lg)',
            padding: '24px 32px', marginBottom: 20,
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📐</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--teal-light)', marginBottom: 8 }}>
              The Secret is in the Triangle!
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Not all triangles are equal. The strong trusses used <strong style={{ color: 'var(--amber)' }}>equilateral</strong> triangles — all sides and angles equal, distributing force perfectly. Let's learn to classify every triangle like a junior engineer!
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={onComplete} id="wonder-continue-btn">
            🚀 Join the Junior Engineers Club →
          </button>
        </div>
      )}
    </div>
  );
}
