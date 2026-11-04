// Static game data: merge chain and eras.

// Fonts (self-hosted in assets/fonts): Orbitron for titles, scores and buttons; Exo 2 for small text.
window.ERA_FONTS = {
  title: "Orbitron, 'Arial Black', sans-serif",
  body: "'Exo 2', Arial, sans-serif",
};

window.ERA_DATA = {
  items: ['Wheel', 'Cart', 'Carriage', 'Bicycle', 'Car', 'Plane', 'Rocket'],

  // Bubble tint per tier.
  tierColors: [0xc9b49a, 0xd99a52, 0xb07ee0, 0x62c97a, 0x3cc8c0, 0xf28b30, 0xff5a85],

  // One entry per era. Index = tier the era's job orders.
  // look* fields style the art (Look); job* fields decide the costume and the order (Job).
  eras: [
    { baseName: 'Caveman', lookAdj: 'Caveman', jobNoun: 'Caveman', short: 'Stone',
      bg: 0xc9b28a, main: 0x8f877d, accent: 0x5b4a3a, pattern: 'spots' },
    { baseName: 'Ancient Egyptian Farmer', lookAdj: 'Egyptian', jobNoun: 'Farmer', short: 'Egypt',
      bg: 0xf2d27a, main: 0xe0ac34, accent: 0x2b5fa8, pattern: 'stripes' },
    { baseName: 'Medieval Knight', lookAdj: 'Medieval', jobNoun: 'Knight', short: 'Medieval',
      bg: 0xbcaee0, main: 0x9aa3ad, accent: 0x6a3fa0, pattern: 'rivets' },
    { baseName: 'Victorian Gentleman', lookAdj: 'Victorian', jobNoun: 'Gentleman', short: 'Victorian',
      bg: 0xb9a48c, main: 0x3b3036, accent: 0xb08850, pattern: 'check' },
    { baseName: '1950s Greaser', lookAdj: '1950s', jobNoun: 'Greaser', short: '1950s',
      bg: 0xffc2d8, main: 0xff6fa5, accent: 0x2fb8b0, pattern: 'polka' },
    { baseName: 'Old-School Pilot', lookAdj: 'Old-School', jobNoun: 'Pilot', short: 'Pilot',
      bg: 0xa9c4e0, main: 0x7a5230, accent: 0x6b7d3a, pattern: 'stitch' },
    { baseName: 'Future Astronaut', lookAdj: 'Future', jobNoun: 'Astronaut', short: 'Future',
      bg: 0x1d2b4f, main: 0xdfe6ee, accent: 0x22e3ff, pattern: 'circuit' },
  ],

  // Capsule skins: -1 is the default; 0–6 unlock by collecting all 6 hybrids with that era's look.
  skin(index) {
    const e = this.eras[index];
    if (!e) return { glass: 0xbfe9ff, portal: [0x22e3ff, 0xff6fa5, 0xf2d27a, 0xb07ee0] };
    return { glass: e.main === 0x3b3036 ? e.accent : e.main, portal: [e.accent, e.bg, e.main, 0xffffff] };
  },

  customerName(look, job) {
    const e = this.eras;
    return look === job ? e[job].baseName : e[look].lookAdj + ' ' + e[job].jobNoun;
  },
};
