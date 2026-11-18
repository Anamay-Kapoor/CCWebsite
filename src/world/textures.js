import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { BOARD, PLACES, decorTraces, seeded } from './places';
import { drawLogo } from './logo';

const MONO = "'Geist Mono', ui-monospace, Menlo, monospace";
const DISPLAY = "'Clash Display', 'General Sans', system-ui, sans-serif";

/*
 * A canvas-backed texture that redraws once web fonts are ready,
 * so silkscreen text uses the site's fonts instead of a fallback.
 */
export function useCanvasTexture(width, height, draw, deps = [], opts = {}) {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = opts.anisotropy ?? 8;
    if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
    return t;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  useEffect(() => {
    let alive = true;
    const paint = () => {
      if (!alive) return;
      const ctx = tex.image.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      draw(ctx, width, height);
      tex.needsUpdate = true;
    };
    paint();
    document.fonts?.ready.then(paint);
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, ...deps]);

  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/* ---------------- Board ---------------- */
const PX = 96; // texture pixels per board unit

export function drawBoard(ctx, W, H) {
  const u = (x) => (x + BOARD.w / 2) * PX;
  const v = (z) => (z + BOARD.d / 2) * PX;
  const rnd = seeded(3);

  // Solder mask
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.65);
  g.addColorStop(0, '#121313');
  g.addColorStop(1, '#0b0b0b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.025})`;
    ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
  }

  // Copper pour hatch in two corners
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.028)';
  ctx.lineWidth = 2;
  [[u(-11.2), v(-8.4), u(-8.8), v(-5.2)], [u(8.6), v(5.4), u(11.2), v(8.2)]].forEach(([x0, y0, x1, y1]) => {
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
    ctx.save();
    ctx.clip();
    for (let k = -H; k < W; k += 12) { ctx.moveTo(k, 0); ctx.lineTo(k + H, H); }
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();

  // Decorative traces + vias
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  decorTraces().forEach((pts, i) => {
    ctx.strokeStyle = i % 5 === 0 ? '#2a1414' : '#1d1f1f';
    ctx.lineWidth = (i % 4 === 0 ? 0.11 : 0.07) * PX;
    ctx.beginPath();
    pts.forEach(([x, z], j) => (j ? ctx.lineTo(u(x), v(z)) : ctx.moveTo(u(x), v(z))));
    ctx.stroke();
    [pts[0], pts[pts.length - 1]].forEach(([x, z]) => {
      ctx.fillStyle = '#3a3420';
      ctx.beginPath(); ctx.arc(u(x), v(z), 0.1 * PX, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#050505';
      ctx.beginPath(); ctx.arc(u(x), v(z), 0.045 * PX, 0, Math.PI * 2); ctx.fill();
    });
  });

  // Bus of parallel traces along the top edge
  ctx.strokeStyle = '#1d1f1f';
  ctx.lineWidth = 0.06 * PX;
  for (let i = 0; i < 8; i++) {
    const z = -8.1 + i * 0.16;
    ctx.beginPath(); ctx.moveTo(u(-4.5), v(z)); ctx.lineTo(u(4.5), v(z)); ctx.stroke();
  }

  const silk = 'rgba(225,225,225,0.62)';
  const silkDim = 'rgba(225,225,225,0.32)';

  // Footprints, pads and reference designators
  const footprint = (x, z, s, ref) => {
    const h = s / 2;
    ctx.strokeStyle = silk;
    ctx.lineWidth = 0.035 * PX;
    ctx.strokeRect(u(x - h), v(z - h), s * PX, s * PX);
    ctx.fillStyle = silk;
    ctx.beginPath(); ctx.arc(u(x - h + 0.22), v(z - h + 0.22), 0.07 * PX, 0, Math.PI * 2); ctx.fill();
    // corner ticks
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
      ctx.beginPath();
      ctx.moveTo(u(x + sx * (h + 0.18)), v(z + sz * (h - 0.25)));
      ctx.lineTo(u(x + sx * (h + 0.18)), v(z + sz * (h + 0.18)));
      ctx.lineTo(u(x + sx * (h - 0.25)), v(z + sz * (h + 0.18)));
      ctx.stroke();
    });
    // gold pads peeking out on two sides
    ctx.fillStyle = '#7a6128';
    const n = Math.floor(s / 0.32);
    for (let i = 0; i < n; i++) {
      const t = -h + 0.2 + i * ((s - 0.4) / Math.max(1, n - 1));
      ctx.fillRect(u(x + t) - 0.05 * PX, v(z + h + 0.06), 0.1 * PX, 0.14 * PX);
      ctx.fillRect(u(x + t) - 0.05 * PX, v(z - h - 0.2), 0.1 * PX, 0.14 * PX);
    }
    ctx.font = `600 ${0.3 * PX}px ${MONO}`;
    ctx.fillStyle = silk;
    ctx.textBaseline = 'bottom';
    ctx.fillText(ref, u(x - h), v(z - h - 0.3));
  };
  footprint(0, 0, 3.5, 'U1');
  PLACES.forEach((p) => footprint(p.pos[0], p.pos[1], 2.6, p.ref));

  // Small SMD parts scattered (resistors / caps)
  for (let i = 0; i < 46; i++) {
    const x = (rnd() * 2 - 1) * (BOARD.w / 2 - 1);
    const z = (rnd() * 2 - 1) * (BOARD.d / 2 - 1.4);
    const near = Math.hypot(x, z) < 2.6 || PLACES.some((p) => Math.abs(p.pos[0] - x) < 1.8 && Math.abs(p.pos[1] - z) < 1.8);
    if (near) continue;
    const rot = rnd() > 0.5;
    ctx.save();
    ctx.translate(u(x), v(z));
    if (rot) ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = silkDim;
    ctx.lineWidth = 0.025 * PX;
    ctx.strokeRect(-0.22 * PX, -0.12 * PX, 0.44 * PX, 0.24 * PX);
    ctx.fillStyle = '#7a6128';
    ctx.fillRect(-0.2 * PX, -0.09 * PX, 0.1 * PX, 0.18 * PX);
    ctx.fillRect(0.1 * PX, -0.09 * PX, 0.1 * PX, 0.18 * PX);
    ctx.font = `500 ${0.15 * PX}px ${MONO}`;
    ctx.fillStyle = silkDim;
    ctx.fillText(`${rnd() > 0.5 ? 'R' : 'C'}${10 + i}`, -0.2 * PX, -0.16 * PX);
    ctx.restore();
  }

  // Mounting holes + fiducials
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz]) => {
    const x = u(sx * (BOARD.w / 2 - 0.65));
    const y = v(sz * (BOARD.d / 2 - 0.65));
    ctx.fillStyle = '#8f7531';
    ctx.beginPath(); ctx.arc(x, y, 0.36 * PX, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#050505';
    ctx.beginPath(); ctx.arc(x, y, 0.22 * PX, 0, Math.PI * 2); ctx.fill();
  });
  [[-9.6, -6.9], [9.6, -6.9], [-9.6, 6.2]].forEach(([x, z]) => {
    ctx.strokeStyle = silkDim;
    ctx.lineWidth = 0.02 * PX;
    ctx.beginPath(); ctx.arc(u(x), v(z), 0.24 * PX, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#b9a35a';
    ctx.beginPath(); ctx.arc(u(x), v(z), 0.1 * PX, 0, Math.PI * 2); ctx.fill();
  });

  // Edge connector fingers along the near edge
  for (let i = 0; i < 44; i++) {
    const x = -7 + i * 0.32;
    if (i === 22) continue; // the key notch
    ctx.fillStyle = '#b08d3c';
    ctx.fillRect(u(x), v(BOARD.d / 2 - 0.62), 0.2 * PX, 0.55 * PX);
  }

  // Titles
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = silk;
  ctx.font = `600 ${0.56 * PX}px ${DISPLAY}`;
  ctx.fillText('CODING CLUB', u(-10.6), v(7.0));
  ctx.font = `500 ${0.22 * PX}px ${MONO}`;
  ctx.fillStyle = silkDim;
  ctx.fillText('BITS PILANI · CC-MAIN · REV 2026 · 4 LAYER · 1.6 MM', u(-10.6), v(7.42));
  drawLogo(ctx, u(-10.6), v(4.9), 1.25 * PX, silkDim);

  ctx.textAlign = 'right';
  ctx.fillStyle = silkDim;
  ctx.font = `500 ${0.2 * PX}px ${MONO}`;
  ctx.fillText('MADE IN PILANI, RAJASTHAN', u(10.6), v(-7.7));
  ctx.fillText('BUILD. BREAK. TRY TO FIX. REPEAT.', u(10.6), v(-7.38));
  ctx.fillText('SN 0x00C0DE · DO NOT LICK', u(10.6), v(7.42));
  ctx.textAlign = 'left';

  // Data matrix
  const dm = 0.08 * PX;
  for (let r = 0; r < 14; r++) {
    for (let c = 0; c < 14; c++) {
      if (r === 13 || c === 0 || (r + c) % 2 === 0 ? r === 13 || c === 0 || rnd() > 0.45 : rnd() > 0.55) {
        ctx.fillStyle = silkDim;
        ctx.fillRect(u(8.9) + c * dm, v(5.6) + r * dm, dm, dm);
      }
    }
  }
}

