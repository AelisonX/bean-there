# Bean There — Quality Control v0.4

A very normal job. An increasingly unreasonable supervisor.

## What's changed
- A populated opening: 24 beans, including three obvious rejects. Continuous waves replace the old empty gaps. Mud and wildlife arrive inside the normal flow.
- Every 10 seconds (10–80s), the belt speeds up slightly, incoming bean count rises, and the supervisor comments on recent mistakes. No interruption or modal dialogue.
- Start with a total allowance of 10 misses: the 11th fails. Every pressure step adds 5 to the allowance, without erasing previous misses. At 80s, 50 misses are allowed; the 51st fails. Every missed bad/muddy bean and foreign object counts separately.
- The counter changes emphasis and sounds a brief warning when only three misses remain. No full-screen flashing or shaking.
- Tap precisely to grab one item. Move a held pointer more than 7 logical pixels to sweep continuously. Sweep width scales with equipment; precise tap tolerance stays narrow. Only two hands can carry objects at once. One briefly queued precise tap follows its selected bean, rather than grabbing an unrelated one.
- Tool upgrades at 20, 40, 60, 80 seconds unlock the next permanently owned arm and immediately equip it, until all five are owned. Existing progress is preserved. Later arms have larger jaws, hydraulics, higher speed and broader sweeping. Gold is a real upgrade.
- Reports include sellable beans, wasted good beans, good-bean yield and cumulative misses, as well as score and clean streak. Indiscriminately sweeping good beans is costly, but does not create a separate failure condition.

## Rules and scoring
Survive 90 seconds without exceeding the current miss allowance. Pick bad pods and foreign objects; leave good pods on the belt. A slightly curved green full-length pod is good. Yellow, tightly curled, short, tiny, oversized, wormy and mud-stained pods are rejects.

Reject picked +20; good bean reaches the end +2; 20 consecutive correct actions +30; entire muddy batch removed +100. A mistaken good-bean pick costs 18 points (floor zero), breaks the clean streak and reduces good-bean yield. Clearing only part of a muddy batch cannot earn its bonus. Mistakes do not fabricate additional penalties when the supervisor speaks.

Every finished or failed shift banks its score once. Mid-shift arm unlocks save immediately; score is banked only at the end. Closing mid-shift loses that unbanked score. Progress, best score, equipped tool and sound setting are browser-local. No analytics, advertisements, purchases, account backend or external runtime dependencies.

## Controls
Mouse or touch: tap a reject; hold and drag to sweep. Pause button or P/Esc pauses; hidden tabs pause automatically and require explicit resume. Arrow keys select an object and Space picks it. Sound button mutes feedback. Reduced-motion preferences disable vibration and supervisor bubble animation.

## Running and publishing
Open `index.html`, or run `python3 -m http.server 8000` and open http://localhost:8000.
For GitHub Pages, unzip this package and upload all files and folders inside it to the repository root and select Settings → Pages → Deploy from a branch → main / root. No build step. Do not copy private hosting metadata into another host.

## Validation
Run `node tests/engine.test.cjs` and `node tests/interactions.test.cjs` from this directory.
30 tests pass (12 engine + 18 interaction), including initial traffic, cumulative limits and exact failure thresholds, individual dirty-bean misses, ten-second escalation, no-work loss, game-over freeze, supervisor context, uninterrupted traffic, old-save migration, per-hand occupancy, precise-vs-sweep selection, pause/restart and report metrics. Twenty seeded 90-second shifts are solvable by a simulated player constrained by two hand slots and the actual tool cooldown/duration. This establishes a winning path, not human difficulty calibration.
Interaction tests use a mock DOM/canvas. Chrome preview QA checked the new menu, populated start, mouse picking/sweeping, miss counter and HUD. Physical iPhone/Safari remains unverified; user playtesting is still needed for density and touch feel.

## Art and implementation
The original generated factory image is preserved. Beans, wildlife, tools, conveyor movement and trash are lightweight code-drawn animation. Upgraded arms are simplified 2D forms, not the full 3D concept renders. `engine.js` contains simulation; `game.js` contains rendering/input/menus/persistence; `content.js` holds equipment stats; CSS/HTML provide the responsive portrait shell. The discontinued ALFRED digestive game is not included.
