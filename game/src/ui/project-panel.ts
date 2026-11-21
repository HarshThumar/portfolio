import type { GroundData } from '../types';
import { attachDialog } from './dialog';

export interface ProjectPanelController {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

type Styles = Partial<CSSStyleDeclaration>;

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

/** Only https: and mailto: may become real links; anything else stays text. */
function safeHref(url: string): string | null {
  if (url.startsWith('[[')) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'mailto:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function buildNumbers(ground: GroundData): HTMLElement {
  const row = el('div', { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' });
  for (const num of ground.numbers) {
    const card = el('div', {
      flex: '1',
      minWidth: '120px',
      background: 'var(--cream)',
      border: '2px solid var(--ink)',
      borderRadius: 'var(--radius)',
      padding: '10px',
      textAlign: 'center'
    });
    card.append(
      el(
        'div',
        { fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--leather)' },
        num.value
      ),
      el(
        'div',
        { fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' },
        num.label
      ),
      el(
        'div',
        { fontSize: '10px', color: 'var(--timber)', marginTop: '4px' },
        `[[COPY: source caption]] ${num.source}`
      )
    );
    row.appendChild(card);
  }
  return row;
}

function buildLink(link: { label: string; url: string }): HTMLElement {
  const href = safeHref(link.url);
  const style: Styles = {
    display: 'inline-block',
    padding: '6px 14px',
    border: '2px solid var(--ink)',
    borderRadius: 'var(--radius)',
    fontSize: '12px',
    fontWeight: '600'
  };
  if (!href) {
    return el(
      'span',
      { ...style, borderStyle: 'dashed', color: 'var(--timber)' },
      `${link.label}: ${link.url}`
    );
  }
  const a = el('a', {
    ...style,
    background: 'var(--willow)',
    color: 'var(--ink)',
    textDecoration: 'none'
  });
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = link.label;
  return a;
}

function buildHeader(ground: GroundData, titleId: string) {
  const header = el('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2px solid var(--ink)',
    paddingBottom: '10px',
    marginBottom: '12px'
  });
  const heading = el('div', {});
  heading.appendChild(
    el(
      'div',
      {
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '1.5px',
        color: 'var(--timber)',
        textTransform: 'uppercase'
      },
      `${ground.name} · ${ground.projectId}`
    )
  );
  const title = el(
    'h2',
    { margin: '4px 0 0 0', fontFamily: 'var(--font-display)', fontSize: '18px', lineHeight: '1.2' },
    ground.projectTitle
  );
  title.id = titleId;
  heading.appendChild(title);
  const closeBtn = el(
    'button',
    {
      background: 'var(--leather)',
      color: 'var(--cream)',
      border: '2px solid var(--ink)',
      borderRadius: 'var(--radius)',
      padding: '4px 10px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '12px'
    },
    '[[COPY: close button label]]'
  );
  closeBtn.type = 'button';
  header.append(heading, closeBtn);
  return { header, closeBtn };
}

function buildFooter(ground: GroundData, onMap: () => void): HTMLElement {
  const footer = el('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    paddingTop: '10px',
    borderTop: '1px dashed var(--timber)'
  });
  const links = el('div', { display: 'flex', gap: '8px', flexWrap: 'wrap' });
  ground.links.forEach((link) => links.appendChild(buildLink(link)));

  const actions = el('div', { display: 'flex', gap: '8px' });
  const buttonStyle: Styles = {
    border: '1px solid var(--ink)',
    borderRadius: 'var(--radius)',
    padding: '5px 10px',
    fontSize: '11px',
    cursor: 'pointer'
  };
  const map = el(
    'button',
    { ...buttonStyle, background: 'var(--cream)', color: 'var(--ink)' },
    '[[COPY: map button label]]'
  );
  map.type = 'button';
  map.addEventListener('click', onMap);
  // Only one ground exists in this build, so there is nothing to advance to.
  const next = el(
    'button',
    { ...buttonStyle, background: 'var(--ink)', color: 'var(--cream)', cursor: 'not-allowed' },
    '[[COPY: next ground button label]]'
  );
  next.type = 'button';
  next.disabled = true;
  actions.append(map, next);
  footer.append(links, actions);
  return footer;
}

function buildPanel(ground: GroundData) {
  const panel = el('section', {
    position: 'fixed',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%) translateY(105%)',
    width: 'min(96vw, 680px)',
    maxHeight: '80vh',
    overflowY: 'auto',
    background: 'var(--cream)',
    color: 'var(--ink)',
    border: '3px solid var(--ink)',
    borderBottom: 'none',
    borderTopLeftRadius: 'var(--radius)',
    borderTopRightRadius: 'var(--radius)',
    padding: '20px 24px',
    boxShadow: '3px 3px 0 var(--ink)',
    zIndex: '2000',
    fontFamily: 'var(--font-body)'
  });
  panel.id = 'project-scorecard-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-labelledby', 'project-panel-title');
  panel.setAttribute('aria-describedby', 'project-panel-body');

  const { header, closeBtn } = buildHeader(ground, 'project-panel-title');
  const body = el(
    'div',
    {
      fontSize: '13px',
      lineHeight: '1.5',
      marginBottom: '14px',
      background: 'var(--cream)',
      padding: '10px',
      borderLeft: '3px solid var(--timber)'
    },
    ground.panelText
  );
  body.id = 'project-panel-body';
  return { panel, closeBtn, header, body };
}

export function createProjectPanel(ground: GroundData): ProjectPanelController {
  const { panel, closeBtn, header, body } = buildPanel(ground);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const dialog = attachDialog(panel, closeBtn, {
    onOpen: () => {
      // Reflow first so the slide-in transition actually runs from the hidden pose.
      panel.style.transition = reduceMotion.matches
        ? 'none'
        : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      void panel.offsetHeight;
      panel.style.transform = 'translateX(-50%) translateY(0)';
    },
    onClose: () => {
      panel.style.transform = 'translateX(-50%) translateY(105%)';
    }
  });

  panel.append(header, body, buildNumbers(ground), buildFooter(ground, dialog.close));
  closeBtn.addEventListener('click', dialog.close);
  document.body.appendChild(panel);

  return {
    open: dialog.open,
    close: dialog.close,
    isOpen: dialog.isOpen,
    destroy: () => {
      dialog.destroy();
      panel.remove();
    }
  };
}
