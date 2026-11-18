import './index.css';
import './hud/hud.css';
import './pages/pages.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import BackgroundText from './randombgtext';
import Projects from './Projects.jsx';
import Admin from './admin/Admin.jsx';
import ProjectDetail from './ProjectDetail.jsx';
import Join from './pages/Join.jsx';
import Vertical from './pages/Vertical.jsx';
import { useContent, todayIST } from './content';
import WorldHero from './world/WorldHero';
import HomeSections from './home/HomeSections';
import { HudProvider, useHud } from './hud/HudContext';
import HudTop from './hud/HudTop';
import StatusBar from './hud/StatusBar';
import Crosshair from './hud/Crosshair';
import CommandPalette from './hud/CommandPalette';
import Intro from './hud/Intro';
import { CLUB, STACK } from './data/club';
import {
  BulletinList, EventsBoard, EventKinds, ProjectList, StackList, JoinSummary, ContactBlock, ContactForm, PastEvents,
} from './sections';
import { gsap, ScrollTrigger, useGSAP, Background } from './ui';

let hasBooted = false;

/* ---------- Route scroll handling ---------- */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);
  return null;
}

/* Red scan-line wipe between routes (skipped on first load). */
function RouteWipe() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setN((k) => k + 1);
  }, [pathname]);
  return n ? <div key={n} className="route-wipe" aria-hidden="true" /> : null;
}

