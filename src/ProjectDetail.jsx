import React, { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gsap, useGSAP, useMagnetic, useTilt, Scramble, motionQuery } from './ui';
import { useContent, externalLink } from './content';
import { partNo, AutoCover } from './Projects';

const ext = (url) => (externalLink(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {});
function host(url) {
  try { return new URL(url, window.location.origin).host; } catch { return url; }
}

/* The project's stack drawn as a DIP chip pinout. */
function Pinout({ name, tags, part }) {
  const pins = ['VCC', ...tags.map((t) => t.toUpperCase()), 'GND'];
  // At least 4 pins a side so the package reads as a chip; pad with no-connects.
  while (pins.length < 8 || pins.length % 2) pins.splice(pins.length - 1, 0, 'NC');
  const half = pins.length / 2;
  const left = pins.slice(0, half);
  const right = pins.slice(half).reverse();
  const pitch = 34;
  const h = half * pitch + 30;
  const W = 520;
  const bx = 180;
  const bw = W - bx * 2;
  const nameSize = Math.min(15, (bw - 24) / (name.length * 0.62));
  return (
    <svg className="pinout" viewBox={`0 0 ${W} ${h + 20}`} role="img" aria-label={`Pinout: ${pins.join(', ')}`}>
      <rect x={bx} y="10" width={bw} height={h} rx="6" className="pinout__body" />
      <path d={`M${W / 2 - 14} 10 a14 14 0 0 0 28 0`} className="pinout__notch" />
      <text x={W / 2} y={h / 2 + 2} textAnchor="middle" className="pinout__name" style={{ fontSize: nameSize }}>{name.toUpperCase()}</text>
      <text x={W / 2} y={h / 2 + 22} textAnchor="middle" className="pinout__part">{part}</text>
      {left.map((pin, i) => {
        const y = 25 + i * pitch + 10;
        return (
          <g key={`l${pin}${i}`}>
            <rect x={bx - 26} y={y - 5} width="26" height="10" className="pinout__pin" />
            <text x={bx - 34} y={y + 4} textAnchor="end" className={`pinout__label${i === 0 ? ' is-pwr' : ''}`}>{pin}</text>
            <text x={bx + 10} y={y + 4} className="pinout__num">{i + 1}</text>
          </g>
        );
      })}
      {right.map((pin, i) => {
        const y = 25 + i * pitch + 10;
        return (
          <g key={`r${pin}${i}`}>
            <rect x={bx + bw} y={y - 5} width="26" height="10" className="pinout__pin" />
            <text x={bx + bw + 34} y={y + 4} className={`pinout__label${i === 0 ? ' is-pwr' : ''}`}>{pin}</text>
            <text x={bx + bw - 10} y={y + 4} textAnchor="end" className="pinout__num">{pins.length - i}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ProjectDetail() {
  const { slug } = useParams();
  const root = useRef(null);
  const magLive = useMagnetic();
  const magSource = useMagnetic();
  const tiltImage = useTilt(4);
  const { content, loading, error } = useContent();
  const index = content.projects.findIndex((p) => p.slug === slug);
  const project = content.projects[index];

  useGSAP(() => {
    if (!project) return;
    gsap.matchMedia().add(motionQuery(), () => {
      gsap.from('.ds-reveal', { y: 40, opacity: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out' });
      gsap.from('.pinout__pin', { scaleX: 0, transformOrigin: 'center', stagger: 0.04, duration: 0.4, delay: 0.5 });
    });
  }, { scope: root, dependencies: [project?.id] });

  if (loading) return <main className="site page ds"><p className="ds-loading">Loading datasheet<span>_</span></p></main>;
  if (error) return <main className="site page ds"><p role="alert" className="ds-loading">{error}</p></main>;
  if (!project) {
    return (
      <main className="site page ds ds-missing">
        <p className="world-kicker">Error 404 · part not found</p>
        <h1 className="page-hero__title">No datasheet for <em>{slug}</em>.</h1>
        <Link to="/projects" className="btn btn-primary">← All projects</Link>
      </main>
    );
  }

  const n = content.projects.length;
  const prev = n > 2 ? content.projects[(index - 1 + n) % n] : null;
  const next = content.projects[(index + 1) % n];
  const part = partNo(index);
  const live = !!project.liveUrl;

  return (
    <main className="site page ds" ref={root} key={project.id}>
      <header className="ds-head">
        <p className="page-hero__crumb ds-reveal">
          <Link to="/">board</Link><span aria-hidden="true">/</span>
          <Link to="/projects">projects</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{project.slug}</span>
          <span className="page-hero__sheet">Datasheet · {part} · Rev {new Date().getFullYear()}</span>
        </p>
        <div className="ds-title-row">
          <div>
            <p className="world-kicker ds-reveal">{project.verticalLabel}</p>
            <Scramble as="h1" text={project.name} className="page-hero__title ds-title" />
          </div>
          <span className="ds-status ds-reveal is-live"><i />In production</span>
        </div>
      </header>

      <div className="ds-grid">
        <div ref={tiltImage} className="ds-screen tilt ds-reveal">
          <div className="ds-screen__bar" aria-hidden="true">
            <span className="ds-dots"><i /><i /><i /></span>
            <span className="ds-url">{live ? host(project.liveUrl) : `${project.slug}.local`}</span>
          </div>
          <div className="ds-screen__view">
            {project.image ? (
              <img src={project.image} alt={`${project.name} screenshot`} />
            ) : (
              <AutoCover project={project} big />
            )}
            <span className="pcard__scan" aria-hidden="true" />
          </div>
        </div>

        <aside className="ds-specs ds-reveal" aria-label="Specifications">
          <h2 className="ds-h">Specifications</h2>
          <dl>
            <div><dt>Part no.</dt><dd>{part}</dd></div>
            <div><dt>Vertical</dt><dd>{project.verticalLabel}</dd></div>
            <div><dt>Stack</dt><dd>{project.tags.join(' · ') || '—'}</dd></div>
            <div><dt>Status</dt><dd className="is-live">Live</dd></div>
            <div><dt>Endpoint</dt><dd>{live ? <a href={project.liveUrl} {...ext(project.liveUrl)}>{host(project.liveUrl)} ↗</a> : 'Internal / campus only'}</dd></div>
            <div><dt>Source</dt><dd>{project.sourceUrl ? <a href={project.sourceUrl} {...ext(project.sourceUrl)}>Repository ↗</a> : 'Private'}</dd></div>
            <div><dt>Built by</dt><dd>Coding Club, BITS Pilani</dd></div>
          </dl>
          <div className="ds-actions">
            {live && <a ref={magLive} href={project.liveUrl} className="btn btn-primary" {...ext(project.liveUrl)}>Open live ↗</a>}
            {project.sourceUrl && <a ref={magSource} href={project.sourceUrl} className="btn" {...ext(project.sourceUrl)}>Source ↗</a>}
          </div>
        </aside>
      </div>

      <div className="ds-grid ds-grid--lower">
        <section className="ds-block ds-reveal">
          <h2 className="ds-h"><span>1.</span> General description</h2>
          <p className="ds-desc">{project.description}</p>
          <h2 className="ds-h"><span>2.</span> Features</h2>
          <ul className="ds-features">
            <li>Designed and maintained by the {project.verticalLabel.replace(' Vertical', '')} vertical</li>
            <li>Built with {project.tags.join(', ')}</li>
            <li>Deployed and in use</li>
          </ul>
        </section>
        <section className="ds-block ds-reveal">
          <h2 className="ds-h"><span>3.</span> Pin configuration</h2>
          <Pinout name={project.name} tags={project.tags} part={part} />
        </section>
      </div>

      {n > 1 && (
        <nav className="ds-nav ds-reveal" aria-label="More projects">
          {prev ? (
            <Link to={`/projects/${prev.slug}`} className="ds-nav__item">
              <span>← Previous part</span><b>{prev.name}</b><small>{prev.verticalLabel}</small>
            </Link>
          ) : <span aria-hidden="true" />}
          <Link to="/projects" className="ds-nav__all">All projects</Link>
          <Link to={`/projects/${next.slug}`} className="ds-nav__item ds-nav__item--next">
            <span>Next part →</span><b>{next.name}</b><small>{next.verticalLabel}</small>
          </Link>
        </nav>
      )}
    </main>
  );
}

export default ProjectDetail;
