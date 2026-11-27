SNOW KINGDOM: "THE BURNING WINTER" — NEW MAIN STORY (LIT) + 4× WORLD EXPANSION + NEW ENEMIES + SIDE QUESTS + KEEPS + GRAPHICS (publish to PhoenixOfTheSpoon/wilderland-arcade, bump BUILD)

This is a massive update. Build it in parts if needed, publishing and testing after each part, and never break saves.

═══ PART 1: THE MAIN MAP BECOMES AT LEAST 4× BIGGER ═══
- Make the actual Snow Kingdom map (the one with Camp Cocoa, Frostpine Village and the current regions) at least 4× bigger in area. One connected, walkable open world.
- The new areas must NOT go into the "lands beyond" system (snow-saga.js regions loaded one at a time). They are real parts of the main map you can walk, sled, glide and ride to.
- Grow the map AROUND the existing world so nothing already there moves:
  - Camp Cocoa, villages, shrines, chests, raid entrances, quest spots and saved positions keep working exactly.
  - Old saves load in the same place.
- The 11 existing lands beyond keep working as they are (the Dumpling saga must not break). Add real roads and gateways to them from the edges of the bigger map.
- New regions (at least 8, each with its own look, enemies, weather, music and secrets):
  - Pinecrest Hollow: dense snowy pine valley.
  - Mirrormere: a huge frozen lake you can skate across, with ice-fishing huts and cracks to avoid.
  - Northwatch Cliffs: climbing, gliding, eagle nests.
  - Ember Springs: steaming hot springs; warmth zones; where the Lit story starts.
  - Shiverstone Quarry: mines, minecarts, falling rocks.
  - Starlight Tundra: wide open aurora plains at night.
  - Old Mill Marsh: frozen marsh, fog, will-o'-wisps.
  - Ravenwatch Woods: dark woods with a sad, quiet story.
- At least 2 new villages (with shops, an inn, a quest board and their own NPCs) and many small landmarks:
  - ruins, watchtowers, frozen shipwrecks, caves, hidden groves, abandoned cabins.
- Every area has something to find: chests, Frost Crystals, lore notes, shrines, viewpoints that reveal the map.
- Mounts, gliding, climbing and fast travel (waystones in every region) work everywhere.
- The world map shows all regions, reveals as you explore, and has quest markers.

PERFORMANCE (MUST stay smooth on school Chromebooks and phones):
- Split the world into chunks.
- Only load, draw and update the chunks near the player; unload far ones.
- Enemies, animals and fire spreading only run near the player.
- Cap fires, particles and lights on screen.
- Save explored areas and burned/restored areas compactly; the save must stay well under the size limit.

═══ PART 2: NEW MAIN STORY — "THE BURNING WINTER" ═══
THE MYSTERY
- A mysterious figure known only as LIT appears around the Snow Kingdom: a hooded silhouette wreathed in flame, face never shown, who speaks in short cryptic lines.
- Lit sets things on fire: lanterns, trees, cabins, bridges, watchtowers, whole village squares.
- Lit's goal, revealed slowly: turn the whole world into a fireball. A growing ball of fire forms in the sky over the kingdom as the story goes on.
- Who (or what) Lit really is stays a mystery until the final chapter. Write a reveal that fits the Snow Kingdom lore.
  - Do NOT make Lit an existing character (Loki, Mau Mau, Bau Bau, Chao Chao, Minccino, Little Mow, Oswald, Dumpling) unless I say so.
  - Plant clues in side quests and lore notes along the way.
- Dark and sad is fine (burned homes, people who lose things, sacrifices), no gore.
- Existing lore stays exact:
  - Minccino never tells how he died. Chao Chao is never redeemed. Little Mow is not Bau Bau's brother.
  - Dumpling is a leopard gecko drawn side view lying flat.
  - Mau Mau is the chubby orange tabby Royal Guard who loves food. Loki is a golden retriever sorcerer who can't resist a thrown ball.

