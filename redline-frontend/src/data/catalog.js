// Complete Redline Catalog and Generative Artwork System preserved 100% from index.html

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
export const nf = n => (n || 0).toLocaleString('en-US');
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const durText = s => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`; };

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed) {
  let a = typeof seed === 'number' ? seed : hash(String(seed));
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function shade(hex, amt) {
  if (!hex || hex.length < 7) return '#181818';
  const n = parseInt(hex.slice(1), 16), f = c => Math.round(c * (1 - amt));
  return '#' + ((1 << 24) | (f(n >> 16 & 255) << 16) | (f(n >> 8 & 255) << 8) | f(n & 255)).toString(16).slice(1);
}

export const PAL = [
  ['#1b1f3b', '#53354a', '#e84545', '#ffb26b', '#f6e9e9'], // 0 dusk
  ['#0f3057', '#00587a', '#008891', '#e7e7de', '#ffd56b'], // 1 teal
  ['#2d132c', '#801336', '#c72c41', '#ee4540', '#f6d6ad'], // 2 wine
  ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#f5f5f5'], // 3 navy pink
  ['#283618', '#606c38', '#dda15e', '#bc6c25', '#fefae0'], // 4 olive
  ['#03045e', '#0077b6', '#00b4d8', '#90e0ef', '#caf0f8'], // 5 ocean
  ['#3c096c', '#7b2cbf', '#c77dff', '#ff9e00', '#ffe8d6'], // 6 violet
  ['#10002b', '#240046', '#5a189a', '#e0aaff', '#ff6d00'], // 7 deep purple
  ['#003049', '#d62828', '#f77f00', '#fcbf49', '#eae2b7'], // 8 sunset
  ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'], // 9 earth
  ['#0b090a', '#161a1d', '#660708', '#a4161a', '#f5f3f4'], // 10 noir
  ['#22223b', '#4a4e69', '#9a8c98', '#c9ada7', '#f2e9e4'], // 11 dusty
  ['#081c15', '#1b4332', '#2d6a4f', '#95d5b2', '#d8f3dc'], // 12 forest
  ['#370617', '#6a040f', '#dc2f02', '#f48c06', '#ffba08'], // 13 fire
  ['#012a4a', '#2c7da0', '#a9d6e5', '#ff5d8f', '#fff0f3'], // 14 candy
  ['#1f1300', '#5a3e1b', '#c08552', '#f3e9dc', '#895737'], // 15 coffee
];

const FONT = 'Inter,Helvetica Neue,Helvetica,Arial,sans-serif';
const MARK = `<g transform="translate(18 18) scale(.75)"><circle cx="16" cy="16" r="16" fill="#C92000"/><path d="M5 17h5l2.5-6 4 11 3-8 2 3H27" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const artCache = new Map();
const toURL = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
const memo = (k, f) => { if (!artCache.has(k)) artCache.set(k, toURL(f())); return artCache.get(k); };

const svgDoc = (defs, body, grain = .3, W = 300) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 300" width="${W}" height="300"><defs>` +
  `<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>` +
  `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>${defs}</defs>` +
  `${body}<rect width="${W}" height="300" filter="url(#g)" opacity="${grain}" style="mix-blend-mode:overlay"/></svg>`;

const n0 = v => v.toFixed(0), n1 = v => v.toFixed(1);

