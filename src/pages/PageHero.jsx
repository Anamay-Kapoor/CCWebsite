import React, { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP, motionQuery } from '../ui';
import { useHud } from '../hud/HudContext';
import { LogoMark } from '../hud/HudTop';

const PartViewer = lazy(() => import('../world/PartViewer'));

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

/* CAD-style viewport framing a live 3D part. Drag to rotate. */
export function Viewport({ kind, refdes, caption }) {
  const { motionOn } = useHud();
  const box = useRef(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [gl] = useState(hasWebGL);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '120px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  const fallback = (
    <div className="viewport-fallback" aria-hidden="true">
      <LogoMark />
    </div>
  );

  return (
    <figure className={`viewport${ready || !gl ? ' is-ready' : ''}`} ref={box}>
      <div className="viewport-stage">
        {gl ? (
          <Boundary fallback={fallback} onFail={() => setReady(true)}>
            <Suspense fallback={null}>
              {inView || ready ? (
                <PartViewer kind={kind} running={inView} motionOn={motionOn} onReady={() => setReady(true)} />
              ) : null}
            </Suspense>
          </Boundary>
        ) : fallback}
        <div className="viewport-scan" aria-hidden="true" />
      </div>
      <i className="vp-corner vp-corner--tl" /><i className="vp-corner vp-corner--tr" />
      <i className="vp-corner vp-corner--bl" /><i className="vp-corner vp-corner--br" />
      <div className="viewport-hud viewport-hud--top" aria-hidden="true">
        <span><b>●</b> VIEWPORT · ISO</span>
        <span>{refdes}</span>
      </div>
      <div className="viewport-hud viewport-hud--bottom" aria-hidden="true">
        <span className="viewport-axes"><i className="ax-x">X</i><i className="ax-y">Y</i><i className="ax-z">Z</i></span>
        <span>drag to rotate</span>
      </div>
      {caption && <figcaption className="sr-only">{caption}</figcaption>}
    </figure>
  );
}

/*
 * Header shared by the inner pages: breadcrumb, sheet number, title,
 * lede, stats, actions, and a live 3D viewport on the right.
 */
export default function PageHero({ sheet, crumb, kicker, title, lede, stats = [], actions, part, refdes, children }) {
  const root = useRef(null);

  useGSAP(() => {
    gsap.matchMedia().add(motionQuery(), () => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from('.page-hero__copy > *', { y: 36, opacity: 0, stagger: 0.07, duration: 1 }, 0.05)
        .from('.viewport', { opacity: 0, scale: 0.96, duration: 1.1 }, 0.15)
        .from('.page-hero__rule', { scaleX: 0, duration: 1.2, ease: 'expo.inOut' }, 0);
    });
  }, { scope: root });

  return (
    <header className={`page-hero${part ? '' : ' page-hero--flat'}`} ref={root}>
      <div className="page-hero__rule" aria-hidden="true" />
      <div className="page-hero__copy">
        <p className="page-hero__crumb">
          <Link to="/">board</Link>
          {crumb.map((c) => (
            <React.Fragment key={c.label}>
              <span aria-hidden="true">/</span>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </React.Fragment>
          ))}
          <span className="page-hero__sheet">{sheet}</span>
        </p>
        <p className="world-kicker">{kicker}</p>
        <h1 className="page-hero__title">{title}</h1>
        {lede && <p className="page-hero__lede">{lede}</p>}
        {stats.length > 0 && (
          <div className="join-stats page-hero__stats">
            {stats.map((s) => <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>)}
          </div>
        )}
        {actions && <div className="join-cta">{actions}</div>}
        {children}
      </div>
      {part && <Viewport kind={part} refdes={refdes} caption={`3D model of the ${refdes} part`} />}
    </header>
  );
}
