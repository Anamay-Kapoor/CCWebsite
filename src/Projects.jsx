import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP, useTilt } from './ui';
import { useContent, externalLink } from './content';
import PageHero from './pages/PageHero';
import { VERTICALS } from './data/club';

const ext = (url) => (externalLink(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {});
export const partNo = (i) => `CC-PRJ-${String(i + 1).padStart(3, '0')}`;

const FILTERS = [{ id: 'all', name: 'All' }, ...VERTICALS.map((v) => ({ id: v.id, name: v.name }))];

function host(url) {
  try { return new URL(url).host; } catch { return ''; }
}

export function ProjectCard({ project, index }) {
  const tilt = useTilt(5);
  // Every club project is live; the link only shows when there's a public URL.
  const live = !!project.liveUrl;
  return (
    <article ref={tilt} className="pcard tilt">
      <Link to={`/projects/${project.slug}`} className="pcard__media" aria-label={`${project.name} details`}>
        {project.image ? (
          <img src={project.image} alt="" loading="lazy" />
        ) : (
          <span className="pcard__placeholder">{project.name}<i>_</i></span>
        )}
        <span className="pcard__scan" aria-hidden="true" />
        <span className="pcard__ref">{partNo(index)}</span>
        <span className="pcard__status is-live"><i />Live</span>
      </Link>
      <div className="pcard__body">
        <p className="pcard__vertical">{project.verticalLabel}</p>
        <h2 className="pcard__title">
          <Link to={`/projects/${project.slug}`}>{project.name}</Link>
        </h2>
        <p className="pcard__desc">{project.description}</p>
        <ul className="pcard__tags" aria-label="Stack">
          {project.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
        <div className="pcard__foot">
          <Link to={`/projects/${project.slug}`} className="pcard__link">Datasheet →</Link>
          <span className="pcard__ext">
            {live && <a href={project.liveUrl} {...ext(project.liveUrl)} title={host(project.liveUrl)}>Live ↗</a>}
            {project.sourceUrl && <a href={project.sourceUrl} {...ext(project.sourceUrl)}>Source ↗</a>}
          </span>
        </div>
      </div>
      <span className="pcard__trace" aria-hidden="true" />
    </article>
  );
}

export function PitchCard() {
  return (
    <article className="pcard pcard--pitch">
      <div className="pcard__pitch">
        <span className="pcard__ref">CC-PRJ-???</span>
        <p className="pcard__vertical">Empty slot</p>
        <h2 className="pcard__title">Your project here</h2>
        <p className="pcard__desc">Got an idea for campus, a game, or a model? Pitch it and we’ll help you build it.</p>
        <div className="pcard__pitch-actions">
          <Link to="/?place=contact" className="pcard__link">Pitch it →</Link>
          <Link to="/join" className="pcard__link">Join a team →</Link>
        </div>
      </div>
    </article>
  );
}

function Projects() {
  const root = useRef(null);
  const searchRef = useRef(null);
  const [search, setSearch] = useState('');
  const [vertical, setVertical] = useState('all');
  const { content, loading, error } = useContent();
  const projects = content.projects;

  // "/" focuses search, like most dev tools.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.target.closest?.('input, textarea, select')) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const counts = useMemo(() => {
    const c = { all: projects.length };
    VERTICALS.forEach((v) => { c[v.id] = projects.filter((p) => p.vertical === v.id).length; });
    return c;
  }, [projects]);

  const query = search.trim().toLowerCase();
  const filtered = projects
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => {
      const text = [p.name, p.description, p.verticalLabel, ...p.tags].join(' ').toLowerCase();
      return text.includes(query) && (vertical === 'all' || p.vertical === vertical);
    });
  const resultKey = filtered.map(({ p }) => p.id).join('|');

  useGSAP(() => {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.pcard', { y: 40, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'power3.out' });
    });
  }, { scope: root, dependencies: [resultKey] });

  const live = projects.length;

  return (
    <main className="site page projects-page" ref={root}>
      <PageHero
        sheet="Sheet 02 · U2–U4"
        crumb={[{ label: 'projects' }]}
        kicker="The Foundry · Things we shipped"
        title={<>Built by <em>members</em>, used on campus.</>}
        lede="Every project here was designed, argued over, debugged at 3 am and shipped by Coding Club members across our verticals."
        stats={[
          { value: loading ? '—' : projects.length, label: 'projects' },
          { value: loading ? '—' : live, label: 'live right now' },
          { value: VERTICALS.length, label: 'verticals' },
        ]}
        part="ram"
        refdes="U2–U4 · DDR5 MODULE"
      />

      <section className="page-body">
        <div className="pfilter" role="search">
          <label className="pfilter__search">
            <span aria-hidden="true">&gt;_</span>
            <input
              ref={searchRef}
              type="search"
              placeholder="grep projects..."
              aria-label="Search projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd aria-hidden="true">/</kbd>
          </label>
          <div className="pfilter__chips" role="group" aria-label="Filter by vertical">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={vertical === f.id ? 'is-active' : ''}
                aria-pressed={vertical === f.id}
                onClick={() => setVertical(f.id)}
              >
                {f.name}<b>{counts[f.id] ?? 0}</b>
              </button>
            ))}
          </div>
        </div>

        <p className="pfilter__count" aria-live="polite">
          <span>$ ls ./projects{vertical !== 'all' ? ` --vertical=${vertical}` : ''}{query ? ` | grep "${query}"` : ''}</span>
          <b>{filtered.length}</b> result{filtered.length === 1 ? '' : 's'}
        </p>

        {loading && <div className="pgrid">{[0, 1, 2].map((k) => <div key={k} className="pcard pcard--ghost" />)}</div>}
        {error && <p role="alert" className="result-count">{error}</p>}

        {!loading && !error && (
          <div className="pgrid">
            {filtered.map(({ p, i }) => <ProjectCard key={p.id} project={p} index={i} />)}
            {filtered.length === 0 && (
              <div className="pempty">
                <p><b>0 results.</b> No project matches “{search || vertical}”.</p>
                <button type="button" className="pcard__link" onClick={() => { setSearch(''); setVertical('all'); }}>Clear filters ↺</button>
              </div>
            )}
            <PitchCard />
          </div>
        )}
      </section>
    </main>
  );
}

export default Projects;
