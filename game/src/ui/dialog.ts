export interface DialogBehavior {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

interface DialogHooks {
  onOpen?: () => void;
  onClose?: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal behaviour: focus moves in on open and returns on close, Tab is
 * trapped, Esc closes, and the closed element is hidden and inert so neither
 * keyboard nor screen readers can reach it.
 */
export function attachDialog(
  el: HTMLElement,
  initialFocus: HTMLElement,
  hooks: DialogHooks = {}
): DialogBehavior {
  let opened = false;
  let previousFocus: Element | null = null;

  const setClosedState = (closed: boolean): void => {
    el.hidden = closed;
    el.inert = closed;
  };
  setClosedState(true);

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !el.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !el.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  function open(): void {
    if (opened) return;
    opened = true;
    previousFocus = document.activeElement;
    setClosedState(false);
    hooks.onOpen?.();
    document.addEventListener('keydown', onKeyDown, true);
    initialFocus.focus();
  }

  function close(): void {
    if (!opened) return;
    opened = false;
    document.removeEventListener('keydown', onKeyDown, true);
    setClosedState(true);
    hooks.onClose?.();
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    previousFocus = null;
  }

  return {
    open,
    close,
    isOpen: () => opened,
    destroy: () => {
      document.removeEventListener('keydown', onKeyDown, true);
      opened = false;
    }
  };
}
