import type { GameState } from '../types';

export interface HonoursBoardController {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  update: (state: GameState) => void;
  destroy: () => void;
}

interface HonoursItem {
  name: string;
  advisory: boolean;
  story?: string;
}

const HONOURS_MODELS: HonoursItem[] = [
  { name: 'OAuth 2.1 + PKCE Authorization Flow', advisory: false },
  { name: 'ID-JAG Token Exchange Delegation Flow', advisory: false },
  { name: 'Dynamic Client Registration Model', advisory: false },
  { name: 'Confused Deputy Resistance Model', advisory: false },
  { name: 'Agent-Payment Mandate Verification (UPI-style)', advisory: false },
  { name: 'Scope Step-Up Protocol Model', advisory: false },
  {
    name: 'Rediscovered Advisory: Auth Code Replay',
    advisory: true,
    story:
      'Weakened client check allows auth code replay across servers; fixed model proves trace impossible.'
  },
  {
    name: 'Rediscovered Advisory: Missing Audience Binding',
    advisory: true,
    story:
      'Missing audience binding allows token passthrough to malicious server; fixed model enforces proof of possession.'
  },
  {
    name: 'Rediscovered Advisory: Unchecked Resource Indicator',
    advisory: true,
    story:
      'Unchecked resource indicator enables token substitution; verified model enforces dynamic binding.'
  }
];

function renderModelRows(): string {
  return HONOURS_MODELS.map((item, idx) => {
    const textColor = item.advisory ? 'var(--leather)' : 'var(--willow)';
    const tag = item.advisory ? 'REDISCOVERED ADVISORY' : 'VERIFIED';
    const cursor = item.advisory ? 'cursor: pointer;' : '';
    const clickHint = item.advisory ? 'title="Click to view formal verification finding"' : '';
    const storyHtml = item.story
      ? `<div class="honours-story" style="display: none; font-size: 11px; font-style: italic; color: var(--cream); margin-top: 4px; padding-left: 12px; border-left: 2px solid var(--leather);">${item.story}</div>`
      : '';

    return `
      <div class="honours-row" data-idx="${idx}" style="padding: 6px 0; border-bottom: 1px solid rgba(243, 234, 211, 0.15); ${cursor}" ${clickHint}>
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <span style="font-size: 13px; font-weight: 600; color: ${textColor};">
            ${idx + 1}. ${item.name}
          </span>
          <span style="font-size: 10px; letter-spacing: 1px; color: ${textColor}; margin-left: 8px; white-space: nowrap;">
            ${tag}
          </span>
        </div>
        ${storyHtml}
      </div>
    `;
  }).join('');
}

function createBoardElement(): HTMLElement {
  const modal = document.createElement('div');
  modal.id = 'long-room-honours-board';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-label', "Lord's Long Room Honours Board");

  Object.assign(modal.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(92vw, 560px)',
    maxHeight: '88vh',
    overflowY: 'auto',
    backgroundColor: 'var(--timber)',
    color: 'var(--cream)',
    border: '4px solid var(--ink)',
    borderRadius: 'var(--radius)',
    padding: '24px',
    boxShadow: '6px 6px 0 var(--ink)',
    zIndex: '2500',
    display: 'none',
    fontFamily: 'var(--font-body)'
  });

  modal.innerHTML = `
    <div style="text-align: center; border-bottom: 2px solid var(--willow); padding-bottom: 12px; margin-bottom: 16px;">
      <div style="font-family: var(--font-display); font-size: 18px; color: var(--willow); letter-spacing: 1px;">
        LORD'S · THE LONG ROOM
      </div>
      <div style="font-size: 12px; margin-top: 4px; color: var(--cream); letter-spacing: 0.5px;">
        HONOURS BOARD · 9 PROTOCOL MODELS
      </div>
    </div>
    <div id="honours-rows-container" style="margin-bottom: 16px;">
      ${renderModelRows()}
    </div>
    <div style="text-align: center; margin-top: 18px;">
      <button id="close-honours-btn" style="background: var(--cream); color: var(--ink); border: 2px solid var(--ink); border-radius: var(--radius); padding: 8px 18px; font-family: var(--font-display); font-size: 12px; cursor: pointer;">
        CLOSE
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function attachAdvisoryClicks(modal: HTMLElement): void {
  const rows = modal.querySelectorAll<HTMLElement>('.honours-row');
  rows.forEach((row) => {
    const story = row.querySelector<HTMLElement>('.honours-story');
    if (story) {
      row.addEventListener('click', () => {
        const isHidden = story.style.display === 'none';
        story.style.display = isHidden ? 'block' : 'none';
      });
    }
  });
}

export function createHonoursBoard(triggerPosition = { x: 0, z: -46 }): HonoursBoardController {
  const modal = createBoardElement();
  const closeBtn = modal.querySelector('#close-honours-btn');
  attachAdvisoryClicks(modal);

  let visible = false;
  let hasTriggeredProximity = false;

  function open(): void {
    visible = true;
    modal.style.display = 'block';
  }

  function close(): void {
    visible = false;
    modal.style.display = 'none';
  }

  closeBtn?.addEventListener('click', close);

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && visible) close();
  };
  window.addEventListener('keydown', onKeyDown);

  function update(state: GameState): void {
    const vehicle = state.vehicle;
    if (!vehicle) return;

    const vPos = vehicle.currentPosition;
    const dist = Math.hypot(vPos.x - triggerPosition.x, vPos.z - triggerPosition.z);

    if (dist < 7.0 && !hasTriggeredProximity && !visible) {
      hasTriggeredProximity = true;
      open();
    } else if (dist > 12.0) {
      hasTriggeredProximity = false;
    }
  }

  return {
    open,
    close,
    isOpen: () => visible,
    update,
    destroy: () => {
      window.removeEventListener('keydown', onKeyDown);
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    }
  };
}