STRUCTURE
- 10 chapters. It starts after the player has finished the main Dumpling story (fight 6); if they haven't, show the opening sighting as a teaser and lock the rest.
- Chapters move across the new regions:
  - First sightings and strange fires at Ember Springs.
  - A burning village to save.
  - Investigating who Lit is.
  - Fire spreading into the forests.
  - The Scorched Keeps (part 4).
  - Allies from every faction joining (Bau Bau's court, Loki, Mau Mau and the teammates).
  - A finale in the sky against the forming fireball.
- LIT SIGHTINGS: during the story, smoke columns appear at random places on the world map. Reach them in time to catch Lit in the act, put out the fire and find a clue. Lit always escapes until the final chapters.
- World Heat: a story meter that rises ONLY when you advance chapters (never in real time, never while offline).
  - Regions marked "Scorched" get burned scenery and fire enemies until you restore them.
  - After the finale, the world heals: snow returns and burned areas regrow over time.

═══ PART 3: NEW MECHANIC — FIRE vs FROST ═══
- HEAT: near Lit, fires and fire enemies, the air is hot.
  - Snowballs MELT in flight in heat: they shrink and vanish after a short distance, and the hotter it is, the sooner.
  - Normal snowballs can never reach Lit, who sits in the hottest heat.
  - Show heat with visible shimmer and a heat gauge.
- Ways to fight heat (each unlocked by the story):
  - Frostforged Snowballs: packed with Frost Crystals; survive heat much longer. Crafted at the Forge; costs Frost Crystals.
  - Cold Lantern: carried light that makes a moving chill bubble around you, where snowballs don't melt. It runs out and recharges in snow.
  - Blizzard Bomb: throw to create a cold zone for a few seconds; snowballs thrown through it get extra frost.
  - Snow Pump: spray snow to put out fires and lower the heat around them; fires you put out drop Frost Crystals.
  - Frozen Heart: an ultimate ability that freezes everything in a big circle and lets snowballs reach anything for a few seconds.
- FIRE SPREADING: fires spread to nearby trees, grass and wooden buildings (near the player only, capped). Put them out before they spread.
  - Burned spots become ash; villages get damaged and repaired by quests.
  - Fire never destroys player progress, the player's base or anything that can't be fixed.
- Teammates and Mau Mau get fire-fighting moves (Mau Mau sits on small fires).
- Works with the existing damage stacking: Frostbite stacks still apply, and a SHATTER on an enemy standing in a chill zone does extra damage.

═══ PART 4: NEW ENEMIES (all custom art, no emojis) ═══
LIT'S FIRE ARMY, "the Kindled":
- Ember Imps: fast, light fires as they run.
- Cinder Hounds: chase you and leave burning trails.
- Smoke Bats: blind your view with smoke.
- Ash Wraiths: only visible in cold light.
- Magma Golems: armored; must be cooled with Blizzard Bombs before snowballs hurt them.
- Fire Moths: drawn to your Cold Lantern and drain it.
- Kindled Cultists: hooded fire-starters who heal fire enemies.
- Flame Wisps: explode into fire patches.

NEW WILD CREATURES in the expanded world:
- Frost Wolves (packs), Ice Eagles (Northwatch Cliffs), Mirrormere Ice Serpent (rare), Quarry Rock Crabs, Marsh Lurkers, Starlight Elk (peaceful, rare).

All enemies follow Threat scaling (gear-based difficulty) and the boss rules.

LIT'S BOSS FIGHTS:
- Several encounters across the story where Lit fights briefly and escapes, each with a new fire mechanic to counter.
- Then the FINAL FIGHT inside/against the forming fireball in the sky:
  - multiple phases, gliding and flight;
  - cooling the fireball's core with Frozen Heart and Frostforged snowballs while dodging telegraphed fire attacks;
  - the knockout rule (back at 50% hearts, boss at the top of its current phase).
- Telegraphed attacks (at least 0.6 s wind-up), safe gaps, breathers, projectile cap: hard but fair, never bullet spam.

═══ PART 5: SIDE QUEST OVERHAUL: LOTS of side quests ═══
- At least 60 new side quests across all regions, plus quest CHAINS (3–6 parts). Some tie into the Lit mystery with clues.
- Mix of types:
  - rescues, escorts, mysteries solved from clues, races, ice-fishing contests, cooking, building/repair (including rebuilding burned homes), delivery under a time limit, stealth, puzzles, tracking footprints, defending a village from fire, photo hunts, lore hunts, rare-creature hunts, helping animals.
- A quest journal (active/done, steps, map markers, track a quest) and "!" markers over quest givers.
- A quest board in every village with repeatable daily side jobs.
- Rewards: Frost Crystals, gear, mount skins, base decorations, titles, lore. Big chains end with a unique reward.
- Funny, heartwarming and sad quests.
- Examples to include:
  - "The Lantern Keeper of Mirrormere": a lighthouse keeper who never stopped waiting.
  - "Mau Mau's Midnight Snack Heist": a comedy stealth quest through the castle kitchens.
  - "Loki's Lost Ball": a chase across three regions.
  - "Little Mow's Winter": help a stray survive the cold, a quiet and sad chain.
  - "The Quarry Ghost Lights".
  - "Ice-Fishing Championship".
  - "The Cabin with the Warm Window": an early Lit clue.
  - "Ravenwatch Woods' Missing Hunter".
  - "Old Pip's Last Expedition".
  - "Sled Race of the Northwatch Cliffs".
  - "Ashes of Ember Springs": rebuild a burned bathhouse.

═══ PART 6: KEEPS ═══
- At least 8 enemy keeps across the new regions. Some are held by Dumpling's army; later in the story, many become SCORCHED KEEPS held by the Kindled (fire everywhere, heat mechanics).
- Each keep is a real assault:
  - break gates and outer walls, clear towers, free prisoners, put out fires;
  - then a Keep Lord boss following the boss rules and Threat scaling.
- Captured keeps become YOUR outposts:
  - a fast-travel point, a small rest/heal spot (not usable during boss fights), and an outpost upgrade panel (walls, turrets, frost cannons, a garrison of teammates) paid with Frost Crystals.
  - Enemy counterattacks can try to retake an outpost as an event you defend, never while you're offline.

═══ PART 7: GRAPHICS UPDATE ═══
- Better terrain: textured snow, ice with reflections, footprints and sled trails in snow, softer cliff edges.
- Animated water and ice cracks, layered trees that sway, falling snow by region.
- FIRE: animated flames, glowing embers, rising smoke, heat shimmer, scorch marks, ash. Firelight that lights up the snow at night, and melting snow around fires.
- Lighting: day/night cycle, lanterns and campfires that glow at night, aurora skies, the glowing fireball in the sky growing chapter by chapter, soft shadows.
- Better character and building art: smoother animations, idle animations, detailed villages, keeps and burned/restored versions of places.
- All custom art, no emojis for characters, enemies or bosses.
- Low-effects mode (automatic on slow devices, plus a toggle) that turns off the heavy effects.

═══ PART 8: MUSIC ═══
Original music:
- every new region, village and keep assault;
- a mysterious theme for Lit and tense music during Lit sightings and fire events;
- the final fireball fight;
- side-quest chain finales.
Smooth crossfades. Not "Hex Pup Hustle".

═══ TEST ═══
- The main map is at least 4× bigger and all of it is walkable without loading screens.
- Old saves load in the same place with everything intact.
- The lands beyond and the Dumpling saga still work.
- Lit's story plays start to finish.
- Snowballs melt in heat, and every anti-heat tool works.
- Fires spread and can be put out, and nothing burns while offline.
- 60+ side quests show in the journal; keeps can be captured and upgraded.
- Smooth on a school Chromebook and a phone, and everything saves after a reload.
- Admin (Snow Kingdom only):
  - teleport anywhere, reveal map;
  - jump to any Lit chapter, set World Heat;
  - put out all fires;
  - complete/reset a single side quest, capture/reset a keep.

ALWAYS:
- Never reset or delete progress; migrate old saves.
- The Snow Kingdom has NO heart cap.
- Snow Kingdom upgrades cost Frost Crystals; the Workshop only has ticket boosters for it.
- No emojis for characters or bosses.
- No real money, no ads.
- Each game shows only its own admin controls.
- Must work on phones and school Chromebooks and save after a reload.
═══ ADD-ON (user, Nov 27): TIMING ═══
- Lit story starts only AFTER the whole Dumpling saga incl. post-credits (Cat Gone Missing, 3 godlike fake fights, THE GECKO GOD). Chapter 1 unlocks after the Gecko God is defeated (Oswald home, Gecko God Slayer title). Before that: at most one distant smoke column on the map as a teaser; no Lit encounters, fires or Heat.
- Continuity: kingdom celebrating the Gecko God's defeat when the first fires start; characters remember (title, Oswald with Nell, the statue). Dumpling stays defeated; Lit is new; identity not an existing character.
- Lit chapters, Kindled, Scorched Keeps, Lit fights = endgame (post-Gecko-God gear, Threat scaling; Lit fights story minimum ≥ Gecko God).
- World expansion, new regions, side quests, normal keeps, graphics: available to everyone right away. Only Lit story, fire events, World Heat and Scorched versions wait.
- Old saves that already beat the Gecko God unlock Chapter 1 on first Snow Kingdom entry after the update.
- Admin: "Unlock Lit story" (Snow Kingdom only).
