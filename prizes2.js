// Wilderland Arcade · PRIZE COUNTER 2.0
// 8 rarities · 300+ prizes in themed collections · multiplier shop · Rebirth (Golden Stars) · daily & weekly challenges
// featured prize · seasonal prizes · ticket-only mystery capsules with posted odds · trophy room.
// Everything is stored in the same profile object (P) the arcade already saves to localStorage / the cloud.
// Old saves keep working: the original 16 prizes keep their ids inside the "Arcade Classics" collection.
(function(){
'use strict';
const W = {};

// ---------------- numbers ----------------
const SUF = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
W.fmt = n => { n = Number(n)||0; const neg = n < 0; n = Math.abs(n); let out;
  if (!isFinite(n)) out = '∞';
  else if (n < 10000) out = (n % 1 ? n.toFixed(1) : String(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  else if (n >= 1e36) out = n.toExponential(2).replace('e+','e');
  else { let i = -1; while (n >= 1000 && i < SUF.length-1) { n /= 1000; i++; } out = (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n)) + SUF[i]; }
  return (neg?'-':'') + out; };
const nice = x => { if (x < 100) return Math.round(x); const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.round(x / p) * p; };
const hash = s => { let h = 2166136261; for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = seed => { let a = hash(String(seed)); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const today = () => { const d = new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
const weekKey = () => { const d = new Date(); const j = new Date(d.getFullYear(),0,1); return d.getFullYear()+'w'+Math.ceil(((d - j)/864e5 + j.getDay() + 1)/7); };
const yesterday = () => { const d = new Date(Date.now()-864e5); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
const seasonNow = () => { const m = new Date().getMonth(); return m==11||m<2 ? 'winter' : m<5 ? 'spring' : m<8 ? 'summer' : 'fall'; };
const SEASON_NAME = {winter:'Winter', spring:'Spring', summer:'Summer', fall:'Fall'};

// ---------------- rarities ----------------
const R = [
  {id:'common',    n:'Common',     c:'#9aa5a1', glow:'rgba(154,165,161,.55)', base:50},
  {id:'uncommon',  n:'Uncommon',   c:'#00B451', glow:'rgba(0,180,81,.6)',     base:500},
  {id:'rare',      n:'Rare',       c:'#2fa8e0', glow:'rgba(47,168,224,.65)',  base:5e3},
  {id:'epic',      n:'Epic',       c:'#a64be0', glow:'rgba(166,75,224,.7)',   base:6e4},
  {id:'legendary', n:'Legendary',  c:'#f2a900', glow:'rgba(249,191,1,.75)',   base:1e6},
  {id:'mythic',    n:'Mythic',     c:'#ff4539', glow:'rgba(255,69,57,.8)',    base:1e8},
  {id:'cosmic',    n:'Cosmic',     c:'#4a5cff', glow:'rgba(74,92,255,.85)',   base:1e11},
  {id:'wild',      n:'Wilderland', c:'#ff5fd2', glow:'rgba(255,95,210,.9)',   base:1e15, rainbow:true},
];
W.R = R;

// ---------------- collections (emoji | name | one-line description) ----------------
// b = first rarity, s = how many rarities the collection spans, k = price scale.
const COLS = [
 {id:'forest', n:'Forest Critters', e:'🦊', col:'#00B451', b:0, s:5, nature:1, items:
  '🐿️|Red Squirrel|Buries thousands of seeds a year and forgets many, planting new trees.;🐇|Cottontail|Can hop sideways in a zig-zag to escape hawks.;🦔|Hedgehog|Has about 5,000 spines, each one hollow.;🦝|Raccoon|Its front paws have super-sensitive fingertips for feeling food underwater.;🦨|Skunk|Stomps and does a handstand as a warning before spraying.;🐻|Black Bear|Can smell food more than a mile away.;🦌|Mule Deer|Named for its big, mule-like ears.;🦉|Great Horned Owl|Can turn its head about 270 degrees.;🦫|Beaver|Its orange teeth contain iron, which makes them extra strong.;🐺|Gray Wolf|A pack can travel 30 miles in a single day.;🦡|Badger|Can dig faster than a person with a shovel.;🦎|Horned Lizard|Some can squirt blood from their eyes to scare predators.;🐍|Garter Snake|Hundreds gather together in dens to survive winter.;🦬|Bison|The heaviest land animal in North America, yet it can run 35 mph.;🐆|Mountain Lion|Can leap about 15 feet straight up.'},
 {id:'invasive', n:'Invasive Species Hunters', e:'🧤', col:'#c9a3e0', b:0, s:6, k:1.5, nature:1, items:
  '🌾|Cheatgrass Pull|Dries out early and feeds wildfires across the West.;🌳|Tamarisk Saw|Pulls salt up from deep soil and leaves it on the surface.;🫒|Russian Olive Pruner|Planted as a windbreak, it now crowds riverbanks.;🌸|Thistle Grabber|Canada thistle roots can spread several feet in one season.;🌼|Spurge Shovel|Leafy spurge roots can grow 20 feet deep.;🐚|Zebra Mussel Scraper|One mussel filters about a liter of water a day.;🐞|Ash Borer Trap|The emerald ash borer has killed hundreds of millions of trees.;🍃|Kudzu Cutter|Kudzu can grow up to a foot a day in summer.;💜|Loosestrife Net|One plant can make over 2 million seeds a year.;🐍|Python Patrol Badge|Escaped pets now breed in the Florida Everglades.;🐦|Starling Counter|About 100 starlings released in 1890 became tens of millions.;🌿|Myrtle Spurge Gloves|A Colorado “List A” weed that must be removed by law.;🐟|Carp Barrier|Asian carp can leap 10 feet out of the water.;🚤|Clean-Drain-Dry Kit|Washing boats stops mussels hitching a ride to new lakes.'},
 {id:'ocean', n:'Ocean Deep', e:'🐙', col:'#2fa8e0', b:0, s:6, k:2, nature:1, items:
  '🐠|Clownfish|All clownfish are born male, and the biggest becomes female.;🐡|Pufferfish|Puffs up to twice its size by gulping water.;🦀|Hermit Crab|Swaps shells, and sometimes lines up to trade in size order.;🦐|Mantis Shrimp|Punches as fast as a bullet from a .22 rifle.;🐢|Sea Turtle|Can sleep underwater for hours by slowing its heart.;🪼|Jellyfish|Has no brain, heart or bones.;🐬|Dolphin|Sleeps with one half of its brain at a time.;🦭|Seal|Can slow its heartbeat to about 10 beats a minute when diving.;🐙|Octopus|Has three hearts and blue blood.;🦈|Hammerhead|Its wide head works like a metal detector for prey.;🐋|Blue Whale|Its heart is about the size of a small car.;🦑|Giant Squid|Has the biggest eyes of any animal, as wide as a dinner plate.;🐳|Narwhal|Its “tusk” is a tooth with millions of nerve endings.;🧜|Abyssal Anglerfish|Uses a glowing lure to hunt in total darkness.;🌊|Mariana Trench Pebble|From the deepest spot on Earth, about 7 miles down.'},
 {id:'dino', n:'Dinosaurs', e:'🦖', col:'#8D5B1D', b:1, s:5, k:1, nature:1, items:
  '🥚|Fossil Egg|Some dinosaurs sat on their nests like birds do.;🦴|Raptor Claw|Velociraptor was about the size of a turkey.;🦕|Brachiosaurus|Could reach treetops 40 feet up.;🦖|T. rex|Its bite was strong enough to crush a car.;🛡️|Ankylosaurus|Had a bony club on its tail for defense.;🔺|Stegosaurus|Its brain was about the size of a lime.;🦏|Triceratops|Colorado’s neighbor Wyoming is a top Triceratops site.;🪶|Archaeopteryx|A dino-bird with feathers and teeth.;🌊|Spinosaurus|One of the few dinosaurs that swam and hunted fish.;🐊|Deinosuchus|A crocodile relative as long as a school bus.;🦅|Quetzalcoatlus|A flying reptile as tall as a giraffe.;🗻|Stegosaurus Plate (CO)|Stegosaurus is Colorado’s state fossil.;🌋|Asteroid Fragment|An asteroid impact 66 million years ago ended the dinosaur age.;👑|Dino Crown|For the ruler of the Mesozoic.'},
 {id:'birds', n:'Birds of the West', e:'🦅', col:'#64CDF5', b:0, s:5, k:1.2, nature:1, items:
  '🐦|Mountain Bluebird|Its blue comes from feather structure, not pigment.;🐤|Goldfinch|Waits until late summer to nest, when thistle seeds are ready.;🦆|Mallard|Ducks have waterproof feathers thanks to a special oil.;🐦‍⬛|Magpie|One of the few animals that can recognize itself in a mirror.;🐧|Dipper|Walks underwater along stream bottoms hunting bugs.;🦃|Wild Turkey|Can fly up to 55 mph in short bursts.;🦜|Hummingbird|Its heart can beat over 1,200 times a minute.;🦢|Trumpeter Swan|North America’s largest native waterfowl.;🦩|Sandhill Crane|Families dance by leaping and flapping together.;🦉|Snowy Owl|Can hear prey moving under the snow.;🦅|Bald Eagle|Its nests can weigh more than a ton.;🪶|Golden Eagle|Dives at speeds over 150 mph.;🐓|Sage Grouse|Males puff up yellow air sacs to show off.;🌈|Rainbow Feather|A gift from every bird in the West.'},
 {id:'bugs', n:'Bug Collection', e:'🐞', col:'#FF4539', b:0, s:5, k:1, nature:1, items:
  '🐜|Ant|Some ants can carry 50 times their body weight.;🐞|Ladybug|Can eat 5,000 aphids in its lifetime.;🦗|Cricket|You can estimate temperature by counting cricket chirps.;🐝|Honeybee|Bees do a “waggle dance” to share flower directions.;🦋|Monarch|Migrates up to 3,000 miles to Mexico.;🐛|Caterpillar|Has about 4,000 muscles, compared to about 600 in people.;🪲|Dung Beetle|Navigates using the Milky Way at night.;🕷️|Jumping Spider|Can leap 50 times its own body length.;🪳|Walkingstick|Some look so much like twigs birds fly right past.;🦟|Dragonfly|Catches over 90% of the prey it chases.;🪰|Firefly|Its light makes almost no heat.;🐌|Banana Slug|Can be as long as your forearm.;🦂|Scorpion|Glows bright blue-green under UV light.;💎|Jewel Beetle|Its shiny shell has no paint at all, just tiny structures.'},
 {id:'space', n:'Space Junk', e:'🛰️', col:'#4a5cff', b:1, s:6, k:2, items:
  '🔩|Lost Bolt|There are millions of tiny bits of junk orbiting Earth.;🧤|Astronaut Glove|A real glove floated away during a 1965 spacewalk.;🧰|Floating Toolbag|An astronaut lost one in 2008, and it orbited for months.;📡|Old Antenna|Some old satellites still beep with no one listening.;🛰️|Retired Satellite|Over 2,000 dead satellites still circle Earth.;🚀|Rocket Stage|Used rocket parts can orbit for decades.;🔭|Lens Cap|Even a lens cap moves faster than a bullet up there.;🌑|Moon Dust Jar|Moon dust smells like spent gunpowder, astronauts said.;☄️|Comet Ice|Comets are dirty snowballs from the edge of the solar system.;🪐|Ring Shard|Saturn’s rings are mostly water ice.;🛸|Mystery Saucer|Nobody knows where this came from.;🌌|Galaxy Marble|Holds a tiny swirl of stars (probably).;👨‍🚀|Golden Space Suit|Astronaut visors are coated with real gold.;⭐|Pocket Star|Handle with oven mitts.'},
 {id:'retro', n:'Retro Tech', e:'📼', col:'#EA55AB', b:0, s:6, k:1.5, items:
  '📼|VHS Tape|Be kind, rewind!;💾|Floppy Disk|Held about 1.44 megabytes, less than one phone photo.;📟|Pager|Beep beep! Call me back.;☎️|Rotary Phone|You had to spin the dial for every number.;📻|Transistor Radio|Made music portable in the 1950s.;📺|CRT TV|Heavy, warm and humming.;🕹️|Joystick|The arcade’s favorite steering wheel.;📷|Instant Camera|Shake it while it develops (you didn’t need to).;💿|Compact Disc|A CD spins up to 500 times a minute.;🎮|Handheld Console|Ran for hours on two AA batteries.;📠|Fax Machine|Sent pictures over phone lines, slowly.;🖥️|Beige Computer|Dial-up internet sounded like robots arguing.;🎞️|Film Reel|Movies used to be real strips of film.;🤖|Toy Robot 1985|Batteries not included.'},
 {id:'food', n:'Food Friends', e:'🍕', col:'#FBB99D', b:0, s:5, k:.8, items:
  '🍎|Apple Pal|Apples float because they’re about a quarter air.;🍌|Banana Buddy|Bananas are berries, but strawberries are not.;🥕|Carrot Chum|Carrots were purple before orange ones were bred.;🍕|Pizza Slice|Always the right answer.;🌮|Taco Twin|Crunchy or soft? Yes.;🍩|Donut Dude|The hole helps it cook evenly.;🧀|Cheese Wheel|Some cheeses age for over 10 years.;🍔|Burger Boss|Stacked high.;🍣|Sushi Roll|Rolled with a bamboo mat.;🥞|Pancake Stack|Syrup waterfall incoming.;🍦|Soft Serve|One lick at a time.;🧁|Cupcake Royal|Extra sprinkles, always.;🍉|Watermelon King|About 92% water.;🥐|Golden Croissant|Layer after buttery layer.;🎂|Mega Cake|For celebrating 100 games.'},
 {id:'wizard', n:'Wizard Gear', e:'🧙', col:'#5B2A86', b:1, s:6, k:2, items:
  '🕯️|Candle Stub|Lights the spellbook.;📜|Scroll of Sums|Casts long division.;🧪|Bubbling Potion|Smells like grape soda.;🪄|Wand of Oak|Oak wood is strong and fire-resistant.;🔮|Crystal Ball|Shows next week’s daily challenge (maybe).;🧹|Speedy Broom|Turbo mode included.;📕|Spellbook|Page 394: Turning homework into pizza.;🎩|Pointy Hat|Stars sewn on by hand.;🧿|Charm of Luck|Lucky payouts feel luckier.;🦉|Wise Familiar|Answers questions with more questions.;🌙|Moonstone Staff|Glows on full moons.;🐉|Pocket Dragon|Breathes warm air, great for cold hands.;⚡|Storm Orb|Holds a captured thunderstorm.;🧙|Archmage Robe|Woven from starlight.'},
 {id:'legends', n:'Arcade Legends', e:'🕹️', col:'#D5F367', b:0, s:6, k:1, items:
  '🐍|Neon Serpent|For clearing every Snake maze.;🧱|Brick Breaker|For smashing the wall.;🐤|Flapper Feather|For mind-the-gaps champions.;🏓|Golden Paddle|For Pong shutouts.;🃏|Memory Card|For perfect pairs.;🔨|Gopher Mallet|Bonk!;🔢|Tile 2048|Just for fun now.;❌|Tic-Tac Crown|Outsmarted the machine.;⚡|Reflex Bolt|Faster than a blink.;⌨️|Golden Keyboard|Home row hero.;🔴|Simon Pad|Watch. Remember. Repeat.;💣|Defused Mine|Tread carefully.;🟣|Connect-4 Disc|Off THE TIMMY’s lawn.;🏕️|Trailhead Flag|Held the camp.;🐸|Crossing Frog|Minded the traffic.;🪵|Timber Trophy|Cleared the lines.'},
 {id:'rocks', n:'Rocks & Gems', e:'💎', col:'#9fd8ff', b:1, s:6, k:1.5, nature:1, items:
  '🪨|Granite|Pikes Peak is made mostly of pink granite.;⚫|Obsidian|Volcanic glass sharp enough for ancient arrowheads.;🟤|Petrified Wood|Wood slowly replaced by stone over millions of years.;🔵|Turquoise|Formed when water seeps through copper-rich rock.;⚪|Quartz|The most common mineral on Earth’s surface.;🟣|Amethyst|Purple quartz colored by bits of iron.;🟢|Malachite|Its green bands come from copper.;🟡|Gold Nugget|Colorado’s 1859 gold rush started Denver.;🔴|Rhodochrosite|Colorado’s state mineral, bright red-pink.;🟠|Sunstone|Has copper flakes that sparkle.;💠|Aquamarine|Colorado’s state gem, found on Mount Antero.;💎|Diamond|Made of carbon squeezed deep underground.;🌠|Meteorite|A rock that fell from space.;🌈|Opal|Shows rainbow flashes from tiny silica spheres.'},
 {id:'weather', n:'Weather Wonders', e:'🌩️', col:'#64CDF5', b:1, s:5, k:1.2, nature:1, items:
  '☀️|Sunbeam|Sunlight takes about 8 minutes to reach Earth.;☁️|Cumulus Cloud|A puffy cloud can weigh as much as 100 elephants.;🌧️|Raindrop|Raindrops are shaped more like hamburger buns than tears.;❄️|Snowflake|Most snowflakes have six sides.;🌫️|Fog Bank|Fog is a cloud touching the ground.;🌈|Rainbow|You always see a rainbow with the sun behind you.;🌬️|Chinook Wind|A warm wind that can melt snow fast in Colorado.;⚡|Lightning Bolt|Hotter than the surface of the sun.;🌪️|Tornado|Colorado gets dozens of tornadoes most years.;🧊|Hailstone|Colorado’s Front Range is one of the hail capitals of the world.;🌀|Hurricane Eye|The calm center of a giant storm.;🌌|Aurora|Colorful lights made by solar wind hitting the air.'},
 {id:'trees', n:'Trees & Plants', e:'🌲', col:'#2f7a4f', b:0, s:5, k:1, nature:1, items:
  '🌱|Seedling|Every giant tree starts this small.;🍀|Clover|About 1 in 5,000 clovers has four leaves.;🌻|Sunflower|Young sunflowers follow the sun across the sky.;🌵|Prickly Pear|A cactus native to Colorado’s plains.;🍄|Fly Agaric|A mushroom is the “fruit” of a huge underground fungus.;🌿|Sagebrush|Smells strongly after rain.;🌷|Pasqueflower|Blooms while snow is still on the ground.;🌲|Ponderosa Pine|Its bark can smell like vanilla.;🍁|Sugar Maple|It takes about 40 gallons of sap to make 1 gallon of syrup.;🍂|Quaking Aspen|Whole groves can be one connected organism.;🌳|Bur Oak|Its acorns are some of the biggest in North America.;🪴|Bristlecone Pine|Some are nearly 5,000 years old.;🌸|Blue Columbine|Colorado’s state flower since 1899.;🌴|Giant Sequoia|The largest trees on Earth by volume.'},
 {id:'camp', n:'Camp Gear', e:'⛺', col:'#DD8B03', b:0, s:5, k:.8, items:
  '🔦|Flashlight|Always pack spare batteries.;🧭|Compass|The needle points to magnetic north.;🥾|Hiking Boots|Broken in and ready.;🎒|Backpack|Ten essentials inside.;🪓|Hatchet|For splitting kindling (with a grown-up).;🏕️|Tent|Pitched before dark.;🔥|Campfire Kit|Leave no trace: drown, stir, feel.;🍫|S’mores Pack|The best camp math: 1 + 1 + 1 = delicious.;🗺️|Trail Map|Marked with secret swimming spots.;🛶|Canoe Paddle|J-stroke master.;🪢|Climbing Rope|Knots tied by a pro.;🔭|Star Scope|Dark skies, bright stars.'},
 {id:'robots', n:'Robots', e:'🤖', col:'#c9ccd1', b:1, s:6, k:1.5, items:
  '🔋|Battery Bot|Runs on AAs and enthusiasm.;🧹|Vacuum Bot|Bumps into everything, cleans anyway.;🦾|Robo Arm|Lifts 10 times its weight.;🚗|Rover Bot|Drives itself to snack time.;🐕|Robo Dog|Never needs a walk (still wants one).;🛰️|Mars Rover|Real rovers have driven over 25 miles on Mars.;🧠|Thinking Bot|Calculates pi for fun.;🎨|Painter Bot|Only paints happy clouds.;🥁|Drummer Bot|Never misses a beat.;🦿|Walker Bot|Learned to dance by falling down a lot.;🤖|Mega Mech|Two stories tall.;👾|Pixel Bot|Escaped from an arcade game.'},
 {id:'music', n:'Music Makers', e:'🎸', col:'#E9B9F7', b:0, s:5, k:1, items:
  '🥁|Snare Drum|Rat-a-tat!;🎹|Keytar|A piano you can wear.;🎸|Electric Guitar|Turn it up to 11.;🎺|Trumpet|Sound comes from buzzing your lips.;🎷|Saxophone|Made of brass but counted as a woodwind.;🎻|Violin|Its bow is strung with horsehair.;🪕|Banjo|Twangy and bright.;🪗|Accordion|Squeezebox of joy.;🎤|Golden Mic|Sing it loud.;🪘|Hand Drum|The heartbeat of the band.;🎶|Perfect Pitch|Hears every note.;🎼|Symphony Score|Eighty players, one song.'},
 {id:'sports', n:'Sports Day', e:'🏆', col:'#F9BF01', b:0, s:5, k:1, items:
  '⚽|Soccer Ball|Has 32 panels on the classic design.;🏀|Basketball|Invented with a peach basket in 1891.;⚾|Baseball|Has 108 double stitches.;🏈|Football|Shaped to spiral through the air.;🎾|Tennis Ball|Fuzz helps it grip the racket.;🏓|Ping Pong|Balls are hollow and weigh about 2.7 grams.;🏒|Hockey Stick|Pucks are frozen before games so they bounce less.;⛸️|Ice Skates|Blades glide on a thin layer of water.;🏂|Snowboard|Colorado has some of the snowiest slopes around.;🥇|Gold Medal|Olympic golds are mostly silver inside.;🏆|Grand Trophy|For the arcade champion.;🎳|Strike Pin|All ten down.'},
 {id:'classics', n:'Arcade Classics', e:'🎟️', col:'#AB2372', b:0, s:5, k:1, classic:1, items: ''},
 {id:'cosmic', n:'Cosmic Mysteries', e:'🌌', col:'#4a5cff', b:4, s:4, k:1, items:
  '🕳️|Mini Black Hole|Its gravity is so strong not even light escapes.;🌟|Neutron Star|A teaspoon would weigh about a billion tons.;🌀|Spiral Galaxy|The Milky Way has 100 to 400 billion stars.;💫|Shooting Star|Usually a speck of dust smaller than a grain of sand.;🪐|Ring World|Jupiter, Uranus and Neptune have rings too.;☄️|Halley’s Comet|Visible from Earth about every 76 years (next: 2061).;🌑|Dark Matter Jar|Most of the universe’s matter can’t be seen.;🌞|Solar Flare|Can be as powerful as billions of bombs.;🌠|Meteor Shower|Earth passing through a comet’s dusty trail.;🛸|First Contact Badge|Hello from Wilderland!;✨|Stardust|You are made of atoms forged in old stars.;🔭|Edge of the Universe|About 46 billion light-years away.'},
 // seasonal
 {id:'winter', n:'Winter Wonderland', e:'⛄', col:'#c9f0ff', b:1, s:5, k:1.5, season:'winter', items:
  '⛄|Snow Pal|Every snowflake is a little different.;🧣|Cozy Scarf|Hand-knit.;🧤|Mittens|Warmer than gloves because fingers share heat.;🛷|Sled|Fastest down the hill.;❄️|Crystal Flake|Snow is clear, but it looks white because of scattered light.;☕|Cocoa Mug|Extra marshmallows.;🎿|Ski Set|Ready for fresh powder.;🦌|Reindeer|Their eyes turn blue in winter to see in the dark.;🐧|Penguin Pal|Emperor penguins huddle to stay warm.;🏔️|Peak of Winter|Colorado has 58 peaks over 14,000 feet.'},
 {id:'spring', n:'Spring Bloom', e:'🌷', col:'#ffd0e8', b:1, s:5, k:1.5, season:'spring', items:
  '🌷|Tulip|Tulip bulbs were once worth more than houses.;🐣|Chick|Hatches by pecking with a tiny “egg tooth.”;🌱|Sprout|Spring rain wakes up seeds.;🐝|Busy Bee|Bees visit about 2 million flowers to make a pound of honey.;🌈|Spring Rainbow|Sun plus rain equals rainbow.;🦋|Spring Butterfly|Tastes with its feet.;🐸|Peeper Frog|Spring peepers can be heard a mile away.;🪺|Bird Nest|Robins line nests with mud.;🌸|Cherry Blossom|Bloom for only about a week.;☔|Golden Umbrella|For April showers.'},
 {id:'summer', n:'Summer Splash', e:'🏖️', col:'#ffe14f', b:1, s:5, k:1.5, season:'summer', items:
  '🩴|Flip Flops|Slap slap slap.;🍉|Melon Slice|Spit the seeds!;🏖️|Beach Chair|Front row to the waves.;🕶️|Shades|Cool in every way.;🪁|Kite|Kites were invented in China over 2,000 years ago.;🏄|Surfboard|Hang ten.;🍦|Ice Pop|Melts fast, eat faster.;🐚|Conch Shell|Hold it up and “hear the ocean.”;🐬|Summer Dolphin|Jumps for joy.;☀️|Golden Sun|Longest day of the year!'},
 {id:'fall', n:'Fall Harvest', e:'🍂', col:'#DD8B03', b:1, s:5, k:1.5, season:'fall', items:
  '🍂|Fallen Leaf|Leaves change color as trees stop making green chlorophyll.;🎃|Pumpkin|Pumpkins are fruits.;🌽|Corn Cob|An ear of corn has about 800 kernels.;🍎|Harvest Apple|Over 7,500 kinds of apples exist.;🦃|Harvest Turkey|Only male turkeys gobble.;🥧|Pie Slice|Pumpkin pie with whipped cream.;🦔|Leaf Pile Hedgehog|Hibernates through winter.;🌰|Acorn|One oak can drop 10,000 acorns in a good year.;🦉|Harvest Moon Owl|The harvest moon rises right after sunset.;🍁|Golden Maple|The glow of October.'},
 // prestige (needs Golden Stars)
 // ---- the most expensive prizes: price ladders that unlock one or two at a time as your Rebirths grow ----
 {id:'treasure', n:'Legendary Treasures', e:'🏺', col:'#ff4539', r:5, ladder:[5e9, 1000], noCap:1, items:
  '🏺|Ancient Arcade Urn|Full of tokens from 1979.;🗡️|Sword in the Cabinet|Only a true gamer can pull it out.;🪙|Coin of the First Quarter|The very first quarter ever played.;📜|Scroll of Infinite Lives|Read it and never lose again.;🧭|Compass to High Score|Always points to the top of the board.;🛡️|Shield of the Final Boss|Dented from a million battles.;🔱|Trident of Tickets|Spears tickets from the sea.;🏆|Cup of Champions|Too heavy to lift alone.'},
 {id:'vault', n:'Vault of Wonders', e:'🏛️', col:'#4a5cff', r:6, ladder:[3e12, 1000], noCap:1, items:
  '🪐|Ringed Planet|A whole planet, rings included.;🌠|Bottled Shooting Star|Make a wish. Any wish.;🌀|Pocket Galaxy|Spins forever on your shelf.;☄️|Captured Comet|Still a little warm.;🔭|Telescope of Tomorrow|Shows next week’s high scores.;🛸|Arcade Mothership|Holds a billion cabinets.;🌌|Nebula in a Jar|Glows every color at once.;⏳|Hourglass of Time|Pause any game, any time.;🌞|Tame Sun|Gentle, warm and very bright.;🕳️|Friendly Black Hole|Eats only bad luck.'},
 {id:'diavault', n:'Diamond Vault', e:'💠', col:'#9fe8ff', r:7, starLadder:[500,1000,2500,5000,10000,25000,50000,100000,250000,1000000], items:
  '💠|Diamond Joystick|Every move is a perfect move.;🦄|Crystal Unicorn|Gallops across the leaderboard.;🐲|Diamond Dragon|Breathes sparkles instead of fire.;🏯|Floating Sky Arcade|An arcade above the clouds.;🌈|Solid Rainbow|You can walk on it.;👁️|All-Seeing Gem|Sees every hidden secret.;🎇|Eternal Fireworks|The show never ends.;🌍|Wilderland Globe|The whole world, in your hands.;🪽|Wings of Legend|Lift any score to the sky.;♾️|The Infinity Ticket|Worth more than every ticket ever printed.'},
 {id:'golden', n:'Golden Hall', e:'⭐', col:'#F9BF01', prestige:1, items:
  '🌟|Golden Star Pin|For your first Rebirth.;🏅|Gilded Medal|Shines brighter every Rebirth.;👑|Golden Crown|Rule the arcade.;🗿|Golden Statue|They built a statue in your honor.;🦚|Golden Peacock|Feathers of pure light.;🐉|Golden Dragon|Hoards tickets instead of gold.;🏰|Golden Castle|Your own arcade kingdom.;🌋|Golden Volcano|Erupts with confetti.;🪐|Golden Planet|Ringed with ticket stubs.;☀️|Golden Sun|Brighter than a thousand Turbo runs.;🌌|Golden Galaxy|A billion golden stars.;♾️|The Infinite Ticket|Worth everything. And then some.'},
];

// The original 16 prizes keep their ids, so old saves show up in the new Trophy Room.
const CLASSICS = [['sticker','Sticker Pack','common','Stick it on everything.'],['bracelet','Glow Bracelet','common','Glows at the arcade after dark.'],['ball','Bouncy Ball','common','Bounces higher than you think.'],['snake','Rubber Snake','common','Not a real snake. Probably.'],
  ['pin','Mountain Pin','rare','A badge for every trail.'],['moose','Plush Moose','rare','Extremely huggable.'],['lamp','Lava Lamp','rare','Blobs go up, blobs come down.'],['robot','Pinecone Robot','rare','Built from the forest floor.'],
  ['geode','Crystal Geode','epic','Crack it open for sparkles.'],['fox','Neon Fox','epic','Glows in the dark.'],['pickaxe','Golden Pickaxe','epic','Straight from The Mines.'],['globe','Aurora Globe','epic','Northern lights in a jar.'],
  ['trophy','Golden Trophy','legendary','The classic prize.'],['egg','Dragon Egg','legendary','Warm to the touch.'],['moon','Moon Rock','legendary','From way up there.'],['crown','Crown of Wilderland','legendary','For the ruler of the arcade.']];
const CLASSIC_EMOJI = {sticker:'🏷️',bracelet:'📿',ball:'🔴',snake:'🐍',pin:'📍',moose:'🫎',lamp:'🪔',robot:'🤖',geode:'🪨',fox:'🦊',pickaxe:'⛏️',globe:'🔮',trophy:'🏆',egg:'🥚',moon:'🌕',crown:'👑'};

let CAT = null, BYID = {};
const build = classicArt => {
  if (CAT) return CAT; CAT = [];
  COLS.forEach(C => { const items = [];
    if (C.classic) CLASSICS.forEach(([id,n,r,d],i) => items.push({id, n, d, e:CLASSIC_EMOJI[id], art:classicArt && classicArt[id], r:R.findIndex(x=>x.id==r), f:(i%4)/4}));
    else C.items.split(';').filter(Boolean).forEach((row, i, arr) => { const [e, n, d] = row.split('|');
      let r, f; if (C.prestige) { r = 7; f = 0; } else if (C.ladder || C.starLadder) { r = C.r; f = i / arr.length; } else { const pos = i * C.s / arr.length; r = C.b + Math.floor(pos); f = pos - Math.floor(pos); }
      items.push({id:C.id+'_'+i, n, d, e, r, f}); });
    items.forEach((it, i) => { it.col = C.id; it.colName = C.n;
      it.price = C.prestige ? 1e12 * Math.pow(1000, i) : C.ladder ? nice(C.ladder[0] * Math.pow(C.ladder[1], i)) : C.starLadder ? 1e15 : nice(R[it.r].base * (1 + 3*it.f) * (C.k||1)); if (C.noCap) it.noCap = 1;
      // ONLY Wilderland prizes cost Golden Stars. Mythic and Cosmic cost tickets (Cosmic never comes from capsules).
      if (C.prestige) it.sp = 10 * Math.pow(2, i); else if (C.starLadder) it.sp = C.starLadder[i]; else if (it.r === 7) it.sp = 25 + Math.round(it.f * 35);
      if (C.season) it.season = C.season;
      CAT.push(it); BYID[it.id] = it; });
    C.size = items.length; });
  // A monument you can always buy one more of: each one costs 10× the last.
  const mon = {id:'monument', n:'Wilderland Monument', d:'Costs Golden Stars, doubling each time. There is always another.', e:'🗽', r:7, col:'golden', colName:'Golden Hall', repeat:1, price:1e6};
  CAT.push(mon); BYID.monument = mon;
  return CAT; };
W.catalog = build;

// ---------------- Golden Star perks: every Star prize gives permanent power that survives every Rebirth ----------------
const PERK_GAMES = ['snake','breakout','flappy','pong','memory','whack','tictactoe','reaction','typing','simon','mines','connect4','td','crossing','stack','rootout','trace','idle'];
const GNAME = {snake:'Snake',breakout:'Breakout',flappy:'Flapper',pong:'Pong',memory:'Memory Match',whack:'Whack-a-Gopher',tictactoe:'Tic-Tac-Toe',reaction:'Reaction Test',typing:'Typing Race',simon:'Simon Says',mines:'Minesweeper',connect4:'Connect 4',td:'Trailhead Defense',crossing:'Critter Crossing',stack:'Timber Stack',rootout:'Root Out',trace:'Trace & Write',idle:'The Mines'};
const HEAD_EXP = [['claw','Claw Machine'],['booth','Prize Booth'],['snack','Snack Bar'],['row','Cabinet Row']];
const PERK_KINDS = ['all','game','learn','jack','workshop','combo','critter','buff','game','all'];
const r2 = x => Math.round(x*100)/100;
const mkPerk = (k, s, si) => { const q = Math.pow(s, .75), w = Math.pow(s, .6);
  switch (k) {
    case 'all': return {k, v:r2(1 + .12*q), t:'×'+r2(1 + .12*q)+' ALL tickets'};
    case 'game': { const g = PERK_GAMES[si % PERK_GAMES.length], v = r2(1 + .5*q); return {k, g, v, t:'×'+v+' payouts on '+GNAME[g]}; }
    case 'learn': return {k, v:r2(1 + .25*q), t:'×'+r2(1 + .25*q)+' Learn mode bonus'};
    case 'jack': return {k, v:r2(1 + .1*w), t:'×'+r2(1 + .1*w)+' jackpot chance'};
    case 'head': { const [x, nm] = HEAD_EXP[si % 4], n = Math.max(1, Math.round(3*w)); return {k, x, n, t:'Start every Rebirth with '+nm+' Lv '+n}; }
    case 'combo': return {k, v:r2(1 + .08*w), t:'Combo meter ×'+r2(1 + .08*w)+' stronger'};
    case 'critter': return {k, v:r2(1 + .1*w), t:'Golden critters ×'+r2(1 + .1*w)+' more often'};
    case 'workshop': { const n = Math.max(1, Math.round(1.5*Math.sqrt(s))); return {k, n, t:'Start every Rebirth with Ticket Booster Lv '+n+' on every machine'}; }
    case 'buff': return {k, v:r2(1 + .08*w), t:'Critter boosts last ×'+r2(1 + .08*w)+' longer and hit ×'+r2(1 + .08*w)+' harder'};
  } };
let STAR_ITEMS = null;
const starItems = () => { if (STAR_ITEMS) return STAR_ITEMS; build(); STAR_ITEMS = []; let si = 0;
  CAT.forEach(it => { if (!(it.sp || it.repeat)) return;
    it.perk = it.repeat ? {k:'all', v:2, t:'×2 ALL tickets for each one you own (stacks)'} : mkPerk(PERK_KINDS[si % PERK_KINDS.length], it.sp, Math.floor(si / PERK_KINDS.length) + si);
    si++; STAR_ITEMS.push(it); });
  return STAR_ITEMS; };
W.perkOf = it => { starItems(); return it.perk || null; };
// Combined power of every Star prize you own. Prizes are never reset, so these survive every Rebirth.
W.perks = P => { const o = {all:1, learn:1, jack:1, combo:1, critter:1, buff:1, game:{}, head:{}, workshop:0, count:0}; const own = P.prizes||{};
  starItems().forEach(it => { const n = own[it.id]|0; if (!n) return; const k = it.perk; o.count++;
    if (it.repeat) { o.all *= Math.pow(2, n); return; }
    if (k.k == 'game') o.game[k.g] = (o.game[k.g]||1) * k.v; else if (k.k == 'head') o.head[k.x] = (o.head[k.x]||0) + k.n; else if (k.k == 'workshop') o.workshop += k.n; else o[k.k] *= k.v; });
  return o; };
W.perkLines = P => { const o = W.perks(P), L = [], f = v => '×'+W.fmt(r2(v));
  if (o.all > 1) L.push(['💫','All tickets',f(o.all)]); if (o.learn > 1) L.push(['📚','Learn mode bonus',f(o.learn)]);
  if (o.jack > 1) L.push(['🎰','Jackpot chance',f(o.jack)]); if (o.combo > 1) L.push(['🔥','Combo meter',f(o.combo)]); if (o.critter > 1) L.push(['🦊','Golden critters appear',f(o.critter)]);
  if (o.buff > 1) L.push(['⚡','Critter boosts (length & power)',f(o.buff)]);
  Object.keys(o.game).forEach(g => L.push(['🕹️', GNAME[g]+' payouts', f(o.game[g])]));
  Object.keys(o.head).forEach(x => L.push(['🏗️', 'Rebirth head start: '+(HEAD_EXP.find(h=>h[0]==x)||[0,x])[1], 'Lv '+o.head[x]]));
  if (o.workshop) L.push(['🛠️','Rebirth head start: Ticket Booster on every machine','Lv '+o.workshop]);
  return L; };
// Levels you start each Rebirth with (also applied the moment you buy a head-start prize).
W.headStart = P => { const o = W.perks(P), exp = {}, upg = {}; Object.keys(o.head).forEach(x => exp[x] = o.head[x]);
  const ph = window.WLE && window.WLE.ptHead ? window.WLE.ptHead(P) : {boost:0, expLv:0}; if (ph.expLv && window.WLE) window.WLE.EXP.forEach(x => exp[x.k] = Math.max(exp[x.k]||0, ph.expLv));
  const boost = Math.max(o.workshop||0, ph.boost||0);
  if (boost) PERK_GAMES.forEach(g => upg[g] = {boost}); return {exp, upg}; };
W.applyHead = P => { const h = W.headStart(P), exp = {...(P.exp||{})}, upg = {...(P.upg||{})}; let ch = false;
  Object.keys(h.exp).forEach(x => { if ((exp[x]|0) < h.exp[x]) { exp[x] = h.exp[x]; ch = true; } });
  Object.keys(h.upg).forEach(g => { const cur = {...(upg[g]||{})}; if ((cur.boost|0) < h.upg[g].boost) { cur.boost = h.upg[g].boost; upg[g] = cur; ch = true; } });
  return ch ? {exp, upg} : null; };
W.cols = COLS;
const priceOf = (it, P) => it.price;
const starPrice = (it, P) => it.repeat ? 100 * Math.pow(2, (P.prizes||{})[it.id]||0) : (it.sp||0);
const isStar = it => !!(it.sp || it.repeat);
const freeStars = P => Math.max(0, (P.stars||0) - (P.starsSpent||0));
// What the Wilderland prizes you own cost in Golden Stars (used to refund stars spent on things stars no longer buy).
W.starCostOwned = P => { build(); let t = 0; const own = P.prizes||{}; CAT.forEach(it => { const n = own[it.id]|0; if (!n || !(it.sp || it.repeat)) return; if (it.repeat) { for (let k=0;k<n;k++) t += 100*Math.pow(2,k); } else t += it.sp * n; }); return t; };

// ---------------- multipliers ----------------
const MSHOP = [
  {k:'global', n:'Ticket Multiplier', d:'Every ticket you earn ×1.13 per level (multiplies)', max:999, cost:l=>150*Math.pow(1.32,l), eff:l=>Math.pow(1.13,l), show:l=>'×'+W.fmt(Math.pow(1.13,l))},
  {k:'combo',  n:'Combo Streak', d:'Play different machines in a row: +bonus per machine (up to 10)', max:60, cost:l=>300*Math.pow(1.45,l), eff:l=>.02+.02*l, show:l=>'+'+Math.round((.02+.02*l)*100)+'% per machine'},
  {k:'daily',  n:'Daily Login Streak', d:'Each day in a row you visit adds a bonus (up to 30 days)', max:60, cost:l=>250*Math.pow(1.45,l), eff:l=>.01+.01*l, show:l=>'+'+Math.round((.01+.01*l)*100)+'% per day'},
  {k:'learn',  n:'Learn Mode Bonus', d:'Bonus tickets for every correct answer in Learn mode', max:200, cost:l=>120*Math.pow(1.33,l), eff:l=>5*Math.pow(1.25,l), show:l=>'+'+W.fmt(5*Math.pow(1.25,l))+' per answer (× your multipliers)'},
  {k:'lucky',  n:'Lucky Payout', d:'Chance for a ×10 or ×100 jackpot when a game pays out', max:30, cost:l=>400*Math.pow(1.6,l), eff:l=>({x10:Math.min(.3,.01*l), x100:Math.min(.03,.001*l)}), show:l=>(Math.min(30,l))+'% for ×10 · '+(Math.min(3,.1*l)).toFixed(1)+'% for ×100'},
];
const GAME_UP = {n:'Machine Multiplier', max:150, cost:l=>100*Math.pow(1.4,l), eff:l=>1+.2*l};
W.MSHOP = MSHOP;
const lv = (P,k) => ((P.mult||{})[k])|0;
const glv = (P,g) => (((P.mult||{}).game||{})[g])|0;
// Golden Stars: every star you've ever EARNED counts (spending them on Wilderland prizes doesn't lower this).
const starMult = P => Math.pow(1 + (P.stars||0), 0.6);
W.starMult = starMult;
const colMult = P => Math.pow(1.2, Object.keys(P.colDone||{}).length);
const loginMult = P => 1 + Math.min(30, (P.login||{}).streak||0) * (lv(P,'daily') ? MSHOP[2].eff(lv(P,'daily')) : .01);
const comboN = P => { const c = P.combo||{}, E2 = window.WLE, warm = E2 ? E2.comboWarmMs(P) : 300000; return c.t && Date.now() - c.t > warm ? 1 : (c.n||1); };
const comboMult = P => { const E2 = window.WLE, cap = E2 ? E2.comboCap(P) : 10, str = E2 ? E2.comboStrength(P) : 1; return 1 + Math.min(cap, Math.max(0, comboN(P)-1)) * (lv(P,'combo') ? MSHOP[1].eff(lv(P,'combo')) : .01) * str; };
W.globalMult = P => MSHOP[0].eff(lv(P,'global')) * starMult(P) * colMult(P) * loginMult(P) * W.perks(P).all * (window.WLE ? window.WLE.ptAll(P) : 1) * (window.WLA && window.WLA.bonus ? window.WLA.bonus(P) : 1);
W.totalMult = (P, g) => W.globalMult(P) * comboMult(P) * (g ? GAME_UP.eff(glv(P,g)) * (W.perks(P).game[g]||1) * (window.WLE ? window.WLE.ptGame(P,g) : 1) : 1) * (window.WLE ? window.WLE.gameMult(P) : 1);
W.breakdown = P => [['Ticket Multiplier', MSHOP[0].eff(lv(P,'global'))], ['Golden Stars ('+(P.stars||0)+')', starMult(P)], ['Collections ('+Object.keys(P.colDone||{}).length+')', colMult(P)], ['Login streak ('+(((P.login||{}).streak)||0)+' days)', loginMult(P)], ['Wilderland prizes', W.perks(P).all], ['Prestige Tree 💎', window.WLE ? window.WLE.ptAll(P) * window.WLE.pt(P).games : 1], ['Arcade Expansions', window.WLE ? window.WLE.allMult(P) : 1], ['Achievements (Platinum & Diamond)', window.WLA && window.WLA.bonus ? window.WLA.bonus(P) : 1], ['Combo streak ('+(((P.combo||{}).n)||0)+')', comboMult(P)]];

// ---------------- hooks the arcade calls ----------------
// A game paid out `tix` base tickets: apply multipliers, combo and lucky jackpots.
W.payout = (P, g, tix) => { const lines = []; const prev = {...(P.combo||{}), n:comboN(P)}; const cap = window.WLE ? window.WLE.comboCap(P) : 10; const step = window.WLE && window.WLE.comboStep ? window.WLE.comboStep(P) : 1; const n = prev.g && prev.g !== g ? Math.min(cap,(prev.n||1)+step) : 1;
  const combo = {g, n, t:Date.now()}; const P2 = {...P, combo};
  const m = W.totalMult(P2, g); let out = tix * m;
  if (m > 1.01) lines.push('MULTIPLIER ×'+W.fmt(m));
  if (n > 1) lines.push('COMBO ×'+n+' MACHINES');
  const L = lv(P,'lucky'), lb = window.WLE ? window.WLE.luckBonus(P) : 0, jk = W.perks(P).jack * (window.WLE && window.WLE.jackMult ? window.WLE.jackMult(P) : 1); if (L || lb || jk > 1) { const o = MSHOP[4].eff(L); o.x10 += lb; if (jk > 1) { o.x10 = Math.min(.5, Math.max(o.x10, .01) * jk); o.x100 = Math.min(.05, Math.max(o.x100, .001) * jk); } const r = Math.random(); if (r < o.x100) { out *= 100; lines.push('JACKPOT ×100!!'); } else if (r < o.x100 + o.x10) { out *= 10; lines.push('LUCKY ×10!'); } }
  return {tix: Math.max(1, Math.round(out)), lines, patch:{combo}}; };
W.learnBonus = P => Math.round((lv(P,'learn') ? MSHOP[3].eff(lv(P,'learn')) : 2) * W.globalMult(P) * (window.WLE ? window.WLE.learnMult(P) : 1) * W.perks(P).learn);
W.login = P => { const L = P.login||{}, t = today(); if (L.last === t) return null; const streak = L.last === yesterday() ? (L.streak||0)+1 : 1; return {login:{last:t, streak, best:Math.max(L.best||0, streak)}}; };

// ---------------- challenges ----------------
const CH_TYPES = [
  {t:'play',  txt:n=>'Finish '+n+' games', n:[3,5,8], w:[15,25,40]},
  {t:'variety', txt:n=>'Play '+n+' different machines', n:[3,4,6], w:[8,10,12]},
  {t:'tix',   txt:n=>'Earn '+W.fmt(n)+' tickets from games', n:[300,800,2000], w:[4000,10000,25000], scale:1},
  {t:'learn', txt:n=>'Answer '+n+' Learn-mode questions right', n:[5,10,20], w:[40,80,150]},
  {t:'buy',   txt:n=>'Buy '+n+' prize'+(n>1?'s':''), n:[1,2,3], w:[5,10,15]},
  {t:'playG', txt:(n,g)=>'Finish '+n+' games of '+g, n:[2,3,4], w:[8,12,20], game:1},
  {t:'score', txt:(n,g,tg)=>'Score '+W.fmt(tg)+'+ in '+g+' (one run)', n:[1,1,1], w:[1,1,1], game:1, tgt:1},
];
const genChal = (key, weekly, P, games) => { const r = rng(key); const pick = [...CH_TYPES].sort(()=>r()-.5).slice(0,3); const gm = games.filter(g=>!g.idle && g.id!='2048' && g.target);
  return pick.map((ty, i) => { const d = Math.floor(r()*3), g = ty.game ? gm[Math.floor(r()*gm.length)] : null;
    let n = (weekly ? ty.w : ty.n)[d]; if (ty.scale) n = nice(n * Math.max(1, W.globalMult(P)));
    const tgt = ty.tgt && g ? nice(g.target * (weekly ? 2 : 1) * (1 + d*.5)) : 0;
    const rw = (i==2 || r() < .3) ? {k:'cap', v: weekly ? 'deluxe' : 'basic'} : {k:'tix', v: nice((weekly?6000:800) * (1+d) * Math.max(1, W.globalMult(P)))};
    return {t:ty.t, n, g: g && g.id, gn: g && g.title, tg:tgt, prog:0, claimed:false, rw, seen:[]}; }); };
W.ensureChal = (P, games) => { const C = P.chal||{}; let ch = false; const out = {...C};
  if (!C.d || C.d.key !== today()) { out.d = {key:today(), list:genChal('d'+today(), false, P, games)}; ch = true; }
  if (!C.w || C.w.key !== weekKey()) { out.w = {key:weekKey(), list:genChal('w'+weekKey(), true, P, games)}; ch = true; }
  return ch ? {chal:out} : null; };
const bump = (P, fn) => { const C = P.chal; if (!C) return null; const out = {d:C.d && {...C.d, list:C.d.list.map(x=>({...x}))}, w:C.w && {...C.w, list:C.w.list.map(x=>({...x}))}};
  [out.d, out.w].forEach(s => s && s.list.forEach(x => { if (x.prog < x.n) fn(x); x.prog = Math.min(x.n, x.prog); })); return {chal:out}; };
W.onFinish = (P, g, score, tix) => bump(P, x => {
  if (x.t=='play') x.prog++; if (x.t=='playG' && x.g==g) x.prog++; if (x.t=='tix') x.prog += tix;
  if (x.t=='variety' && !(x.seen||[]).includes(g)) { x.seen = [...(x.seen||[]), g]; x.prog = x.seen.length; }
  if (x.t=='score' && x.g==g && score >= x.tg) x.prog = x.n; });
W.onEdu = P => bump(P, x => { if (x.t=='learn') x.prog++; });
W.onBuy = P => bump(P, x => { if (x.t=='buy') x.prog++; });

// ---------------- capsules (tickets only, odds always shown) ----------------
const CAPS = [
  {id:'basic',  n:'Basic Capsule',  price:500,   col:'#00B451', odds:[60,25,10,4,1,0,0,0]},
  {id:'deluxe', n:'Deluxe Capsule', price:1.5e5,   col:'#a64be0', odds:[0,30,35,22,10,3,0,0]},
  {id:'cosmic', n:'Mega Capsule',   price:3e6,   col:'#4a5cff', odds:[0,0,0,35,40,25,0,0]},
];
// Capsules can only ever roll Common → Mythic. Cosmic and Wilderland prizes are bought with Golden Stars only.
const CAP_MAX_R = 5; CAPS.forEach(c => { for (let i = CAP_MAX_R+1; i < 8; i++) c.odds[i] = 0; const t = c.odds.reduce((a,b)=>a+b,0); if (t !== 100) c.odds = c.odds.map(o => Math.round(o*100/t*10)/10); });
W.CAPS = CAPS;
const capPrice = (c, P) => nice(Math.min(c.price * Math.max(1, Math.pow(W.globalMult(P), .25)), W.rebirthNeed(P) * .3));
const rollCap = (c, P) => { const tot = c.odds.slice(0, CAP_MAX_R+1).reduce((a,b)=>a+b,0); const r = Math.random()*tot; let acc = 0, tier = 0; for (let i=0;i<=CAP_MAX_R;i++) { if (!c.odds[i]) continue; acc += c.odds[i]; tier = i; if (r < acc) break; }
  const pool = CAT.filter(it => it.r === tier && it.r <= CAP_MAX_R && !it.season && !it.noCap && it.col !== 'golden' && !it.repeat); return pool[Math.floor(Math.random()*pool.length)] || CAT[0]; };
W.rollCap = rollCap;

// ---------------- rebirth ----------------
// 10M → 10B → 10T → 10Qa → 10Qi (10 quintillion) → 10Sx … ×1,000 each Rebirth
W.rebirthNeed = P => 1e7 * Math.pow(1000, P.rebirths||0);
// Stars come from ALL tickets ever earned: total stars = cube root of (lifetime tickets ÷ 1M). Each Rebirth gives at least 1.
W.lifetimeStars = P => Math.floor(Math.cbrt(Math.max(0, P.earned||0) / 1e6));
W.rebirthStars = P => { const need = W.rebirthNeed(P); if ((P.tickets||0) < need) return 0; return Math.max(1, W.lifetimeStars(P) - (P.stars||0)); };
// Rebirth: tickets, Multiplier upgrades, The Mines (miners, ore, mine upgrades — depth, gems and the Gem Tree stay) and the Mines Workshop upgrades reset;
// every saved game restarts. Returns the profile patch plus how many Golden Stars were earned.
W.doRebirth = P => { const stars = W.rebirthStars(P); if (!stars) return null;
  const idle = P.idle && typeof P.idle=='object' ? {...P.idle, grid:[1,0,0,0,0,0,0,0,0,0,0,0], up:{}, ore:0, hires:1, last:Date.now()} : P.idle;
  const upg = {}; // the whole Upgrade Workshop resets
  const hs = W.headStart(P); Object.assign(upg, hs.upg); // Golden Star head starts survive
  return {stars, patch:{tickets:0, mult:{}, exp:hs.exp, expUp:{}, combo:{}, stars:(P.stars||0)+stars, rebirths:(P.rebirths||0)+1, saves:{}, idle, upg}}; };
W.rebirthCard = (stars, total, n) => ({n:'+'+stars+' Golden Star'+(stars>1?'s':''), d:'Every ticket is now worth ×'+W.fmt(Math.pow(1.5,total))+'. Your next milestone is '+W.fmt(1e7*Math.pow(1000,n))+' tickets.', e:'⭐', r:7, colName:'Rebirth #'+n});
const SKINS = [{id:'',n:'Classic',stars:0},{id:'gold',n:'Gold Trim',stars:1},{id:'neon',n:'Neon Glow',stars:3},{id:'galaxy',n:'Galaxy',stars:6},{id:'rainbow',n:'Wilderland Rainbow',stars:10}];
W.SKINS = SKINS;
W.skinStyle = id => ({gold:'0 0 0 3px #F9BF01, 0 0 16px rgba(249,191,1,.6)', neon:'0 0 0 3px #64CDF5, 0 0 18px #EA55AB', galaxy:'0 0 0 3px #4a5cff, 0 0 22px rgba(166,75,224,.8)', rainbow:'0 0 0 3px #ff5fd2, 0 0 14px #64CDF5, 0 0 26px #F9BF01'})[id] || '';

// ---------------- collection status ----------------
W.colStatus = P => { build(); const inv = P.prizes||{}; return COLS.map(C => { const items = CAT.filter(it => it.col===C.id && !it.repeat), own = items.filter(it => inv[it.id]).length;
  return {id:C.id, n:C.n, e:C.e, col:C.col, own, size:items.length, done: own>=items.length && items.length>0}; }); };
W.floorTrophies = P => COLS.filter(C => (P.colDone||{})[C.id]).map(C => ({id:C.id, n:C.n, e:C.e, col:C.col}));
W.rarOwned = P => { build(); const inv = P.prizes||{}; let best = -1; CAT.forEach(it => { if (inv[it.id] && it.r > best) best = it.r; }); return best; };
W.ownedCount = P => { build(); const inv = P.prizes||{}; return CAT.filter(it => inv[it.id]).length; };
W.total = () => { build(); return CAT.filter(it=>!it.repeat).length; };

// ---------------- styles ----------------
const css = `
.wlp{font-family:"Uncut Sans","Inter",system-ui,sans-serif;color:#121313}
.wlp *{box-sizing:border-box}
.wlp-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.wlp-tab{border:none;border-radius:999px;padding:8px 14px;font:700 13px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#015640}
.wlp-tab.on{background:#015640;color:#fff}
.wlp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
.wlp-card{background:#fff;border-radius:14px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;border:2px solid var(--rc);position:relative;overflow:hidden}
.wlp-card .nm{font-weight:700;font-size:13px;color:#015640;line-height:1.15;min-height:30px;display:flex;align-items:center}
.wlp-card .ds{font-size:10.5px;color:#4a4a4a;line-height:1.25;min-height:26px}
.wlp-card .tier{font-size:9.5px;font-weight:700;letter-spacing:.12em;color:var(--rc)}
.wlp-buy{width:100%;border:none;border-radius:999px;padding:7px 6px;font:700 12px inherit;font-family:inherit;cursor:pointer;background:#015640;color:#fff}
.wlp-perk{font-size:11px;font-weight:700;line-height:1.25;color:#7a5200;background:#fff3c4;border:1.5px solid #F9BF01;border-radius:8px;padding:4px 6px;margin:2px 0 6px}
.wlp-perk.on{background:#e9f7c8;border-color:#00B451;color:#015640}
.wlp-buy:disabled{background:#d9d5c3;color:#6a6a6a;cursor:default}
.wlp-ic{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:36px;background:radial-gradient(circle at 50% 35%,#fff,var(--rbg));box-shadow:0 0 0 3px var(--rc),0 0 14px var(--rg);position:relative}
.wlp-ic img{width:54px;height:54px}
.wlp-ic.off{filter:grayscale(1) brightness(.25);opacity:.45;box-shadow:0 0 0 2px #bbb}
.wlp-r5 .wlp-ic,.wlp-r6 .wlp-ic{animation:wlpGlow 1.6s ease-in-out infinite}
.wlp-r7 .wlp-ic{box-shadow:0 0 0 3px #fff,0 0 16px #ff5fd2;background:conic-gradient(from 0deg,#ff4539,#f9bf01,#00b451,#64cdf5,#a64be0,#ff4539);animation:wlpSpin 4s linear infinite}
.wlp-r7 .wlp-ic>*{animation:wlpSpin 4s linear infinite reverse}
.wlp-r4 .wlp-card::after,.wlp-r5 .wlp-card::after,.wlp-r6 .wlp-card::after,.wlp-r7 .wlp-card::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);background-size:250% 100%;animation:wlpShine 2.8s linear infinite;pointer-events:none}
.wlp-r7.wlp-card,.wlp-card.wlp-r7{border-image:linear-gradient(90deg,#ff4539,#f9bf01,#00b451,#64cdf5,#a64be0) 1}
.wlp-chip{border:1.5px solid #015640;border-radius:999px;padding:5px 10px;font:700 12px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#015640;white-space:nowrap}
.wlp-chip.on{background:#015640;color:#fff}
.wlp-row{display:flex;gap:10px;align-items:center;background:#fff;border-radius:12px;padding:10px 12px}
.wlp-bar{height:8px;background:#ece8d6;border-radius:4px;overflow:hidden}
.wlp-bar>div{height:100%;border-radius:4px}
.wlp-box{background:#fff;border-radius:14px;padding:12px}
.wlp-h{font-size:12px;font-weight:700;letter-spacing:.12em;color:#AB2372;margin:14px 0 8px}
.wlp-small{font-size:12px;color:#4a4a4a}
.wlp-reveal{font-family:"Uncut Sans","Inter",system-ui,sans-serif;position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;background:rgba(1,20,15,.78);animation:wlpFade .25s ease-out}
.wlp-reveal.big{background:radial-gradient(circle at 50% 45%,rgba(74,92,255,.55),rgba(5,5,25,.96) 70%)}
.wlp-reveal.wild{background:radial-gradient(circle at 50% 45%,rgba(255,95,210,.5),rgba(10,0,20,.96) 70%)}
.wlp-reveal .card{background:#fff;border-radius:22px;padding:22px 26px;display:flex;flex-direction:column;align-items:center;gap:8px;max-width:320px;text-align:center;animation:wlpPop .6s cubic-bezier(.2,1.5,.4,1) both;box-shadow:0 0 0 4px var(--rc),0 0 60px var(--rg)}
.wlp-reveal .card .wlp-ic{width:110px;height:110px;font-size:64px;border-radius:26px}
.wlp-reveal .card .wlp-ic img{width:92px;height:92px}
.wlp-reveal .ttl{font-weight:800;font-size:15px;letter-spacing:.2em;color:var(--rc)}
.wlp-reveal.big .ttl,.wlp-reveal.wild .ttl{font-size:30px;color:#fff;text-shadow:0 0 18px var(--rg)}
.wlp-p{position:absolute;left:50%;top:50%;width:8px;height:8px;border-radius:50%;animation:wlpBurst 1.2s ease-out forwards;pointer-events:none}
@keyframes wlpBurst{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
@keyframes wlpPop{0%{transform:scale(.2) rotate(-12deg);opacity:0}100%{transform:none;opacity:1}}
@keyframes wlpFade{from{opacity:0}}
@keyframes wlpGlow{50%{box-shadow:0 0 0 3px var(--rc),0 0 26px var(--rc)}}
@keyframes wlpSpin{to{transform:rotate(360deg)}}
@keyframes wlpShine{from{background-position:150% 0}to{background-position:-100% 0}}
@keyframes wlpRain{to{background-position:200% 0}}
.wlp-rain{background:linear-gradient(90deg,#ff4539,#f9bf01,#00b451,#64cdf5,#a64be0,#ff4539);background-size:200% 100%;animation:wlpRain 3s linear infinite;-webkit-background-clip:text;background-clip:text;color:transparent}
.wlp-low *{animation:none!important}
`;
const ensureCss = () => { if (document.getElementById('wlp-css')) return; const s = document.createElement('style'); s.id = 'wlp-css'; s.textContent = css; document.head.appendChild(s); };

// ---------------- UI ----------------
const E = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { if (k=='style' && typeof props.style=='object') Object.assign(e.style, props.style); else if (k.startsWith('on')) e[k] = props[k]; else if (k=='cls') e.className = props[k]; else if (k=='html') e.innerHTML = props[k]; else e.setAttribute(k, props[k]); }
  kids.flat().forEach(k => { if (k==null || k===false) return; e.appendChild(typeof k=='object' ? k : document.createTextNode(String(k))); }); return e; };
const icon = (it, owned=true, big=false) => { const r = R[it.r]; const d = E('div', {cls:'wlp-ic'+(owned?'':' off'), style:{'--rc':r.c, '--rg':r.glow, '--rbg': r.c+'33'}});
  if (it.art) d.appendChild(E('img', {src:it.art, alt:''})); else d.appendChild(E('span', null, it.e)); if (!owned) d.title = '???'; return d; };

// Buy pop-ups can be switched off (remembered on this device). Rebirths and other big moments always show.
W.popsOn = () => { try { return localStorage.getItem('wl-prize-pops') !== 'off'; } catch(e) { return true; } };
W.setPops = on => { try { localStorage.setItem('wl-prize-pops', on ? 'on' : 'off'); } catch(e) {} };
W.reveal = (it, label, low, sfx, opts) => { ensureCss(); sfx = sfx || (n => window.Arcade && window.Arcade.sfx && window.Arcade.sfx(n)); const r = R[it.r], big = it.r >= 6, wild = it.r == 7;
  const o = E('div', {cls:'wlp-reveal'+(big?' big':'')+(wild?' wild':''), style:{'--rc':r.c, '--rg':r.glow}});
  const card = E('div', {cls:'card'}, E('div', {cls:'ttl'+(wild?' wlp-rain':'')}, label || (r.n.toUpperCase()+'!')), icon(it), E('div', {style:{fontWeight:800, fontSize:'20px', color:'#015640'}}, it.n), E('div', {cls:'wlp-small'}, it.d), E('div', {style:{fontSize:'11px', fontWeight:700, color:'#8a8a8a'}}, it.colName),
    E('button', {cls:'wlp-buy', style:{marginTop:'6px', maxWidth:'200px'}, onclick:()=>o.remove()}, 'Awesome!'));
  if (opts && opts.buy) card.appendChild(E('button', {cls:'wlp-chip', style:{marginTop:'4px', fontSize:'11px'}, onclick:()=>{ W.setPops(false); o.remove(); opts.onOff && opts.onOff(); }}, '🔕 Turn off these pop-ups'));
  o.appendChild(card);
  if (!low && it.r >= 2) { const n = it.r >= 6 ? 70 : it.r >= 4 ? 40 : 18; for (let i=0;i<n;i++) { const a = Math.random()*Math.PI*2, d = 120 + Math.random()*(big?420:220);
      const p = E('div', {cls:'wlp-p', style:{background: wild ? ['#ff4539','#f9bf01','#00b451','#64cdf5','#a64be0'][i%5] : (i%3? r.c : '#fff'), animationDelay:(Math.random()*.25)+'s'}}); p.style.setProperty('--dx', Math.cos(a)*d+'px'); p.style.setProperty('--dy', Math.sin(a)*d+'px'); o.appendChild(p); } }
  o.onclick = e => { if (e.target === o) o.remove(); };
  document.body.appendChild(o); sfx(it.r >= 4 ? 'win' : 'coin');
  if (it.r >= 5 && window.Arcade && window.Arcade.tone) [523,659,784,1046,1318].slice(0, it.r-2).forEach((f,i)=>window.Arcade.tone(f,.18,'triangle',.06,i*.09)); };


W.mount = (root, api) => {
  ensureCss(); build(api.classicArt);
  const games = api.games();
  let bumpK = null, expN = 1; let tab = api.tab || 'shop', colF = 'featured', rarF = -1, affordOnly = false, live = true, q = '', upgF = 'all', catF = 'all', avOff = null;
  const wrap = E('div', {cls:'wlp'+(api.lowFx()?' wlp-low':'')}); root.appendChild(wrap);
  const P = () => api.P();
  const set = patch => { api.setP(patch); };
  const tabs = [['upg','🔧 Upgrades'],['shop','🎁 Prizes'],['avatar','👕 Avatar'],['wild','⭐ Wilderland'],['mult','✖ Multipliers'],['trophy','Trophy Room'],['chal','Challenges'],['caps','Capsules'],['exp','Expansions 🎢'],['rebirth','Rebirth ⭐'],['prestige','Prestige 💎'],['stats','Most Played']];
  // keep challenges current
  { const p = W.ensureChal(P(), games); if (p) set(p); }

  // Buying shows the big pop-up only if pop-ups are on; otherwise a quick note so you can keep shopping.
  const reveal = (it, label) => { if (W.popsOn()) return W.reveal(it, label, api.lowFx(), api.sfx, {buy:true, onOff:()=>{ api.toast('BUY POP-UPS OFF · TURN THEM BACK ON AT THE TOP'); render(); }});
    api.sfx(it.r >= 4 ? 'win' : 'coin'); api.toast((label ? label+' · ' : 'GOT ')+it.n.toUpperCase()); };
  let qty = 1; try { qty = JSON.parse(localStorage.getItem('wl-prize-qty')) || 1; } catch(e) {}
  // How many copies the bulk-buy setting buys right now, and what they cost in total.
  const bulk = (it, price) => { const p = P(), want = qty === 'max' ? 1e4 : qty;
    if (isStar(it)) { if (!it.repeat) return {n:1, cost:starPrice(it, p)}; let n = 0, cost = 0, own = (p.prizes||{})[it.id]||0;
      while (n < want) { const c = 100 * Math.pow(2, own+n); if (cost + c > freeStars(p) && n > 0) break; cost += c; n++; if (cost > freeStars(p)) break; } return {n, cost}; }
    const can = Math.floor((p.tickets||0) / price); return {n: Math.max(1, Math.min(want, can)), cost: price * Math.max(1, Math.min(want, can))}; };

  const checkCols = () => { const st = W.colStatus(P()), done = {...(P().colDone||{})}; let newly = null;
    st.forEach(c => { if (c.done && !done[c.id]) { done[c.id] = true; newly = c; } });
    if (newly) { set({colDone:done}); api.toast('COLLECTION COMPLETE · '+newly.n.toUpperCase()+' · PERMANENT ×1.2'); } };

  const buy = (it, price) => { const p = P(); if (api.admin()) { api.toast('ADMIN MODE · SHOPPING DISABLED'); return; }
    const {n, cost} = bulk(it, price); const lbl = n > 1 ? 'BOUGHT ×'+n : null;
    const prizes = {...(p.prizes||{}), [it.id]: ((p.prizes||{})[it.id]||0)+n};
    let pp = {...p, prizes}, ch = {}; for (let i = 0; i < Math.min(n, 200); i++) { const c = W.onBuy(pp); if (!c) break; pp = {...pp, ...c}; ch = c; }
    if (isStar(it)) { if (freeStars(p) < cost) { api.sfx('bad'); api.toast('NEED '+(cost - freeStars(p))+' MORE GOLDEN STARS'); return; }
      set({starsSpent:(p.starsSpent||0)+cost, prizes, ...ch}); const hd = W.applyHead(P()); if (hd) set(hd); reveal(it, lbl); const pk = W.perkOf(it); if (pk) api.toast('PERMANENT POWER · '+pk.t.toUpperCase()); if (api.log) api.log('star', 'bought '+(n>1?n+'× ':'')+it.n+' for '+cost+' ⭐'); checkCols(); render(); return; }
    if ((p.tickets||0) < cost) { api.sfx('bad'); api.toast('NEED '+W.fmt(cost - p.tickets)+' MORE TICKETS'); return; }
    set({tickets:p.tickets-cost, prizes, ...ch}); reveal(it, lbl); if (api.log && it.r >= 4) api.log('prize', 'bought '+(n>1?n+'× ':'')+it.n+' ('+R[it.r].n+')'); checkCols(); render(); };

  const head = E('div'); const body = E('div'); wrap.append(head, body);
  const renderHead = () => { head.innerHTML = ''; const p = P();
    const top = E('div', {style:{display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px'}},
      E('div', {style:{background:'#D5F367', color:'#015640', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '🎟 '+W.fmt(p.tickets||0)+' tickets'),
      E('div', {style:{background:'#015640', color:'#D5F367', borderRadius:'999px', padding:'7px 14px', fontWeight:800}, title:'Total multiplier on every game'}, '×'+W.fmt(W.totalMult(p))+' total multiplier'),
      E('div', {style:{background:'#F9BF01', color:'#121313', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '⭐ '+freeStars(p)+' to spend · '+(p.stars||0)+' earned'),
      ...(window.WLE && window.WLE.diamonds(p) ? [E('div', {style:{background:'#C7F1EE', color:'#06324a', borderRadius:'999px', padding:'7px 14px', fontWeight:800}}, '💎 '+window.WLE.diaFree(p)+' Diamond Stars')] : []),
      E('div', {cls:'wlp-small'}, W.ownedCount(p)+' / '+W.total()+' prizes · '+Object.keys(p.colDone||{}).length+' / '+COLS.length+' collections'));
    const opt = E('div', {style:{display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center', marginBottom:'8px'}}, E('span', {style:{fontSize:'12px', fontWeight:700, color:'#015640'}}, 'BUY'));
    [1, 10, 100, 'max'].forEach(q => opt.appendChild(E('button', {cls:'wlp-chip'+(qty===q?' on':''), onclick:()=>{ qty = q; try { localStorage.setItem('wl-prize-qty', JSON.stringify(q)); } catch(e) {} render(); }}, q === 'max' ? 'Max' : '×'+q)));
    opt.appendChild(E('button', {cls:'wlp-chip'+(W.popsOn()?' on':''), style:{marginLeft:'6px'}, title:'The big pop-up when you buy a prize or open a capsule', onclick:()=>{ W.setPops(!W.popsOn()); api.toast(W.popsOn() ? 'BUY POP-UPS ON' : 'BUY POP-UPS OFF'); render(); }}, W.popsOn() ? '🔔 Pop-ups on' : '🔕 Pop-ups off'));
    const tb = E('div', {cls:'wlp-tabs'}); tabs.forEach(([id,t]) => tb.appendChild(E('button', {cls:'wlp-tab'+(tab==id?' on':''), onclick:()=>{ tab = id; render(); }}, t)));
    const sr = E('input', {type:'search', placeholder:'🔍 Search upgrades and prizes…', 'aria-label':'Search the shop', value:q, style:{flex:'1 1 220px', minWidth:0, font:'600 14px inherit', fontFamily:'inherit', border:'1.5px solid #015640', borderRadius:'999px', padding:'7px 14px', background:'#fff'}});
    sr.addEventListener('keydown', e => e.stopPropagation()); sr.addEventListener('input', () => { q = sr.value; if (!['upg','shop','wild'].includes(tab)) tab = 'shop'; renderBody(); setTimeout(()=>{ try { const x = head.querySelector('input[type=search]'); x.focus(); x.setSelectionRange(q.length, q.length); } catch(e){} }, 0); });
    opt.insertBefore(sr, opt.firstChild);
    head.append(top, opt, tb); };
  const match = (...t) => !q.trim() || t.join(' ').toLowerCase().includes(q.trim().toLowerCase());

  const prizeCard = (it, opts={}) => { const p = P(), own = (p.prizes||{})[it.id]||0, r = R[it.r];
    let price = opts.price || priceOf(it, p); const season = it.season && it.season !== seasonNow(), star = isStar(it), sp = star ? starPrice(it, p) : 0;
    const card = E('div', {cls:'wlp-card wlp-r'+it.r, style:{'--rc':r.c}});
    card.append(E('div', {cls:'tier'+(r.rainbow?' wlp-rain':'')}, r.n.toUpperCase()), icon(it, true), E('div', {cls:'nm'}, it.n), E('div', {cls:'ds'}, it.d));
    if (own) card.appendChild(E('div', {style:{position:'absolute', top:'6px', right:'6px', background:'#015640', color:'#D5F367', fontSize:'10px', fontWeight:800, borderRadius:'999px', padding:'2px 7px'}}, '×'+own));
    if (opts.badge) card.appendChild(E('div', {style:{position:'absolute', top:'6px', left:'6px', background:'#FF4539', color:'#fff', fontSize:'10px', fontWeight:800, borderRadius:'999px', padding:'2px 7px'}}, opts.badge));
    const need = W.rebirthNeed(p), can = !season && (star ? freeStars(p) >= sp : (p.tickets||0) >= price && price < need);
    const b = E('button', {cls:'wlp-buy', style: star ? {background:'#F9BF01', color:'#121313'} : null, onclick:()=>buy(it, price)}, season ? 'Back in '+SEASON_NAME[it.season] : (()=>{ const bk = bulk(it, price); return (bk.n > 1 ? '×'+bk.n+' · ' : '')+(star ? W.fmt(bk.cost)+' ⭐' : W.fmt(bk.cost)+' 🎟'); })());
    const em = star && window.WLAV && window.WLAV.forPrize ? window.WLAV.forPrize(it.id) : null; if (em) card.appendChild(E('div', {style:{fontSize:'10px', fontWeight:700, color:'#AB2372', margin:'2px 0'}}, '👕 Includes avatar '+em));
    const pk = star && W.perkOf(it); if (pk) card.appendChild(E('div', {cls:'wlp-perk'+(own?' on':''), title:'Permanent — survives every Rebirth'}, (own?'✅ ':'✨ ')+pk.t));
    if (!can) b.disabled = true; card.appendChild(b); return card; };

  const shop = () => { const p = P(), box = E('div');
    // featured
    const pool = CAT.filter(it => !isStar(it) && (!it.season || it.season === seasonNow()));
    const fr = rng('feat'+today()); const feat = pool[Math.floor(fr()*pool.length)], fprice = nice(priceOf(feat,p)*.7);
    const goals = pool.filter(it => !(p.prizes||{})[it.id] && priceOf(it,p) > (p.tickets||0)).sort((a,b)=>priceOf(a,p)-priceOf(b,p)).slice(0,3);
    if (!q.trim()) { box.appendChild(E('div', {cls:'wlp-h'}, 'FEATURED PRIZE OF THE DAY · 30% OFF'));
    const fr2 = E('div', {cls:'wlp-grid'}); fr2.appendChild(prizeCard(feat, {price:fprice, badge:'−30%'}));
    if (goals.length) goals.forEach(g => fr2.appendChild(prizeCard(g, {badge:'NEXT GOAL'})));
    box.appendChild(fr2); }
    // filters
    box.appendChild(E('div', {cls:'wlp-h'}, 'BROWSE'));
    const chips = E('div', {style:{display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'8px'}});
    [['featured','All'], ...COLS.map(C=>[C.id, C.e+' '+C.n+(C.season && C.season!==seasonNow()?' (away)':'')])].forEach(([id,t]) => chips.appendChild(E('button', {cls:'wlp-chip'+(colF==id?' on':''), onclick:()=>{ colF = id; render(); }}, t)));
    box.appendChild(chips);
    const rch = E('div', {style:{display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'10px', alignItems:'center'}});
    rch.appendChild(E('button', {cls:'wlp-chip'+(rarF<0?' on':''), onclick:()=>{ rarF = -1; render(); }}, 'Any rarity'));
    R.forEach((r,i) => rch.appendChild(E('button', {cls:'wlp-chip'+(rarF==i?' on':''), style:{borderColor:r.rainbow?'#ff5fd2':r.c}, onclick:()=>{ rarF = i; render(); }}, r.n)));
    rch.appendChild(E('button', {cls:'wlp-chip'+(affordOnly?' on':''), onclick:()=>{ affordOnly = !affordOnly; render(); }}, 'Can afford'));
    box.appendChild(rch);
    const grid = E('div', {cls:'wlp-grid'});
    let list = CAT.filter(it => (colF=='featured' || it.col===colF) && (rarF<0 || it.r===rarF) && (!affordOnly || (isStar(it) ? freeStars(p) >= starPrice(it,p) : priceOf(it,p) <= (p.tickets||0))) && match(it.n, it.d, R[it.r].n));
    list.sort((a,b) => priceOf(a,p)-priceOf(b,p));
    list.forEach(it => grid.appendChild(prizeCard(it)));
    if (!list.length) grid.appendChild(E('div', {cls:'wlp-small'}, 'Nothing here yet. Keep playing!'));
    box.appendChild(grid); return box; };

  const trophy = () => { const p = P(), inv = p.prizes||{}, box = E('div'), st = W.colStatus(p);
    const own = W.ownedCount(p), tot = W.total(), pct = Math.floor(own/tot*100);
    box.appendChild(E('div', {cls:'wlp-box'}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, 'Trophy Room · '+pct+'% complete'), E('div', {cls:'wlp-small'}, own+' of '+tot+' prizes · each finished collection gives a permanent ×1.2 and a trophy on the arcade floor'),
      E('div', {cls:'wlp-bar', style:{marginTop:'8px'}}, E('div', {style:{width:pct+'%', background:'linear-gradient(90deg,#00B451,#F9BF01,#ff5fd2)'}}))));
    const rarRow = E('div', {style:{display:'flex', gap:'6px', flexWrap:'wrap', margin:'10px 0'}});
    R.forEach((r,i) => { const n = CAT.filter(it => it.r===i && inv[it.id]).length, t = CAT.filter(it=>it.r===i && !it.repeat).length; rarRow.appendChild(E('div', {style:{border:'2px solid '+(r.rainbow?'#ff5fd2':r.c), borderRadius:'10px', padding:'4px 9px', fontSize:'12px', fontWeight:700, background:'#fff'}}, E('span', {cls:r.rainbow?'wlp-rain':'', style:{color:r.c}}, r.n), ' '+n+'/'+t)); });
    box.appendChild(rarRow);
    st.forEach(c => { const C = COLS.find(x=>x.id==c.id), items = CAT.filter(it=>it.col===c.id && !it.repeat).sort((a,b)=>a.r-b.r);
      const sec = E('div', {style:{background:'linear-gradient(#3b2614,#2a1b0e)', borderRadius:'14px', padding:'10px 12px', marginBottom:'10px', boxShadow:'inset 0 0 0 3px #5a3a1c'}});
      sec.appendChild(E('div', {style:{display:'flex', justifyContent:'space-between', alignItems:'center', color:'#EDE9D8', fontWeight:700, gap:'8px', flexWrap:'wrap'}},
        E('span', null, C.e+' '+C.n+(C.season?' · '+SEASON_NAME[C.season]+' only':'')+(C.prestige?' · Rebirth prizes':'')), E('span', {style:{color: c.done ? '#D5F367' : '#cfc6a8', fontSize:'13px'}}, c.done ? '🏆 COMPLETE · ×1.2' : c.own+' / '+c.size+' · '+Math.floor(c.own/c.size*100)+'%')));
      const row = E('div', {style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(64px,1fr))', gap:'8px', marginTop:'8px'}});
      items.forEach(it => { const o = !!inv[it.id]; const cell = E('div', {title: o ? it.n+' · '+it.d : '??? ('+R[it.r].n+')', style:{display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', cursor:o?'pointer':'default'}, onclick:()=>{ if (o) reveal(it, R[it.r].n.toUpperCase()); }}, icon(it, o), E('div', {style:{fontSize:'9.5px', color:o?'#EDE9D8':'#7d6a55', fontWeight:700, textAlign:'center', lineHeight:1.1}}, o ? it.n : '???'));
        cell.firstChild.style.width = cell.firstChild.style.height = '52px'; cell.firstChild.style.fontSize = '28px'; row.appendChild(cell); });
      sec.appendChild(row); sec.appendChild(E('div', {style:{height:'8px', marginTop:'6px', borderRadius:'3px', background:'linear-gradient(#a0703f,#7a5230)'}})); box.appendChild(sec); });
    return box; };

  const mult = () => { const p = P(), box = E('div'), cats = api.cats ? api.cats() : [];
    box.appendChild(E('div', {cls:'wlp-box'}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, 'Total multiplier: ×'+W.fmt(W.totalMult(p))+' · ×'+W.fmt(W.globalMult(p))+' on everything'),
      E('div', {cls:'wlp-small'}, 'Every multiplier sorted by what it boosts. Pick a category to see each one, its value and exactly what it affects.')));
    if (cats.length) { const ch = E('div', {style:{display:'flex', gap:'6px', flexWrap:'wrap', margin:'10px 0'}});
      [{id:'all', e:'📋', n:'Overview'}, ...cats].forEach(c => ch.appendChild(E('button', {cls:'wlp-chip'+(catF==c.id?' on':''), onclick:()=>{ catF = c.id; renderBody(); }}, c.e+' '+c.n+(c.total ? ' · ×'+W.fmt(Math.round(c.total*100)/100) : ''))));
      box.appendChild(ch);
      const show = catF=='all' ? cats : cats.filter(c => c.id==catF);
      show.forEach(c => { const card = E('div', {cls:'wlp-box', style:{marginBottom:'10px'}});
        card.appendChild(E('div', {style:{display:'flex', justifyContent:'space-between', gap:'8px', flexWrap:'wrap', alignItems:'baseline'}}, E('div', {style:{fontWeight:800, fontSize:'16px', color:'#015640'}}, c.e+' '+c.n), E('b', {style:{color:'#AB2372'}}, c.total ? 'Category total ×'+W.fmt(Math.round(c.total*100)/100) : '')));
        card.appendChild(E('div', {cls:'wlp-small'}, c.d));
        const tb = E('div', {style:{display:'grid', gridTemplateColumns:'1fr auto', gap:'3px 12px', marginTop:'8px', fontSize:'13px'}});
        (catF=='all' ? c.rows.slice(0, 4) : c.rows).forEach(([n,v,aff]) => tb.append(E('div', null, E('div', {style:{fontWeight:600}}, n), E('div', {style:{fontSize:'11px', color:'#6a6a6a'}}, c.n+' · affects: '+aff)), E('b', {style:{color:'#015640', alignSelf:'center'}}, v)));
        card.appendChild(tb); if (catF=='all' && c.rows.length > 4) card.appendChild(E('button', {cls:'wlp-chip', style:{marginTop:'6px'}, onclick:()=>{ catF = c.id; renderBody(); }}, 'See all '+c.rows.length));
        box.appendChild(card); }); }
    box.appendChild(perkCard());
    box.appendChild(E('div', {cls:'wlp-h'}, 'UPGRADES · PAID IN TICKETS · RESET ON REBIRTH'));
    const up = (n, d, l, max, cost, now, next, buyFn) => { const maxed = l >= max, c = maxed ? 0 : nice(cost), can = !maxed && (p.tickets||0) >= c;
      const b = E('button', {cls:'wlp-buy', style:{width:'auto', minWidth:'110px'}, onclick:buyFn}, maxed ? 'MAXED' : W.fmt(c)+' 🎟'); if (!can) b.disabled = true;
      return E('div', {cls:'wlp-row', style:{marginBottom:'6px'}}, E('div', {style:{flex:1, minWidth:0}}, E('div', {style:{fontWeight:700, color:'#015640'}}, n+'  ', E('span', {style:{fontSize:'11px', color:'#8a8a8a'}}, 'level '+l+(max<999?' / '+max:''))), E('div', {cls:'wlp-small'}, d), E('div', {style:{fontSize:'12px', fontWeight:700, color:'#AB2372'}}, 'Now: '+now+(maxed?'':'  →  Next: '+next))), b); };
    MSHOP.forEach(m => { const l = lv(p,m.k); box.appendChild(up(m.n, m.d, l, m.max, m.cost(l), l ? m.show(l) : (m.k=='global'?'×1':'off'), m.show(l+1), () => {
      const pp = P(), L = lv(pp,m.k), c = nice(m.cost(L)); if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); if (L >= m.max || (pp.tickets||0) < c) return api.sfx('bad');
      set({tickets:pp.tickets-c, mult:{...(pp.mult||{}), [m.k]:L+1}}); api.sfx('coin'); render(); })); });
    box.appendChild(E('div', {cls:'wlp-h'}, 'MACHINE MULTIPLIERS · ×0.2 MORE PER LEVEL'));
    games.filter(g=>g.id!='2048').forEach(g => { const l = glv(p,g.id); box.appendChild(up(g.title, 'Only for '+g.title, l, GAME_UP.max, GAME_UP.cost(l), '×'+GAME_UP.eff(l).toFixed(1), '×'+GAME_UP.eff(l+1).toFixed(1), () => {
      const pp = P(), L = glv(pp,g.id), c = nice(GAME_UP.cost(L)); if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); if (L >= GAME_UP.max || (pp.tickets||0) < c) return api.sfx('bad');
      const m = {...(pp.mult||{})}; m.game = {...(m.game||{}), [g.id]:L+1}; set({tickets:pp.tickets-c, mult:m}); api.sfx('coin'); render(); })); });
    return box; };

  const chal = () => { const p = P(), box = E('div'), C = p.chal||{};
    const L = p.login||{};
    box.appendChild(E('div', {cls:'wlp-box'}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '🔥 '+(L.streak||0)+'-day login streak'), E('div', {cls:'wlp-small'}, 'Come back every day to grow it (best: '+(L.best||0)+' days). Your streak bonus: ×'+W.fmt(loginMult(p)))));
    const sec = (title, s, sub) => { box.appendChild(E('div', {cls:'wlp-h'}, title)); if (sub) box.appendChild(E('div', {cls:'wlp-small', style:{marginBottom:'6px'}}, sub));
      (s && s.list || []).forEach((x, i) => { const ty = CH_TYPES.find(t=>t.t==x.t), done = x.prog >= x.n, pct = Math.floor(x.prog/x.n*100);
        const rw = x.rw.k=='tix' ? W.fmt(x.rw.v)+' 🎟' : (CAPS.find(c=>c.id==x.rw.v)||CAPS[0]).n;
        const b = E('button', {cls:'wlp-buy', style:{width:'auto', minWidth:'120px'}, onclick:()=>claim(s===C.d?'d':'w', i)}, x.claimed ? 'Claimed ✓' : done ? 'Claim '+rw : rw); if (x.claimed || !done) b.disabled = true;
        box.appendChild(E('div', {cls:'wlp-row', style:{marginBottom:'6px'}}, E('div', {style:{flex:1, minWidth:0}}, E('div', {style:{fontWeight:700, color:'#015640'}}, ty.txt(x.n, x.gn, x.tg)), E('div', {cls:'wlp-bar', style:{marginTop:'5px'}}, E('div', {style:{width:pct+'%', background:done?'#00B451':'#F9BF01'}})), E('div', {cls:'wlp-small'}, W.fmt(x.prog)+' / '+W.fmt(x.n))), b)); }); };
    sec('TODAY’S CHALLENGES', C.d, 'New ones every day at midnight.'); sec('THIS WEEK’S CHALLENGES', C.w, 'Bigger goals, bigger rewards. New ones every week.');
    return box; };
  const claim = (which, i) => { const p = P(), C = p.chal; const s = C && C[which]; if (!s) return; const x = s.list[i]; if (!x || x.claimed || x.prog < x.n) return;
    const list = s.list.map((y,j) => j==i ? {...y, claimed:true} : y); const chal2 = {...C, [which]:{...s, list}};
    if (x.rw.k=='tix') { if (!api.admin()) set({chal:chal2, tickets:(p.tickets||0)+x.rw.v, earned:(p.earned||0)+x.rw.v}); else set({chal:chal2}); api.sfx('win'); api.toast('CHALLENGE COMPLETE · +'+W.fmt(x.rw.v)+' TICKETS'); render(); }
    else { set({chal:chal2}); openCap(CAPS.find(c=>c.id==x.rw.v)||CAPS[0], true); render(); } };

  const openCap = (c, free) => { const p = P(), price = capPrice(c,p); if (api.admin() && !free) return api.toast('ADMIN MODE · SHOPPING DISABLED');
    if (!free && (p.tickets||0) < price) { api.sfx('bad'); return api.toast('NEED '+W.fmt(price-(p.tickets||0))+' MORE TICKETS'); }
    const it = rollCap(c, p), prizes = {...(p.prizes||{}), [it.id]:((p.prizes||{})[it.id]||0)+1};
    set({tickets:(p.tickets||0)-(free?0:price), prizes, capsules:(p.capsules||0)+1}); reveal(it, (free?'FREE ':'')+c.n.toUpperCase()+' · '+R[it.r].n.toUpperCase()); checkCols(); render(); };
  const caps = () => { const p = P(), box = E('div');
    box.appendChild(E('div', {cls:'wlp-box'}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, 'Mystery Capsules'), E('div', {cls:'wlp-small'}, 'Paid with tickets only — never real money. The exact odds are printed on every capsule. Capsules only hold Common to Mythic prizes — Cosmic and Wilderland prizes can only be bought with Golden Stars. Duplicates add to your count in the Trophy Room.')));
    const g = E('div', {style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px', marginTop:'10px'}});
    CAPS.forEach(c => { const price = capPrice(c,p), can = (p.tickets||0) >= price;
      const odds = E('div', {style:{display:'grid', gridTemplateColumns:'1fr auto', gap:'1px 8px', fontSize:'12px', margin:'6px 0'}});
      R.forEach((r,i) => { if (!c.odds[i]) return; odds.append(E('span', {cls:r.rainbow?'wlp-rain':'', style:{color:r.c, fontWeight:700}}, r.n), E('b', null, c.odds[i]+'%')); });
      const b = E('button', {cls:'wlp-buy', onclick:()=>openCap(c,false)}, 'Open · '+W.fmt(price)+' 🎟'); if (!can) b.disabled = true;
      g.appendChild(E('div', {cls:'wlp-box', style:{border:'3px solid '+c.col, textAlign:'center'}}, E('div', {style:{fontSize:'52px'}}, '🥚'), E('div', {style:{fontWeight:800, color:c.col, fontSize:'17px'}}, c.n), E('div', {cls:'wlp-small'}, 'ODDS FOR EACH RARITY:'), odds, b)); });
    box.appendChild(g); box.appendChild(E('div', {cls:'wlp-small', style:{marginTop:'8px'}}, 'You’ve opened '+(p.capsules||0)+' capsules. Capsule prices grow a little as your multiplier grows.')); return box; };

  // Summary of everything Golden Star prizes give you (permanent — never reset).
  const perkCard = () => { const p = P(), L = W.perkLines(p), o = W.perks(p);
    const b = E('div', {cls:'wlp-box', style:{border:'3px solid #F9BF01', background:'linear-gradient(160deg,#fffbe6,#fff3c4)'}},
      E('div', {style:{fontWeight:800, fontSize:'18px', color:'#7a5200'}}, '⭐ Wilderland power · '+o.count+' Wilderland prize'+(o.count==1?'':'s')),
      E('div', {cls:'wlp-small'}, 'Golden Stars buy only Wilderland prizes, and every one gives permanent power that survives every Rebirth. Pricier prizes give bigger bonuses.'));
    if (!L.length) b.appendChild(E('div', {style:{marginTop:'6px', fontWeight:700, color:'#015640'}}, 'No Wilderland prizes yet. They’re the only thing Golden Stars can buy — each one shows its power on the card.'));
    else { const g = E('div', {style:{display:'grid', gridTemplateColumns:'auto 1fr auto', gap:'4px 10px', marginTop:'8px', alignItems:'center'}});
      L.forEach(([e,n,v]) => g.append(E('span', null, e), E('span', {style:{fontWeight:600}}, n), E('b', {style:{color:'#015640'}}, v))); b.appendChild(g); }
    return b; };
  W._perkCard = perkCard;
  const rebirth = () => { const p = P(), box = E('div'), need = W.rebirthNeed(p), stars = W.rebirthStars(p), pct = Math.min(100, (p.tickets||0)/need*100);
    box.appendChild(E('div', {cls:'wlp-box', style:{border:'3px solid #F9BF01'}},
      E('div', {style:{fontWeight:800, fontSize:'20px', color:'#015640'}}, '⭐ Rebirth'),
      E('div', {cls:'wlp-small'}, 'When you reach the milestone you Rebirth automatically: your tickets and Multiplier upgrades reset, every game’s saved run restarts, the whole Upgrade Workshop resets, and The Mines clears its miners, ore and mine upgrades (you keep the depth you reached). In return you get Golden Stars: they boost every ticket forever (×'+W.fmt(starMult(p))+' right now), buy Star prizes with permanent powers and unlock Golden Hall prizes and cabinet skins — and The Mines’ max miner level grows 15% (now '+(function(){ let m = 30; for (let i=0;i<(p.rebirths||0);i++) m = Math.floor(m*1.15); return m; })()+'). You keep high scores, prizes, collections and achievements.'),
      E('div', {style:{marginTop:'10px', fontWeight:700}}, 'Rebirths: '+(p.rebirths||0)+' · Prestige '+(window.WLE?window.WLE.prestige(p):0)+' ('+(window.WLE?window.WLE.diaFree(p):0)+' 💎 to spend · Rebirth '+((p.rebirths||0)%10)+' / 10 to next Diamond Star) · Golden Stars earned: '+(p.stars||0)+' ('+freeStars(p)+' to spend) · star bonus ×'+W.fmt(starMult(p))),
      E('div', {style:{marginTop:'6px', fontSize:'13px'}}, 'Next milestone: '+W.fmt(need)+' tickets'),
      E('div', {cls:'wlp-small'}, 'Milestones: '+[0,1,2,3,4,5].map(i=>W.fmt(1e7*Math.pow(1000,(p.rebirths||0)+i))).join(' → ')+' → …'),
      E('div', {cls:'wlp-bar', style:{margin:'6px 0'}}, E('div', {style:{width:pct+'%', background:'#F9BF01'}})),
      E('div', {style:{fontWeight:700, color:'#015640', fontSize:'13px'}}, 'No button needed — the Rebirth happens the moment you reach '+W.fmt(need)+' tickets. You’ll earn about '+Math.max(1, W.lifetimeStars({...p, earned:Math.max(p.earned||0, need)}) - (p.stars||0))+' Golden Star(s).')));
    box.appendChild(perkCard());
    box.appendChild(E('div', {cls:'wlp-h'}, 'CABINET SKINS (UNLOCK WITH GOLDEN STARS)'));
    const sk = E('div', {style:{display:'flex', gap:'8px', flexWrap:'wrap'}});
    SKINS.forEach(s => { const ok = (p.stars||0) >= s.stars, on = (p.skin||'') === s.id;
      const b = E('button', {cls:'wlp-chip'+(on?' on':''), style:{boxShadow:W.skinStyle(s.id), opacity:ok?1:.5}, onclick:()=>{ if (!ok) return api.sfx('bad'); set({skin:s.id}); api.sfx('blip'); render(); }}, s.n+(ok?'':' · 🔒 '+s.stars+' ⭐')); sk.appendChild(b); });
    box.appendChild(sk);
    box.appendChild(E('div', {cls:'wlp-h'}, 'GOLDEN HALL · WILDERLAND PRIZES (GOLDEN STARS)'));
    const gg = E('div', {cls:'wlp-grid'}); CAT.filter(it => it.col==='golden').forEach(it => gg.appendChild(prizeCard(it))); box.appendChild(gg); return box; };

  const stats = () => { const p = P(), box = E('div'); const rows = games.map(g => ({g, n:(p.played||{})[g.id]||0, best:(p.best||{})[g.id]||0})).sort((a,b)=>b.n-a.n), mx = Math.max(1, ...rows.map(r=>r.n));
    box.appendChild(E('div', {cls:'wlp-small', style:{marginBottom:'8px'}}, Object.values(p.played||{}).reduce((a,b)=>a+b,0)+' games finished in total · kept with your profile across every update'));
    rows.forEach((r,i) => box.appendChild(E('div', {cls:'wlp-row', style:{marginBottom:'5px', padding:'6px 10px'}}, E('b', {style:{width:'20px', color:'#8a8a8a'}}, i+1), E('img', {src:api.icon(r.g.id), alt:'', style:{width:'30px', height:'30px', background:'#015640', borderRadius:'7px'}}),
      E('div', {style:{flex:1, minWidth:0}}, E('div', {style:{display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:'13px', color:'#015640'}}, E('span', null, r.g.title), E('span', null, r.n+' plays')), E('div', {cls:'wlp-bar', style:{marginTop:'3px'}}, E('div', {style:{width:Math.round(r.n/mx*100)+'%', background:r.g.color}}))),
      E('span', {style:{fontSize:'11px', color:'#4a4a4a', minWidth:'70px', textAlign:'right'}}, 'best '+W.fmt(r.best)))));
    return box; };

  // ----- Upgrades (the old Upgrade Workshop), with bulk buy -----
  const qN = () => qty === 'max' ? Infinity : qty;
  const upg = () => { const box = E('div'), data = api.upgrades ? api.upgrades() : [], p = P();
    box.appendChild(E('div', {cls:'wlp-box'}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '🔧 Upgrades · '+data.reduce((a,g)=>a+g.ups.reduce((x,u)=>x+u.lv,0),0)+' levels owned'),
      E('div', {cls:'wlp-small'}, 'Machine upgrades from the old Workshop — paid in tickets, they reset on Rebirth. Use ×1 / ×10 / ×100 / Max at the top to buy many levels at once.')));
    const ch = E('div', {style:{display:'flex', gap:'5px', flexWrap:'wrap', margin:'8px 0'}});
    [['all','All machines'], ...data.map(g=>[g.id, g.name])].forEach(([id,t]) => ch.appendChild(E('button', {cls:'wlp-chip'+(upgF==id?' on':''), onclick:()=>{ upgF = id; renderBody(); }}, t)));
    ch.appendChild(E('button', {cls:'wlp-chip'+(affordOnly?' on':''), onclick:()=>{ affordOnly = !affordOnly; renderBody(); }}, 'Can afford'));
    box.appendChild(ch); let shown = 0;
    data.filter(g => upgF=='all' || g.id==upgF).forEach(g => { const ups = g.ups.filter(u => match(u.n, u.d, g.name) && (!affordOnly || (u.lv < u.max && (p.tickets||0) >= u.cost))); if (!ups.length) return;
      box.appendChild(E('div', {cls:'wlp-h', style:{display:'flex', alignItems:'center', gap:'8px'}}, E('img', {src:g.icon, alt:'', style:{width:'24px', height:'24px', background:'#015640', borderRadius:'6px'}}), g.name.toUpperCase()+(g.tm > 1.001 ? ' · +'+W.fmt(Math.round((g.tm-1)*100))+'% TICKETS' : '')));
      ups.forEach(u => { shown++; const maxed = u.lv >= u.max, pl = api.upgPlan ? api.upgPlan(g.id, u.k, qN()) : {cnt:1, cost:u.cost}, n = Math.max(1, pl.cnt), cost = pl.cnt ? pl.cost : u.cost, can = !maxed && pl.cnt > 0;
        const b = E('button', {cls:'wlp-buy', style:{width:'auto', minWidth:'120px'}, onclick:()=>{ if (api.admin()) return api.toast('ADMIN MODE · SHOPPING DISABLED'); const got = api.buyUpg(g.id, u.k, qN()); if (got) { api.sfx('coin'); } renderHead(); renderBody(); }},
          maxed ? (u.one ? 'OWNED' : 'MAXED') : (n > 1 ? '×'+n+' · ' : '')+W.fmt(cost)+' 🎟'); if (!can) b.disabled = true;
        const pips = E('div', {style:{display:'flex', gap:'2px', marginTop:'4px'}}); if (u.cap || u.one) for (let i=0;i<Math.min(10, u.one ? 1 : u.cap);i++) pips.appendChild(E('div', {style:{width:'12px', height:'5px', borderRadius:'3px', background: i < Math.min(u.lv, u.cap||1) ? '#F9BF01' : '#d9d3bd'}}));
        box.appendChild(E('div', {cls:'wlp-row', style:{marginBottom:'6px'}}, E('div', {style:{flex:1, minWidth:0}}, E('div', {style:{fontWeight:700, color:'#015640'}}, u.n+'  ', E('span', {style:{fontSize:'11px', color:'#8a8a8a'}}, u.one ? (u.lv ? 'unlocked' : 'locked') : 'level '+W.fmt(u.lv)+(u.max < 1e9 ? ' / '+u.max : ''))),
          E('div', {cls:'wlp-small'}, u.d+(u.cap && u.lv >= u.cap ? ' · effect maxed, each level now +2% tickets' : '')), E('div', {style:{fontSize:'11px', color:'#4a4a4a'}}, 'Category: '+g.name+' · affects '+g.name+' only'), pips), b)); }); });
    if (!shown) box.appendChild(E('div', {cls:'wlp-small'}, 'No upgrades match.'));
    return box; };
  // ----- Avatar (the builder, inside the shop) -----
  const avatar = () => { const box = E('div'); if (!api.avatar) { box.appendChild(E('div', {cls:'wlp-small'}, 'Loading…')); return box; }
    box.appendChild(E('div', {cls:'wlp-small', style:{marginBottom:'6px'}}, 'Build your critter, buy avatar parts with tickets and see what achievements unlock.'));
    const host = E('div'); box.appendChild(host); setTimeout(() => { if (live && tab=='avatar') avOff = api.avatar(host); }, 0); return box; };
  // ----- Wilderland prizes (Golden Stars) -----
  const wild = () => { const p = P(), box = E('div');
    box.appendChild(E('div', {cls:'wlp-box', style:{border:'3px solid #F9BF01'}}, E('div', {style:{fontWeight:800, fontSize:'18px', color:'#015640'}}, '⭐ Wilderland prizes · '+freeStars(p)+' Golden Stars to spend'),
      E('div', {cls:'wlp-small'}, 'The rarest prizes. They cost Golden Stars (earned by Rebirthing) and each one gives a permanent power that survives every Rebirth.')));
    box.appendChild(perkCard());
    const gg = E('div', {cls:'wlp-grid', style:{marginTop:'10px'}}); const list = CAT.filter(it => isStar(it) && match(it.n, it.d) && (!affordOnly || freeStars(p) >= starPrice(it,p)));
    list.forEach(it => gg.appendChild(prizeCard(it))); if (!list.length) gg.appendChild(E('div', {cls:'wlp-small'}, 'No Wilderland prizes match.'));
    box.appendChild(E('button', {cls:'wlp-chip'+(affordOnly?' on':''), style:{margin:'10px 0 4px'}, onclick:()=>{ affordOnly = !affordOnly; renderBody(); }}, 'Can afford')); box.appendChild(gg); return box; };
  const renderBody = () => { if (!live) return; if (avOff) { try { avOff(); } catch(e){} avOff = null; } body.innerHTML = '';
    const eapi = bump => ({P, setP:set, sfx:api.sfx, toast:api.toast, admin:api.admin, games:api.games, rerender:k=>{ bumpK = k; render(); }, bump, buyN:expN, setBuyN:n=>{ expN = n; }});
    const exp = () => window.WLE ? window.WLE.expPanel(eapi(bumpK)) : E('div', null, 'Loading…');
    const prestige = () => window.WLE ? window.WLE.ptPanel(eapi()) : E('div', null, 'Loading…');
    body.appendChild(({upg, shop, avatar, wild, trophy, mult, chal, caps, exp, rebirth, prestige, stats}[tab] || shop)()); bumpK = null; };
  const render = () => { if (!live) return; renderHead(); renderBody(); };
  render();
  checkCols();
  return () => { live = false; if (avOff) { try { avOff(); } catch(e){} } wrap.remove(); };
};

window.WLP = W;
})();