const STYLES = {
  mesh(r, p) {
    let b = `<rect width="300" height="300" fill="${p[0]}"/><g filter="url(#b)">`;
    for (let i = 0; i < 6; i++) b += `<circle cx="${n0(r() * 300)}" cy="${n0(r() * 300)}" r="${n0(60 + r() * 90)}" fill="${p[1 + i % 4]}" opacity="${(.65 + r() * .35).toFixed(2)}"/>`;
    return ['', b + '</g>'];
  },
  orbs(r, p) {
    let d = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient>`;
    let b = `<rect width="300" height="300" fill="url(#bg)"/>`;
    const n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      d += `<radialGradient id="o${i}" cx=".32" cy=".28" r=".8"><stop offset="0" stop-color="${p[4]}"/><stop offset=".35" stop-color="${p[2 + i % 3]}"/><stop offset="1" stop-color="${p[0]}"/></radialGradient>`;
      const R = 40 + r() * 70;
      b += `<circle cx="${n0(R + r() * (300 - 2 * R))}" cy="${n0(R + r() * (300 - 2 * R))}" r="${n0(R)}" fill="url(#o${i})"/>`;
    }
    b += `<circle cx="${n0(80 + r() * 140)}" cy="${n0(80 + r() * 140)}" r="${n0(90 + r() * 40)}" fill="none" stroke="${p[4]}" stroke-opacity=".35" stroke-width="1.5"/>`;
    return [d, b];
  },
  waves(r, p) {
    let b = `<rect width="300" height="300" fill="${p[0]}"/>`;
    const n = 6 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const y = 40 + i * (240 / n), a = 8 + r() * 22, f = 1 + r() * 2, ph = r() * 6.283;
      let d = `M0 300L0 ${n1(y + Math.sin(ph) * a)}`;
      for (let x = 10; x <= 300; x += 10) d += `L${x} ${n1(y + Math.sin(x / 300 * f * 6.283 + ph) * a)}`;
      b += `<path d="${d}L300 300Z" fill="${p[1 + i % 4]}"/>`;
    }
    return ['', b];
  },
  bauhaus(r, p) {
    let b = '';
    const pk = () => p[Math.floor(r() * 5)];
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
      const x = gx * 100, y = gy * 100, bg = pk(), cx = x + 50, cy = y + 50, rot = Math.floor(r() * 4) * 90;
      let fg = pk(); if (fg === bg) fg = p[(p.indexOf(bg) + 2) % 5];
      b += `<rect x="${x}" y="${y}" width="100" height="100" fill="${bg}"/><g transform="rotate(${rot} ${cx} ${cy})" fill="${fg}">`;
      switch (Math.floor(r() * 6)) {
        case 0: b += `<path d="M${x} ${y}H${x + 100}A100 100 0 0 1 ${x} ${y + 100}Z"/>`; break;
        case 1: b += `<circle cx="${cx}" cy="${cy}" r="38"/>`; break;
        case 2: b += `<path d="M${x} ${cy}A50 50 0 0 1 ${x + 100} ${cy}Z"/>`; break;
        case 3: b += `<path d="M${x} ${y + 100}L${cx} ${y}L${x + 100} ${y + 100}Z"/>`; break;
        case 4: b += `<circle cx="${cx}" cy="${cy}" r="34" fill="none" stroke="${fg}" stroke-width="12"/><circle cx="${cx}" cy="${cy}" r="10"/>`; break;
        default: for (let k = 0; k < 5; k++) b += `<rect x="${x}" y="${y + k * 20 + 5}" width="100" height="10"/>`;
      }
      b += '</g>';
    }
    return ['', b];
  },
  sun(r, p) {
    const sy = 110 + r() * 45, R = 78 + r() * 22;
    let m = '';
    for (let i = 0; i < 7; i++) m += `<rect x="0" y="${n1(sy + 6 + i * (R / 7) * 1.05)}" width="300" height="${n1(1 + i * 1.4)}" fill="#000"/>`;
    const d = `<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient>` +
      `<linearGradient id="su" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[4]}"/><stop offset=".45" stop-color="${p[3]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>` +
      `<mask id="m"><rect width="300" height="300" fill="#fff"/>${m}</mask>`;
    const gy = 228 + r() * 22;
    const ridge = (o, amp) => { let s = `M0 ${n0(gy + o)}`; for (let x = 0; x <= 300; x += 30) s += `L${x} ${n0(gy + o - r() * amp)}`; return s + 'V300H0Z'; };
    const b = `<rect width="300" height="300" fill="url(#sk)"/><circle cx="150" cy="${n0(sy)}" r="${n0(R)}" fill="url(#su)" mask="url(#m)"/>` +
      `<path d="${ridge(0, 50)}" fill="${p[1]}" opacity=".85"/><path d="${ridge(26, 28)}" fill="${p[0]}"/>`;
    return [d, b];
  },
  rings(r, p) {
    const cx = 70 + r() * 160, cy = 70 + r() * 160, dx = (r() - .5) * 9, dy = (r() - .5) * 9;
    let b = `<rect width="300" height="300" fill="${p[0]}"/>`;
    for (let k = 15; k > 0; k--) b += `<circle cx="${n0(cx + k * dx)}" cy="${n0(cy + k * dy)}" r="${k * 22}" fill="${p[1 + k % 4]}"/>`;
    return ['', b + `<circle cx="${n0(cx)}" cy="${n0(cy)}" r="9" fill="${p[0]}"/>`];
  },
  stripes(r, p) {
    const w = 14 + Math.floor(r() * 14), R = 70 + r() * 30;
    let s = '';
    for (let x = -300, k = 0; x < 600; x += w, k++) s += `<rect x="${x}" y="-150" width="${w / 2}" height="600" fill="${p[2 + k % 3]}"/>`;
    const d = `<clipPath id="c"><circle cx="150" cy="150" r="${n0(R)}"/></clipPath>`;
    const b = `<rect width="300" height="300" fill="${p[1]}"/><g transform="rotate(45 150 150)">${s}</g>` +
      `<circle cx="150" cy="150" r="${n0(R + 10)}" fill="${p[0]}"/><g clip-path="url(#c)"><rect width="300" height="300" fill="${p[0]}"/><g transform="rotate(-45 150 150)">${s}</g></g>`;
    return [d, b];
  },
  chart(r, p, o) {
    const d = `<linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/></linearGradient>`;
    let pts = '';
    for (let x = 0; x <= 300; x += 25) pts += `${x},${n0(262 - x * .32 - r() * 36)} `;
    const b = `<rect width="300" height="300" fill="url(#cg)"/><polyline points="${pts}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linejoin="round"/>` +
      `<text x="20" y="150" font-family="${FONT}" font-weight="900" font-size="62" fill="#fff" letter-spacing="-3">${esc(o.big)}</text>` +
      `<text x="22" y="184" font-family="${FONT}" font-weight="700" font-size="16" fill="#fff" fill-opacity=".85" letter-spacing="4">${esc(o.small)}</text>${MARK}`;
    return [d, b];
  },
  radar(r) {
    const d = `<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C92000" stop-opacity="0"/><stop offset="1" stop-color="#C92000" stop-opacity=".85"/></linearGradient>`;
    let b = `<rect width="300" height="300" fill="#160604"/>`;
    for (let k = 1; k <= 5; k++) b += `<circle cx="150" cy="150" r="${k * 28}" fill="none" stroke="#fff" stroke-opacity="${(.22 - k * .025).toFixed(3)}" stroke-width="1.2"/>`;
    b += `<path d="M150 150L150 10A140 140 0 0 1 271 80Z" fill="url(#sw)"/><path d="M150 150L271 80" stroke="#ff5a3c" stroke-width="2"/>`;
    for (let i = 0; i < 6; i++) {
      const a = r() * 6.283, rad = 30 + r() * 105, x = 150 + Math.cos(a) * rad, y = 150 + Math.sin(a) * rad;
      b += `<circle cx="${n0(x)}" cy="${n0(y)}" r="11" fill="#ff5a3c" opacity=".22"/><circle cx="${n0(x)}" cy="${n0(y)}" r="4" fill="#fff"/>`;
    }
    b += `<text x="20" y="278" font-family="${FONT}" font-weight="900" font-size="34" fill="#fff" letter-spacing="-1.5">Radar</text>${MARK}`;
    return [d, b];
  },
};

