import { Howler } from 'howler';

export interface SoundManager {
  playBell: () => void;
  playStumpClatter: () => void;
  playHowzat: () => void;
  playSixRoar: () => void;
  playHonk: () => void;
  playBrakeSqueak: () => void;
  playFlip: () => void;
  playApplause: () => void;
  updateRollerSpeed: (speed: number) => void;
  toggleMute: () => boolean;
  isMuted: () => boolean;
  destroy: () => void;
}

function createMuteButton(isMuted: boolean, onToggle: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.id = 'hud-mute-btn';
  btn.setAttribute('aria-label', 'Toggle audio sound');
  Object.assign(btn.style, {
    position: 'fixed',
    top: '16px',
    left: '16px',
    zIndex: '1200',
    background: 'var(--cream)',
    color: 'var(--ink)',
    border: '2px solid var(--ink)',
    borderRadius: 'var(--radius)',
    padding: '6px 12px',
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    boxShadow: '2px 2px 0 var(--ink)'
  });

  const updateText = (muted: boolean): void => {
    btn.textContent = muted ? 'SOUND: OFF [M]' : 'SOUND: ON [M]';
    btn.style.color = muted ? 'var(--timber)' : 'var(--ink)';
  };

  updateText(isMuted);
  btn.addEventListener('click', onToggle);
  document.body.appendChild(btn);
  return btn;
}

function createEngineNode(actx: AudioContext): {
  setSpeed: (speed: number) => void;
  stop: () => void;
} {
  const osc = actx.createOscillator();
  const filter = actx.createBiquadFilter();
  const gain = actx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(45, actx.currentTime);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, actx.currentTime);

  gain.gain.setValueAtTime(0.04, actx.currentTime);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(Howler.masterGain || actx.destination);
  osc.start();

  return {
    setSpeed: (speed: number) => {
      const normalized = Math.min(1.0, Math.max(0, speed / 7.5));
      const targetFreq = 45 + normalized * 70;
      const targetGain = 0.03 + normalized * 0.08;
      osc.frequency.setTargetAtTime(targetFreq, actx.currentTime, 0.1);
      gain.gain.setTargetAtTime(targetGain, actx.currentTime, 0.1);
    },
    stop: () => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    }
  };
}

function playSynthesizedBell(actx: AudioContext): void {
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1760, actx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, actx.currentTime + 0.8);
  gain.gain.setValueAtTime(0.3, actx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(Howler.masterGain || actx.destination);
  osc.start();
  osc.stop(actx.currentTime + 0.8);
}

function playSynthesizedClatter(actx: AudioContext): void {
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
    gain.connect(Howler.masterGain || actx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.2);
  }
}

function playNoiseBurst(actx: AudioContext, duration: number, volume: number): void {
  const bufferSize = actx.sampleRate * duration;
  const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

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
  gain.connect(Howler.masterGain || actx.destination);
  noise.start();
}

function playHonkSound(actx: AudioContext): void {
  [440, 554].forEach((freq) => {
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, actx.currentTime);
    gain.gain.setValueAtTime(0.2, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(Howler.masterGain || actx.destination);
    osc.start();
    osc.stop(actx.currentTime + 0.35);
  });
}

function playBrakeSqueakSound(actx: AudioContext): void {
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2400, actx.currentTime);
  osc.frequency.linearRampToValueAtTime(2100, actx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.12, actx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.25);
  osc.connect(gain);
  gain.connect(Howler.masterGain || actx.destination);
  osc.start();
  osc.stop(actx.currentTime + 0.25);
}

function loadMutePreference(): boolean {
  try {
    return localStorage.getItem('tour-muted') === 'true';
  } catch {
    return false;
  }
}

function saveMutePreference(muted: boolean): void {
  try {
    localStorage.setItem('tour-muted', String(muted));
  } catch {
    // LocalStorage unavailable
  }
}

function createPlaybackMethods(getAudioContext: () => AudioContext | null) {
  return {
    playBell: () => {
      const actx = getAudioContext();
      if (actx) playSynthesizedBell(actx);
    },
    playStumpClatter: () => {
      const actx = getAudioContext();
      if (actx) playSynthesizedClatter(actx);
    },
    playHowzat: () => {
      const actx = getAudioContext();
      if (actx) playNoiseBurst(actx, 1.4, 0.35);
    },
    playSixRoar: () => {
      const actx = getAudioContext();
      if (actx) playNoiseBurst(actx, 1.8, 0.4);
    },
    playHonk: () => {
      const actx = getAudioContext();
      if (actx) playHonkSound(actx);
    },
    playBrakeSqueak: () => {
      const actx = getAudioContext();
      if (actx) playBrakeSqueakSound(actx);
    },
    playFlip: () => {
      const actx = getAudioContext();
      if (actx) playSynthesizedClatter(actx);
    },
    playApplause: () => {
      const actx = getAudioContext();
      if (actx) playNoiseBurst(actx, 1.0, 0.2);
    }
  };
}

export function createSoundManager(): SoundManager {
  let muted = loadMutePreference();
  let unlocked = false;
  let engine: ReturnType<typeof createEngineNode> | null = null;

  Howler.mute(muted);
  Howler.volume(0.6);

  const getAudioContext = (): AudioContext | null => {
    if (muted || !unlocked) return null;
    const actx = Howler.ctx;
    if (actx && actx.state === 'suspended') {
      actx.resume().catch(() => {});
    }
    return actx || null;
  };

  const unlockAudio = (): void => {
    if (unlocked) return;
    unlocked = true;
    const actx = Howler.ctx;
    if (actx && actx.state === 'suspended') {
      actx.resume().catch(() => {});
    }
    if (actx && !engine && !muted) {
      engine = createEngineNode(actx);
    }
  };

  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  const muteBtn = createMuteButton(muted, () => toggleMute());

  function toggleMute(): boolean {
    muted = !muted;
    Howler.mute(muted);
    saveMutePreference(muted);
    muteBtn.textContent = muted ? 'SOUND: OFF [M]' : 'SOUND: ON [M]';
    muteBtn.style.color = muted ? 'var(--timber)' : 'var(--ink)';

    if (!muted && unlocked && !engine && Howler.ctx) {
      engine = createEngineNode(Howler.ctx);
    }
    return muted;
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
      toggleMute();
    }
  };
  window.addEventListener('keydown', onKeyDown);

  const playback = createPlaybackMethods(getAudioContext);

  return {
    ...playback,
    updateRollerSpeed: (speed: number) => {
      if (engine && !muted) engine.setSpeed(speed);
    },
    toggleMute,
    isMuted: () => muted,
    destroy: () => {
      if (engine) engine.stop();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', unlockAudio);
      if (muteBtn.parentNode) muteBtn.parentNode.removeChild(muteBtn);
    }
  };
}
