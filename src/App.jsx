import { useState, useCallback, useEffect } from 'react';
import FloatingTriangles from './components/FloatingTriangles';
import IntroScreen from './components/IntroScreen';
import WonderPhase from './components/WonderPhase';
import StoryPhase from './components/StoryPhase';
import SimulatePhase from './components/SimulatePhase';
import PlayPhase from './components/PlayPhase';
import ReflectPhase from './components/ReflectPhase';
import { subscribeMute, toggleMute, playAudio } from './utils/audio';

const PHASES = ['intro', 'welcome', 'wonder', 'story', 'simulate', 'play', 'reflect'];
const JOURNEY_ITEMS = [
  { icon: '🔍', label: 'Wonder' },
  { icon: '📖', label: 'Story' },
  { icon: '🔬', label: 'Simulate' },
  { icon: '🎮', label: 'Practice' },
  { icon: '📓', label: 'Reflect' },
];

export default function App() {
  const [phase, setPhase] = useState('intro');
  const [playStats, setPlayStats] = useState(null);
  const [isMuted, setIsMutedState] = useState(false);

  useEffect(() => {
    return subscribeMute(setIsMutedState);
  }, []);

  const goHome = useCallback(() => { setPhase('intro'); setPlayStats(null); }, []);
  const restart = useCallback(() => { setPhase('wonder'); setPlayStats(null); }, []);

  const handleStartLearning = () => {
    setPhase('welcome');
    playAudio('welcome');
  };

  const handleBeginJourney = () => {
    setPhase('wonder');
  };

  const phaseIndex = PHASES.indexOf(phase);
  const journeyIndex = phaseIndex - 1; // journey starts at wonder (index 1)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <FloatingTriangles />

      <div className="app-container">
        {/* Journey Bar — shown after intro */}
        {phase !== 'intro' && (
          <div className="journey-bar">
            {JOURNEY_ITEMS.map((item, i) => {
              const isActive = i === journeyIndex;
              const isDone = i < journeyIndex;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className={`journey-step ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}>
                    <div className="journey-step-dot">
                      {isDone ? '✓' : item.icon}
                    </div>
                    <div className="journey-step-label">{item.label}</div>
                  </div>
                  {i < JOURNEY_ITEMS.length - 1 && (
                    <div className={`journey-connector ${isDone ? 'filled' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Home Button — shown after intro */}
        {phase !== 'intro' && (
          <button className="home-btn" onClick={goHome}>
            🏠 Home
          </button>
        )}

        {/* Audio toggle button */}
        <button className="audio-toggle-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Phase content */}
        {phase === 'intro' && <IntroScreen onStart={() => setPhase('wonder')} />}
        {phase === 'wonder' && <WonderPhase onComplete={() => setPhase('story')} />}
        {phase === 'story' && <StoryPhase onComplete={() => setPhase('simulate')} />}
        {phase === 'simulate' && <SimulatePhase onComplete={() => setPhase('play')} />}
        {phase === 'play' && <PlayPhase onComplete={(stats) => { setPlayStats(stats); setPhase('reflect'); }} />}
        {phase === 'reflect' && <ReflectPhase stats={playStats} onRestart={restart} onGoHome={goHome} />}
      </div>
    </div>
  );
}