const BUST = `<ellipse cx="150" cy="128" rx="44" ry="52"/><rect x="132" y="160" width="36" height="50" rx="10"/><path d="M48 300C56 228 98 204 150 204S244 228 252 300Z"/>`;
const HAIR = {
  short: `<path d="M104 120C102 82 124 66 150 66S198 82 196 120C186 98 170 92 150 92S112 98 104 120Z"/>`,
  long: `<path d="M100 128C96 80 122 64 150 64S204 80 200 128L208 236H92Z"/>`,
  afro: `<circle cx="150" cy="106" r="74"/>`,
  bun: `<circle cx="150" cy="60" r="24"/><path d="M106 118C104 84 126 72 150 72S196 84 194 118C184 96 168 90 150 90S114 96 106 118Z"/>`,
  cap: `<path d="M104 112C104 78 126 64 150 64S196 78 196 112Z"/><path d="M190 104H238C238 112 228 118 210 118H190Z"/>`,
  mohawk: `<rect x="140" y="42" width="20" height="54" rx="9"/>`,
  phones: '',
};

const PHONES = c => `<path d="M98 128C98 80 120 60 150 60S202 80 202 128" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/><rect x="88" y="112" width="20" height="40" rx="9" fill="${c}"/><rect x="192" y="112" width="20" height="40" rx="9" fill="${c}"/>`;
const SHADES = c => `<g fill="${c}"><rect x="110" y="116" width="36" height="17" rx="7"/><rect x="154" y="116" width="36" height="17" rx="7"/><rect x="144" y="120" width="12" height="4"/></g><path d="M116 120h10" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`;

