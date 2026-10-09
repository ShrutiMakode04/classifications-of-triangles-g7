// src/utils/audio.js

let currentAudio = null;
let isMuted = false;
let listeners = [];

export function subscribeMute(listener) {
  listeners.push(listener);
  listener(isMuted);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function toggleMute() {
  isMuted = !isMuted;
  if (isMuted && currentAudio) {
    currentAudio.pause();
  } else if (!isMuted && currentAudio && !currentAudio.ended) {
    currentAudio.play().catch(() => {});
  }
  listeners.forEach(l => l(isMuted));
}

export function setMute(muted) {
  if (isMuted !== muted) toggleMute();
}

export function getMute() {
  return isMuted;
}

export function playAudio(id) {
  // Try to stop any currently playing narration
  stopNarration();
  
  if (isMuted) return;

  try {
    const audio = new Audio(`/audio/${id}.mp3`);
    audio.playbackRate = 1.05; // Normal speed with a tiny lift
    currentAudio = audio;
    audio.play().catch(e => console.log('Audio playback prevented:', e));
  } catch (err) {
    console.error('Failed to play audio', err);
  }
}

export function stopNarration() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
