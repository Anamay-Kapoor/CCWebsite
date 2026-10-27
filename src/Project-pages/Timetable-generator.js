import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP, useMagnetic, useTilt, Scramble, prefersReduced } from '../ui';
import './projects.css';

const PROJECT = {
  name: 'TimeTable Generator',
  vertical: 'WebDev Vertical',
  stack: ['React', 'Golang'],
  description: "Coding Club's Time Table Generator.",
  image: null, // e.g. '/timetable-preview.png'
  liveUrl: 'projecturl', // TODO: replace
  sourceUrl: 'githuburl', // TODO: replace
};

function TimeTableGen() {
  const root = useRef(null);
  const magLive = useMagnetic();
  const magSource = useMagnetic();
  const tiltImage = useTilt(5);

  useGSAP(() => {
    if (prefersReduced()) return;
    gsap.from('.detail-reveal', {
      y: 50, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
    });
  }, { scope: root });

  return (
    <div className="detail-page" ref={root}>
      <div className="page-topbar detail-reveal">
        <Link to="/projects" className="back-link">← All Projects</Link>
        <span className="page-crumb">~/projects/timetable-generator</span>
      </div>

      <header className="detail-header">
        <p className="eyebrow detail-reveal">{PROJECT.vertical}</p>
        <Scramble as="h1" text={PROJECT.name} className="detail-title" />
        <div className="language-container detail-reveal">
          {PROJECT.stack.map((s) => (
            <span className="language-box" key={s}>{s}</span>
          ))}
        </div>
      </header>

      <div className="detail-grid">
        <section className="panel corners detail-panel detail-reveal">
          <h2 className="detail-subtitle">Project Details</h2>
          <p className="detail-description">{PROJECT.description}</p>

          <dl className="detail-meta">
            <div><dt>Vertical</dt><dd>{PROJECT.vertical}</dd></div>
            <div><dt>Stack</dt><dd>{PROJECT.stack.join(' + ')}</dd></div>
            <div><dt>Built by</dt><dd>Coding Club, BITS Pilani</dd></div>
          </dl>
        </section>

        <div ref={tiltImage} className="detail-image tilt detail-reveal">
          {PROJECT.image ? (
            <img src={PROJECT.image} alt={`${PROJECT.name} preview`} />
          ) : (
            <>
              <span className="listing-scan" aria-hidden="true" />
              <span className="detail-image-text">preview coming soon_</span>
            </>
          )}
        </div>
      </div>

      <div className="detail-actions detail-reveal">
        <a ref={magLive} href={PROJECT.liveUrl} className="btn btn-primary" target="_blank" rel="noreferrer">
          Live Project ↗
        </a>
        <a ref={magSource} href={PROJECT.sourceUrl} className="btn" target="_blank" rel="noreferrer">
          Source Code ↗
        </a>
      </div>
    </div>
  );
}

export default TimeTableGen;