function portrait(r, p, ar, W = 300) {
  const d = `<radialGradient id="pg" cx="${W === 300 ? (.3 + r() * .4).toFixed(2) : .78}" cy=".35" r=".85"><stop offset="0" stop-color="${p[3]}"/><stop offset=".55" stop-color="${p[2]}"/><stop offset="1" stop-color="${p[1]}"/></radialGradient>` +
    `<pattern id="ht" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.1" fill="${p[4]}" fill-opacity=".22"/></pattern>`;
  const one = (tx, ty, s, hair, acc) => {
    const h = HAIR[hair] || '';
    return `<g transform="translate(${tx} ${ty}) scale(${s})"><g transform="translate(5 -3)" fill="${p[4]}" opacity=".4">${h}${BUST}</g><g fill="${p[0]}">${h}${BUST}</g>` +
      `${hair === 'phones' ? PHONES(p[3]) : ''}${acc ? SHADES(p[3]) : ''}</g>`;
  };
  let figs;
  const hairs = ['short', 'long', 'afro', 'bun', 'cap', 'mohawk', 'phones'];
  if (ar.band === 3) {
    const hs = [0, 1, 2].map(() => hairs[Math.floor(r() * hairs.length)]);
    figs = one(-29, 112, .66, hs[0], r() < .3) + one(131, 112, .66, hs[1], r() < .3) + one(51, 92, .66, hs[2], r() < .4);
  } else if (ar.band === 2) {
    const hs = [0, 1].map(() => hairs[Math.floor(r() * hairs.length)]);
    figs = one(-30, 76, .8, hs[0], r() < .3) + one(86, 66, .8, hs[1], r() < .4);
  } else figs = one(0, 0, 1, ar.hair, ar.shades);
  const b = `<rect width="${W}" height="300" fill="url(#pg)"/><rect width="${W}" height="300" fill="url(#ht)"/>` +
    `<g filter="url(#b)" opacity=".55"><circle cx="${n0(r() * W)}" cy="${n0(r() * 120)}" r="64" fill="${p[4]}"/></g>` +
    (W === 300 ? figs : `<g transform="translate(${W - 330} 24)">${figs}</g>`);
  return [d, b];
}

