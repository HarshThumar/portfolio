export interface StampBanner {
  show: (text: string) => void;
  destroy: () => void;
}

export function createStampBanner(): StampBanner {
  const el = document.createElement('div');
  el.id = 'cricket-stamp-banner';
  el.setAttribute('aria-live', 'polite');

  Object.assign(el.style, {
    position: 'fixed',
    top: '28px',
    left: '50%',
    transform: 'translateX(-50%) scale(0.9)',
    backgroundColor: 'var(--cream, #f3ead3)',
    color: 'var(--leather, #a3271f)',
    border: '3px solid var(--leather, #a3271f)',
    borderRadius: 'var(--radius, 4px)',
    padding: '8px 24px',
    fontFamily: 'var(--font-display, "Alfa Slab One", serif)',
    fontSize: '24px',
    letterSpacing: '2px',
    zIndex: '2000',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
    boxShadow: '3px 3px 0 var(--ink, #1e1b16)'
  });

  document.body.appendChild(el);
  let timeoutId = 0;

  function show(text: string): void {
    el.textContent = text;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) scale(1.0) rotate(-2deg)';

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) scale(0.9)';
    }, 2200);
  }

  return {
    show,
    destroy: () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  };
}
