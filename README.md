# Era Pop

Casual drop-and-merge (Suika-style) game with customer orders. The merge chain is the history of transport, and customers arrive from mixed-up eras.

**Play:** https://saeidsedaqat.github.io/era-pop/

Built with [Phaser 4.2.1](https://phaser.io) (vendored in `lib/`) and Matter.js physics. All visuals are placeholders drawn in code.

## How to play

- **Tutorial:** the first run starts with a short, mandatory tutorial: drop, merge, serve a customer, then the danger line. It's remembered once finished (localStorage `erapop.tutorial.v1`).
- **Drop:** touch or click inside the capsule, move to aim, release to drop. With a mouse, the bubble follows the cursor.
- **Merge:** two identical bubbles that touch merge into the next tier: Wheel, Cart, Carriage, Bicycle, Car, Plane, Rocket. Two Rockets merge and disappear. Merges in quick succession build a combo multiplier.
- **Orders:** one customer at a time walks in and says what they want, in their era's voice. Any item from Wheel to Rocket can be ordered (Car, Plane and Rocket join over time), and customers you haven't collected in the Book yet come first. Every order you serve raises the order bonus (+10% each, up to x2.5).
- **Serve:** drag a bubble onto the customer's card (bubbles they ordered glow, and the card flashes while you drag one). Serve fast for a tip. A plain tap anywhere in the capsule (even on a bubble) just drops.
- Orders time out and cost points. You lose when the stack stays above the dashed line.
- **Time storms:** every few minutes the portal glitches for 15 s: an era invasion, a merge frenzy, or a rush hour, each with bonus rewards.
- **Customer Book:** every hybrid customer you serve is collected (42 in total) and saved in your browser. Tap a collected card in the Book to read that customer's funny story.
- **Pause:** the pause button in the HUD opens a menu: Play, Music on/off, SFX on/off, Book and Restart. Music and SFX choices are remembered.
- **Sound:** background music and sound effects (all CC0, credits in [`assets/audio/CREDITS.txt`](assets/audio/CREDITS.txt)).
- **Revive:** once per run, a free **Revive** on the game over screen clears the top of the capsule. No ads yet: a rewarded ad will be wired into Revive at full launch.

## Tuning

Every balancing value (scoring, timers, penalties, order ramp-up, customer slots, physics, audio volumes) is in [`src/config.js`](src/config.js).

## Project layout

| File | Purpose |
| --- | --- |
| `src/config.js` | All tunable values |
| `src/data.js` | Merge chain and eras |
| `src/draw.js` | Code-drawn fallback art (used if a sheet is missing) |
| `src/art.js` | Slices the art in `assets/` into textures at load time |
| `src/audio.js` | Music, sound effects, music/SFX switches |
| `src/BgScene.js` | Background picture behind everything |
| `src/storage.js` | Saves (best score, Customer Book, settings): CrazyGames SDK Data module on CrazyGames, localStorage elsewhere |
| `src/GameScene.js` | Capsule, physics, merging, customers, scoring |
| `src/UIScene.js` | Responsive layout, HUD, cards, input, overlays |

The source runs as is, with no build step. Every push to `main` redeploys GitHub Pages through `.github/workflows/deploy.yml`.

## Release build

`release/` holds the build to upload to game portals (live at `/era-pop/release/`). Rebuild it before each release:

```
dotnet run --project tools/build-release
```

The page loads the CrazyGames SDK v3, and on CrazyGames the saves go through its Data module, so pick "Yes, using the Data Module" for Progress Save when submitting there. On any other site the SDK is disabled and saves stay in localStorage. Add `?useLocalSdk=true` to the URL to try the SDK in its local mode.

The tool (C#, [NUglify](https://github.com/trullock/NUglify)) bundles Phaser and every `src/` file, in `index.html` order, into one `release/game.js`. The game code is minified and its local names shortened. It also writes a minified `release/index.html` and copies `assets/` unchanged. Each GitHub release attaches the same files as `release.zip`.

## Versioning

`vA.B.C`: each new feature adds 10 to C, each tweak adds 1. C goes up to 999, then B goes up by one and the remainder carries over (v0.1.995 + one feature = v0.2.5). A becomes 1 on release. The version shown in-game comes from `src/config.js`.
