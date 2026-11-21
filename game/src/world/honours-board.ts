import type { GameState, GroundData } from '../types';
import { attachDialog } from '../ui/dialog';

export interface HonoursBoardController {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  update: (state: GameState) => void;
  destroy: () => void;
}

type Styles = Partial<CSSStyleDeclaration>;

const TRIGGER_RADIUS = 7;
// Wider than the trigger so a roller idling at the edge cannot re-open the board.
const RESET_RADIUS = 12;

// From the public repo github.com/HarshThumar/mcp-auth-tamarin (README and docs/results.md),
// recorded in docs/02. Each model takes one question about MCP authorization.
const MODEL_NAMES = [
  '01 · Does a credential reach only its own login server?',
  '02 · Codes and tokens reach only the right server',
  '03 · One client identity at many login servers',
  '04 · Enterprise token exchange (ID-JAG)',
  '05 · An AI agent paying under a UPI-style mandate',
  '06 · Audience injection',
  '07 · Confused deputy at an MCP proxy',
  '08 · Token passthrough',
  '09 · Scope step-up'
];
const ADVISORIES = [
  'GHSA-qx49-fqc8-xw99 · Python SDK: a malicious MCP server could get credentials meant for the real login server',
  'GHSA-w4fh-qvv9-3v23 · Python SDK: a server accepted tokens issued for a different server',
  'GHSA-rvq5-wwqv-78pq · TypeScript SDK: the same audience bug'
];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  styles: Styles,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, styles);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** The counts live in ground.numbers so the board never hard-codes them. */
function countFor(ground: GroundData, value: string): number {
  const found = ground.numbers.find((n) => n.value === value);
  return found ? Number(found.value) : 0;
}

function buildSection(heading: string, rows: string[], color: string): HTMLElement {
  const section = el('section', { marginBottom: '16px' });
  section.appendChild(
    el(
      'h3',
      { margin: '0 0 6px 0', fontSize: '12px', letterSpacing: '1px', color: 'var(--cream)' },
      heading
    )
  );
  const list = el('ol', { margin: '0', paddingLeft: '22px' });
  for (const text of rows) {
    list.appendChild(
      el(
        'li',
        { padding: '6px 0', borderBottom: '1px solid var(--ink)', fontSize: '13px', color },
        text
      )
    );
  }
  section.appendChild(list);
  return section;
}

function buildBoard(ground: GroundData) {
  const modal = el('div', {
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
    fontFamily: 'var(--font-body)'
  });
  modal.id = 'long-room-honours-board';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'honours-board-title');

  const head = el('div', {
    textAlign: 'center',
    borderBottom: '2px solid var(--willow)',
    paddingBottom: '12px',
    marginBottom: '16px'
  });
  const title = el(
    'h2',
    { margin: '0', fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--willow)' },
    'Honours board'
  );
  title.id = 'honours-board-title';
  head.append(
    title,
    el(
      'div',
      { fontSize: '12px', marginTop: '4px' },
      'mcp-auth-tamarin · every model checked in CI'
    )
  );

  const models = MODEL_NAMES.slice(0, countFor(ground, '9'));
  const advisories = ADVISORIES.slice(0, countFor(ground, '3'));

  const closeBtn = el(
    'button',
    {
      background: 'var(--cream)',
      color: 'var(--ink)',
      border: '2px solid var(--ink)',
      borderRadius: 'var(--radius)',
      padding: '8px 18px',
      fontFamily: 'var(--font-display)',
      fontSize: '12px',
      cursor: 'pointer'
    },
    'Close'
  );
  closeBtn.type = 'button';
  const footer = el('div', { textAlign: 'center', marginTop: '18px' });
  footer.appendChild(closeBtn);

  modal.append(
    head,
    buildSection('The 9 models', models, 'var(--willow)'),
    buildSection('Rediscovered: 3 published, already-fixed advisories', advisories, 'var(--cream)'),
    footer
  );
  return { modal, closeBtn };
}

export function createHonoursBoard(
  ground: GroundData,
  triggerPosition: { x: number; z: number }
): HonoursBoardController {
  const { modal, closeBtn } = buildBoard(ground);
  document.body.appendChild(modal);
  const dialog = attachDialog(modal, closeBtn);
  closeBtn.addEventListener('click', dialog.close);

  // Armed means the roller has been away; it disarms on open so focus is taken once per approach.
  let armed = true;

  function update(state: GameState): void {
    const vehicle = state.vehicle;
    if (!vehicle) return;
    const pos = vehicle.currentPosition;
    const dist = Math.hypot(pos.x - triggerPosition.x, pos.z - triggerPosition.z);
    if (dist < TRIGGER_RADIUS && armed) {
      armed = false;
      dialog.open();
    } else if (dist > RESET_RADIUS) {
      armed = true;
    }
  }

  return {
    open: dialog.open,
    close: dialog.close,
    isOpen: dialog.isOpen,
    update,
    destroy: () => {
      dialog.destroy();
      modal.remove();
    }
  };
}