export function useBoardTexture() {
  return useCanvasTexture(Math.round(BOARD.w * PX), Math.round(BOARD.d * PX), drawBoard, [], { anisotropy: 16 });
}

/* ---------------- CPU lid ---------------- */
export function drawLid(ctx, W, H) {
  const rnd = seeded(11);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#a9abaf');
  g.addColorStop(0.5, '#cfd1d4');
  g.addColorStop(1, '#9a9ca0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // brushed lines
  for (let i = 0; i < 1400; i++) {
    const y = rnd() * H;
    ctx.strokeStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${rnd() * 0.06})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + (rnd() - 0.5) * 3); ctx.stroke();
  }
  const etch = 'rgba(40,42,46,0.78)';
  drawLogo(ctx, W * 0.39, H * 0.1, W * 0.22, etch);
  ctx.fillStyle = etch;
  ctx.textAlign = 'center';
  ctx.font = `700 ${W * 0.085}px ${DISPLAY}`;
  ctx.fillText('CODING CLUB', W / 2, H * 0.47);
  ctx.font = `500 ${W * 0.036}px ${MONO}`;
  ctx.fillText('CC-2026 · x64 · 4.20 GHz', W / 2, H * 0.56);
  ctx.fillText('BITS PILANI · RAJASTHAN', W / 2, H * 0.62);
  ctx.font = `500 ${W * 0.028}px ${MONO}`;
  ctx.fillStyle = 'rgba(40,42,46,0.55)';
  ctx.fillText('X7-PILANI-0426 · e4', W / 2, H * 0.68);
  ctx.textAlign = 'left';
  // pin-1 triangle
  ctx.fillStyle = etch;
  ctx.beginPath();
  ctx.moveTo(W * 0.07, H * 0.93); ctx.lineTo(W * 0.15, H * 0.93); ctx.lineTo(W * 0.07, H * 0.85);
  ctx.fill();
  // data matrix
  const cell = W * 0.013;
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      if (r === 11 || c === 0 || rnd() > 0.5) ctx.fillRect(W * 0.76 + c * cell, H * 0.76 + r * cell, cell, cell);
    }
  }
}

