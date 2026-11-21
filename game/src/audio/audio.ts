export interface SoundManager {
  playBell: () => void;
  playStumpClatter: () => void;
  playHowzat: () => void;
  playSixRoar: () => void;
  toggleMute: () => boolean;
  isMuted: () => boolean;
}

function playBellSound(actx: AudioContext): void {
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1760, actx.currentTime); // A6 note
  osc.frequency.exponentialRampToValueAtTime(880, actx.currentTime + 0.8);

  gain.gain.setValueAtTime(0.3, actx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.8);

  osc.connect(gain);
  gain.connect(actx.destination);
  osc.start();
  osc.stop(actx.currentTime + 0.8);
}

function playStumpClatterSound(actx: AudioContext): void {
  for (let i = 0; i < 3; i++) {
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'triangle';
    const freq = 180 + Math.random() * 80;
    const startTime = actx.currentTime + i * 0.04;

    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.2);
  }
}

function playNoiseSwell(actx: AudioContext, duration: number, volume: number): void {
  const bufferSize = actx.sampleRate * duration;
  const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = actx.createBufferSource();
  noise.buffer = buffer;

  const filter = actx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, actx.currentTime);
  filter.Q.setValueAtTime(1.5, actx.currentTime);

  const gain = actx.createGain();
  gain.gain.setValueAtTime(0.01, actx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, actx.currentTime + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(actx.destination);
  noise.start();
}

export function createSoundManager(): SoundManager {
  let ctx: AudioContext | null = null;
  let muted = false;

  try {
    const saved = localStorage.getItem('tour-muted');
    if (saved === 'true') muted = true;
  } catch {
    // LocalStorage unavailable
  }

  function getAudioContext(): AudioContext | null {
    if (muted) return null;
    if (!ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  return {
    playBell: () => {
      const actx = getAudioContext();
      if (actx) playBellSound(actx);
    },
    playStumpClatter: () => {
      const actx = getAudioContext();
      if (actx) playStumpClatterSound(actx);
    },
    playHowzat: () => {
      const actx = getAudioContext();
      if (actx) playNoiseSwell(actx, 1.4, 0.35);
    },
    playSixRoar: () => {
      const actx = getAudioContext();
      if (actx) playNoiseSwell(actx, 1.8, 0.4);
    },
    toggleMute: () => {
      muted = !muted;
      try {
        localStorage.setItem('tour-muted', String(muted));
      } catch {
        // LocalStorage unavailable
      }
      return muted;
    },
    isMuted: () => muted
  };
}
