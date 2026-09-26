# Sundown Sprint

A browser platformer. Dusky carries a lantern home as the sun goes down, across 11 worlds of 4 levels each: underground passages in every x-2 and a fire fortress with a Gloomling boss at every x-4. It has frame-exact NES-style movement physics, real-time lantern lighting and fully procedural art and music.

**Play:** https://kapilsh.github.io/sundown-sprint/ (published from `main` by GitHub Actions). Press `F` for full screen.

```sh
npm run dev      # play at http://localhost:8080  (test mode: /?test, one level: /?level=2-3, watch the bot: /?watch=1-1)
npm test         # physics golden traces, level structure, and every recorded bot run
npm run solve    # bot plays every level to prove it can be finished
npm run levels   # regenerate levels/*.json from tools/
```

No dependencies. Needs Node 20+ for the tools; the game itself is static files.

CI (`.github/workflows/ci.yml`) runs the tests and checks the level JSON matches its generators on every push. `Solve levels` is a manual workflow that runs the bot over all 44 levels, one world per job.
