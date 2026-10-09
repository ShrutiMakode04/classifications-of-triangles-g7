import { useState } from 'react';
import { playAudio, stopNarration } from '../utils/audio';

const JOURNEY_PHASES = [
  { icon: '🔍', label: 'Wonder', desc: 'A triangle mystery!' },
  { icon: '📖', label: 'Story', desc: 'See triangles in action' },
  { icon: '🔬', label: 'Simulate', desc: 'Explore & classify' },
  { icon: '🎮', label: 'Practice', desc: 'Gamified challenges' },
  { icon: '📓', label: 'Reflect', desc: 'What did you learn?' },
];

export default function IntroScreen({ onStart }) {
  const [started, setStarted] = useState(false);
  const [showJourneyBtn, setShowJourneyBtn] = useState(false);

  const handleStartAudio = () => {
    setStarted(true);
    playAudio('welcome');
    setTimeout(() => setShowJourneyBtn(true), 6000);
  };

  const handleStartJourney = () => {
    stopNarration();
    onStart();
  };

  return (
    <div className="intro-screen">
      {/* Curriculum badge */}
      <div className="intro-badge">
        📐 Triangles &amp; Polygons · Grade 7 Maths
      </div>

      {/* Title */}
      <h1 className="intro-title">
        <span style={{ color: 'var(--amber)' }}>Classifications</span>{' '}of{' '}
        <span style={{ color: 'var(--teal-light)' }}>Triangles</span>
      </h1>

      <p className="intro-subtitle">
        John, Mike, and Sarah are building bridges, kites, and rocket trusses — and they need YOUR help to classify every triangle. Explore shapes, solve mysteries, and master the geometry that holds the world together!
      </p>

      {/* Journey preview */}
      <div className="intro-journey-grid">
        {JOURNEY_PHASES.map((p, i) => (
          <div key={i} className="intro-journey-item" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
            <span className="intro-journey-icon">{p.icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{p.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="intro-btn-group">
        {!started ? (
          <button className="btn btn-primary btn-lg" onClick={handleStartAudio} id="intro-start-btn">
            🔊 Start Learning
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartJourney}
              id="intro-begin-btn"
              style={{
                opacity: showJourneyBtn ? 1 : 0.5,
                animation: showJourneyBtn ? 'pulse 2s infinite' : 'none',
                pointerEvents: showJourneyBtn ? 'all' : 'none',
              }}
            >
              🚀 Begin Your Journey
            </button>
          </>
        )}
      </div>

    </div>
  );
}
