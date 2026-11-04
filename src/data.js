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
    if (!e) return { glass: 0xbfe9ff, frameTint: 0xffffff, portal: [0x22e3ff, 0xff6fa5, 0xf2d27a, 0xb07ee0] };
    const glass = e.main === 0x3b3036 ? e.accent : e.main;
    return { glass, frameTint: glass, portal: [e.accent, e.bg, e.main, 0xffffff] };
  },

  // ---- Customer speech: the Look sets the voice, the Job sets what they want and why ----
  // {item} = the ordered item, {why} = a reason picked from the job's list.
  reasons: [
    ["Rocks don't roll themselves.", 'The mammoth race is at noon.', 'Square ones keep failing.'],
    ["The turnips won't carry themselves.", 'My donkey wants a day off.', 'Harvest waits for no one.'],
    ['A princess needs a lift.', 'My dragon refuses to drive.', 'Arriving on foot is so peasant.'],
    ['Tea is at four sharp.', 'My monocle needs fresh air.', 'The tall one, naturally.'],
    ['The drive-in starts at eight.', 'My hair needs wind.', 'Gotta cruise to the diner.'],
    ["The mail won't fly itself.", 'The clouds are calling.', 'My scarf needs flapping.'],
    ['Lunch is on the Moon.', 'Mars has better parking.', 'Gravity is so last century.'],
  ],
  voices: [
    { // Stone Age
      arrive: ['UGH! Me want {item}. {why}', 'Me need {item}. Me pay in shiny rock.', '{item}! Now! ...please.'],
      hurry: ['Me wait long. Me grumpy.', 'Hurry! Fire going out!', 'UGH. Slow time-bubble.'],
      thanks: ['Ooga! Best {item}!', 'Me happy. Me tell whole cave.', 'Ugh-mazing!'],
      leave: ['Me go invent own {item}.', 'UGH. Me stomp home.', 'No {item}? Back to rocks.'],
    },
    { // Ancient Egypt
      arrive: ['By Ra, I need a {item}! {why}', "One {item}, please. Pharaoh's orders.", 'Seeking a {item}. Will pay in grain.'],
      hurry: ['The sun god is waiting!', 'Faster than a sandstorm, please!', 'My mummy said to hurry.'],
      thanks: ['Blessings of the Nile upon you!', 'Worth a whole pyramid!', 'Ra-diant service!'],
      leave: ['I shall complain to the Sphinx.', 'Too slow. Off to the Nile.', 'Not even a pyramid waits this long.'],
    },
    { // Medieval
      arrive: ['Hark! A {item}, good merchant! {why}', 'Prithee, one {item}. Posthaste!', 'By my helmet, I require a {item}!'],
      hurry: ['Make haste, I beseech thee!', 'My quest grows cold!', 'Forsooth, this is slow!'],
      thanks: ['Huzzah! A fine {item}!', 'Thou art a true hero!', 'Most excellent, good merchant!'],
      leave: ['Fie! I ride elsewhere!', 'This shop is a dungeon of waiting.', 'I shall write a sad ballad.'],
    },
    { // Victorian
      arrive: ['I say, one {item}, if you please. {why}', 'A {item}, old chap. Chop chop!', "Splendid shop! I'll take a {item}."],
      hurry: ['Tick tock, my good fellow!', 'My tea grows cold!', 'Most irregular delay!'],
      thanks: ['Jolly good show!', 'Smashing {item}, old bean!', 'Capital! Simply capital!'],
      leave: ['Well, I never!', 'Harrumph! Good day, sir!', 'I shall write to the Times.'],
    },
    { // 1950s
      arrive: ['Hey daddy-o, one {item}! {why}', 'Gimme a {item}, make it snappy!', "Cool shop. I'll take a {item}."],
      hurry: ['Make it snappy, cat!', "My milkshake's melting!", "Don't be a square, hurry!"],
      thanks: ['Real gone, man!', "This {item} is the bee's knees!", 'Crazy cool, daddy-o!'],
      leave: ['Later, gator!', "This joint's a drag.", "I'm splitting, daddy-o."],
    },
    { // Old-School pilot
      arrive: ['Roger that: one {item}! {why}', 'Requesting one {item}, over.', 'Tower, I need a {item}!'],
      hurry: ["Fuel's running low!", 'Mayday! Mayday! Hurry!', 'Circling the runway here!'],
      thanks: ['Smooth landing! Thanks!', 'Wilco, and thank you!', 'Top-notch {item}, ace!'],
      leave: ['Abort mission. Over and out.', 'Taking my business elsewhere, over.', 'Grounded by slow service.'],
    },
    { // Future
      arrive: ['BEEP. Require: one {item}. {why}', 'Greetings, past-human. {item}, please.', 'Scanning shop... {item} detected? Want.'],
      hurry: ['Patience module overheating.', 'Error 404: {item} not found.', 'Time-flux unstable. Hurry!'],
      thanks: ['{item} received. Joy level: 100%.', 'Five stars. Six in the future.', 'Beep boop. Gratitude.'],
      leave: ['Rebooting elsewhere. Goodbye.', 'Filing a complaint in the year 3000.', 'Teleporting away. Bye.'],
    },
  ],

  // moment: 'arrive' | 'hurry' | 'thanks' | 'leave'
  line(look, job, moment) {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const s = pick(this.voices[look][moment])
      .replace(/\{item\}/g, this.items[job].toLowerCase())
      .replace('{why}', pick(this.reasons[job]));
    // Capitalise the start of every sentence (an {item} can land right after a full stop).
    return s.replace(/(^|[.!?]\s+)([a-z])/g, (m, p, l) => p + l.toUpperCase());
  },

  customerName(look, job) {
    const e = this.eras;
    return look === job ? e[job].baseName : e[look].lookAdj + ' ' + e[job].jobNoun;
  },
};
