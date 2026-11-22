# Midnight Vault — best-heist-game-20261122-0559-v1

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Barkie303/best-heist-game-20261122-0559-v1/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Barkie303/best-heist-game-20261122-0559-v1/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Midnight Vault** is a top-down stealth heist game. You are Wren, a cat burglar with three floors to clean out in one night: a gilded gallery, an iron bank vault, and a neon casino. Each floor is a room to cross — guards patrol with red vision cones, cameras sweep orange cones, lasers blink across the vault door — and every piece of loot has to be cracked open (hold E) before the green exit unlocks.

## How it plays

- **Move** with WASD / arrow keys, or click anywhere to walk there. **Shift** sneaks (slower, harder to spot). **Hold E** beside loot to crack it.
- **Tools cost loot:** smoke bombs (key 1, vanish for 3s), EMP charges (key 2, cameras off for 6s), a lockpick (crack loot twice as fast). Buy them in the shop between heists with the banked loot.
- **Vents** hide you completely; **shadow patches** slow detection; **noise** (walking loud) turns nearby guards toward you.
- **Alarm meter** (top bar) fills while a camera or a suspicious guard sees you and drains while you stay hidden. At 100% the floor locks down — BUSTED. A guard that catches you costs a life; three lives for the whole run.
- Grab the loot target, reach the exit, bank the take, and spend it before the next floor. Finish all three for the getaway — with a ghost bonus if no one ever saw you.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files. Screenshots in `screenshots/` are real renders of the game's own code (`?shot=start|play|tools|end` stages each scene from the live rules). Hand it in with `MAKEFUN_OUTPUT_DIR=out node main.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=1qzhe0a6&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
