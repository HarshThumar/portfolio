export interface SoundManager {
  playBell: () => void;
  playStumpClatter: () => void;
  playHowzat: () => void;
  playSixRoar: () => void;
  playWhoosh: () => void;
  playThud: () => void;
  playHonk: () => void;
  playBrakeSqueak: () => void;
  playFlip: () => void;
  playApplause: () => void;
  updateRollerSpeed: (speed: number) => void;
  toggleMute: () => boolean;
  isMuted: () => boolean;
  destroy: () => void;
}

const MUTE_KEY = 'tour-muted';
const MASTER_VOLUME = 0.6;
const SVG_NS = 'http://www.w3.org/2000/svg';

interface Bus {
  ctx: AudioContext;
  out: GainNode;
  noise: AudioBuffer;
}

interface NoiseVariant {
  freq: number;
  q: number;
}

/** Random multiplier within +-4% so repeated sounds never match exactly. */
function jitter(): number {
  return 1 + (Math.random() * 2 - 1) * 0.04;
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

function buildSpeakerIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M2 6h3l4-3v10l-4-3H2z M12 5.5q1.5 2.5 0 5');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--ink)');
  path.setAttribute('stroke-width', '1.5');
  path.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(path);
  return svg;
}

function createMuteButton(isMuted: boolean, onToggle: () => void) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'hud-mute-btn';
  Object.assign(btn.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--cream)',
    color: 'var(--ink)',
    border: '2px solid var(--ink)',
    borderRadius: 'var(--radius)',
    padding: '6px 12px',
    fontFamily: 'var(--font-display)',
    fontSize: '11px',
    cursor: 'pointer',
    boxShadow: '2px 2px 0 var(--ink)'
  });
  const label = document.createElement('span');
  label.textContent = 'Sound';
  btn.append(buildSpeakerIcon(), label);
  btn.addEventListener('click', onToggle);
  // The page provides a #hud row so HUD buttons line up instead of overlapping.
  (document.getElementById('hud') ?? document.body).appendChild(btn);
  const setMuted = (muted: boolean): void => {
    btn.setAttribute('aria-pressed', String(muted));
    btn.style.color = muted ? 'var(--timber)' : 'var(--ink)';
  };
  setMuted(isMuted);
  return { el: btn, setMuted };
}

function tone(
  bus: Bus,
  type: OscillatorType,
  freq: number,
  peak: number,
  dur: number,
  when = 0,
  lowpass?: number
): void {
  const { ctx } = bus;
  const t = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq * jitter(), t);
  gain.gain.setValueAtTime(peak, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  if (lowpass) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(lowpass, t);
    gain.connect(lp);
    lp.connect(bus.out);
  } else {
    gain.connect(bus.out);
  }
  osc.start(t);
  osc.stop(t + dur);
}

function noiseBurst(bus: Bus, dur: number, peak: number, v: NoiseVariant, endFreq?: number): void {
  const { ctx } = bus;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = bus.noise;
  src.loop = true;
  src.playbackRate.value = jitter();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(v.freq * jitter(), t);
  if (endFreq) filter.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  filter.Q.setValueAtTime(v.q, t);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, t);
  gain.gain.linearRampToValueAtTime(peak, t + Math.min(0.2, dur * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(bus.out);
  src.start(t);
  src.stop(t + dur);
}

const HOWZAT_VARIANTS: readonly NoiseVariant[] = [
  { freq: 520, q: 1.2 },
  { freq: 700, q: 1.8 },
  { freq: 440, q: 0.9 }
];
const ROAR_VARIANTS: readonly NoiseVariant[] = [
  { freq: 480, q: 0.8 },
  { freq: 620, q: 1.1 },
  { freq: 380, q: 0.7 }
];
const APPLAUSE_VARIANTS: readonly NoiseVariant[] = [
  { freq: 1800, q: 0.6 },
  { freq: 2400, q: 0.8 },
  { freq: 1400, q: 0.5 }
];

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function createEngine(bus: Bus): { setSpeed: (s: number) => void; stop: () => void } {
  const { ctx } = bus;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(45, ctx.currentTime);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, ctx.currentTime);
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(bus.out);
  osc.start();
  return {
    setSpeed: (speed) => {
      const n = Math.min(1, Math.max(0, speed / 7.5));
      osc.frequency.setTargetAtTime(45 + n * 70, ctx.currentTime, 0.1);
      gain.gain.setTargetAtTime(0.03 + n * 0.08, ctx.currentTime, 0.1);
    },
    stop: () => {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    }
  };
}

