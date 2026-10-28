import './index.css';
import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import TextType from './TextType';
import BackgroundText from './randombgtext';


import Projects from './Projects.jsx';
import Admin from './Admin.jsx';
import ProjectDetail from './ProjectDetail.jsx';
import { useContent, todayIST, externalLink } from './content';

import {
  gsap,
  ScrollTrigger,
  useGSAP,
  Background,
  Cursor,
  SiteMenu,
  SectionHead,
  useMagnetic,
  useTilt,
  prefersReduced,
} from './ui';

const HERO_WORDS = ['Coding Club', 'BITS Pilani'];

let hasBooted = false;

/* ---------- Route scroll handling ---------- */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
}

/* ---------- Boot loader (first visit only) ---------- */
function BootLoader({ onDone }) {
  const root = useRef(null);

  useGSAP(() => {
    const fast = prefersReduced();
    const tl = gsap.timeline({ onComplete: onDone });

    tl.from('.boot-line', {
      opacity: 0, x: -14, stagger: fast ? 0.05 : 0.18, duration: 0.25, ease: 'power2.out',
    })
      .to('.boot-bar-fill', { scaleX: 1, duration: fast ? 0.2 : 0.8, ease: 'power3.inOut' }, '<0.2')
      .add(() => {
        if (document.readyState !== 'complete') {
          tl.pause();
          window.addEventListener('load', () => tl.play(), { once: true });
        }
      })
      .to(root.current, {
        clipPath: 'inset(0 0 100% 0)', duration: fast ? 0.2 : 0.8, ease: 'expo.inOut',
      }, '+=0.15');
  }, { scope: root });

  return (
    <div className="boot" ref={root} role="status" aria-label="Loading">
      <div className="boot-box">
        <p className="boot-line"><span>$</span> init coding_club.sys</p>
        <p className="boot-line"><span>$</span> load modules [react, golang, caffeine]</p>
        <p className="boot-line"><span>$</span> compile ideas ........ <b>OK</b></p>
        <p className="boot-line"><span>$</span> welcome, human_</p>
        <div className="boot-bar"><div className="boot-bar-fill" /></div>
      </div>
    </div>
  );
}

function HudClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return <>{now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })} IST</>;
}