function coverLabel(r, p, a, ar) {
  const m = r();
  if (m < .35) return '';
  const c = p[4];
  const top = `<text x="20" y="34" font-family="${FONT}" font-weight="700" font-size="11" letter-spacing="2.6" fill="${c}" fill-opacity=".9">${esc(ar.name.toUpperCase())}</text>`;
  if (m < .68) return top;
  return top + `<text x="20" y="276" font-family="${FONT}" font-weight="800" font-size="${a.title.length > 15 ? 20 : 26}" letter-spacing="-.5" fill="${c}">${esc(a.title)}</text>`;
}

export const art = {
  album: a => memo('a:' + a.id, () => {
    const r = rng(a.id), p = PAL[a.pal], [d, b] = STYLES[a.style](r, p);
    return svgDoc(d, b + coverLabel(r, p, a, ART[a.artist]));
  }),
  artistWide: ar => memo('w:' + ar.id, () => {
    const [d, b] = portrait(rng(ar.id), PAL[ar.pal], ar, 900);
    return svgDoc(d, b, .35, 900);
  }),
  artist: ar => memo('r:' + ar.id, () => {
    const [d, b] = portrait(rng(ar.id), PAL[ar.pal], ar);
    return svgDoc(d, b, .35);
  }),
  playlist: pl => memo('p:' + pl.id, () => {
    const r = rng(pl.id), p = PAL[pl.pal ?? 10];
    if (pl.style === 'mix') {
      const ar = ART[pl.mixArtist], [d, b] = portrait(rng(ar.id), PAL[ar.pal], ar);
      return svgDoc(d, b + `<rect y="242" width="300" height="58" fill="${pl.mixColor}"/><text x="150" y="280" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="22" fill="#fff">${esc(pl.title)}</text>${MARK}`, .3);
    }
    if (pl.style === 'chart') {
      const [d, b] = STYLES.chart(r, p, pl.chart);
      return svgDoc(d, b);
    }
    if (pl.style === 'radar') {
      const [d, b] = STYLES.radar(r);
      return svgDoc(d, b);
    }
    const [d, b] = STYLES[pl.style](r, p);
    const shadeDef = `<linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>`;
    return svgDoc(d + shadeDef, b + `<rect width="300" height="300" fill="url(#lg)"/><text x="20" y="274" font-family="${FONT}" font-weight="900" font-size="${pl.title.length > 14 ? 26 : 32}" letter-spacing="-1" fill="#fff">${esc(pl.title)}</text>${MARK}`);
  }),
  liked: () => memo('liked', () => svgDoc(
    `<linearGradient id="lk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a0ca3"/><stop offset=".55" stop-color="#7b2cbf"/><stop offset="1" stop-color="#ff8fa3"/></linearGradient>`,
    `<rect width="300" height="300" fill="url(#lk)"/><g transform="translate(90 92) scale(5)"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" fill="#fff"/></g>`, .25
  )),
  me: () => memo('me', () => {
    const [d, b] = portrait(rng('me-avatar'), PAL[14], { hair: 'short' });
    return svgDoc(d, b, .2);
  }),
};

export const ARTISTS = [];
export const ART = {};

export const ALBUMS = [];
export const ALB = {}, TR = {};
export const ALL = [];

export const topTracks = () => [];

export const PLAYLISTS = [];
export const PL = {};

