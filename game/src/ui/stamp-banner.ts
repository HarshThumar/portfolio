export interface StampBanner {
  show: (text: string) => void;
  destroy: () => void;
}

export function createStampBanner(): StampBanner {
  const el = document.createElement('div');
  el.id = 'cricket-stamp-banner';
  el.setAttribute('role', 'status');

  Object.assign(el.style, {
    position: 'fixed',
    top: '28px',
    left: '50%',
    transform: 'translateX(-50%) scale(0.9)',
    backgroundColor: 'var(--cream)',
    color: 'var(--leather)',
    border: '3px solid var(--leather)',
    borderRadius: 'var(--radius)',
    padding: '8px 24px',
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    letterSpacing: '2px',
    zIndex: '2000',
    opacity: '0',
    pointerEvents: 'none',
    boxShadow: '3px 3px 0 var(--ink)'
  });

  document.body.appendChild(el);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timeoutId = 0;

  // Reduced motion keeps the banner readable but fades only, with no scale or tilt.
  const applyPose = (visible: boolean): void => {
    el.style.transition = motion.matches
      ? 'opacity 0.25s ease'
      : 'opacity 0.25s ease, transform 0.25s ease';
    el.style.opacity = visible ? '1' : '0';
    if (motion.matches) {
      el.style.transform = 'translateX(-50%)';
    } else {
      el.style.transform = visible
        ? 'translateX(-50%) scale(1.0) rotate(-2deg)'
        : 'translateX(-50%) scale(0.9)';
    }
  };

  function show(text: string): void {
    el.textContent = text;
    applyPose(true);
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => applyPose(false), 2200);
  }

  return {
    show,
    destroy: () => {
      if (timeoutId) clearTimeout(timeoutId);
      el.remove();
    }
  };
}
