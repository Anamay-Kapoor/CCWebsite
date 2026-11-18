import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHud } from './HudContext';
import { useContent } from '../content';
import { PLACES } from '../world/places';
import { CLUB, VERTICALS } from '../data/club';

/* Ctrl/⌘ K palette: nodes, pages, projects and commands. */
export default function CommandPalette() {
  const { paletteOpen: open, setPaletteOpen, toggleSound, soundOn, toggleMotion, motionOn, copyEmail } = useHud();
  const { content } = useContent();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef(null);
  const listRef = useRef(null);
  const lastFocus = useRef(null);
  const close = () => setPaletteOpen(false);

  const items = useMemo(() => [
    ...PLACES.map((p) => ({
      group: 'Board', label: p.title, hint: `${p.index} · ${p.name}`, keywords: `${p.name} ${p.sub} ${p.blurb}`,
      run: () => navigate(`/?place=${p.id}`),
    })),
    { group: 'Pages', label: 'The board', hint: 'home', keywords: 'home start', run: () => navigate('/') },
    { group: 'Pages', label: 'All projects', hint: 'page', run: () => navigate('/projects') },
    { group: 'Pages', label: 'Join the club', hint: `recruitment ${CLUB.session}`, keywords: 'apply recruitment roles faq', run: () => navigate('/join') },
    ...VERTICALS.map((v) => ({
      group: 'Verticals', label: `${v.name} team`, hint: v.ref, keywords: `${v.id} members people vertical`,
      run: () => navigate(`/verticals/${v.id}`),
    })),
    ...content.projects.map((p) => ({
      group: 'Projects', label: p.name, hint: p.verticalLabel, keywords: p.tags.join(' '),
      run: () => navigate(`/projects/${p.slug}`),
    })),
    { group: 'Actions', label: 'Copy club email', hint: CLUB.email, keywords: 'contact mail', run: copyEmail },
    { group: 'Actions', label: 'Write us an email', hint: 'mail app ↗', keywords: 'contact', run: () => { window.location.href = `mailto:${CLUB.email}`; } },
    { group: 'Actions', label: 'Open Instagram', hint: CLUB.instagram.handle, keywords: 'social', run: () => window.open(CLUB.instagram.url, '_blank', 'noopener') },
    { group: 'Actions', label: soundOn ? 'Turn sound off' : 'Turn sound on', hint: 'toggle', keywords: 'audio mute', run: toggleSound },
    { group: 'Actions', label: motionOn ? 'Pause motion' : 'Resume motion', hint: 'toggle', keywords: 'animation reduce', run: toggleMotion },
  ], [content.projects, navigate, copyEmail, soundOn, toggleSound, motionOn, toggleMotion]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((it) => `${it.label} ${it.hint || ''} ${it.keywords || ''} ${it.group}`.toLowerCase().includes(needle));
  }, [q, items]);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement;
      setQ('');
      setSel(0);
      requestAnimationFrame(() => input.current?.focus());
    } else if (lastFocus.current) {
      lastFocus.current.focus?.({ preventScroll: true });
      lastFocus.current = null;
    }
  }, [open]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;

  const run = (it) => { close(); it.run(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && list[sel]) { e.preventDefault(); run(list[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  };

  let lastGroup = '';
  return (
    <div className="palette-backdrop" onMouseDown={close}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search the site" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <span aria-hidden="true">&gt;_</span>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to a node, page, project or command…"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={list[sel] ? `palette-opt-${sel}` : undefined}
            autoComplete="off"
            spellCheck="false"
          />
          <button type="button" className="palette-esc" onClick={close}>esc</button>
        </div>
        <ul id="palette-list" role="listbox" className="palette-list" ref={listRef}>
          {list.length === 0 && <li className="palette-empty">No matches. Try “join” or “events”.</li>}
          {list.map((it, i) => {
            const head = it.group !== lastGroup;
            lastGroup = it.group;
            return (
              <React.Fragment key={`${it.group}-${it.label}`}>
                {head && <li className="palette-group" role="presentation">{it.group}</li>}
                <li
                  id={`palette-opt-${i}`}
                  role="option"
                  aria-selected={i === sel}
                  className={i === sel ? 'is-sel' : ''}
                  onMouseMove={() => setSel(i)}
                  onClick={() => run(it)}
                >
                  <span className="palette-label">{it.label}</span>
                  {it.hint && <span className="palette-hint">{it.hint}</span>}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
        <div className="palette-foot" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