function createPlayback(getBus: () => Bus | null) {
  const play = (fn: (bus: Bus) => void) => (): void => {
    const bus = getBus();
    if (bus) fn(bus);
  };
  const clatter = (bus: Bus): void => {
    for (let i = 0; i < 3; i++) {
      tone(bus, 'triangle', 180 + Math.random() * 80, 0.25, 0.2, i * 0.04);
    }
  };
  return {
    playBell: play((b) => tone(b, 'sine', pick([1760, 1700, 1820]), 0.3, 0.8)),
    playStumpClatter: play(clatter),
    playHowzat: play((b) => noiseBurst(b, 1.4, 0.35, pick(HOWZAT_VARIANTS))),
    // The six roar is the loudest cue, so nothing else may exceed its 0.4 peak.
    playSixRoar: play((b) => noiseBurst(b, 1.8, 0.4, pick(ROAR_VARIANTS))),
    playWhoosh: play((b) => noiseBurst(b, 0.6, 0.25, { freq: 2200, q: 1.4 }, 300)),
    playThud: play((b) => {
      tone(b, 'sine', 60, 0.35, 0.35, 0, 160);
      noiseBurst(b, 0.2, 0.22, { freq: 140, q: 1.0 });
    }),
    playHonk: play((b) => {
      tone(b, 'sawtooth', 440, 0.08, 0.35, 0, 1200);
      tone(b, 'sawtooth', 554, 0.08, 0.35, 0, 1200);
    }),
    playBrakeSqueak: play((b) => tone(b, 'sine', 2300, 0.08, 0.25, 0, 2600)),
    playFlip: play(clatter),
    playApplause: play((b) => noiseBurst(b, 1.0, 0.2, pick(APPLAUSE_VARIANTS)))
  };
}

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // storage blocked; mute simply will not persist
  }
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
}

export function createSoundManager(): SoundManager {
  let muted = loadMuted();
  let bus: Bus | null = null;
  let engine: ReturnType<typeof createEngine> | null = null;

  const applyMute = (): void => {
    if (bus) bus.out.gain.value = muted ? 0 : MASTER_VOLUME;
  };

  // The context is created here, never earlier, so autoplay policy is respected.
  const wake = (): void => {
    window.removeEventListener('pointerdown', wake);
    window.removeEventListener('keydown', wake);
    if (bus) return;
    const ctx = new AudioContext();
    const out = ctx.createGain();
    out.connect(ctx.destination);
    bus = { ctx, out, noise: createNoiseBuffer(ctx) };
    applyMute();
    ctx.resume().catch(() => {});
    engine = createEngine(bus);
  };
  window.addEventListener('pointerdown', wake);
  window.addEventListener('keydown', wake);

  const button = createMuteButton(muted, () => toggleMute());

  function toggleMute(): boolean {
    muted = !muted;
    saveMuted(muted);
    button.setMuted(muted);
    applyMute();
    return muted;
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return;
    if (e.key === 'm' || e.key === 'M') toggleMute();
  };
  window.addEventListener('keydown', onKeyDown);

  const getBus = (): Bus | null => (muted ? null : bus);

  return {
    ...createPlayback(getBus),
    updateRollerSpeed: (speed) => {
      if (engine && !muted) engine.setSpeed(speed);
    },
    toggleMute,
    isMuted: () => muted,
    destroy: () => {
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('keydown', onKeyDown);
      engine?.stop();
      engine = null;
      if (bus) {
        bus.out.disconnect();
        bus.ctx.close().catch(() => {});
        bus = null;
      }
      button.el.remove();
    }
  };
}
