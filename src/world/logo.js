/* The club's cube mark (public/media/cc-logo.svg), as raw path data. viewBox 0 0 2160 2160. */
export const LOGO_SIZE = 2160;
export const LOGO_PATHS = [
  'M1184.39,1069.62L1185.68,2160l969.16-401.11V1442.16l-152.07,62.31,2.58,153.17-625.06,240.15-9.03-769.76,632.8-241.444V1013.8l150.78-63.608-1.28-271.3Z',
  'M848.019,1910.77V1747.21l157.231,53.22-5.150,338.8L10.31,1765.38,11.6,672.4,1001.38,1043.65v250.53l-153.361-55.81V1133.22L195.9,894.375V1668.03Z',
  'M0,468.606v92.163l976.9,377.74,1.289-282.98L246.157,377.74,850.6,144.087l1.289,89.567L485.871,376.442,603.15,427.067,978.186,280.384,976.9,6.49,2.578,379.038,851.885,706.154v86.971Z',
  'M1184.39,933.317l-3.870-273.894,377.62-141.491,112.12,45.433L1306.83,704.856l1.280,92.163,609.6-234.952-735.9-280.384L1183.1,0l975.61,377.74,1.29,90.866L1306.83,141.49l-1.290,94.76,850.59,328.413Z',
];

export const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_SIZE} ${LOGO_SIZE}">${LOGO_PATHS.map((d) => `<path d="${d}"/>`).join('')}</svg>`;

export function drawLogo(ctx, x, y, size, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / LOGO_SIZE, size / LOGO_SIZE);
  ctx.fillStyle = fill;
  LOGO_PATHS.forEach((d) => ctx.fill(new Path2D(d), 'evenodd'));
  ctx.restore();
}
