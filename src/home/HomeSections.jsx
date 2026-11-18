import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scramble } from '../ui';
import { externalLink } from '../content';
import { placeById } from '../world/places';
import { CLUB, EVENT_KINDS, VERTICALS, STACK, TEAM_COUNT } from '../data/club';
import { WhyJoin, ProcessTrace, ContactBlock, ContactForm, PastEvents } from '../sections';
import { ProjectCard, PitchCard } from '../Projects';
import { Viewport } from '../pages/PageHero';
import { membersOf } from '../data/team';
import './home.css';

const ext = (url) => (externalLink(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {});

function SmartLink({ to, className, children }) {
  if (externalLink(to) || to.startsWith('mailto:')) return <a href={to} className={className} {...ext(to)}>{children}</a>;
  return <Link to={to} className={className}>{children}</Link>;
}

/* One section on the scroll page, tied to its chip on the board. */
function HomeSection({ id, index, place, title, lede, children, wide }) {
  const p = placeById(place);
  return (
    <section id={id} className={`hsec${wide ? ' hsec--wide' : ''}`} aria-label={title}>
      <span className="hsec__node" aria-hidden="true">{index}</span>
      <header className="hsec__head">
        <p className="hsec__ref">
          <span>{p.ref}</span>{p.title}
        </p>
        <Scramble as="h2" text={title} className="hsec__title" />
        {lede && <p className="hsec__lede">{lede}</p>}
        <Link to={`/?place=${place}`} className="hsec__board" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Open on the board <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className="hsec__body">{children}</div>
    </section>
  );
}

/* ---------------- 01 Bulletin ---------------- */
function Feed({ bulletins, loading, error }) {
  if (loading) return <div className="feed"><div className="feed__lead pcard--ghost" /></div>;
  if (error) return <p role="alert" className="result-count">{error}</p>;
  if (!bulletins.length) return <p className="hsec__empty">Quiet on the airwaves. Check back soon.</p>;
  const [lead, ...rest] = bulletins;
  return (
    <div className={`feed${rest.length ? '' : ' feed--single'}`}>
      <article className="feed__lead reveal">
        <div className="feed__meta"><span className="chip chip-solid">New</span><span>Post 01 · {CLUB.session}</span></div>
        <h3>{lead.title}</h3>
        <p>{lead.description}</p>
        {lead.image && <img src={lead.image} alt="" loading="lazy" />}
        <div className="feed__links">
          {lead.links.map((l) => <SmartLink key={l.url} to={l.url} className="pcard__link">{l.label}</SmartLink>)}
        </div>
        <span className="feed__wave" aria-hidden="true"><i /><i /><i /></span>
      </article>
      {rest.length > 0 && (
        <ol className="feed__list">
          {rest.map((b, i) => (
            <li key={b.id} className="feed__item reveal">
              <span className="feed__n">{String(i + 2).padStart(2, '0')}</span>
              <div>
                <h4>{b.title}</h4>
                <p>{b.description}</p>
                <div className="feed__links">
                  {b.links.map((l) => <SmartLink key={l.url} to={l.url} className="pcard__link">{l.label}</SmartLink>)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ---------------- 02 Events ---------------- */
function LedClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' });
  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  return (
    <div className="led" role="timer" aria-label={`Current time in Pilani: ${time}`}>
      <span className="led__ghost" aria-hidden="true">88:88:88</span>
      <span className="led__time" aria-hidden="true">{time}</span>
      <span className="led__date">{date} · IST</span>
    </div>
  );
}

const KIND_ICONS = [
  <svg viewBox="0 0 24 24" key="w"><path d="M4 18h16M6 18V8l6-4 6 4v10M10 18v-5h4v5" /></svg>,
  <svg viewBox="0 0 24 24" key="g"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg>,
  <svg viewBox="0 0 24 24" key="h"><path d="M13 3 5 13h6l-1 8 8-10h-6z" /></svg>,
  <svg viewBox="0 0 24 24" key="c"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M10 17h4v4h-4z" /></svg>,
];

function EventRow({ e, live }) {
  return (
    <li className={`erow${live ? ' is-live' : ''}`}>
      <span className="erow__date">{e.startDate.slice(5).replace('-', '/')}</span>
      <div>
        <h4>{e.name}</h4>
        <p>{e.description}</p>
        {e.link && <a href={e.link} className="pcard__link" {...ext(e.link)}>Details ↗</a>}
      </div>
      {live && <span className="erow__live"><i />Live</span>}
    </li>
  );
}

function EventsBlock({ upcoming, running, past }) {
  const next = running[0] || upcoming[0];
  return (
    <div className="events2">
      <div className="events2__clock reveal">
        <LedClock />
        <p className="events2__next">
          <span>{running.length ? 'Running now' : 'Next up'}</span>
          {next ? <b>{next.name} · {next.startDate}</b> : <b>Nothing scheduled yet. Workshops are cooking.</b>}
        </p>
      </div>
      <div className="events2__lists reveal">
        <div>
          <p className="hud-label">Running · {running.length}</p>
          {running.length ? <ul className="erows">{running.map((e) => <EventRow key={e.id} e={e} live />)}</ul>
            : <p className="hsec__empty">No events running right now.</p>}
        </div>
        <div>
          <p className="hud-label">Queued · {upcoming.length}</p>
          {upcoming.length ? <ul className="erows">{upcoming.map((e) => <EventRow key={e.id} e={e} />)}</ul>
            : <p className="hsec__empty">Queue is empty. Follow {CLUB.instagram.handle} for drops.</p>}
        </div>
      </div>
      {past.length > 0 && (
        <div className="events2__past reveal">
          <p className="hud-label">Archive · {past.length} past event{past.length === 1 ? '' : 's'}</p>
          <PastEvents events={past} />
        </div>
      )}
      <div className="kinds2">
        {EVENT_KINDS.map((k, i) => (
          <div className="kind2 reveal" key={k.name}>
            <span className="kind2__icon" aria-hidden="true">{KIND_ICONS[i]}</span>
            <h4>{k.name}</h4>
            <p>{k.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 04 Verticals ---------------- */
function VerticalsBlock({ projects, members }) {
  return (
    <div className="verts">
      <Viewport kind="caps" refdes="C1–C6 · CAPACITOR BANK" caption="3D model of the capacitor bank" />
      <ol className="verts__list">
        {VERTICALS.map((v, i) => {
          const n = projects.filter((p) => p.vertical === v.id).length;
          const m = membersOf(members, v.id).length;
          return (
            <li key={v.id} className="reveal">
              <Link to={`/verticals/${v.id}`} className="vert">
                <span className="vert__n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{v.name}</h3>
                  <p>{v.note}</p>
                  <span className="vert__go">{m ? `${m} members` : 'Meet the team'} · view →</span>
                </div>
                <span className="vert__count"><b>{n}</b><span>project{n === 1 ? '' : 's'}</span></span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="verts__stack" aria-label="Stack">
        {STACK.map((s) => <span key={s}>{s}</span>)}
      </div>
    </div>
  );
}

/* ---------------- The whole scroll page ---------------- */
export default function HomeSections({ content, loading, error, upcoming, running, past = [] }) {
  const projects = content.projects;
  return (
    <div className="hsecs">
      <div className="hsecs__rail" aria-hidden="true"><i /></div>

      <HomeSection id="bulletin" index="01" place="bulletin" title="Latest Updates" lede="Announcements straight off the antenna. Newest first.">
        <Feed bulletins={content.bulletins} loading={loading} error={error} />
      </HomeSection>

      <HomeSection id="events" index="02" place="events" title="Events" lede="What’s running, what’s queued, and what we run every semester.">
        <EventsBlock upcoming={upcoming} running={running} past={past} />
      </HomeSection>

      <HomeSection id="projects" index="03" place="projects" title="Projects" lede="Built by members, used on campus.">
        <div className="pbar">
          <span>Showing {Math.min(2, projects.length)} of {projects.length}</span>
          <Link to="/projects" className="btn btn-primary pbar__btn">All projects ({projects.length}) →</Link>
        </div>
        <div className="pgrid">
          {projects.slice(0, 2).map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
          {!loading && <PitchCard />}
          {loading && <div className="pcard pcard--ghost" />}
        </div>
      </HomeSection>

      <HomeSection id="verticals" index="04" place="stack" title="Verticals" lede="Where the energy is stored. Pick your voltage.">
        <VerticalsBlock projects={projects} members={content.members} />
      </HomeSection>

      <HomeSection id="join" index="05" place="join" title="Join the Club" lede={`Recruitment ${CLUB.session} is open. ${TEAM_COUNT} teams, zero experience required.`}>
        <WhyJoin reveal />
        <div className="hsec__gap"><ProcessTrace reveal /></div>
        <div className="join-cta">
          <Link to="/join" className="btn btn-primary">Roles, FAQ &amp; apply →</Link>
          <a href={`mailto:${CLUB.email}?subject=${encodeURIComponent(`Recruitment ${CLUB.session}`)}`} className="btn">Ask us ↗</a>
        </div>
      </HomeSection>

      <HomeSection id="contact" index="06" place="contact" title="Contact Us" lede="Plug in. Pitch a project, ask a question, or just say hi.">
        <div className="contact2">
          <div className="contact2__side reveal">
            <Viewport kind="port" refdes="J2 · USB-C / RJ45" caption="3D model of the port" />
            <ContactBlock />
          </div>
          <ContactForm />
        </div>
      </HomeSection>
    </div>
  );
}
