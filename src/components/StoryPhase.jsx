import { useState, useEffect, useCallback } from 'react';
import { playAudio, stopNarration } from '../utils/audio';

const STORY_SLIDES = [
  {
    image: '/images/story_bridge_challenge.png',
    title: "The Junior Engineers Club",
    text: "John, Mike, and Sarah were thrilled — their school just entered the Global Bridge Challenge! Their mission: build a craft-stick bridge strong enough to hold 500g. Their first truss wobbled dangerously. 'Something is wrong with these triangles,' said Mike, pressing on the shaky structure.",
    highlight: '"Every strong bridge is made of triangles — but not all triangles are equal!"',
    mascotText: "Shape detectives, activate! 🌉",
    color: '#2563eb',
  },
  {
    image: '/images/story_triangle_types.png',
    title: "The Observation",
    text: "Mike pointed at the whiteboard. 'Look — some triangles look pointy, some are super wide, and some look... perfectly balanced.' Sarah grabbed a ruler. 'There has to be a SYSTEM for this!' John's eyes lit up: 'What if we can classify every triangle by its sides AND angles?'",
    highlight: '"Triangles can be classified by their sides OR by their angle sizes."',
    mascotText: "Two classification systems — double the power! 📐",
    color: '#0891b2',
  },
  {
    image: '/images/story_side_classification.png',
    title: "Classification by Sides",
    text: "LearnFlow, their AI companion, projected three triangles on the wall. 'Meet the side-based family! An EQUILATERAL triangle has all 3 sides equal — like a perfect snowflake. ISOSCELES has exactly 2 equal sides — like a tent. SCALENE has all 3 sides different — totally unique.' Sarah quickly labeled each one on her model.",
    highlight: '"Equilateral: 3 equal · Isosceles: 2 equal · Scalene: all different"',
    mascotText: "Side-based family sorted! 🏗️",
    color: '#8b5cf6',
  },
  {
    image: '/images/story_angle_classification.png',
    title: "A Call from Kyoto!",
    text: "Suddenly, a video call! Yuki from their Kyoto partner school was on screen. 'We classify by ANGLES too!' she said. 'ACUTE triangles have all angles under 90° — sharp and strong. RIGHT triangles have exactly one 90° corner — perfect for corners. OBTUSE triangles have one angle over 90° — wide and flat.'",
    highlight: '"Acute: all < 90° · Right: one = 90° · Obtuse: one > 90°"',
    mascotText: "International math power! 🌏",
    color: '#f59e0b',
  },
  {
    image: '/images/story_angle_sum.png',
    title: "The 180° Secret",
    text: "Sarah grabbed a paper triangle and tore off all three corners. She placed them side by side along a ruler. 'Look!' she gasped — they made a PERFECT straight line! John's calculator confirmed: 60° + 60° + 60° = 180°. Tried again with a scalene: 37° + 83° + 60° = 180°. Always 180°! 'This changes everything for our bridge!' Mike shouted.",
    highlight: '"The three interior angles of ANY triangle ALWAYS add up to exactly 180°!"',
    mascotText: "The Angle Sum Property — proven! ✨",
    color: '#10b981',
  },
];

export default function StoryPhase({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const slide = STORY_SLIDES[current];

  useEffect(() => { playAudio(`story_${current}`); }, [current]);

  const goNext = useCallback(() => {
    if (animating) return;
    if (current === STORY_SLIDES.length - 1) {
      stopNarration();
      onComplete();
    } else {
      setAnimating(true);
      stopNarration();
      setTimeout(() => {
        setCurrent(c => c + 1);
        setAnimating(false);
      }, 250);
    }
  }, [current, animating, onComplete]);

  const goPrev = useCallback(() => {
    if (animating || current === 0) return;
    setAnimating(true);
    stopNarration();
    setTimeout(() => {
      setCurrent(c => c - 1);
      setAnimating(false);
    }, 250);
  }, [current, animating]);

  return (
    <div className="story-screen">
      {/* Progress dots */}
      <div className="progress-dots">
        {STORY_SLIDES.map((_, i) => (
          <div key={i} className={`progress-dot ${i === current ? 'active' : i < current ? 'completed' : ''}`} />
        ))}
      </div>

      {/* Story slide */}
      <div
        className="story-slide"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        {/* Left: Image */}
        <div className="story-image-wrap">
          <div className="story-slide-number">Panel {current + 1} of {STORY_SLIDES.length}</div>
          <img
            src={slide.image}
            alt={slide.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback SVG if image not loaded */}
          <div style={{
            display: 'none', width: '100%', height: '100%',
            alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${slide.color}22, rgba(0,0,0,0.5))`,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>📐</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: slide.color }}>
                {slide.title}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Text content */}
        <div className="story-content">
          <h2 className="story-panel-title" style={{ color: slide.color }}>
            {slide.title}
          </h2>
          <p className="story-text">{slide.text}</p>
          <div className="story-highlight">{slide.highlight}</div>
          <div className="story-mascot">
            🤖 <span>{slide.mascotText}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="story-nav">
        <button
          className="btn btn-outline btn-sm"
          onClick={goPrev}
          disabled={current === 0 || animating}
          style={{ opacity: current === 0 ? 0.3 : 1 }}
        >
          ← Previous
        </button>

        <div className="story-progress-text">
          {current + 1} / {STORY_SLIDES.length}
        </div>

        <button
          className="btn btn-primary"
          onClick={goNext}
          disabled={animating}
          id={`story-next-${current}`}
        >
          {current === STORY_SLIDES.length - 1 ? '🔬 To Simulation →' : 'Next Panel →'}
        </button>
      </div>
    </div>
  );
}