function Toast() {
  const { toast } = useHud();
  return (
    <div className={`hud-toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
      {toast?.text}
    </div>
  );
}

/* ---------- Footer with the motto marquee ---------- */
function SiteFooter() {
  const { copyEmail } = useHud();
  const motto = (
    <span className="footer-motto__item">
      {CLUB.fullName} · {CLUB.place} — {new Date().getFullYear()}
      <b>Build. Break. Try to fix. <em>Repeat.</em></b>
      <i>— {CLUB.mottoSig}</i>
    </span>
  );
  return (
    <footer className="site-footer">
      <div className="footer-motto" aria-hidden="true">
        <div className="footer-motto__track">{motto}{motto}{motto}{motto}</div>
      </div>
      <div className="site-footer__grid">
        <div>
          <p className="site-footer__brand">{CLUB.fullName}</p>
          <p className="site-footer__line">{CLUB.footerLine}</p>
        </div>
        <nav aria-label="Footer">
          <p className="hud-label">Quick links</p>
          <Link to="/">The board</Link>
          <Link to="/projects">Projects</Link>
          <Link to="/join">Join us</Link>
          <Link to="/?place=events">Events</Link>
          <Link to="/?place=bulletin">Updates</Link>
        </nav>
        <div>
          <p className="hud-label">Contact</p>
          <button type="button" className="site-footer__mail" onClick={copyEmail}>{CLUB.email}</button>
          <a href={CLUB.instagram.url} target="_blank" rel="noreferrer">Instagram {CLUB.instagram.handle} ↗</a>
        </div>
      </div>
      <div className="site-footer__base">
        <span>© {new Date().getFullYear()} {CLUB.fullName}. All rights reserved.</span>
        <span className="footer-mono">&gt;_ build. break. try to fix. repeat</span>
      </div>
    </footer>
  );
}

/* ---------- Home ---------- */
function Home() {
  const root = useRef(null);
  const [booted, setBooted] = useState(hasBooted);
  const worldReady = useRef(false);
  const markReady = useCallback(() => { worldReady.current = true; }, []);
  const { content, loading, error } = useContent();
  const [today, setToday] = useState(todayIST);

  useEffect(() => {
    const timer = setInterval(() => setToday(todayIST()), 60000);
    return () => clearInterval(timer);
  }, []);

  const upcoming = content.events.filter((e) => e.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const running = content.events.filter((e) => e.startDate <= today && e.endDate >= today);
  const past = content.events.filter((e) => e.endDate < today).sort((a, b) => b.endDate.localeCompare(a.endDate));
  const counts = useMemo(() => ({
    projects: content.projects.length, bulletins: content.bulletins.length, upcoming: upcoming.length, running: running.length,
  }), [content.projects.length, content.bulletins.length, upcoming.length, running.length]);

  useEffect(() => {
    document.documentElement.classList.toggle('is-intro', !booted);
    return () => document.documentElement.classList.remove('is-intro');
  }, [booted]);

  useGSAP(() => {
    if (!booted) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from('.world-intro > *', { y: 40, opacity: 0, stagger: 0.08, duration: 1.1 }, 0.35)
        .from('.world-sheet, .world-places__head, .world-progress-bar, .world-places li, .world-places__keys, .world-scroll', {
          y: 14, opacity: 0, stagger: 0.05, duration: 0.8,
        }, 0.5)
        .from(document.querySelectorAll('.hud-top > *'), { y: -20, opacity: 0, stagger: 0.08, duration: 0.8 }, 0.2);

      const loopA = gsap.to('.tape-track-a', { xPercent: -50, ease: 'none', duration: 26, repeat: -1 });
      const loopB = gsap.fromTo('.tape-track-b', { xPercent: -50 }, { xPercent: 0, ease: 'none', duration: 30, repeat: -1 });
      ScrollTrigger.create({
        onUpdate: (self) => {
          const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 350);
          [loopA, loopB].forEach((loop) => {
            gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1.2 }) });
          });
        },
      });

      gsap.utils.toArray('.section-line').forEach((line) => {
        gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 92%', end: 'top 60%', scrub: true } });
      });
      gsap.utils.toArray('.site > main .reveal').forEach((el) => {
        gsap.from(el, { y: 70, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      // The bus trace down the left fills as you scroll; each section's node lights when reached.
      const rail = root.current.querySelector('.hsecs__rail');
      ScrollTrigger.create({
        trigger: '.hsecs', start: 'top 65%', end: 'bottom 65%', scrub: true,
        onUpdate: (self) => rail?.style.setProperty('--rail', self.progress.toFixed(4)),
      });
      gsap.utils.toArray('.hsec').forEach((sec) => {
        ScrollTrigger.create({ trigger: sec, start: 'top 65%', toggleClass: 'is-lit' });
      });
      gsap.fromTo('.site > main .ptrace__line i', { scaleX: 0 }, {
        scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.site > main .ptrace', start: 'top 80%', end: 'bottom 60%', scrub: true },
      });
    });
    ScrollTrigger.refresh();
  }, { scope: root, dependencies: [booted] });

  const tapeWords = [...STACK, ...STACK];

  const renderPanel = (id) => {
    switch (id) {
      case 'bulletin': return <BulletinList content={content} loading={loading} error={error} />;
      case 'events': return (
        <>
          <EventsBoard upcoming={upcoming} running={running} />
          {past.length > 0 && (
            <>
              <h5 className="panel-sub">Past events</h5>
              <PastEvents events={past} />
            </>
          )}
          <h5 className="panel-sub">What we run</h5>
          <EventKinds />
        </>
      );
      case 'projects': return <ProjectList projects={content.projects} loading={loading} />;
      case 'stack': return <StackList />;
      case 'join': return <JoinSummary />;
      case 'contact': return (
        <>
          <ContactBlock />
          <h5 className="panel-sub">Or send a message</h5>
          <ContactForm idPrefix="panel-contact" />
        </>
      );
      default: return null;
    }
  };

  return (
    <div className="site" id="home" ref={root}>
      {!booted && <Intro isReady={() => worldReady.current} onDone={() => { hasBooted = true; setBooted(true); }} />}

      <BackgroundText />

      <WorldHero
        booted={booted}
        onReady={markReady}
        renderPanel={renderPanel}
        counts={counts}
        latestTitle={content.bulletins[0]?.title}
      />

      <main>
        <div className="tape-zone" aria-hidden="true">
          <div className="tape tape-dark">
            <div className="tape-track tape-track-b">{tapeWords.map((w, i) => <span key={i}>{w} /</span>)}</div>
          </div>
          <div className="tape tape-accent">
            <div className="tape-track tape-track-a">{tapeWords.map((w, i) => <span key={i}>{w} ✦</span>)}</div>
          </div>
        </div>

        <HomeSections content={content} loading={loading} error={error} upcoming={upcoming} running={running} past={past} />
      </main>
    </div>
  );
}

/* ---------- App ---------- */
function Shell() {
  const { pathname } = useLocation();
  const admin = pathname.startsWith('/admin');
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollManager />
      {!admin && <RouteWipe />}
      <Background />
      {!admin && <Crosshair />}
      {!admin && <HudTop />}
      <div id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/join" element={<Join />} />
          <Route path="/verticals/:id" element={<Vertical />} />
          <Route path="/recruitment" element={<Navigate to="/join" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/Project-pages/Timetable-generator" element={<Navigate to="/projects/timetable-generator" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!admin && <SiteFooter />}
      {!admin && <StatusBar />}
      <CommandPalette />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <HudProvider>
        <Shell />
      </HudProvider>
    </BrowserRouter>
  );
}