/* ---------------- Labels ---------------- */
export function useLabel(lines, { w = 512, h = 128, bg = '#141414', fg = 'rgba(230,230,230,0.8)', size = 0.3, align = 'center', font = MONO } = {}) {
  const key = lines.join('|');
  return useCanvasTexture(w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const lh = h / (lines.length + 0.6);
    lines.forEach((line, i) => {
      ctx.font = `${i === 0 ? 600 : 500} ${h * size * (i === 0 ? 1 : 0.75)}px ${font}`;
      ctx.fillText(line, align === 'center' ? w / 2 : w * 0.06, lh * (i + 0.8));
    });
  }, [key, bg, fg]);
}

/* ---------------- 7-segment clock (live IST) ---------------- */
const SEG = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
};

function digit(ctx, n, x, y, w, h, on, off) {
  const t = w * 0.18;
  const segs = {
    a: [x + t, y, w - 2 * t, t], d: [x + t, y + h - t, w - 2 * t, t], g: [x + t, y + h / 2 - t / 2, w - 2 * t, t],
    f: [x, y + t, t, h / 2 - t * 1.5], b: [x + w - t, y + t, t, h / 2 - t * 1.5],
    e: [x, y + h / 2 + t / 2, t, h / 2 - t * 1.5], c: [x + w - t, y + h / 2 + t / 2, t, h / 2 - t * 1.5],
  };
  Object.entries(segs).forEach(([k, r]) => {
    ctx.fillStyle = SEG[n].includes(k) ? on : off;
    ctx.fillRect(...r);
  });
}

export function drawClock(ctx, W, H) {
  ctx.fillStyle = '#0d0101';
  ctx.fillRect(0, 0, W, H);
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Kolkata' });
  const digits = time.replace(/:/g, '');
  const dw = W * 0.105;
  const dh = H * 0.62;
  const y = (H - dh) / 2;
  let x = W * 0.06;
  ctx.shadowColor = '#ff2020';
  digits.split('').forEach((d, i) => {
    ctx.shadowBlur = 14;
    digit(ctx, Number(d), x, y, dw, dh, '#ff2a1a', 'rgba(255,40,30,0.07)');
    x += dw * 1.32;
    if (i === 1 || i === 3) {
      ctx.fillStyle = '#ff2a1a';
      ctx.fillRect(x - dw * 0.08, y + dh * 0.28, dw * 0.16, dw * 0.16);
      ctx.fillRect(x - dw * 0.08, y + dh * 0.64, dw * 0.16, dw * 0.16);
      x += dw * 0.38;
    }
  });
  ctx.shadowBlur = 0;
}
