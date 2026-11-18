import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, useGSAP, SectionHead, motionQuery } from '../ui';
import { CLUB, JOIN_PITCH, TEAM_COUNT, PROCESS } from '../data/club';
import { RoleTabs, FaqList, ContactBlock, WhyJoin, ProcessTrace } from '../sections';
import PageHero from './PageHero';


export default function Join() {
  const root = useRef(null);

  useGSAP(() => {
    gsap.matchMedia().add(motionQuery(), () => {
      gsap.utils.toArray('.join-page .reveal').forEach((el) => {
        gsap.from(el, { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      gsap.fromTo('.ptrace__line i', { scaleX: 0 }, {
        scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.ptrace', start: 'top 80%', end: 'bottom 60%', scrub: true },
      });
      gsap.utils.toArray('.section-line').forEach((line) => {
        gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 92%', end: 'top 60%', scrub: true } });
      });
    });
  }, { scope: root });

  const apply = `mailto:${CLUB.email}?subject=${encodeURIComponent(`Application: Coding Club ${CLUB.session}`)}&body=${encodeURIComponent('Name:\nYear & branch:\nTeam(s) I am interested in:\nWhat I have built / coded so far:\nLinks (GitHub, portfolio, CP profiles):\n')}`;

  return (
    <main className="site page join-page" ref={root}>
      <PageHero
        sheet="Sheet 05 · J1"
        crumb={[{ label: 'join' }]}
        kicker={`Recruitment · ${CLUB.session} · applications open`}
        title={<>There’s a socket with <em>your name</em> on it.</>}
        lede={JOIN_PITCH}
        stats={[
          { value: CLUB.session, label: 'applications open' },
          { value: TEAM_COUNT, label: 'teams recruiting' },
          { value: PROCESS.length, label: 'step process' },
          { value: 0, label: 'experience required' },
        ]}
        actions={(
          <>
            <a className="btn btn-primary" href={apply}>Apply now ↗</a>
            <Link className="btn" to="/?place=join">See it on the board →</Link>
          </>
        )}
        part="socket"
        refdes="J1 · ZIF-225 SOCKET"
      />

      <section className="section">
        <SectionHead index="01" title="Why Join Us" />
        <WhyJoin reveal />
      </section>

      <section className="section">
        <SectionHead index="02" title="Recruitment Process" />
        <ProcessTrace reveal />
      </section>

      <section className="section">
        <SectionHead index="03" title="Roles & Teams" />
        <div className="reveal"><RoleTabs /></div>
      </section>

      <section className="section">
        <SectionHead index="04" title="FAQ" />
        <div className="reveal"><FaqList /></div>
      </section>

      <section className="section">
        <div className="cta-band reveal">
          <div>
            <p className="world-kicker">Ready to plug in?</p>
            <h2>Applications for {CLUB.session} are open.</h2>
            <p>Any questions about recruitment or the club, write to us. We read everything.</p>
            <ContactBlock />
          </div>
          <div className="cta-band__actions">
            <a className="btn btn-primary" href={apply}>Apply now ↗</a>
            <Link className="btn" to="/projects">See what we build</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
