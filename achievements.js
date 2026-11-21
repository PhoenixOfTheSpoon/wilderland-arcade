// Wilderland Arcade · ACHIEVEMENTS 2.0
// Tiered achievements (Bronze → Silver → Gold → Platinum → Diamond), seven categories, rewards for every tier
// (tickets, titles, avatar items, small permanent bonuses), a queued unlock pop-up, titles and a 3-badge showcase.
// Progress comes from the stats the arcade already saves, so old saves keep everything they earned.
(function(){
'use strict';
const A = {};
const fmt = n => window.WLP ? window.WLP.fmt(n) : String(Math.round(n));
const nice = x => { x = Number(x); if (x !== x) return 0; if (!(x < 1e300)) return 1e300; if (x < 100) return Math.round(x); const p = Math.pow(10, Math.floor(Math.log10(x)) - 1); return Math.min(1e300, Math.round(x / p) * p); };
const mx = (s,k) => ((s.stats||{}).max||{})[k]||0, sm = (s,k) => ((s.stats||{}).sum||{})[k]||0;
const bs = (s,g) => (s.best||{})[g]||0, pl = (s,g) => (s.played||{})[g]||0;
const plays = s => Object.values(s.played||{}).reduce((a,b)=>a+b,0);
const keysWith = (s, pre) => Object.keys((s.stats||{}).max||{}).filter(k => k.startsWith(pre)).length;

A.TIERS = [
  {n:'Bronze',   c:'#C97A2B', g:'linear-gradient(145deg,#f3c58f,#C97A2B 60%,#8a4f17)'},
  {n:'Silver',   c:'#9aa7a2', g:'linear-gradient(145deg,#ffffff,#B9C4BF 55%,#7d8a85)'},
  {n:'Gold',     c:'#e0a800', g:'linear-gradient(145deg,#fff3a8,#F9BF01 55%,#b07d00)'},
  {n:'Platinum', c:'#4fbdb8', g:'linear-gradient(145deg,#f2fffe,#9fe8e3 50%,#3fa19c)'},
  {n:'Diamond',  c:'#4a9cff', g:'linear-gradient(145deg,#ffffff,#9fe8ff 35%,#64CDF5 60%,#a64be0)'},
];
A.CATS = ['Games','Learning','Rebirth & Prestige','Collector','Explorer','Streaks','Secret'];
const T_TIX = [100, 500, 2500, 10000, 50000];      // ticket reward per tier (scaled up by your multiplier, capped by your Rebirth goal)
const T_CAP = [.005, .01, .02, .03, .05];         // never more than this share of the current Rebirth goal
const T_BONUS = [0, 0, 0, .01, .02];              // Platinum +1% · Diamond +2% to all tickets, forever

let FAM = [], BY = {};
const add = (id, cat, e, name, desc, v, goals, x) => { const f = {id, cat, e, name, desc, v, goals: goals.map(Math.round), ...(x||{})}; FAM.push(f); BY[id] = f; };
const GE = {space:'✦',snake:'🐍',breakout:'🧱',flappy:'🐦',pong:'🏓',memory:'🃏',whack:'🐹','2048':'🔢',tictactoe:'❌',reaction:'⚡',typing:'⌨️',simon:'🎵',mines:'💣',connect4:'🔴',td:'🏰',crossing:'🐸',stack:'🪵',rootout:'🌱',trace:'✏️',idle:'⛏️'};
const GT = {space:'Space Ace',snake:'Snake Charmer',breakout:'Brick Smasher',flappy:'Sky Flapper',pong:'Paddle Pro',memory:'Elephant Brain',whack:'Gopher Hunter','2048':'Tile Tamer',tictactoe:'X Marks the Spot',reaction:'Quick Draw',typing:'Keyboard Kid',simon:'Echo Master',mines:'Bomb Squad',connect4:'Four in a Row',td:'Trail Guardian',crossing:'Road Ranger',stack:'Lumberjack',rootout:'Weed Warrior',trace:'Neat Writer',idle:'Deep Digger'};

A.init = ctx => { if (FAM.length) return; const G = ctx.games || [], NG = G.length;
  // ---------- Games: one set per cabinet ----------
  G.forEach(g => { const e = GE[g.id] || '🕹️';
    add(g.id+'_plays', 'Games', e, g.title+' Regular', n => 'Finish '+fmt(n)+' '+g.title+' game'+(n==1?'':'s'), s => pl(s,g.id), [5,25,100,250,1000], {game:g.id, titles:{2:GT[g.id]}});
    if (g.target > 0) add(g.id+'_score', 'Games', e, g.title+' Ace', n => 'Score '+fmt(n)+' in one '+g.title+' game', s => bs(s,g.id), [.5,1,2,4,8].map(m => nice(g.target*m)), {game:g.id, titles:{4:g.title+' Master'}}); });
  const sp = (id, e, name, desc, v, goals, x) => add(id, 'Games', e, name, desc, v, goals, x);
  sp('snakeLevel','🐍','Serpent Levels', n => 'Reach level '+n+' in Snake', s => mx(s,'snakeLevel'), [3,5,8,12,16]);
  sp('brkLevel','🧱','Wall Breaker', n => 'Reach level '+n+' in Breakout', s => mx(s,'brkLevel'), [3,6,10,15,20]);
  sp('bossKills','👾','Boss Buster', n => 'Defeat '+n+' Breakout boss'+(n==1?'':'es'), s => sm(s,'bossKills'), [1,5,20,50,100]);
  sp('pongShutout','🏓','Clean Sheet', n => 'Win Pong 5–0, '+n+' time'+(n==1?'':'s'), s => sm(s,'pongShutout'), [1,5,20,50,100]);
  sp('memPerfect','🃏','Photographic', n => 'Clear Memory Match with 6 or fewer misses '+n+' time'+(n==1?'':'s'), s => sm(s,'memPerfect'), [1,5,20,50,100]);
  sp('whackLevel','🐹','Gopher Warden', n => 'Reach level '+n+' in Whack-a-Gopher', s => mx(s,'whackLevel'), [3,5,10,15,20]);
  sp('whackKing','👑','Regicide', n => 'Bonk the Gopher King '+n+' time'+(n==1?'':'s'), s => sm(s,'whackKing'), [1,3,10,25,50]);
  sp('whackCombo','💥','Whack Attack', n => 'Land a '+n+'-hit combo in Whack-a-Gopher', s => mx(s,'whackCombo'), [10,20,30,50,80]);
  sp('tileLvl','🔢','Merge Master', n => 'Make a '+Math.pow(2,n)+' tile in 2048', s => mx(s,'tileLvl'), [7,9,11,12,13]);
  sp('tttStreak','❌','Unbeatable', n => 'Win '+n+' Tic-Tac-Toe rounds in a row', s => mx(s,'tttStreak'), [2,3,5,8,12]);
  sp('wpm','⌨️','Speed Typist', n => 'Hit '+n+' words per minute in Typing Race', s => mx(s,'wpm'), [20,40,60,80,100]);
  sp('minesHard','💣','Bomb Squad', n => 'Clear '+n+' Minesweeper field'+(n==1?'':'s')+' on Hard', s => sm(s,'minesHard'), [1,5,20,50,100]);
  sp('c4Boss','🔴','Lawn Defender', n => 'Beat Timmy (or someone scarier) at Connect 4, '+n+' time'+(n==1?'':'s'), s => sm(s,'c4Boss'), [1,3,10,25,50]);
  sp('tdWave','🏰','Hold the Line', n => 'Survive '+n+' waves in Trailhead Defense', s => mx(s,'tdWave'), [5,10,25,40,60]);
  sp('tdPerfect','🛡️','Untouchable', n => 'Clear '+n+' waves in a row with no leaks', s => mx(s,'tdPerfect'), [3,5,10,15,25]);
  sp('crossLevel','🐸','Crossing Guard', n => 'Reach level '+n+' in Critter Crossing', s => mx(s,'crossLevel'), [2,5,8,12,16]);
  sp('stackLines','🪵','Timber!', n => 'Clear '+n+' lines in one Timber Stack run', s => mx(s,'stackLines'), [10,20,40,80,150]);
  sp('stackMulti','🪓','Four Logs', n => 'Clear '+n+' lines at once in Timber Stack', s => mx(s,'stackMulti'), [2,3,4]);
  sp('rootHeight','🌳','Canopy Builder', n => 'Stack a '+n+'-layer tower in Root Out', s => mx(s,'rootHeight'), [5,10,25,40,60]);
  sp('rootPulled','🧤','Root Remover', n => 'Root out '+n+' invasive species', s => sm(s,'rootPulled'), [10,50,200,500,1000]);
  sp('spaceWave','✦','Star Ranger', n => 'Reach wave '+n+' in Star Ranger', s => mx(s,'spaceWave'), [5,10,20,30,50], {titles:{3:'Star Ranger'}});
  sp('secretsFound','✨','Secret Seeker', n => 'Find '+n+' hidden secret'+(n==1?'':'s')+' in Secrets', s => mx(s,'secretsFound'), [1,4,8,12,15], {titles:{4:'Secret Keeper'}});
  sp('secretsChapters','🔍','Mystery Solver', n => 'Solve '+n+' puzzle'+(n==1?'':'s')+' in Secrets', s => mx(s,'secretsChapters'), [1,2,3,5,6]);
  sp('spaceBoss','🛸','Boss Blaster', n => 'Defeat '+n+' Star Ranger boss'+(n==1?'':'es'), s => sm(s,'spaceBoss'), [1,3,10,25,50]);
  sp('rootBoss','👑','King Uprooter', n => 'Defeat the Kudzu King '+n+' time'+(n==1?'':'s'), s => sm(s,'rootBoss'), [1,3,10,25,50]);
  sp('mineGolem','🪨','Golem Crusher', n => 'Defeat '+n+' Cave Golem'+(n==1?'':'s')+' in The Mines', s => sm(s,'mineGolem'), [1,5,20,50,100]);
  sp('tdBoss','👻','Boss Hunter', n => 'Defeat '+n+' Trailhead Defense boss'+(n==1?'':'es'), s => sm(s,'tdBoss'), [1,5,15,40,100], {titles:{2:'Ghostbuster'}});
  sp('mineDepth','🕳️','Deep Delver', n => 'Reach layer '+n+' of The Mines', s => mx(s,'mineDepth'), [10,50,100,200,300], {titles:{2:'Deep Delver',4:'Core Seeker'}});
  sp('mineCore','☄️','Armageddon Survivor', n => 'Calm The Armageddon Core on Layer 100'+(n>1?' '+n+' times':''), s => sm(s,'mineCore'), [1], {titles:{0:'Core Breaker'}});
  sp('mineChests','🧰','Treasure Hunter', n => 'Open '+n+' hidden treasure rooms in The Mines', s => sm(s,'mineChests'), [3,10,25,50,100]);
  sp('mineGemTree','💎','Gem Gardener', n => 'Buy '+n+' Gem Tree upgrades in The Mines', s => mx(s,'mineGemTree'), [1,5,15,30,60]);
  sp('minerLevel','⛏️','Miner Boss', n => 'Merge a level '+n+' miner in The Mines', s => mx(s,'minerLevel'), [5,10,15,20,30]);
  // ---------- Learning ----------
  const L = (id, e, name, desc, v, goals, x) => add(id, 'Learning', e, name, desc, v, goals, x);
  L('eduRight','📚','Smart Cookie', n => 'Answer '+fmt(n)+' Learn-mode questions correctly', s => sm(s,'eduRight'), [10,100,500,2000,10000], {titles:{1:'Bookworm',2:'Math Wizard',4:'Professor'}});
  L('eduStreak','🔥','On a Roll', n => 'Get '+n+' Learn-mode answers right in a row', s => mx(s,'eduStreak'), [5,10,30,60,100], {titles:{3:'Brainstorm'}});
  L('learnTix','🎓','Learning Pays', n => 'Earn '+fmt(n)+' tickets from Learn-mode answers', s => s.learnTix||0, [1e3,1e4,1e5,1e6,1e7]);
  L('learnG','🧠','Learn Everywhere', n => 'Play Learn mode on '+n+' different machine'+(n==1?'':'s'), s => keysWith(s,'learnG:'), [1,3,6,10,15], {titles:{4:'Know-It-All'}});
  L('traceRound','✏️','Penmanship', n => 'Earn '+n+' stars in one Trace & Write round', s => mx(s,'traceRound'), [5,10,20,30,40]);
  L('rootSpecies','🦉','Field Guide', n => 'Meet '+n+' species in Root Out the Corruption', s => mx(s,'rootSpecies'), [6,12,18,24], {titles:{3:'Naturalist'}});
  // ---------- Rebirth & Prestige ----------
  const R = (id, e, name, desc, v, goals, x) => add(id, 'Rebirth & Prestige', e, name, desc, v, goals, x);
  R('rebirths','🌟','Born Again', n => 'Rebirth '+n+' time'+(n==1?'':'s'), s => s.rebirths||0, [1,3,10,25,50], {titles:{1:'Phoenix',2:'Rebirth Legend',4:'Eternal'}});
  R('prestige','💎','Diamond Hands', n => 'Prestige '+n+' time'+(n==1?'':'s')+' (every 10 Rebirths)', s => Math.floor((s.rebirths||0)/10), [1,2,3,5,10], {titles:{0:'Diamond Hands',4:'Diamond Legend'}});
  R('ptree','🌳','Branching Out', n => 'Unlock '+n+' Prestige Tree node'+(n==1?'':'s'), s => Object.keys(s.ptree||{}).length, [1,3,6,10,20]);
  R('mult','✖️','Number Go Up', n => 'Reach Ticket Multiplier level '+n, s => ((s.mult||{}).global)|0, [10,50,100,200,500]);
  R('wildPrizes','🌈','Star Shopper', n => 'Own '+n+' Wilderland prize'+(n==1?'':'s')+' (bought with Golden Stars)', s => window.WLP && window.WLP.perks ? window.WLP.perks(s).count : 0, [1,3,6,10,20], {titles:{4:'Star Royalty'}});
  R('expansions','🎢','Builder', n => 'Own '+fmt(n)+' Arcade Expansion levels in one run', s => window.WLE ? window.WLE.expLevels(s) : 0, [10,100,500,1000,2000], {titles:{3:'Tycoon'}});
  // ---------- Collector ----------
  const C = (id, e, name, desc, v, goals, x) => add(id, 'Collector', e, name, desc, v, goals, x);
  C('prizes','🧸','Prize Hoarder', n => 'Own '+n+' different prizes', s => window.WLP ? window.WLP.ownedCount(s) : Object.keys(s.prizes||{}).length, [25,100,200,300,350], {titles:{2:'Collector'}});
  C('collections','🏛️','Set Builder', n => 'Complete '+n+' prize collection'+(n==1?'':'s'), s => Object.keys(s.colDone||{}).length, [1,5,12,20,28], {titles:{4:'Museum Curator'}});
  C('rarity','✨','Rare Finds', n => 'Own a '+['Common','Uncommon','Rare','Epic','Legendary','Mythic','Cosmic','Wilderland'][n]+' prize', s => window.WLP && window.WLP.rarOwned ? window.WLP.rarOwned(s) : 0, [3,4,5,6,7]);
  C('avItems','👕','Fashionista', n => 'Own '+n+' avatar items', s => window.WLAV ? window.WLAV.ownedCount(s) : 0, [10,25,50,100,150], {titles:{3:'Fashion Icon'}});
  C('capsules','🥚','Capsule Cracker', n => 'Open '+fmt(n)+' mystery capsules', s => s.capsules||0, [5,25,100,500,2000]);
  C('classics','🎟️','Classic Collector', n => 'Own '+n+' of the 16 Arcade Classics prizes', s => (ctx.classic||[]).filter(id => (s.prizes||{})[id]).length, [4,8,12,16]);
  C('earned','💰','Ticket Tycoon', n => 'Earn '+fmt(n)+' tickets in total', s => s.earned||0, [1e3,1e5,1e7,1e10,1e15], {titles:{4:'Ticket Tycoon'}});
  // ---------- Explorer ----------
  const X = (id, e, name, desc, v, goals, x) => add(id, 'Explorer', e, name, desc, v, goals, x);
  X('variety','🗺️','Floor Walker', n => 'Play '+n+' different machines', s => Object.keys(s.played||{}).filter(id => G.some(g=>g.id==id)).length, [3,8,13,17,NG], {titles:{4:'Explorer'}});
  X('targets','🎯','Sharpshooter', n => 'Beat the target score on '+n+' machine'+(n==1?'':'s'), s => G.filter(g => g.target > 0 && bs(s,g.id) >= g.target).length, [1,5,10,14,G.filter(g=>g.target>0).length], {titles:{4:'Marksman'}});
  X('modes','🎚️','Mode Mixer', n => 'Try '+n+' different difficulty + speed combos', s => keysWith(s,'mode:'), [2,4,6,9,12]);
  X('plays','🕹️','Arcade Rat', n => 'Finish '+fmt(n)+' games in total', s => plays(s), [10,50,250,1000,5000], {titles:{3:'Arcade Rat',4:'Lifer'}});
  X('hard','🌶️','Glutton for Punishment', n => 'Finish '+fmt(n)+' games on Hard or against a rival', s => sm(s,'hard'), [10,50,200,500,1000]);
  X('resumes','⏯️','Unfinished Business', n => 'Pick a saved game back up '+n+' time'+(n==1?'':'s'), s => sm(s,'resumes'), [1,5,20]);
  X('account','🪪','Card Carrying', () => 'Sign up for an arcade account', s => mx(s,'account'), [1]);
  X('username','💡','Name in Lights', () => 'Create a leaderboard username', s => s.username ? 1 : 0, [1]);
  // ---------- Streaks ----------
  const S = (id, e, name, desc, v, goals, x) => add(id, 'Streaks', e, name, desc, v, goals, x);
  S('login','📅','Regular Visitor', n => 'Reach a '+n+'-day login streak', s => (s.login||{}).best||0, [3,7,14,30,100], {titles:{3:'Regular',4:'Arcade Royalty'}});
  S('daily','☀️','Daily Regular', n => 'Complete '+n+' daily challenge'+(n==1?'':'s'), s => Math.max(sm(s,'daily'), (s.daily||{}).done ? 1 : 0), [1,7,30,100,365], {titles:{3:'Creature of Habit'}});
  S('combo','🔗','Combo Streak', n => 'Build a '+n+'-machine combo', s => mx(s,'comboMax'), [3,5,8,10,15], {titles:{4:'Combo King'}});
  S('critters','🦊','Critter Catcher', n => 'Catch '+fmt(n)+' golden critter'+(n==1?'':'s'), s => s.critters||0, [1,25,100,250,1000], {titles:{2:'Critter Catcher'}});
  S('jackpots','🎰','Jackpot!', n => 'Hit '+fmt(n)+' Lucky Payout'+(n==1?'':'s'), s => sm(s,'jackpots'), [1,10,50,200,1000], {titles:{4:'Lucky Duck'}});
  // ---------- Secret (hidden until unlocked) ----------
  const Z = (id, e, name, desc, hint, v, title) => add(id, 'Secret', e, name, () => desc, v, [1], {secret:true, hint, titles: title ? {0:title} : {}});
  Z('owl','🦉','Night Owl','Finish a game between midnight and 4 AM','Some arcades never sleep…', s => sm(s,'owl'), 'Night Owl');
  Z('broke','🪹','Flat Broke','Spend your tickets down to exactly zero','Sometimes less is more.', s => sm(s,'broke'));
  Z('zero','🥚','Goose Egg','Finish a game with a score of exactly 0','Everyone starts somewhere…', s => sm(s,'zero'));
  Z('marathon','🏃','Marathon','Play one machine for 30 minutes straight','Stamina is a skill too.', s => sm(s,'marathon'), 'Marathoner');
  Z('trophy','🏆','Arcade Legend','Claim the Golden Trophy from the Arcade Classics','The oldest prize still shines.', s => (s.prizes||{}).trophy ? 1 : 0, 'Arcade Legend');
  Z('allin','🎲','All In','Own 10 different Mythic prizes','Luck favors the bold.', s => window.WLP && window.WLP.catalog ? window.WLP.catalog().filter(it => it.r===5 && (s.prizes||{})[it.id]).length >= 10 ? 1 : 0 : 0);
};

// ---------- evaluation ----------
A.fam = id => BY[id];
A.list = () => FAM;
A.tierOf = (P, f) => { let v = 0; try { v = f.v(P) || 0; } catch(e) {} let t = 0; while (t < f.goals.length && v >= f.goals[t]) t++; return {t, v}; };
// Recompute every family. Returns the new tier map and every newly unlocked tier (in order).
A.eval = P => { const at = {...(P.at||{})}, newly = [];
  FAM.forEach(f => { const {t} = A.tierOf(P, f), had = at[f.id]|0; if (t > had) { for (let k = had; k < t; k++) newly.push({id:f.id, t:k}); at[f.id] = t; } });
  return {at, newly}; };
A.level = P => Object.values(P.at||{}).reduce((a,b)=>a+(b|0),0);
A.total = () => FAM.reduce((a,f)=>a+f.goals.length,0);
A.achList = at => Object.entries(at||{}).flatMap(([id,t]) => Array.from({length:t|0}, (_,k) => id+'#'+(k+1)));
// Rewards
A.tixReward = (P, t) => { const W = window.WLP, m = W ? Math.max(1, W.globalMult(P)) : 1, need = W ? W.rebirthNeed(P) : 1e7; return Math.max(25, nice(Math.min(T_TIX[t] * m, need * T_CAP[t]))); };
A.titleAt = (f, t) => (f.titles||{})[t] || null;
A.bonusAt = (f, t) => f.goals.length >= 4 ? T_BONUS[t]||0 : 0;
A.itemsAt = (f, t) => window.WLAV ? window.WLAV.itemsFor(f.id, t) : [];
A.rewardText = (P, f, t) => { const out = ['+'+fmt(A.tixReward(P, t))+' 🎟']; const ti = A.titleAt(f,t); if (ti) out.push('Title “'+ti+'”'); A.itemsAt(f,t).forEach(n => out.push('Avatar: '+n)); const b = A.bonusAt(f,t); if (b) out.push('+'+Math.round(b*100)+'% all tickets forever'); return out; };
A.bonus = P => { let b = 0; FAM.forEach(f => { const t = (P.at||{})[f.id]|0; for (let k=0;k<t;k++) b += A.bonusAt(f,k); }); return 1 + b; };
A.titles = P => { const out = []; FAM.forEach(f => { const t = (P.at||{})[f.id]|0; Object.entries(f.titles||{}).forEach(([k, n]) => { if (t > +k) out.push({n, f:f.id, t:+k}); }); }); return out; };
A.title = P => { const ts = A.titles(P); return ts.some(x => x.n === P.title) ? P.title : ''; };
A.pins = P => (P.achPins||[]).filter(id => BY[id] && (P.at||{})[id]).slice(0,3).map(id => { const f = BY[id], t = (P.at||{})[id]-1; return {id, e:f.e, name:f.name+' · '+A.TIERS[t].n, c:A.TIERS[t].c, g:A.TIERS[t].g}; });

// ---------- CSS ----------
const css = `
.wla{font-family:"Uncut Sans","Inter",system-ui,sans-serif;color:#121313}
.wla *{box-sizing:border-box}
.wla-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.wla-chip{border:1.5px solid #015640;border-radius:999px;padding:6px 12px;font:700 12px inherit;font-family:inherit;cursor:pointer;background:#fff;color:#015640;white-space:nowrap}
.wla-chip.on{background:#015640;color:#fff}
.wla-box{background:#fff;border-radius:16px;padding:14px}
.wla-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.wla-card{background:#fff;border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:6px;border:2px solid #e6e2cf;position:relative}
.wla-card.got{border-color:var(--tc)}
.wla-badge{width:46px;height:46px;flex-shrink:0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:23px;background:#e6e2cf;box-shadow:inset 0 -3px 0 rgba(0,0,0,.15),0 2px 5px rgba(0,0,0,.15);position:relative}
.wla-badge.lock{filter:grayscale(1);opacity:.55}
.wla-badge::after{content:"";position:absolute;inset:3px;border-radius:50%;border:2px solid rgba(255,255,255,.55)}
.wla-pips{display:flex;gap:3px}
.wla-pip{width:14px;height:6px;border-radius:3px;background:#e6e2cf}
.wla-bar{height:7px;background:#ece8d6;border-radius:4px;overflow:hidden}
.wla-bar>div{height:100%;border-radius:4px}
.wla-small{font-size:12px;color:#4a4a4a}
.wla-rw{font-size:11px;font-weight:700;color:#AB2372;line-height:1.35}
.wla-pin{position:absolute;top:8px;right:8px;border:none;background:none;font-size:16px;cursor:pointer;opacity:.35;padding:2px}
.wla-pin.on{opacity:1}
.wla-pop{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:640;background:#fff;border-radius:20px;padding:14px 18px;display:flex;gap:14px;align-items:center;max-width:min(460px,94vw);box-shadow:0 0 0 4px var(--tc),0 18px 50px rgba(0,0,0,.45);animation:wlaIn .5s cubic-bezier(.2,1.5,.4,1) both;font-family:"Uncut Sans","Inter",system-ui,sans-serif;cursor:pointer}
.wla-pop.out{animation:wlaOut .35s ease-in forwards}
.wla-pop .wla-badge{width:64px;height:64px;font-size:32px;animation:wlaSpin 1s ease-out}
.wla-spark{position:fixed;width:8px;height:8px;border-radius:2px;z-index:639;pointer-events:none;animation:wlaBurst 1.1s ease-out forwards}
@keyframes wlaIn{from{transform:translate(-50%,120%) scale(.8);opacity:0}to{transform:translate(-50%,0);opacity:1}}
@keyframes wlaOut{to{transform:translate(-50%,130%);opacity:0}}
@keyframes wlaSpin{from{transform:rotateY(540deg) scale(.4)}to{transform:none}}
@keyframes wlaBurst{to{transform:translate(var(--dx),var(--dy)) rotate(260deg);opacity:0}}
@media (max-width:560px){.wla-pop{padding:10px 12px;gap:10px;bottom:12px}.wla-pop .wla-badge{width:44px;height:44px;font-size:22px}.wla-pt{font-size:15px!important}.wla-pop .wla-small{font-size:11px}}
@media (prefers-reduced-motion: reduce){.wla-pop,.wla-pop .wla-badge,.wla-spark{animation:none!important}}
`;
const ensureCss = () => { if (document.getElementById('wla-css')) return; const s = document.createElement('style'); s.id = 'wla-css'; s.textContent = css; document.head.appendChild(s); };
const E = (tag, props, ...kids) => { const e = document.createElement(tag); if (props) for (const k in props) { if (k=='style') { for (const sk in props.style) { if (sk.startsWith('--')) e.style.setProperty(sk, props.style[sk]); else e.style[sk] = props.style[sk]; } } else if (k.startsWith('on')) e[k] = props[k]; else if (k=='cls') e.className = props[k]; else e.setAttribute(k, props[k]); }
  kids.flat().forEach(k => { if (k==null || k===false) return; e.appendChild(typeof k=='object' ? k : document.createTextNode(String(k))); }); return e; };
const badge = (f, t, lock, big) => { const b = E('div', {cls:'wla-badge'+(lock?' lock':'')}, lock && f.secret ? '❔' : f.e); if (!lock && t >= 0) b.style.background = A.TIERS[t].g; if (big) { b.style.width = b.style.height = big+'px'; b.style.fontSize = (big/2)+'px'; } return b; };
A.badge = badge;

// ---------- unlock pop-ups (queued while a game is being played) ----------
let Q = [], showing = false, host = null, pumpT = null;
A.attach = api => { host = api; ensureCss(); if (!pumpT) pumpT = setInterval(A.pump, 1200); };
A.queue = (items, P) => { items.forEach(x => Q.push({...x, rw: A.rewardText(P, BY[x.id], x.t)})); A.pump(); };
A.pump = () => { if (showing || !Q.length || !host || host.busy()) return; showing = true; const x = Q.shift(), f = BY[x.id], T = A.TIERS[x.t];
  const low = (window.Arcade && window.Arcade.lowFx) || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const pop = E('div', {cls:'wla-pop', role:'status', style:{'--tc':T.c}}, badge(f, x.t, false),
    E('div', {style:{minWidth:0}}, E('div', {style:{fontSize:'11px', fontWeight:800, letterSpacing:'.14em', color:T.c}}, 'ACHIEVEMENT · '+T.n.toUpperCase()+(Q.length ? ' · +'+Q.length+' MORE' : '')),
      E('div', {cls:'wla-pt', style:{fontSize:'19px', fontWeight:800, color:'#015640'}}, f.name), E('div', {cls:'wla-small'}, f.desc(f.goals[x.t])), E('div', {cls:'wla-rw', style:{marginTop:'3px'}}, x.rw.join(' · '))));
  document.body.appendChild(pop);
  if (!low) { const r = pop.getBoundingClientRect(); for (let i=0;i<26;i++) { const a = Math.PI + Math.random()*Math.PI, d = 60+Math.random()*140; const s = E('div', {cls:'wla-spark', style:{left:(r.left+42)+'px', top:(r.top+40)+'px', background:[T.c,'#D5F367','#ffffff','#EA55AB'][i%4]}}); s.style.setProperty('--dx', Math.cos(a)*d+'px'); s.style.setProperty('--dy', Math.sin(a)*d+'px'); document.body.appendChild(s); setTimeout(()=>s.remove(), 1200); } }
  const tone = window.Arcade && window.Arcade.tone; if (tone) [523,659,784,1046,1318].slice(0, 3+x.t).forEach((fq,i)=>tone(fq,.14,'triangle',.05,i*.08));
  const done = () => { if (!pop.isConnected) return; pop.classList.add('out'); setTimeout(()=>{ pop.remove(); showing = false; A.pump(); }, 340); };
  pop.onclick = done; setTimeout(done, 3800); };

// ---------- the Achievements page ----------
A.mount = (root, api) => { ensureCss(); let cat = api.cat || 'All', sort = 'default';
  const wrap = E('div', {cls:'wla'}); root.appendChild(wrap);
  const P = () => api.P();
  const render = () => { wrap.innerHTML = ''; const p = P(), at = p.at||{}, lvl = A.level(p), tot = A.total(), pct = Math.round(lvl/tot*100);
    // header: completion, bonus, title, showcase
    const titles = A.titles(p), cur = A.title(p);
    const sel = E('select', {style:{fontFamily:'inherit', fontSize:'13px', fontWeight:'700', borderRadius:'10px', padding:'6px 8px', border:'1.5px solid #015640', color:'#015640', maxWidth:'100%'}, 'aria-label':'Title shown under your name', onchange:e => { api.setP({title:e.target.value}); api.sfx('blip'); render(); }},
      E('option', {value:''}, titles.length ? '— no title —' : 'Earn titles from achievements'), ...titles.map(x => { const o = E('option', {value:x.n}, '“'+x.n+'” · '+(BY[x.f] ? BY[x.f].name : 'Pets & Home')); if (x.n === cur) o.selected = true; return o; }));
    const pins = A.pins(p);
    wrap.appendChild(E('div', {cls:'wla-box', style:{display:'flex', gap:'14px', flexWrap:'wrap', alignItems:'center', marginBottom:'10px'}},
      E('div', {style:{flex:'1 1 200px', minWidth:0}}, E('div', {style:{fontWeight:800, fontSize:'22px', color:'#015640'}}, pct+'% complete'),
        E('div', {cls:'wla-small'}, lvl+' of '+tot+' tiers unlocked · Platinum and Diamond tiers add +'+Math.round((A.bonus(p)-1)*100)+'% to all tickets'),
        E('div', {cls:'wla-bar', style:{marginTop:'6px'}}, E('div', {style:{width:pct+'%', background:'linear-gradient(90deg,#00B451,#D5F367,#F9BF01)'}}))),
      E('div', {style:{flex:'1 1 200px', minWidth:0}}, E('div', {style:{fontSize:'11px', fontWeight:800, letterSpacing:'.12em', color:'#AB2372', marginBottom:'4px'}}, 'YOUR TITLE'), sel),
      E('div', {style:{flex:'1 1 180px', minWidth:0}}, E('div', {style:{fontSize:'11px', fontWeight:800, letterSpacing:'.12em', color:'#AB2372', marginBottom:'4px'}}, 'SHOWCASE (PIN UP TO 3 WITH ★)'),
        E('div', {cls:'wla-row'}, ...(pins.length ? pins.map(x => { const b = E('div', {cls:'wla-badge', title:x.name}, x.e); b.style.background = x.g; return b; }) : [E('span', {cls:'wla-small'}, 'Nothing pinned yet')])))));
    // next up
    const near = FAM.filter(f => (at[f.id]|0) < f.goals.length && !f.secret).map(f => { const {v} = A.tierOf(p, f), t = at[f.id]|0, g = f.goals[t], prev = t ? f.goals[t-1] : 0; return {f, t, v, g, pr: Math.max(0, Math.min(1, (v - prev) / Math.max(1e-9, g - prev)))}; });
    const top3 = near.slice().sort((a,b) => b.pr - a.pr).slice(0,3);
    if (top3.length) { const box = E('div', {cls:'wla-box', style:{marginBottom:'10px'}}, E('div', {style:{fontSize:'11px', fontWeight:800, letterSpacing:'.12em', color:'#AB2372', marginBottom:'6px'}}, 'NEXT UP · CLOSEST TO UNLOCKING'));
      const g = E('div', {cls:'wla-grid'}); top3.forEach(x => g.appendChild(card(p, x.f, true))); box.appendChild(g); wrap.appendChild(box); }
    // filters + sort
    const bar = E('div', {cls:'wla-row', style:{marginBottom:'8px'}});
    ['All', ...A.CATS, 'Unlocked', 'In progress'].forEach(c => bar.appendChild(E('button', {cls:'wla-chip'+(cat==c?' on':''), onclick:()=>{ cat = c; render(); }}, c)));
    const so = E('select', {style:{fontFamily:'inherit', fontSize:'12px', fontWeight:'700', borderRadius:'999px', padding:'6px 10px', border:'1.5px solid #015640', color:'#015640', marginLeft:'auto'}, 'aria-label':'Sort', onchange:e => { sort = e.target.value; render(); }},
      ...[['default','Sort: by category'],['close','Sort: closest to unlocking'],['tier','Sort: highest tier first'],['name','Sort: A–Z']].map(([v,l]) => { const o = E('option', {value:v}, l); if (v==sort) o.selected = true; return o; }));
    bar.appendChild(so); wrap.appendChild(bar);
    let list = FAM.filter(f => cat=='All' || f.cat==cat || (cat=='Unlocked' && at[f.id]) || (cat=='In progress' && !f.secret && (at[f.id]|0) < f.goals.length && A.tierOf(p,f).v > 0));
    const prog = f => { const t = at[f.id]|0; if (t >= f.goals.length) return 2; const {v} = A.tierOf(p,f), prev = t ? f.goals[t-1] : 0; return Math.max(0, Math.min(1, (v-prev)/Math.max(1e-9, f.goals[t]-prev))); };
    if (sort=='close') list = list.slice().sort((a,b) => { const pa = prog(a), pb = prog(b); return (pa>=2?-1:pa) < (pb>=2?-1:pb) ? 1 : -1; });
    if (sort=='tier') list = list.slice().sort((a,b) => (at[b.id]|0) - (at[a.id]|0));
    if (sort=='name') list = list.slice().sort((a,b) => a.name.localeCompare(b.name));
    const grid = E('div', {cls:'wla-grid'}); list.forEach(f => grid.appendChild(card(p, f))); wrap.appendChild(grid);
    if (!list.length) wrap.appendChild(E('div', {cls:'wla-small'}, 'Nothing here yet — go play!')); };
  const card = (p, f, mini) => { const at = p.at||{}, t = at[f.id]|0, done = t >= f.goals.length, {v} = A.tierOf(p, f), hidden = f.secret && !t;
    const cur = t ? A.TIERS[t-1] : null, next = done ? null : A.TIERS[t], g = done ? f.goals[f.goals.length-1] : f.goals[t], prev = t && !done ? f.goals[t-1] : 0;
    const pct = done ? 100 : Math.max(0, Math.min(100, (v - prev) / Math.max(1e-9, g - prev) * 100));
    const c = E('div', {cls:'wla-card'+(t?' got':''), style:{'--tc': cur ? cur.c : '#e6e2cf'}});
    const pips = E('div', {cls:'wla-pips'}, ...f.goals.map((_,k) => { const d = E('div', {cls:'wla-pip'}); if (k < t) d.style.background = A.TIERS[k].g; return d; }));
    c.appendChild(E('div', {style:{display:'flex', gap:'10px', alignItems:'center'}}, badge(f, t-1, !t),
      E('div', {style:{minWidth:0, flex:1}}, E('div', {style:{fontWeight:800, fontSize:'15px', color:'#015640'}}, hidden ? '???' : f.name),
        E('div', {style:{fontSize:'11px', fontWeight:700, color: cur ? cur.c : '#8a8a8a', letterSpacing:'.06em'}}, (cur ? cur.n.toUpperCase() : 'LOCKED')+(f.goals.length > 1 ? ' · '+t+'/'+f.goals.length : '')+' · '+f.cat.toUpperCase()), f.goals.length > 1 ? pips : null)));
    c.appendChild(E('div', {style:{fontSize:'13px', color:'#3d3d3d'}}, hidden ? 'Hint: '+f.hint : done ? f.desc(g)+' ✓' : f.desc(g)));
    if (!hidden) c.appendChild(E('div', {style:{display:'flex', gap:'8px', alignItems:'center'}}, E('div', {cls:'wla-bar', style:{flex:1}}, E('div', {style:{width:pct+'%', background: next ? next.g : 'linear-gradient(90deg,#64CDF5,#a64be0)'}})), E('span', {style:{fontSize:'11px', fontWeight:700, color:'#4a4a4a', whiteSpace:'nowrap'}}, done ? 'MAXED' : fmt(Math.min(v,g))+' / '+fmt(g))));
    if (!done) c.appendChild(E('div', {cls:'wla-rw'}, (hidden ? 'Reward: ' : next.n+' reward: ')+A.rewardText(p, f, t).join(' · ')));
    if (t && !mini) { const pinned = (p.achPins||[]).includes(f.id); c.appendChild(E('button', {cls:'wla-pin'+(pinned?' on':''), title: pinned ? 'Unpin from your avatar card' : 'Pin to your avatar card', 'aria-label':'Pin to showcase', onclick:()=>{ let pins = (p.achPins||[]).filter(x => x !== f.id && BY[x]); if (!pinned) { if (pins.length >= 3) pins.shift(); pins.push(f.id); } api.setP({achPins:pins}); api.sfx('blip'); render(); }}, '★')); }
    return c; };
  render();
  return () => wrap.remove(); };

window.WLA = A;
})();
