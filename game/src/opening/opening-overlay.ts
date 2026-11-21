export interface OpeningOverlay {
  element: HTMLElement;
  show: () => void;
  hide: () => void;
  destroy: () => void;
}

/** Overlay displaying name, positioning, and play button once the ball is assembled. */
export function createOpeningOverlay(params: { base: string; onPlay: () => void }): OpeningOverlay {
  const container = document.createElement('div');
  container.className = 'opening-overlay';
  container.setAttribute('aria-live', 'polite');

  const card = document.createElement('div');
  card.className = 'opening-card';

  const name = document.createElement('h1');
  name.className = 'opening-name';
  name.textContent = 'HARSH THUMAR';

  const tagline = document.createElement('p');
  tagline.className = 'opening-tagline';
  tagline.textContent = 'I build AI agents that work with real money and data.';

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'opening-play-btn';
  playBtn.textContent = '[[COPY: play button]]';
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    params.onPlay();
  });

  const footer = document.createElement('div');
  footer.className = 'opening-footer';

  const soundNote = document.createElement('span');
  soundNote.className = 'opening-note';
  soundNote.textContent = '[[COPY: sound on note]]';

  const sep = document.createElement('span');
  sep.className = 'opening-sep';
  sep.textContent = '·';
  sep.setAttribute('aria-hidden', 'true');

  const scorecardLink = document.createElement('a');
  scorecardLink.className = 'opening-link';
  scorecardLink.href = `${params.base}scorecard/`;
  scorecardLink.textContent = '[[COPY: link to the Scorecard view]]';

  footer.append(soundNote, sep, scorecardLink);
  card.append(name, tagline, playBtn, footer);
  container.appendChild(card);
  document.body.appendChild(container);

  return {
    element: container,
    show: () => {
      container.classList.add('visible');
      window.requestAnimationFrame(() => playBtn.focus());
    },
    hide: () => {
      container.classList.remove('visible');
    },
    destroy: () => {
      container.remove();
    }
  };
}
