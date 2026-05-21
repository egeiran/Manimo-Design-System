// scene-nav.js — injects a "Next" button on a scene page when there is a
// next scene in the same chapter. Hidden when ?embed=1 (kort-forklart and
// other iframe hosts draw their own transport).
//
// Loaded from each scene HTML as `<script src="../scene-nav.js" defer></script>`.
// Lives in motion/ so the manifest sits next to it.
//
// "Next" is defined as the scene that comes right after the current one when
// the same-chapter scenes are sorted by title (matches index.html ordering).
//
// Conventions assumed:
//   - Scene URL is …/motion/<subject_id>/<file>.html
//   - manifest entries have { subject_id, chapter_number, html, title }
//   - A scene without a chapter_number is treated as having no neighbours.

(function () {
  const qs = new URLSearchParams(window.location.search);
  if (qs.get('embed') === '1') return;

  const me = document.currentScript;
  if (!me) return;
  const manifestUrl = new URL('./scene-manifest.json', me.src).toString();

  const m = window.location.pathname.match(/\/motion\/([^/]+)\/([^/?#]+\.html)(?:$|[?#])/);
  if (!m) return;
  const [, subjectId, htmlName] = m;

  fetch(manifestUrl)
    .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
    .then(({ scenes }) => {
      const current = scenes.find(
        s => s.subject_id === subjectId && s.html === htmlName
      );
      if (!current || !Number.isInteger(current.chapter_number)) return;

      const sameChapter = scenes
        .filter(s =>
          s.subject_id === subjectId &&
          s.chapter_number === current.chapter_number
        )
        .sort((a, b) => a.title.localeCompare(b.title));

      const idx = sameChapter.findIndex(s => s.html === htmlName);
      if (idx === -1 || idx === sameChapter.length - 1) return;

      inject(sameChapter[idx + 1]);
    })
    .catch(() => {});

  function inject(next) {
    const css = document.createElement('style');
    css.textContent = `
      .manimo-next-btn {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 18px;
        border: 1px solid var(--border-soft);
        border-radius: 12px;
        background: var(--bg-elevated);
        color: var(--chalk-50);
        font-family: var(--font-sans);
        font-size: 14px;
        text-decoration: none;
        box-shadow: 0 6px 22px rgba(0, 0, 0, 0.32);
        transition: border-color 120ms ease, transform 120ms ease, background-color 120ms ease;
        max-width: 360px;
        opacity: 0;
        transform: translateY(6px);
        animation: manimo-next-fade-in 240ms ease-out 200ms forwards;
      }
      @keyframes manimo-next-fade-in {
        to { opacity: 1; transform: translateY(0); }
      }
      .manimo-next-btn:hover {
        border-color: var(--border-strong);
        background: var(--bg-raised);
      }
      .manimo-next-btn .label {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--fg-3);
      }
      .manimo-next-btn .title {
        font-family: var(--font-serif);
        font-style: italic;
        font-size: 15px;
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .manimo-next-btn .arrow {
        color: var(--amber-400);
        font-size: 16px;
        line-height: 1;
      }
    `;
    document.head.appendChild(css);

    const a = document.createElement('a');
    a.className = 'manimo-next-btn';
    a.href = next.html; // sibling file in same subject folder
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = 'Next';
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = next.title;
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '→';
    a.append(label, title, arrow);
    document.body.appendChild(a);
  }
})();
