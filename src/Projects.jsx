import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import TextType from './TextType';
import { gsap, useGSAP, useTilt, prefersReduced } from './ui';
import { useContent } from './content';

const PROJECT_WORDS = ['AI/ML', 'WebDev', 'GameDev'];

function ProjectCard({ project, index }) {
  const tilt = useTilt(6);

  return (
    <article ref={tilt} className="listing-card tilt">
      <div className="listing-image">
        {project.image ? (
          <img src={project.image} alt={`${project.name} preview`} loading="lazy" />
        ) : (
          <span className="listing-image-text">{project.name}</span>
        )}
        <span className="listing-index">{String(index + 1).padStart(2, '0')}</span>
      </div>

      <div className="listing-content">
        <p className="listing-vertical">{project.verticalLabel}</p>
        <h2>{project.name}</h2>
        <div className="language-container">
          {project.tags.map((tag) => (
            <span className="language-box" key={tag}>{tag}</span>
          ))}
        </div>
        <p className="listing-description">
          {project.description}
          <Link to={`/projects/${project.slug}`} className="listing-link">View Project →</Link>
        </p>
      </div>
    </article>
  );
}

function Projects() {
  const root = useRef(null);
  const [search, setSearch] = useState('');
  const [vertical, setVertical] = useState('all');
  const { content, loading, error } = useContent();

  const query = search.trim().toLowerCase();
  const filtered = content.projects.filter((p) => {
    const text = [p.name, p.description, p.verticalLabel, ...p.tags].join(' ').toLowerCase();
    return text.includes(query) && (vertical === 'all' || p.vertical === vertical);
  });
  const resultKey = filtered.map((p) => p.id).join('|');

  useGSAP(() => {
    if (prefersReduced()) return;
    gsap.from('.projects-header > *', {
      y: 40, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
    });
    gsap.from('.project-controls', {
      y: 30, opacity: 0, duration: 0.8, delay: 0.3, ease: 'power3.out',
    });
  }, { scope: root });

  useGSAP(() => {
    if (prefersReduced()) return;
    gsap.from('.listing-card', {
      y: 40, opacity: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out',
    });
  }, { scope: root, dependencies: [resultKey] });

  return (
    <div className="projects-page" ref={root}>
      <header className="projects-header">
        <div className="page-topbar">
          <Link to="/" className="back-link">← Home</Link>
          <span className="page-crumb">~/coding-club/projects</span>
        </div>
        <p className="eyebrow">{'//'} showcase</p>
        <h1 className="projects-title">
          Our projects from{' '}
          <span className="accent-text">
            <TextType
              as="span"
              text={PROJECT_WORDS}
              typingSpeed={60}
              pauseDuration={1500}
              deletingSpeed={80}
              deleteMode="backspace"
              typeEffect="fade"
              mistakes={0}
              cursorStyle="underscore"
              cursorGlide
              showCursor
              cursorColor="#d4ff3a"
              cursorBlinkDuration={0.5}
            />
          </span>
        </h1>
      </header>
      <main className="projects-main">
        <div className="project-controls">
          <input
            type="search" placeholder="search projects..." aria-label="Search projects"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          <select aria-label="Filter by vertical" value={vertical} onChange={(e) => setVertical(e.target.value)}>
            <option value="all">All Verticals</option>
            <option value="webdev">WebDev</option>
            <option value="ai-ml">AI / ML</option>
            <option value="gamedev">GameDev</option>
          </select>
        </div>
        <p className="result-count">showing <b>{filtered.length}</b> / {content.projects.length}</p>
        {loading && <p className="result-count">Loading projects...</p>}
        {error && <p role="alert" className="result-count">{error}</p>}
        <section className="project-grid">
          {filtered.map((project, i) => <ProjectCard key={project.id} project={project} index={i} />)}
          {!loading && !error && filtered.length === 0 && (
            <p className="empty-projects">
              No projects match your search. <span>{'//'} try another keyword</span>
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

export default Projects;
