import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMagnetic, useTilt } from './ui';
import { externalLink } from './content';
import {
  CLUB, WHY_JOIN, PROCESS, ROLE_GROUPS, FAQ, EVENT_KINDS, VERTICALS, STACK, JOIN_PITCH, TEAM_COUNT,
} from './data/club';
import { useHud } from './hud/HudContext';

/*
 * Section bodies shared by the scrolling page, the 3D board's panels and /join.
 * `reveal` adds the scroll-reveal class; leave it off inside the panel,
 * where ScrollTrigger never fires and the element would stay hidden.
 */

export { STACK as STACK_WORDS };

const linkProps = (url) => (externalLink(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {});

function SmartLink({ to, className, children }) {
  if (externalLink(to) || to.startsWith('mailto:')) {
    return <a href={to} className={className} {...linkProps(to)}>{children}</a>;
  }
  return <Link to={to} className={className}>{children}</Link>;
}

/* ---------------- Bulletin ---------------- */
export function BulletinList({ content, loading, error, reveal = false }) {
  return (
    <div className={`panel corners${reveal ? ' reveal' : ''}`}>
      {loading && <p className="result-count">Loading updates...</p>}
      {error && <p className="result-count" role="alert">{error}</p>}
      {!loading && !error && content.bulletins.length === 0 && <p>No updates yet.</p>}
      {content.bulletins.map((entry, i) => (
        <details key={entry.id} className="bulletin-drop" open={i === 0}>
          <summary><span className="chip chip-solid">{i === 0 ? 'NEW' : 'POST'}</span> {entry.title}</summary>
          <p>{entry.description}</p>
          {entry.image && <img src={entry.image} alt={`${entry.title} preview`} loading="lazy" />}
          {entry.links.length > 0 && (
            <p className="bulletin-links">
              {entry.links.map((link) => (
                <SmartLink key={link.url} to={link.url} className="text-link">{link.label}</SmartLink>
              ))}
            </p>
          )}
        </details>
      ))}
    </div>
  );
}

/* ---------------- Events ---------------- */
function EventItem({ event }) {
  return (
    <div className="event-item" style={{ minWidth: 180 }}>
      <div>
        <strong>{event.name}</strong>
        <p>{event.startDate} – {event.endDate}</p>
        <p>{event.description}</p>
        {event.image && <img src={event.image} alt="" loading="lazy" />}
        {event.link && <a className="text-link" href={event.link} {...linkProps(event.link)}>Event details ↗</a>}
      </div>
    </div>
  );
}

function EventCard({ title, chip, events, empty }) {
  const tilt = useTilt(6);
  return (
    <div ref={tilt} className="event-card tilt">
      <div className="event-card-head"><h3>{title}</h3>{chip}</div>
      <div className="event-items" style={{ flexWrap: 'wrap' }}>
        {events.length === 0 && <div className="event-item">{empty}</div>}
        {events.map((event) => <EventItem key={event.id} event={event} />)}
      </div>
    </div>
  );
}

export function EventsBoard({ upcoming, running }) {
  return (
    <div className="events-grid">
      <EventCard title="Upcoming Events" chip={<span className="chip">queued</span>} events={upcoming} empty="No upcoming events" />
      <EventCard
        title="Running Events"
        chip={<span className="chip chip-live"><i className="pulse" /> live</span>}
        events={running}
        empty="No running events"
      />
    </div>
  );
}

const fmtDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/* Archive of finished events, newest first. */
export function PastEvents({ events }) {
  return (
    <ul className="past-events">
      {events.map((e) => (
        <li key={e.id} className={`past-event${e.image ? ' has-img' : ''}`}>
          {e.image && (
            <div className="past-event__img">
              <img src={e.image} alt={`${e.name}`} loading="lazy" />
            </div>
          )}
          <span className="past-event__date">{fmtDate(e.startDate)}{e.endDate !== e.startDate ? ` – ${fmtDate(e.endDate)}` : ''}</span>
          <div>
            <h4>{e.name}</h4>
            <p>{e.description}</p>
            {e.link && <a className="text-link" href={e.link} {...linkProps(e.link)}>Event page ↗</a>}
          </div>
          <span className="past-event__tag">Done</span>
        </li>
      ))}
    </ul>
  );
}

export function EventKinds() {
  return (
    <div className="kind-grid">
      {EVENT_KINDS.map((k, i) => (
        <div className="kind-card" key={k.name}>
          <span className="kind-index">{String(i + 1).padStart(2, '0')}</span>
          <h4>{k.name}</h4>
          <p>{k.note}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Projects ---------------- */
export function FeaturedProject({ featured, loading, reveal = false }) {
  const tilt = useTilt(6);
  return (
    <>
      {featured ? (
        <article ref={tilt} className={`listing-card tilt${reveal ? ' reveal' : ''}`}>
          <div className="listing-image">
            {featured.image ? (
              <img src={featured.image} alt={`${featured.name} preview`} loading="lazy" />
            ) : (
              <><span className="listing-scan" aria-hidden="true" /><span className="listing-image-text">{featured.name}</span></>
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
    </>
  );
}

export function ProjectList({ projects, loading }) {
  if (loading) return <p className="result-count">Loading projects...</p>;
  if (!projects.length) return <p className="result-count">No projects yet.</p>;
  return (
    <div className="mini-projects">
      <div className="pbar">
        <span>{projects.length} project{projects.length === 1 ? '' : 's'}</span>
        <Link to="/projects" className="btn btn-primary pbar__btn">All projects →</Link>
      </div>
      {projects.map((p, i) => (
        <article className="mini-project" key={p.id}>
          <div className="mini-project__img">
            {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span>{p.name}</span>}
            <b>{String(i + 1).padStart(2, '0')}</b>
          </div>
          <div className="mini-project__body">
            <p className="listing-vertical">{p.verticalLabel}</p>
            <h4>{p.name}</h4>
            <p>{p.description}</p>
            <div className="language-container">
              {p.tags.slice(0, 4).map((tag) => <span className="language-box" key={tag}>{tag}</span>)}
            </div>
            <div className="mini-project__links">
              <Link to={`/projects/${p.slug}`} className="text-link">Details →</Link>
              {p.liveUrl && <a className="text-link" href={p.liveUrl} {...linkProps(p.liveUrl)}>Live ↗</a>}
              {p.sourceUrl && <a className="text-link" href={p.sourceUrl} {...linkProps(p.sourceUrl)}>Source ↗</a>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/* ---------------- Verticals / stack ---------------- */
export function StackList() {
  return (
    <div className="stack-list">
      <div className="stack-verticals">
        {VERTICALS.map((v, i) => (
          <Link to={`/verticals/${v.id}`} className="stack-vertical" key={v.name}>
            <span className="stack-index">{String(i + 1).padStart(2, '0')}</span>
            <h3>{v.name}</h3>
            <p>{v.note}</p>
            <span className="vert__go">Meet the team →</span>
          </Link>
        ))}
      </div>
      <div className="language-container">
        {STACK.map((w) => <span className="language-box" key={w}>{w}</span>)}
      </div>
    </div>
  );
}

/* ---------------- Join ---------------- */
const WHY_ICONS = [
  <svg viewBox="0 0 24 24" key="c"><circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="17" r="2.5" /><path d="M8 8.5 10.5 15M16 8.5 13.5 15M8.5 7h7" /></svg>,
  <svg viewBox="0 0 24 24" key="s"><rect x="6" y="6" width="12" height="12" rx="1.5" /><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></svg>,
  <svg viewBox="0 0 24 24" key="o"><path d="M7 17 17 7M9 7h8v8" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
];

export function WhyJoin({ reveal = false, icons = true }) {
  return (
    <div className={`why-grid${icons ? ' why-grid--icons' : ''}`}>
      {WHY_JOIN.map((w, i) => (
        <div className={`why-card${reveal ? ' reveal' : ''}`} key={w.title}>
          {icons && <span className="why-card__icon" aria-hidden="true">{WHY_ICONS[i]}</span>}
          <span className="kind-index">{String(i + 1).padStart(2, '0')}</span>
          <h4>{w.title}</h4>
          <p>{w.body}</p>
        </div>
      ))}
    </div>
  );
}

/* Recruitment steps as nodes on a trace (the line fill is scrubbed by the page). */
export function ProcessTrace({ reveal = false }) {
  return (
    <ol className="ptrace">
      <span className="ptrace__line" aria-hidden="true"><i /></span>
      {PROCESS.map((s, i) => (
        <li key={s.title} className={`ptrace__step${reveal ? ' reveal' : ''}`}>
          <span className="ptrace__node">{String(i + 1).padStart(2, '0')}</span>
          <h4>{s.title}</h4>
          <p>{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function ProcessSteps() {
  return (
    <ol className="process">
      {PROCESS.map((s, i) => (
        <li key={s.title}>
          <span className="process__n">{i + 1}</span>
          <div>
            <h4>{s.title}</h4>
            <p>{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RoleTabs() {
  const [tab, setTab] = useState(ROLE_GROUPS[0].id);
  const base = useId();
  const group = ROLE_GROUPS.find((g) => g.id === tab);
  const onKey = (e) => {
    const i = ROLE_GROUPS.findIndex((g) => g.id === tab);
    if (e.key === 'ArrowRight') setTab(ROLE_GROUPS[(i + 1) % ROLE_GROUPS.length].id);
    if (e.key === 'ArrowLeft') setTab(ROLE_GROUPS[(i - 1 + ROLE_GROUPS.length) % ROLE_GROUPS.length].id);
  };
  return (
    <div className="roles">
      <div className="roles__tabs" role="tablist" aria-label="Teams" onKeyDown={onKey}>
        {ROLE_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            id={`${base}-tab-${g.id}`}
            aria-selected={g.id === tab}
            aria-controls={`${base}-panel`}
            tabIndex={g.id === tab ? 0 : -1}
            className={g.id === tab ? 'is-active' : ''}
            onClick={() => setTab(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="roles__panel" role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${tab}`}>
        {group.teams.map((t) => (
          <article className="role-card" key={t.name}>
            <h4>{t.name}</h4>
            <p className="role-card__sum">{t.summary}</p>
            <ul>{t.duties.map((d) => <li key={d}>{d}</li>)}</ul>
            <div className="language-container">
              {t.skills.map((s) => <span className="language-box" key={s}>{s}</span>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function FaqList() {
  return (
    <div className="faq">
      {FAQ.map((f) => (
        <details key={f.q} className="bulletin-drop">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function JoinSummary() {
  return (
    <div className="join-summary">
      <p className="join-lede">{JOIN_PITCH}</p>
      <div className="join-stats">
        <div><b>{CLUB.session}</b><span>applications open</span></div>
        <div><b>{TEAM_COUNT}</b><span>teams recruiting</span></div>
        <div><b>{PROCESS.length}</b><span>step process</span></div>
      </div>
      <h5 className="panel-sub">Why join</h5>
      <WhyJoin icons={false} />
      <h5 className="panel-sub">How it works</h5>
      <ProcessSteps />
      <h5 className="panel-sub">Teams</h5>
      <RoleTabs />
      <div className="join-cta">
        <Link to="/join" className="btn btn-primary">Full details &amp; FAQ →</Link>
        <a href={`mailto:${CLUB.email}?subject=${encodeURIComponent(`Recruitment ${CLUB.session}`)}`} className="btn">Ask us ↗</a>
      </div>
    </div>
  );
}

/* ---------------- Contact ---------------- */
export function ContactBlock() {
  const { copyEmail } = useHud();
  return (
    <address className="contact-block">
      <div className="contact-block__row">
        <span className="contact-block__label">Reach us</span>
        <a className="contact-block__mail" href={`mailto:${CLUB.email}`}>{CLUB.email}</a>
        <button type="button" className="contact-block__copy" onClick={copyEmail}>Copy</button>
      </div>
      <div className="contact-block__row contact-block__links">
        <span className="contact-block__label">Elsewhere</span>
        <a href={CLUB.instagram.url} target="_blank" rel="noreferrer">Instagram ↗</a>
        <Link to="/join">Join us →</Link>
        <Link to="/projects">Projects →</Link>
      </div>
    </address>
  );
}

export function ContactForm({ idPrefix = 'contact' }) {
  const mag = useMagnetic(0.25);
  const [sent, setSent] = useState(false);
  const id = (name) => `${idPrefix}-${name}`;
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = `Hello from ${f.get('name') || 'the website'}`;
    const body = `${f.get('description')}\n\n— ${f.get('name')} (${f.get('email')})`;
    window.location.href = `mailto:${CLUB.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };
  return (
    <form className="panel corners contact-form" onSubmit={submit}>
      <div className="contact-field">
        <label htmlFor={id('name')}>Name</label>
        <input type="text" id={id('name')} name="name" placeholder="Your name" autoComplete="name" required />
      </div>
      <div className="contact-field">
        <label htmlFor={id('email')}>Email</label>
        <input type="email" id={id('email')} name="email" placeholder="Your email address" autoComplete="email" required />
      </div>
      <div className="contact-field contact-field-full">
        <label htmlFor={id('description')}>Message</label>
        <textarea id={id('description')} name="description" placeholder="Pitch a project, ask a question, say hi..." rows="5" required />
      </div>
      <button ref={mag} type="submit" className="btn btn-primary">
        Send <span aria-hidden="true">↗</span>
      </button>
      {sent && <p className="form-note" role="status">Your mail app should open with the message ready. If it didn’t, write to {CLUB.email}.</p>}
    </form>
  );
}