/* ---------- Home ---------- */
function Home() {
  const root = useRef(null);
  const [booted, setBooted] = useState(hasBooted);

  const magBulletin = useMagnetic();
  const magProjects = useMagnetic();
  const magSubmit = useMagnetic(0.25);
  const tiltUpcoming = useTilt(6);
  const tiltRunning = useTilt(6);
  const tiltProject = useTilt(6);
  const { content, loading, error } = useContent();
  const [today, setToday] = useState(todayIST);
  useEffect(() => {
    const timer = setInterval(() => setToday(todayIST()), 60000);
    return () => clearInterval(timer);
  }, []);
  const upcoming = content.events.filter((event) => event.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const running = content.events.filter((event) => event.startDate <= today && event.endDate >= today);
  const featured = content.projects.find((project) => project.slug === 'timetable-generator') || content.projects[0];

  useGSAP(() => {
    if (!booted) return;
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Hero intro
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from('.hero-art', { scale: 0.3, opacity: 0, rotate: -30, duration: 1.4 })
        .from('.orbit', { scale: 0, opacity: 0, stagger: 0.1, duration: 1.2 }, '<0.1')
        .from('.hero-title', { yPercent: 60, opacity: 0, filter: 'blur(14px)', duration: 1.2 }, '-=1')
        .from('.hero-tag', { y: 20, opacity: 0, duration: 0.9 }, '-=0.8')
        .from('.hero-actions .btn', { y: 30, opacity: 0, stagger: 0.12, duration: 0.9 }, '-=0.7')
        .from('.hud, .scroll-cue', { opacity: 0, stagger: 0.08, duration: 0.6 }, '-=0.6');

      // Hero drifts out on scroll
      gsap.to('.hero-inner', {
        yPercent: -18,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });

      // Crossing tapes, faster when scrolling
      const loopA = gsap.to('.tape-track-a', { xPercent: -50, ease: 'none', duration: 26, repeat: -1 });
      const loopB = gsap.fromTo('.tape-track-b', { xPercent: -50 }, { xPercent: 0, ease: 'none', duration: 30, repeat: -1 });

      ScrollTrigger.create({
        onUpdate: (self) => {
          const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 350);
          [loopA, loopB].forEach((loop) => {
            gsap.to(loop, {
              timeScale: boost,
              duration: 0.2,
              overwrite: true,
              onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1.2 }),
            });
          });
        },
      });

      // Section lines draw in
      gsap.utils.toArray('.section-line').forEach((line) => {
        gsap.fromTo(line, { scaleX: 0 }, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: line, start: 'top 92%', end: 'top 60%', scrub: true },
        });
      });

      // Generic reveals
      gsap.utils.toArray('.reveal').forEach((el) => {
        gsap.from(el, {
          y: 70,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      gsap.from('.event-card', {
        y: 80,
        opacity: 0,
        stagger: 0.15,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.events-grid', start: 'top 85%' },
      });

      gsap.from('.contact-field, .contact-form .btn', {
        y: 30,
        opacity: 0,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-form', start: 'top 85%' },
      });
    });

    ScrollTrigger.refresh();
  }, { scope: root, dependencies: [booted] });

 

  return (
    <div className="site" id="home" ref={root}>
      {!booted && (
        <BootLoader onDone={() => { hasBooted = true; setBooted(true); }} />
      )}

      <BackgroundText />

      <main>
        {/* ---------- HERO ---------- */}
        <section className="hero">
          <div className="hero-hud" aria-hidden="true">
          
           
            <span className="hud hud-bl"><HudClock /></span>
            
          </div>

          <div className="hero-inner">
            <div className="hero-art-wrap">
              <span className="orbit" />
            
              <img className="hero-art" src="/cc-mark.png" alt="Coding Club cube mark with code brackets" />
            </div>

            <h1 className="hero-title">
              <TextType
                as="span"
                text={HERO_WORDS}
                typingSpeed={90}
                pauseDuration={1600}
                deletingSpeed={55}
                deleteMode="backspace"
                typeEffect="fade"
                mistakes={0}
                cursorStyle="underscore"
                cursorGlide
                showCursor
                cursorColor="#d4ff3a"
                cursorBlinkDuration={0.5}
              />
            </h1>

            <p className="hero-tag"><span>&gt;_</span> build. break.</p>

            <div className="hero-actions">
              <a ref={magBulletin} href="#bulletin" className="btn btn-primary">
                View Bulletin
              </a>
              <Link ref={magProjects} to="/projects" className="btn">
                Explore Projects <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

        
        </section>

        {/* ---------- TAPES ---------- */}
       

        {/* ---------- BULLETIN ---------- */}
        <section id="bulletin" className="section">
          <SectionHead index="01" title="Latest Updates" />
          <div className="panel corners reveal">
            {loading && <p className="result-count">Loading updates...</p>}
            {error && <p className="result-count" role="alert">{error}</p>}
            {!loading && !error && content.bulletins.length === 0 && <p>No updates yet.</p>}
            {content.bulletins.map((entry) => (
              <details key={entry.id} className="bulletin-drop">
                <summary><span className="chip chip-solid">NEW</span> {entry.title}</summary>
                <p>{entry.description}</p>
                {entry.image && <img src={entry.image} alt={`${entry.title} preview`} loading="lazy" />}
                {entry.links.map((link, i) => (
                  <p key={i}>
                    <a href={link.url} className="text-link"
                      target={externalLink(link.url) ? '_blank' : undefined}
                      rel={externalLink(link.url) ? 'noopener noreferrer' : undefined}>
                      {link.label}
                    </a>
                  </p>
                ))}
              </details>
            ))}
          </div>
        </section>

        {/* ---------- EVENTS ---------- */}
        <section className="section">
          <SectionHead index="02" title="Events" />
          <div className="events-grid">
            <div ref={tiltUpcoming} className="event-card tilt">
              <div className="event-card-head">
                <h3>Upcoming Events</h3><span className="chip">queued</span>
              </div>
              <div className="event-items" style={{ flexWrap: 'wrap' }}>
                {upcoming.length === 0 && <div className="event-item">No upcoming events</div>}
                {upcoming.map((event) => (
                  <div className="event-item" key={event.id} style={{ minWidth: 180 }}>
                    <div>
                      <strong>{event.name}</strong>
                      <p>{event.startDate} – {event.endDate}</p>
                      <p>{event.description}</p>
                      {event.image && <img src={event.image} alt="" loading="lazy" />}
                      {event.link && <a className="text-link" href={event.link}
                        target={externalLink(event.link) ? '_blank' : undefined}
                        rel={externalLink(event.link) ? 'noopener noreferrer' : undefined}>Event details ↗</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div ref={tiltRunning} className="event-card tilt">
              <div className="event-card-head">
                <h3>Running Events</h3>
                <span className="chip chip-live"><i className="pulse" /> live</span>
              </div>
              <div className="event-items" style={{ flexWrap: 'wrap' }}>
                {running.length === 0 && <div className="event-item">No running events</div>}
                {running.map((event) => (
                  <div className="event-item" key={event.id} style={{ minWidth: 180 }}>
                    <div>
                      <strong>{event.name}</strong>
                      <p>{event.startDate} – {event.endDate}</p>
                      <p>{event.description}</p>
                      {event.image && <img src={event.image} alt="" loading="lazy" />}
                      {event.link && <a className="text-link" href={event.link}
                        target={externalLink(event.link) ? '_blank' : undefined}
                        rel={externalLink(event.link) ? 'noopener noreferrer' : undefined}>Event details ↗</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- PROJECTS ---------- */}
        <section id="projects" className="section">
          <SectionHead index="03" title="Projects" />
          {featured ? (
            <article ref={tiltProject} className="listing-card tilt reveal">
              <div className="listing-image">
                {featured.image ? (
                  <img src={featured.image} alt={`${featured.name} preview`} loading="lazy" />
                ) : (
                  <><span className="listing-scan" aria-hidden="true" />
                  <span className="listing-image-text">{featured.name}</span></>
                )}
              </div>
              <div className="listing-content">
                <p className="listing-vertical">{featured.verticalLabel}</p>
                <h2>{featured.name}</h2>
                <div className="language-container">
                  {featured.tags.map((tag) => <span className="language-box" key={tag}>{tag}</span>)}
                </div>
                <p className="listing-description">
                  {featured.description}
                  <Link to={`/projects/${featured.slug}`} className="listing-link">View Project →</Link>
                </p>
              </div>
            </article>
          ) : <div className="panel">{loading ? 'Loading projects...' : 'No projects yet.'}</div>}
          <p><Link to="/projects" className="listing-link">Explore all projects →</Link></p>
        </section>

        {/* ---------- CONTACT ---------- */}
        <section id="contact" className="section">
          <SectionHead index="04" title="Contact Us" />
          <form className="panel corners contact-form" onSubmit={(e) => e.preventDefault()}>
            <div className="contact-field">
              <label htmlFor="contact-name">Name</label>
              <input type="text" id="contact-name" placeholder="Your name" />
            </div>
            <div className="contact-field">
              <label htmlFor="contact-email">Email</label>
              <input type="email" id="contact-email" placeholder="Your email address" />
            </div>
            <div className="contact-field contact-field-full">
              <label htmlFor="contact-description">Description</label>
              <textarea id="contact-description" placeholder="Write your message..." rows="5" />
            </div>
            <button ref={magSubmit} type="button" className="btn btn-primary">
              Submit <span aria-hidden="true">↗</span>
            </button>
          </form>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Coding Club, BITS Pilani</span>
       
      </footer>
    </div>
  );
}

/* ---------- App ---------- */
function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Background />
      <Cursor />
      <SiteMenu />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/Project-pages/Timetable-generator" element={<Navigate to="/projects/timetable-generator" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;