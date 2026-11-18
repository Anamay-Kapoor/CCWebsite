/*
 * Team helpers. The roster itself lives in the site content (edited from /admin);
 * src/data/seed.js holds the bundled copy.
 */

export const membersOf = (members, vertical) => (members || []).filter((m) => m.vertical === vertical);

/* Members grouped by batch, oldest first, leads first within a batch. */
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
      members: [...list].sort((x, y) => Number(!!y.lead) - Number(!!x.lead)),
    }));
}
