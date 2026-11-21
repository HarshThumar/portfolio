export interface ProjectPanelController {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

interface ProjectPanelData {
  slug: string;
  name: string;
  projectId: string;
  projectTitle: string;
  tagline: string;
  panelText: string;
  numbers: Array<{ label: string; value: string; source: string }>;
  links: Array<{ label: string; url: string }>;
}

const DEFAULT_LORDS_DATA: ProjectPanelData = {
  slug: 'lords',
  name: "Lord's, London",
  projectId: 'P1',
  projectTitle: 'mcp-auth-tamarin: formal verification of MCP authorization',
  tagline: "Lord's keeps the Laws of Cricket. This project checks the rules AI agents follow.",
  panelText:
    "[[COPY: 2–3 sentences in Harsh's voice, using only the facts field. Builder draft to rewrite: Models MCP authorization flow in the Tamarin prover with 9 protocol models and 376 lemma checks run in CI. Rediscovered 3 published, already-fixed MCP SDK advisories. Started as IETF 127 Hackathon project (remote participant). Co-authored with Prince Upadhyay.]]",
  numbers: [
    { label: 'Lemma checks', value: '376', source: 'CI test run' },
    { label: 'Protocol models', value: '9', source: 'Tamarin repository models' },
    {
      label: 'Advisories rediscovered',
      value: '3',
      source: 'Published, already-fixed MCP SDK advisories'
    }
  ],
  links: [
    {
      label: 'GitHub Repository',
      url: 'https://github.com/HarshThumar/mcp-auth-tamarin'
    },
    {
      label: 'Write-up (with Prince Upadhyay)',
      url: 'https://harshthumar.github.io'
    }
  ]
};

function renderScorecardNumbers(data: ProjectPanelData): string {
  return data.numbers
    .map(
      (num) => `
    <div style="flex: 1; min-width: 120px; background: rgba(30, 27, 22, 0.05); border: 2px solid var(--ink); border-radius: var(--radius); padding: 10px; text-align: center;">
      <div style="font-family: var(--font-display); font-size: 24px; color: var(--leather);">${num.value}</div>
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 2px; color: var(--ink);">${num.label}</div>
      <div style="font-size: 9px; color: var(--timber); margin-top: 4px;">Source: ${num.source}</div>
    </div>
  `
    )
    .join('');
}

function renderScorecardLinks(data: ProjectPanelData): string {
  return data.links
    .map(
      (link) => `
    <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 6px 14px; background: var(--willow); color: var(--ink); border: 2px solid var(--ink); border-radius: var(--radius); text-decoration: none; font-size: 11px; font-weight: 600;">
      ${link.label} ↗
    </a>
  `
    )
    .join('');
}

function buildPanelHtml(data: ProjectPanelData): string {
  return `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--ink); padding-bottom: 10px; margin-bottom: 12px;">
      <div>
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: var(--timber); text-transform: uppercase;">
          ${data.name} · ${data.projectId}
        </div>
        <h2 id="project-panel-title" style="margin: 4px 0 0 0; font-family: var(--font-display); font-size: 18px; color: var(--ink); line-height: 1.2;">
          ${data.projectTitle}
        </h2>
      </div>
      <button id="close-project-panel-btn" aria-label="Close scorecard panel" style="background: var(--leather); color: var(--cream); border: 2px solid var(--ink); border-radius: var(--radius); padding: 4px 10px; font-weight: bold; cursor: pointer; font-size: 12px;">
        ✕
      </button>
    </div>

    <div id="project-panel-body" style="font-size: 13px; line-height: 1.5; color: var(--ink); margin-bottom: 14px; background: rgba(243, 234, 211, 0.7); padding: 10px; border-left: 3px solid var(--timber);">
      ${data.panelText}
    </div>

    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;">
      ${renderScorecardNumbers(data)}
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-top: 10px; border-top: 1px dashed var(--timber);">
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${renderScorecardLinks(data)}
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="back-to-map-btn" style="background: transparent; color: var(--ink); border: 1px solid var(--ink); border-radius: var(--radius); padding: 5px 10px; font-size: 11px; cursor: pointer;">
          Map
        </button>
        <button id="next-ground-btn" style="background: var(--ink); color: var(--cream); border: 1px solid var(--ink); border-radius: var(--radius); padding: 5px 12px; font-size: 11px; cursor: pointer;">
          Next Ground →
        </button>
      </div>
    </div>
  `;
}

function createPanelElement(data: ProjectPanelData): HTMLElement {
  const panel = document.createElement('section');
  panel.id = 'project-scorecard-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', 'project-panel-title');
  panel.setAttribute('aria-describedby', 'project-panel-body');

  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%) translateY(105%)',
    width: 'min(96vw, 680px)',
    maxHeight: '80vh',
    overflowY: 'auto',
    backgroundColor: 'var(--cream)',
    color: 'var(--ink)',
    border: '3px solid var(--ink)',
    borderBottom: 'none',
    borderTopLeftRadius: 'var(--radius)',
    borderTopRightRadius: 'var(--radius)',
    padding: '20px 24px',
    boxShadow: '0 -4px 16px rgba(30, 27, 22, 0.25)',
    zIndex: '2000',
    fontFamily: 'var(--font-body)',
    transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
  });

  panel.innerHTML = buildPanelHtml(data);
  document.body.appendChild(panel);
  return panel;
}

export function createProjectPanel(
  data: ProjectPanelData = DEFAULT_LORDS_DATA
): ProjectPanelController {
  const panel = createPanelElement(data);
  const closeBtn = panel.querySelector<HTMLButtonElement>('#close-project-panel-btn');
  let isOpenState = false;

  function open(): void {
    isOpenState = true;
    panel.style.transform = 'translateX(-50%) translateY(0)';
    closeBtn?.focus();
  }

  function close(): void {
    isOpenState = false;
    panel.style.transform = 'translateX(-50%) translateY(105%)';
  }

  closeBtn?.addEventListener('click', close);

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && isOpenState) close();
  };
  window.addEventListener('keydown', onKeyDown);

  return {
    open,
    close,
    isOpen: () => isOpenState,
    destroy: () => {
      window.removeEventListener('keydown', onKeyDown);
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    }
  };
}