export const LYRICS = [
  ['Streetlights humming in a minor key', 'Every window holds a secret, none of them for me', 'We were racing down the boulevard at two', 'Painting all the city red, the way we always do',
    'Oh, the afterglow, the afterglow', 'Burning slow on the radio', "Hold me like the night won't end", 'In the afterglow, my friend',
    'Taxi meters ticking like a heart', 'We were never good at endings, only starts', 'Chrome and petals on the dashboard light', "Say you'll stay until the morning steals the night",
    'Oh, the afterglow, the afterglow', "Everything we'll never know", "Hold me like the night won't end", 'In the afterglow, my friend'],
  ['Sunday morning, coffee going cold', "You've got stories that you've never told", 'Let the record spin a little slow', "There's nowhere that we need to go",
    'Slow honey, pour it over me', 'Sweet as summer, soft as the sea', 'Slow honey, stay right where you are', 'Golden like the light inside a jar',
    'Linen curtains dancing in the breeze', 'Every worry falling like the leaves', "Call me softly, call me when you're near", 'Everything I need is right here',
    'Slow honey, pour it over me', 'Sweet as summer, soft as the sea'],
  ["Sun is going down but we're just getting started", 'Hands up high for the ones who never parted', 'Feel the drum, feel the bass, feel the city in your chest', 'Golden hour riot, put your worries all to rest',
    'Oh-oh, we go higher', 'Oh-oh, set the sky on fire', 'Dance until the morning, never tire', 'Golden hour, golden hour riot',
    'Palm wine skies and the music never stopping', 'Everybody moving and the speakers keep on knocking', "Shine your eye, it's a beautiful night", "Everybody here is gonna be alright",
    'Oh-oh, we go higher', 'Oh-oh, set the sky on fire'],
];

export const HERO = [
  { album: 'afterglow-district', eyebrow: 'New album', desc: 'Neon synths, night buses and one very long boulevard. <b>Nova Vale</b> returns with seven songs made for driving nowhere.' },
  { album: 'golden-hour-riot', eyebrow: 'Out now', desc: '<b>Kairo Sun</b> turns every sunset into a block party. Highlife guitars, log drums and hooks you will hum for weeks.' },
  { album: 'glass-weather', eyebrow: 'Trending', desc: 'Heartbreak with a sugar rush. <b>Juniper Hale</b>&#39;s third album is the forecast everyone is talking about.' },
  { album: 'concrete-gardens', eyebrow: 'Editor&#39;s pick', desc: 'Rooftop cyphers and flowers through cracks. <b>Saffron Kade</b> delivers sharp bars and warm beats with zero filler.' },
];

export const GENRES = [
  ['Pop', '#8d67ab', 'glass-weather'], ['Hip-Hop', '#ba5d07', 'concrete-gardens'], ['Indie', '#608108', 'paper-moons'], ['Electronic', '#0d73ec', 'neon-psalms'],
  ['Lo-fi', '#477d95', 'midnight-laundromat'], ['Soul', '#dc148c', 'slow-honey'], ['Afrobeats', '#27856a', 'golden-hour-riot'], ['Jazz', '#1e3264', 'blue-room'],
  ['Folk', '#8c1932', 'ash-season'], ['Shoegaze', '#503750', 'fuzz-fluorescence'], ['Dream pop', '#148a08', 'saltwater-letters'], ['Synth-pop', '#e8115b', 'afterglow-district'],
];

export const hdrOf = p => shade(p[2], .35);

export function splitCtx(ctx) {
  if (!ctx) return ['', ''];
  const i = ctx.indexOf(':');
  return [ctx.slice(0, i), ctx.slice(i + 1)];
}

export function ctxTracks(ctx, likedSet = new Set()) {
  if (!ctx) return [];
  const [k, id] = splitCtx(ctx);
  if (k === 'album') return ALB[id] ? ALB[id].trackIds.slice() : [];
  if (k === 'playlist') return id === 'liked' ? [...likedSet].reverse() : (PL[id] ? PL[id].trackIds.slice() : []);
  if (k === 'artist') return topTracks(id).map(t => t.id);
  return [];
}

export function ctxInfo(ctx) {
  if (!ctx) return { title: 'Redline', href: '#/home' };
  const [k, id] = splitCtx(ctx);
  if (k === 'album' && ALB[id]) return { title: ALB[id].title, href: `#/album/${id}` };
  if (k === 'playlist') return id === 'liked' ? { title: 'Liked Songs', href: '#/playlist/liked' } : { title: PL[id]?.title || 'Playlist', href: `#/playlist/${id}` };
  if (k === 'artist' && ART[id]) return { title: ART[id].name, href: `#/artist/${id}` };
  if (k === 'search') return { title: 'Search results', href: '#/search' };
  return { title: 'Redline', href: '#/home' };
}
