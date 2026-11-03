# Era Pop

Casual drop-and-merge (Suika-style) game with customer orders. The merge chain is the history of transport, and customers arrive from mixed-up eras.

**Play:** https://saeidsedaqat.github.io/era-pop/

Built with [Phaser 4.2.1](https://phaser.io) (vendored in `lib/`) and Matter.js physics. All visuals are placeholders drawn in code.

## How to play

- **Drop:** touch or click inside the capsule, move to aim, release to drop. With a mouse, the bubble follows the cursor.
- **Merge:** two identical bubbles that touch merge into the next tier: Wheel, Cart, Carriage, Bicycle, Car, Plane, Rocket. Two Rockets merge and disappear.
- **Serve:** double tap a bubble to give it to a customer who ordered it, or drag it onto that customer.
- Orders time out and cost points. You lose when the stack stays above the dashed line.
- **Customer Book:** every hybrid customer you serve is collected (42 in total) and saved in your browser.

## Tuning

Every balancing value (scoring, timers, penalties, order ramp-up, customer slots, physics) is in [`src/config.js`](src/config.js).

## Project layout

| File | Purpose |
| --- | --- |
| `src/config.js` | All tunable values |
| `src/data.js` | Merge chain and eras |
| `src/draw.js` | Code-drawn bubbles, vehicles and customers |
| `src/storage.js` | Best score and Customer Book (localStorage) |
| `src/GameScene.js` | Capsule, physics, merging, customers, scoring |
| `src/UIScene.js` | Responsive layout, HUD, cards, input, overlays |

There is no build step. Every push to `main` redeploys GitHub Pages through `.github/workflows/deploy.yml`.

## Versioning

`vA.B.C`: each new feature adds 10 to C, each tweak adds 1. C goes up to 999, then B goes up by one and the remainder carries over (v0.1.995 + one feature = v0.2.5). A becomes 1 on release. The version shown in-game comes from `src/config.js`.
