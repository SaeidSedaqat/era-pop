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

  // What a customer says, in the voice of their look's era. {a} becomes "a Bicycle", "a Car"...
  // order: one is picked when they walk in. thanks / angry: their reaction when served / when they give up.
  voices: [
    { order: ['Ug need {a}. Ug feet very tired.', 'Give Ug {a}! Ug trade you nice rock.', 'Mammoth too slow. Ug want {a}!'],
      thanks: 'Ug happy! Ug name it Rock.', angry: 'Ug walk. Ug sad.' },
    { order: ['I need {a} before the Nile floods again!', 'The pharaoh demands {a}. Also a snack.', 'My camel quit. Please, {a}!'],
      thanks: 'Blessings of the sun upon you!', angry: 'I will carve rude hieroglyphs about this.' },
    { order: ['Hark! I require {a} for my quest!', 'My horse hath fled. Fetch me {a}, good shopkeep!', 'The dragon awaits. I need {a}, posthaste!'],
      thanks: 'Huzzah! Thou art most noble!', angry: 'Fie! I shall walk, like a peasant!' },
    { order: ['Good day. One would like {a}, if it is no bother.', 'I cannot be late for tea. I need {a}, quickly!', 'Splendid shop! I shall take {a}, wrapped in velvet.'],
      thanks: 'Jolly good! A shilling for your trouble.', angry: 'How dreadfully slow. Good day, sir!' },
    { order: ['Hey daddy-o, hook me up with {a}!', 'I need {a}, man, the sock hop starts in five!', 'Make it {a} with flames on it. Crazy!'],
      thanks: 'Real gone, man! You\'re the most!', angry: 'Bummer, man. I\'m outta here.' },
    { order: ['Roger that! Requesting {a}, over!', 'Wind\'s perfect today. Got {a} for me?', 'Mayday, mayday! I need {a}!'],
      thanks: 'Tally-ho! Smooth landing!', angry: 'Out of fuel and patience. Over and out.' },
    { order: ['Greetings, past human. Requesting {a}.', 'My jetpack is charging. I will take {a} meanwhile.', 'In my time {a} is a museum piece. I need one!'],
      thanks: 'Transaction complete. Five stars!', angry: 'Ugh. Back to the future, then.' },
  ],

  orderLine(look, job) {
    const lines = this.voices[look].order;
    return lines[Math.floor(Math.random() * lines.length)].replace('{a}', 'a ' + this.items[job]);
  },

  reactLine(look, served) {
    return served ? this.voices[look].thanks : this.voices[look].angry;
  },

  // One funny story per hybrid customer, keyed 'look-job'. Shown when a collected card is tapped in the Book.
  stories: {
    '0-1': 'Ug planted rocks for three seasons, waiting for a rock tree. When a carrot finally popped up by accident, he named it Kevin and refused to eat it.',
    '0-2': 'He jousts on a very confused goat, and his armor is mostly bark. He has never lost a duel, mainly because nobody understands the rules he grunts.',
    '0-3': 'His monocle is made of river ice and melts every afternoon. Tea time is strictly at noon, which he checks by pointing a stick at the sun and shouting.',
    '0-4': 'He styles his hair with mammoth fat and combs it with a fish bone. His leather jacket used to be a very angry bear, and the collar still growls.',
    '0-5': 'He flies by jumping off cliffs and flapping really hard. His logbook has one entry: "Down." He considers this a very successful career.',
    '0-6': 'He thinks the Moon is a big tasty rock and has been trying to lick it ever since. Mission Control has asked him, again, to stop licking the window.',
    '1-0': 'He lives in a cave but insists it is a pyramid "turned inside out." His grocery lists are carved on the walls, and they are all drawings of rocks.',
    '1-2': 'He rides a camel into battle and polishes his armor with sand, which only makes it scratchier. His sworn enemy is one particularly rude crocodile.',
    '1-3': 'He wraps his tea bags like tiny mummies before steeping them. He once tipped a waiter with a sacred cat and was politely asked to leave.',
    '1-4': 'He drag-races chariots down the Nile road every Friday night. His hair is held up by a pharaoh-sized amount of gel and one beetle who lives there.',
    '1-5': 'He tried to fly a pyramid by tilting it really hard. It is still on the runway, making it the slowest takeoff in history: four thousand years and counting.',
    '1-6': 'He packed his space capsule with everything needed for the afterlife, including a full-size boat. Mission Control had questions. So many questions.',
    '2-0': 'Sir Grug was knighted for discovering fire, then immediately set the Round Table on fire. It is now called the Slightly Shorter Table.',
    '2-1': 'He guards his turnips in full armor and challenges every crow to a duel. The crows have formed an alliance, and honestly, they are winning.',
    '2-3': 'He bows so deeply that his visor slams shut every time. He has introduced himself to the same lamp post eleven times and it still ignores him.',
    '2-4': 'His trusty steed is a horse with a pompadour. He calls everyone "daddy-o, good sir" and has started three jousts at the local diner.',
    '2-5': 'He tried to fly a dragon, but the dragon wanted to fly him. They compromised: now they both walk and argue about directions.',
    '2-6': 'He planted his banner on Mars and claimed it for the king. The king has no idea where Mars is, but has already asked for taxes.',
    '3-0': 'He clubs his dinner with a very polite cane and apologizes to it afterwards. His cave has wallpaper, a butler, and absolutely no fire safety.',
    '3-1': 'He wears a top hat to milk the cows and insists they call him "Sir." The cows have not complied. One of them ate his monocle.',
    '3-2': 'He duels with an umbrella, and only on Tuesdays, weather permitting. His greatest battle was against a rain cloud. It ended in a draw.',
    '3-4': 'He rides a penny-farthing with flames painted on the big wheel. His leather jacket has coat tails, and his comb is silver and slightly too fancy.',
    '3-5': 'His hot-air balloon runs entirely on tea steam. Every flight ends in an emergency landing, because someone has to refill the kettle.',
    '3-6': 'He packed fourteen suitcases for the Moon, all of them hats. When asked about oxygen, he replied that a gentleman simply holds his breath.',
    '4-0': 'He invented the wheel, then immediately gave it whitewall tires. Every night he cruises the valley on a rock with fuzzy dice hanging off it.',
    '4-1': 'He plays rock and roll to his corn so it grows taller. It worked, but now the corn has sideburns and won\'t listen to anyone.',
    '4-2': 'He fights dragons with a jukebox and a really cool attitude. His armor is chrome, his horse is cherry red, and both have tail fins.',
    '4-3': 'He drinks his tea through a milkshake straw and calls the Queen "baby." He has been asked to leave six royal garden parties.',
    '4-5': 'He has a jukebox in the cockpit and hits every bump of turbulence on the beat. Passengers call it Rock Around the Clouds.',
    '4-6': 'His rocket has whitewall tires, which do absolutely nothing in space. He still stops at every star for a malt.',
    '5-0': 'He wears flying goggles to hunt, which mostly helps him see how fast the mammoth is running away. He salutes every bird, just in case.',
    '5-1': 'He crop-dusts by throwing seeds out of his scarf mid-flight. Half the village now has beans growing on their roofs.',
    '5-2': 'He jousts from a biplane and has hit absolutely nothing. He once knocked a pigeon\'s hat off, and they have been rivals ever since.',
    '5-3': 'He serves tea at 3,000 feet and has never spilled a drop, mostly because the tea flies out of the cup before it can land anywhere.',
    '5-4': 'He combs his hair mid-flight, and the wind combs it right back. He thinks this is a duel, and he is losing.',
    '5-6': 'He tried to reach space in a biplane by pulling really, really hard on the stick. He got close enough to wave at a satellite. It did not wave back.',
    '6-0': 'He has a laser spear and a robot mammoth, but still talks only in grunts. His smart fridge has learned to grunt back.',
    '6-1': 'He grows space potatoes from a hover-tractor and talks to them through an app. The potatoes have started leaving one-star reviews.',
    '6-2': 'His sword is a beam of light and his horse is a hoverboard with a mane. He still gets stuck in doorways, because his armor is "retro-chic."',
    '6-3': 'His monocle is a hologram that shows the stock market and cat videos. He brews tea with a fusion reactor and judges anyone who owns a kettle.',
    '6-4': 'His hoverbike has real flames, which is why he is banned from four space stations. His hair is held up with anti-gravity gel.',
    '6-5': 'He flies a starship but wears a leather scarf and goggles "for the feel." The autopilot has begged him to stop shouting "Contact!" at takeoff.',
  },

  story(look, job) {
    return this.stories[look + '-' + job] || '';
  },

  customerName(look, job) {
    const e = this.eras;
    return look === job ? e[job].baseName : e[look].lookAdj + ' ' + e[job].jobNoun;
  },
};
