import React, { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gsap, useGSAP, useMagnetic, useTilt, Scramble, prefersReduced } from './ui';
import { useContent, externalLink } from './content';
import './Project-pages/projects.css';

function ProjectDetail() {
  const { slug } = useParams();
  const root = useRef(null);
  const magLive = useMagnetic();
  const magSource = useMagnetic();
  const tiltImage = useTilt(5);
  const { content, loading, error } = useContent();
  const project = content.projects.find((p) => p.slug === slug);

  useGSAP(() => {
    if (!project || prefersReduced()) return;
    gsap.from('.detail-reveal', {
      y: 50, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
    });
  }, { scope: root, dependencies: [project?.id] });

  if (loading) return <main className="detail-page">Loading project...</main>;
  if (error) return <main className="detail-page" role="alert">{error}</main>;
  if (!project) return (
    <main className="detail-page">
      <h1>Project not found</h1>
      <Link to="/projects" className="back-link">← All Projects</Link>
    </main>
  );

  return (
    <div className="detail-page" ref={root}>
      <div className="page-topbar detail-reveal">
        <Link to="/projects" className="back-link">← All Projects</Link>
        <span className="page-crumb">~/projects/{project.slug}</span>
      </div>

      <header className="detail-header">
        <p className="eyebrow detail-reveal">{project.verticalLabel}</p>
        <Scramble as="h1" text={project.name} className="detail-title" />
        <div className="language-container detail-reveal">
          {project.tags.map((tag) => (
            <span className="language-box" key={tag}>{tag}</span>
          ))}
        </div>
      </header>

      <div className="detail-grid">
        <section className="panel corners detail-panel detail-reveal">
          <h2 className="detail-subtitle">Project Details</h2>
          <p className="detail-description">{project.description}</p>
          <dl className="detail-meta">
            <div><dt>Vertical</dt><dd>{project.verticalLabel}</dd></div>
            <div><dt>Stack</dt><dd>{project.tags.join(' + ') || '—'}</dd></div>
          </dl>
        </section>
        <div ref={tiltImage} className="detail-image tilt detail-reveal">
          {project.image ? (
            <img src={project.image} alt={`${project.name} preview`} />
          ) : (
            <>
              <span className="listing-scan" aria-hidden="true" />
              <span className="detail-image-text">preview coming soon_</span>
            </>
          )}
        </div>
      </div>

      <div className="detail-actions detail-reveal">
        {project.liveUrl && (
          <a ref={magLive} href={project.liveUrl} className="btn btn-primary"
            target={externalLink(project.liveUrl) ? '_blank' : undefined}
            rel={externalLink(project.liveUrl) ? 'noopener noreferrer' : undefined}>
            Live Project ↗
          </a>
        )}
        {project.sourceUrl && (
          <a ref={magSource} href={project.sourceUrl} className="btn"
            target={externalLink(project.sourceUrl) ? '_blank' : undefined}
            rel={externalLink(project.sourceUrl) ? 'noopener noreferrer' : undefined}>
            Source Code ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
