export interface OpeningOverlay {
  element: HTMLElement;
  show: () => void;
  hide: () => void;
  destroy: () => void;
}

/** The positioning line and the play button, shown under the ball once it is stamped. */
export function createOpeningOverlay(params: { base: string; onPlay: () => void }): OpeningOverlay {
  const container = document.createElement('div');
  container.className = 'opening-overlay';
  container.setAttribute('aria-live', 'polite');

  const tagline = document.createElement('p');
  tagline.className = 'opening-tagline';
  tagline.textContent = 'I build AI agents that play by the Laws.';

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'opening-play-btn';
  playBtn.textContent = 'Bowl it';
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    params.onPlay();
  });

  const footer = document.createElement('div');
  footer.className = 'opening-footer';

  const soundNote = document.createElement('span');
  soundNote.className = 'opening-note';
  soundNote.textContent = 'Best with sound on';

  const sep = document.createElement('span');
  sep.className = 'opening-sep';
  sep.textContent = '·';
  sep.setAttribute('aria-hidden', 'true');

  const scorecardLink = document.createElement('a');
  scorecardLink.className = 'opening-link';
  scorecardLink.href = `${params.base}scorecard/`;
  scorecardLink.textContent = 'Prefer reading? Scorecard view';

  footer.append(soundNote, sep, scorecardLink);
  container.append(tagline, playBtn, footer);
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
