// Midnight Vault — tiny synthesized sounds, no audio files. Every sound is
// an oscillator through a gain envelope, built lazily on the first user
// gesture (browsers block audio before one). M toggles mute.

export function createAudio() {
  const audio = { ctx: null, muted: false };
  audio.ensure = function ensure() {
    if (audio.ctx) return;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (Ctor) audio.ctx = new Ctor();
    } catch {
      audio.ctx = null;
    }
  };
  audio.tone = function tone(freq, seconds, type, volume, slideTo) {
    if (audio.muted || !audio.ctx) return;
    try {
      const now = audio.ctx.currentTime;
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
      gain.gain.setValueAtTime(volume || 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
      osc.connect(gain).connect(audio.ctx.destination);
      osc.start(now);
      osc.stop(now + seconds + 0.02);
    } catch {
      // Sound is garnish: a failure here must never break the game.
    }
  };
  audio.play = function play(name) {
    if (audio.muted || !audio.ctx) return;
    if (name === 'pickup') {
      audio.tone(880, 0.12, 'sine', 0.08);
      audio.tone(1318, 0.16, 'sine', 0.06);
    } else if (name === 'spotted') {
      audio.tone(220, 0.3, 'square', 0.06, 440);
    } else if (name === 'caught') {
      audio.tone(160, 0.4, 'sawtooth', 0.1, 60);
    } else if (name === 'laser') {
      audio.tone(1200, 0.15, 'square', 0.05, 300);
    } else if (name === 'smoke') {
      audio.tone(300, 0.3, 'sine', 0.05, 90);
    } else if (name === 'emp') {
      audio.tone(900, 0.25, 'square', 0.05, 120);
    } else if (name === 'leveldone' || name === 'victory') {
      audio.tone(523, 0.15, 'sine', 0.08);
      audio.tone(659, 0.15, 'sine', 0.08);
      audio.tone(784, 0.3, 'sine', 0.08);
    } else if (name === 'busted' || name === 'gameover') {
      audio.tone(220, 0.5, 'sawtooth', 0.09, 55);
    } else if (name === 'click') {
      audio.tone(600, 0.06, 'sine', 0.05);
    }
  };
  return audio;
}
