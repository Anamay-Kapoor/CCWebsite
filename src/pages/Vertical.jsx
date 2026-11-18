import React, { useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { gsap, useGSAP, SectionHead } from '../ui';
import { useContent } from '../content';
import { VERTICALS, verticalById, CLUB } from '../data/club';
import { membersOf, byBatch } from '../data/team';
import { ProjectCard, PitchCard } from '../Projects';
import PageHero from './PageHero';

const photoStyle = ([x, y, zoom = 1]) => ({
  objectPosition: `${x}% ${y}%`,
  transform: `scale(${zoom})`,
  transformOrigin: `${x}% ${y}%`,
});

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function Photo({ m, className }) {
  return (
    <div className={className}>
      {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" style={photoStyle(m.focus || [50, 40, 1])} />
        : <span className="mcard__initials" aria-hidden="true">{initials(m.name)}</span>}
      <span className="mcard__scan" aria-hidden="true" />
    </div>
  );
}

function LeadCard({ m, n }) {
  return (
    <article className="lcard reveal">
      <Photo m={m} className="lcard__photo" />
      <div className="lcard__body">
        <span className="lcard__ref">R{String(n).padStart(2, '0')} · Lead</span>
        <h3>{m.name}</h3>
        <p className="lcard__role">{m.role}</p>
        {m.batch && <p className="lcard__year">Batch of {m.batch}</p>}
      </div>
      <span className="pcard__trace" aria-hidden="true" />
    </article>
  );
}

function MemberCard({ m, n }) {
  return (
    <figure className="mcard reveal">
      <Photo m={m} className="mcard__photo" />
      <span className="mcard__ref">R{String(n).padStart(2, '0')}</span>
      <figcaption>
        <b>{m.name}</b>
        <span>{m.role || 'Developer'}</span>
      </figcaption>
    </figure>
  );
}

export default function Vertical() {
  const { id } = useParams();
  const root = useRef(null);
  const v = verticalById(id);
  const { content, loading } = useContent();

  useGSAP(() => {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray('.vpage .reveal').forEach((el, i) => {
        gsap.from(el, {
          y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', delay: (i % 4) * 0.06,
          scrollTrigger: { trigger: el, start: 'top 92%' },
        });
      });
      gsap.utils.toArray('.vpage .section-line').forEach((line) => {
        gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 92%', end: 'top 60%', scrub: true } });
      });
    });
  }, { scope: root, dependencies: [id] });

  if (!v) return <Navigate to="/" replace />;

  const vi = VERTICALS.indexOf(v);
  const members = membersOf(v.id);
  const batches = byBatch(members);
  const projects = content.projects
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.vertical === v.id);
  const others = VERTICALS.filter((o) => o.id !== v.id);

  return (
    <main className="site page vpage" ref={root} key={v.id}>
      <PageHero
        sheet={`Sheet 04 · ${v.ref}`}
        crumb={[{ label: 'verticals', to: '/#verticals' }, { label: v.id }]}
        kicker={`Vertical ${String(vi + 1).padStart(2, '0')} · ${v.ref} · The Capacitor Bank`}
        title={<>{v.name} <em>vertical</em></>}
        lede={v.long}
        stats={[
          { value: members.length || '—', label: 'members' },
          { value: batches.length || '—', label: batches.length === 1 ? 'batch' : 'batches' },
          { value: loading ? '—' : projects.length, label: projects.length === 1 ? 'project shipped' : 'projects shipped' },
        ]}
        actions={(
          <>
            <Link className="btn btn-primary" to="/join">Join {v.name} →</Link>
            <Link className="btn" to="/projects">All projects</Link>
          </>
        )}
        part={v.part}
        refdes={`${v.ref} · ${v.name.toUpperCase()}`}
      />

      {members.length === 0 ? (
        <section className="section">
          <SectionHead index="01" title="The Team" />
          <div className="roster-empty reveal">
            <p className="world-kicker">Roster not published yet</p>
            <h3>The {v.name} crew is still being wired up.</h3>
            <p>Want your name on this board first? Applications for {CLUB.session} are open.</p>
            <Link className="btn btn-primary" to="/join">Apply to {v.name} →</Link>
          </div>
        </section>
      ) : (
        <>
          <section className="section">
            <SectionHead index="01" title="The Team" />
            <p className="roster-count">
              <span>$ ls ./{v.id}/members --by=batch</span> <b>{members.length}</b> entries · {batches.length} batch{batches.length === 1 ? '' : 'es'}
            </p>
            {(() => {
              let n = 0;
              return batches.map((g) => {
                const gl = g.members.filter((m) => m.lead);
                const gm = g.members.filter((m) => !m.lead);
                return (
                  <div className="ygroup" key={g.batch}>
                    <div className="ygroup__head">
                      <span className="ygroup__year">{g.batch ? `'${String(g.batch).slice(2)}` : '—'}</span>
                      <h3>{g.batch ? `Batch of ${g.batch}` : 'Members'}</h3>
                      <span className="ygroup__count">{g.members.length} member{g.members.length === 1 ? '' : 's'}</span>
                    </div>
                    {gl.length > 0 && (
                      <div className="lgrid">
                        {gl.map((m) => { n += 1; return <LeadCard key={m.id} m={m} n={n} />; })}
                      </div>
                    )}
                    {gm.length > 0 && (
                      <div className={`mgrid${gl.length ? ' mgrid--after-leads' : ''}`}>
                        {gm.map((m) => { n += 1; return <MemberCard key={m.id} m={m} n={n} />; })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </section>
        </>
      )}

      <section className="section">
        <SectionHead index="02" title="Shipped" />
        <div className="pbar">
          <span>{projects.length} {v.name} project{projects.length === 1 ? '' : 's'}</span>
          <Link to="/projects" className="btn btn-primary pbar__btn">All projects →</Link>
        </div>
        <div className="pgrid">
          {projects.map(({ p, i }) => <ProjectCard key={p.id} project={p} index={i} />)}
          <PitchCard />
        </div>
      </section>

      <section className="section">
        <nav className="vnav" aria-label="Other verticals">
          {others.map((o) => (
            <Link key={o.id} to={`/verticals/${o.id}`} className="vnav__item">
              <span>{o.ref} · Vertical</span>
              <b>{o.name}</b>
              <small>{o.note}</small>
              <i aria-hidden="true">→</i>
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
