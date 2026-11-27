MUSIC OVERHAUL — ARCADE-WIDE (publish to PhoenixOfTheSpoon/wilderland-arcade, bump BUILD)

All I hear is "Hex Pup Hustle". What's going on in music.js:
- When the music player is set to "playlist" or "player" (saved in localStorage), area music is ignored, so the playlist's songs (including Hex Pup Hustle) play in every game and area.
- The mood music (floor, action, Snow Kingdom regions, raids, bosses, Dumpling, Sugar Siege) is built from short 8-bar generated loops, so it all sounds the same and repeats fast.
Fix both, and give the whole arcade real music.

═══ 1. AREA MUSIC ALWAYS WINS INSIDE GAMES ═══
- New setting "Game music: Area music (default) / My playlist".
  - With Area music (default for everyone, including old saves): inside any game, the game's/area's own music plays, whatever the floor music player is set to.
  - The playlist/player only plays on the arcade floor and menus, unless the player picks "My playlist" for games too.
- Reset everyone's saved setting to Area music once with this update. This is a setting, not progress.
- Hex Pup Hustle stays in the playlist as one song, but is NEVER used as area or game music anywhere.

═══ 2. REAL COMPOSED MUSIC (original, written note by note in the existing SONGS format) ═══
- Replace the generated 8-bar mood loops with real composed tracks:
  - each at least 32–64 bars, with an intro, A/B/C sections and a bridge;
  - real melodies, harmony, a bass line and drums;
  - loops seamlessly.
- Every track is different: its own key, tempo, time signature, instruments and style.
- Needs a track:
  - ARCADE: the floor, menus, prize counter, Rebirth Road, each game zone (action, puzzle, skill, space, mines, idle, learn).
  - Games: every arcade game gets its own track or shares a zone track — no game uses Hex Pup Hustle.
  - SNOW KINGDOM, one per:
    - each region (including every new region from the world expansion);
    - each village;
    - Camp Cocoa / your base;
    - each lands-beyond region, caves, dungeons, keeps, sieges;
    - each raid dungeon;
    - normal combat, elite combat;
    - each boss family;
    - Loki, Chao Chao (eerie), Minccino's shrine (gentle, sad);
    - Dumpling fights 1–5, fight 6 (rising across phases), the godlike fights, the Gecko God (choir);
    - Lit's mysterious theme, Lit sightings/fire events, the fireball finale;
    - the multiplayer Arena, group raids, the victory and defeat jingles.
  - SUGAR SIEGE: build phase, battle, boss, Final Wave.
- ADAPTIVE: exploration tracks have a calm layer and a combat layer (drums and bass come in when enemies get close and fade out after). Boss tracks get more intense in later phases.
- Smooth crossfades (about 1.5 s) between areas, never a hard cut or a restart when walking back and forth across a border.

═══ 3. BETTER SOUND ═══
- Upgrade the synth so it doesn't all sound like square-wave chiptune:
  - envelopes (attack/decay/sustain/release), filters, vibrato, chorus, echo/reverb;
  - more instruments (bells, strings-like pads, plucks, flute-like leads, choir pads, sub bass);
  - better synthesized drums (kick, snare, hats, toms, shakers, timpani for bosses).
- Each region and boss has its own instrument palette (e.g. Mirrormere: bells and soft pads; Ember Springs and Lit: warm brass-like leads and taiko-style drums; Ravenwatch: lonely solo lead).
- Licensed tracks: the 6 Kevin MacLeod mp3s stay (credited, CC BY). Any new mp3s must also be properly licensed and credited. Prefer the synth (tiny file size).
- Settings: separate Music and Sound Effects volume sliders, and a "Now playing" toast when the track changes (can be turned off).

═══ 4. PERFORMANCE ═══
- Song data loads with the game/area that uses it (lazy-load), not all at startup.
- Audio keeps running smoothly on school Chromebooks and phones; pause when the tab is hidden.
- Audio must start after the first tap/click (browser rule) without errors.

═══ TEST ═══
- With the floor music player set to "playlist" with Hex Pup Hustle, entering the Snow Kingdom plays the region's own music.
- Walking between regions crossfades to a different track.
- Every area listed above has its own track.
- Hex Pup Hustle never plays anywhere except when picked in the floor playlist.
- Music stays smooth on a Chromebook.
- Admin: "Music test" list to play any area's track (each game shows only its own admin controls).

ALWAYS:
- Never reset or delete progress (only the music setting resets once).
- No real money, no ads.
- Must work on phones and school Chromebooks and save after a reload.