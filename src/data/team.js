/*
 * Members per vertical. Names, roles and photos come from the Timetable Generator's
 * credits (timetable-generator/src/data/developers.ts, public/team/).
 *
 * `batch` is the year the member joined BITS; the vertical page groups by it, oldest first.
 * Members without a `photo` show their initials until one is added.
 * `focus` frames each photo in a 4:5 card: [x%, y%] of the face, and a zoom
 * for wide or letterboxed shots.
 */
export const TEAMS = {
  webdev: [
    { id: 'aditya', batch: 2024, name: 'Aditya', role: 'Web Development Lead', lead: true, photo: '/team/webdev/aditya.jpg', focus: [56, 32, 1.25] },
    { id: 'nidesh', batch: 2024, name: 'Nidesh Ahilan', role: 'Apogee Coordinator', lead: true, photo: '/team/webdev/nidesh.jpg', focus: [50, 40, 1] },
    { id: 'utkarsh', batch: 2024, name: 'Utkarsh Patil', photo: '/team/webdev/utkarsh.jpg', focus: [48, 35, 1] },
    { id: 'darsh', batch: 2024, name: 'Darsh Patel', photo: '/team/webdev/darsh.jpg', focus: [50, 36, 1.55] },
    { id: 'dhairya', batch: 2025, name: 'Dhairya Sharma', photo: '/team/webdev/dhairya.jpg', focus: [46, 20, 1.6] },
    { id: 'tanish', batch: 2025, name: 'Tanish Soni', photo: '/team/webdev/tanish.jpg', focus: [51, 52, 2.5] },
    { id: 'aditi', batch: 2025, name: 'Aditi Maheshwari', photo: '/team/webdev/aditi.jpg', focus: [50, 36, 1.15] },
    { id: 'shreya', batch: 2025, name: 'Shreya Gupta', photo: '/team/webdev/shreya.jpg', focus: [50, 40, 1.1] },
    { id: 'aanya', batch: 2025, name: 'Aanya Gupta', photo: '/team/webdev/aanya.jpg', focus: [50, 32, 1.05] },
    { id: 'armaan', batch: 2025, name: 'Armaan Nanavaty', photo: '/team/webdev/armaan.jpg', focus: [44, 48, 1.9] },
    { id: 'prem', batch: 2025, name: 'Prem Kumar', photo: '/team/webdev/prem.jpg', focus: [50, 56, 1.35] },
    { id: 'nikunj', batch: 2025, name: 'Nikunj Rathi', photo: '/team/webdev/nikunj.jpg', focus: [50, 40, 1] },
    { id: 'jayneel', batch: 2025, name: 'Jayneel Yadav', photo: '/team/webdev/jayneel.jpg', focus: [52, 34, 1.45] },
    { id: 'shreyash', batch: 2025, name: 'Shreyash Satpathy', photo: '/team/webdev/shreyash.jpg', focus: [42, 36, 1.6] },
    // Photos to come: drop them in public/team/webdev/ and set `photo` (and `focus` if needed).
    { id: 'anamay', batch: 2026, name: 'Anamay Kapoor', photo: null },
    { id: 'atharv', batch: 2026, name: 'Atharv', photo: null },
  ],
  'ai-ml': [],
  gamedev: [],
};

export const membersOf = (vertical) => TEAMS[vertical] || [];

/* Members grouped by batch, oldest first; anyone without a batch goes last. */
export function byBatch(members) {
  const groups = new Map();
  members.forEach((m) => {
    const k = m.batch || 0;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(m);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => (a || 9999) - (b || 9999))
    .map(([batch, list]) => ({
      batch,
      // Leads first within their batch.
      members: [...list].sort((x, y) => Number(!!y.lead) - Number(!!x.lead)),
    }));
}
