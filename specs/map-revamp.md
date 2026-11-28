SNOW KINGDOM: BIG MAP REVAMP — CLEAN, VARIED, EASY TO GET AROUND (publish to PhoenixOfTheSpoon/wilderland-arcade, bump BUILD)

Problem (see Ravenwatch Woods):
- The map is too cluttered and hard to get around.
- It's annoying during boss fights.
- Every region looks like a repeat: the same pine tree and the same bare Y-shaped tree stamped in grids, rows of identical snow mounds, obstacles everywhere.
Redesign the whole Snow Kingdom map (every region, including the new ones from the world expansion) so it's beautiful, varied and easy to move through.

═══ 1. NO MORE STAMPED PATTERNS ═══
- Stop placing scenery in grids and rows. Use natural clustering (groves, lone trees, clearings, tree lines along cliffs and rivers) with random size, rotation, tint and spacing.
- At least 6–10 different scenery pieces per region, unique to that region. No region is just a recolor of another. For example:
  - Ravenwatch Woods: tall dark firs, dead oaks with ravens, fallen logs, misty hollows.
  - Mirrormere: reeds, ice-fishing huts, frozen docks.
  - Ember Springs: steam vents, warm rocks, bamboo-like canes.
  - Pinecrest: big round pines, stumps, sawmill.
  - Starlight Tundra: open plains, standing stones.
- Ground variety: snow drifts, packed paths, ice patches, rocks, grass poking through, footprints. Not one flat color.
- Each region gets 3–5 hand-placed LANDMARKS you can recognize from far away and on the minimap (a giant dead tree, a ruined tower, a frozen waterfall, a raven statue…).

═══ 2. EASY TO GET AROUND ═══
- Clear ROADS and trails connect villages, camps, waystones, keeps, quest givers and landmarks. Roads are wide, clearly drawn, never blocked, and give a small speed boost.
- Big open clearings and meadows; dense forest only at edges and as walls between areas, not in the middle of walking space.
- Collision:
  - Trees only block at their trunk (small hitbox).
  - Walking behind a canopy makes it fade see-through so you never lose the player.
  - Snow mounds, bushes, grass and small rocks are decoration only (no collision).
  - The player slides smoothly along obstacles instead of getting stuck on corners.
- No dead ends without a reason (a chest, a secret, a view).
- Mounts can use every road.
- A "nearest road" auto-path option on the map: click a destination to get a trail marker.

═══ 3. BOSS FIGHTS: CLEAN ARENAS ═══
- Every boss fight happens in a designed ARENA:
  - open ground with only a few intentional pieces of cover or hazard that are part of the mechanics;
  - clear edges;
  - no random trees or mounds in the way.
- When a boss fight starts in the open world, clear the arena area of decoration (fade it out) and bring it back after.
- Teammates spread out in the arena instead of clumping on the player.

═══ 4. DECLUTTER THE SCREEN ═══
- Contextual HUD: the Heat / Lantern / Snow Pump panel only shows when heat matters (in heat or during Lit events). It hides when Heat is none.
- Bottom action bar:
  - show only the most-used actions (Throw, Use, Roll, the current ability);
  - put the rest in a compact "More" menu;
  - fade the bar when not in use;
  - on phones, use the touch buttons only.
- Name labels on teammates fade out unless they're hurt or talking.
- Teammates follow in a loose formation behind the player instead of piling up around them.
- Minimap: clearer, with roads, landmarks and markers visible, and a toggle to make it bigger or smaller.
- Fix: the fox next to the player is an emoji. Characters and pets must use custom art, never emojis. Replace it.

═══ 5. KEEP SAVES SAFE ═══
- If scenery moves, chests, shrines, quest spots, waystones, keeps and NPCs either keep their places or move to the nearest open spot, keeping their opened/finished status.
- Players standing inside new scenery are moved to the nearest open spot.
- "% explored" and the revealed map stay as they were (recalculate if needed, never lower).
- Nothing resets.

═══ 6. PERFORMANCE ═══
- Fewer, bigger, better-looking pieces instead of thousands of tiny repeated ones.
- Chunk loading as before.
- Must be smoother than now on school Chromebooks and phones.
- Low-effects mode still works.

═══ TEST ═══
- Walk from Camp Cocoa to every region on roads without getting stuck.
- No two regions look alike.
- No grid-stamped trees anywhere.
- Boss fights in Ravenwatch Woods and three other regions have clean arenas.
- The HUD only shows what's needed.
- Teammates don't clump.
- Old saves keep all chests, quests and exploration.
- Smooth on a phone and a Chromebook; saves after a reload.
- Admin (Snow Kingdom only): show collision, show chunk borders, teleport to any landmark.

ALWAYS:
- Never reset or delete progress; migrate old saves.
- The Snow Kingdom has NO heart cap.
- Snow Kingdom upgrades cost Frost Crystals; the Workshop only has ticket boosters for it.
- No emojis for characters, pets or bosses.
- Original music.
- No real money, no ads.
- Each game shows only its own admin controls.