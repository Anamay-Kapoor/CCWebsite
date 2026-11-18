/*
 * Static club information, imported from the club's previous site
 * (bits-coding-club.vercel.app: home, /recruitment, footer) in Nov 2026.
 * Dynamic content (projects, bulletins, events) comes from /api/content;
 * see ./seed.js for the offline fallback.
 */

export const CLUB = {
  name: 'Coding Club',
  fullName: 'BITS Pilani Coding Club',
  campus: 'BITS Pilani',
  place: 'Pilani, Rajasthan',
  tagline: 'Fostering innovation, collaboration, and excellence in computer science.',
  footerLine: 'Fostering innovation and excellence in computer science through collaboration, learning, and competition.',
  motto: ['Build. Break.', 'Try to fix.', 'Repeat.'],
  mottoSig: 'the only loop we run',
  email: 'codingclub@bitspilani.ac.in',
  instagram: { handle: '@bitspilani_codingclub', url: 'https://www.instagram.com/bitspilani_codingclub/' },
  session: '2026–27',
};

export const JOIN_PITCH = 'Become part of a vibrant community of coders, innovators, and problem-solvers. Enhance your skills, work on exciting projects, and participate in competitions.';

export const WHY_JOIN = [
  {
    title: 'Community',
    body: 'Connect with like-minded peers who share your passion for coding and technology. Build lasting friendships and professional networks.',
  },
  {
    title: 'Skill Development',
    body: 'Enhance your programming skills through workshops, hackathons, and collaborative projects. Learn from peers and industry experts.',
  },
  {
    title: 'Opportunities',
    body: 'Gain access to exclusive internship opportunities, industry connections, and the chance to represent BITS Pilani in national competitions.',
  },
];

export const PROCESS = [
  { title: 'Application Submission', body: 'Fill out the online application form with your details, coding experience, and areas of interest.' },
  { title: 'Coding Challenge', body: 'Shortlisted candidates will receive a coding challenge to assess their problem-solving skills.' },
  { title: 'Interview', body: "Selected candidates will be invited for an interview with the club's core team to discuss their experience and motivation." },
  { title: 'Results', body: 'Final results will be announced and successful candidates will be welcomed to the club.' },
];

export const ROLE_GROUPS = [
  {
    id: 'technical',
    label: 'Technical',
    teams: [
      {
        name: 'Development Team',
        summary: 'Build and maintain club projects',
        duties: [
          'Develop web and mobile applications for the club and university',
          'Collaborate on open-source projects',
          "Implement and maintain the club's technical infrastructure",
        ],
        skills: ['HTML', 'CSS', 'JavaScript', 'Any modern framework'],
      },
      {
        name: 'Competitive Programming Team',
        summary: 'Represent the club in coding competitions',
        duties: [
          'Participate in national and international coding competitions',
          'Organize practice sessions and mock contests',
          'Mentor junior members in algorithmic problem-solving',
        ],
        skills: ['Data Structures', 'Algorithms', 'Problem-solving'],
      },
    ],
  },
  {
    id: 'events',
    label: 'Events',
    teams: [
      {
        name: 'Events Coordination Team',
        summary: 'Plan and execute club events',
        duties: [
          'Organize workshops, hackathons, and coding competitions',
          'Coordinate with guest speakers and industry partners',
          'Manage event logistics and participant experience',
        ],
        skills: ['Communication', 'Organization', 'Time Management'],
      },
      {
        name: 'Outreach Team',
        summary: 'Build partnerships and manage external relations',
        duties: [
          'Establish partnerships with tech companies and other universities',
          'Secure sponsorships for club events',
          'Represent the club at external events and conferences',
        ],
        skills: ['Networking', 'Communication', 'Negotiation'],
      },
    ],
  },
  {
    id: 'content',
    label: 'Content & Design',
    teams: [
      {
        name: 'Content Creation Team',
        summary: 'Develop educational and promotional content',
        duties: [
          'Create blog posts, tutorials, and technical articles',
          'Develop educational resources for workshops and training',
          "Manage the club's technical documentation",
        ],
        skills: ['Writing', 'Technical Knowledge', 'Attention to Detail'],
      },
      {
        name: 'Design & Media Team',
        summary: 'Create visual assets and manage social media',
        duties: [
          'Design posters, banners, and promotional materials',
          "Manage the club's social media presence",
          'Create engaging visual content for events and workshops',
        ],
        skills: ['Graphic Design', 'Social Media Management', 'Creativity'],
      },
    ],
  },
];

export const TEAM_COUNT = ROLE_GROUPS.reduce((n, g) => n + g.teams.length, 0);

export const FAQ = [
  {
    q: 'Who can join the Coding Club?',
    a: 'The club is open to all BITS Pilani students with an interest in coding and technology, regardless of their major or year of study. We welcome members with all levels of experience, from beginners to advanced programmers.',
  },
  {
    q: 'What is the time commitment?',
    a: 'The time commitment varies depending on your role and level of involvement. Core team members typically dedicate 5–8 hours per week, while general members can participate as much as their schedule allows. We understand that academics come first and offer flexible engagement options.',
  },
  {
    q: 'Do I need prior coding experience?',
    a: 'While some roles may require specific technical skills, we have opportunities for members at all levels. Beginners can join our learning tracks and workshops to build their skills, while more experienced coders can take on leadership roles or technical projects.',
  },
  {
    q: 'How can I prepare for the recruitment process?',
    a: "For technical roles, we recommend brushing up on your programming fundamentals and problem-solving skills. For non-technical roles, prepare to showcase your relevant experience and enthusiasm for the club's mission. All applicants should be ready to demonstrate their teamwork abilities and commitment to learning.",
  },
];

export const EVENT_KINDS = [
  { name: 'Workshops', note: 'Hands-on sessions, from your first commit to shipping in prod.' },
  { name: 'Guest Talks', note: 'Engineers and alumni on what the work is really like.' },
  { name: 'Hackathons', note: 'Build something in a weekend. Sleep optional.' },
  { name: 'Contests', note: 'Practice rounds and mock contests for competitive programmers.' },
];

export const VERTICALS = [
  {
    id: 'webdev', name: 'WebDev', ref: 'C1', part: 'ram',
    note: 'Sites, tools and internal apps for campus, like the Timetable Generator.',
    long: 'The WebDev vertical builds and runs the club’s software: the sites, internal tools and campus apps people actually use, like the Timetable Generator. Frontend, backend and everything in between.',
  },
  {
    id: 'ai-ml', name: 'AI / ML', ref: 'C2', part: 'cpu',
    note: 'Models, papers, experiments and the occasional GPU fire.',
    long: 'The AI / ML vertical reads papers, trains models and ships experiments, from classic ML to whatever came out last week.',
  },
  {
    id: 'gamedev', name: 'GameDev', ref: 'C3', part: 'socket',
    note: 'Engines, jams and low-poly worlds, like Railway To Rome.',
    long: 'The GameDev vertical makes games: engines, jams and low-poly worlds like Railway To Rome.',
  },
];

export const verticalById = (id) => VERTICALS.find((v) => v.id === id);

export const STACK = ['React', 'Golang', 'Hackathons', 'Open Source', 'AI / ML', 'GameDev', 'Web Dev', 'Linux', 'CP', 'Systems'];
