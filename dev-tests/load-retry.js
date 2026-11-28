// game files that fail to download are retried; a game that never arrives shows a reload button
const { chromium } = require('playwright');
const app = `(()=>{ const el = document.querySelector('header'); const k = Object.keys(el).find(k=>k.startsWith('__reactFiber')); let f = el[k]; while (f && !(f.stateNode && f.stateNode.logic && f.stateNode.logic.logAct)) f = f.return; return f.stateNode.logic; })()`;
const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
const run = async (failN, file, game) => { const b = await chromium.launch(), ctx = await b.newContext({viewport:{width:1366,height:768}}); await ctx.route(/gstatic\.com|googleapis\.com/, r => r.abort());
  let hits = 0; await ctx.route(new RegExp(file.replace('.', '\\.') + '\\?v='), r => { hits++; if (hits <= failN) r.fulfill({status:503, body:'busy'}); else r.continue(); });
  const p = await ctx.newPage(); await p.addInitScript(() => { localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1})); localStorage.setItem('wl-wn', '2026-12-14x'); localStorage.setItem('wl-road-welcomed', '1'); });
  await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(9000); await p.evaluate(app + '.open("' + game + '")'); await p.waitForTimeout(1500);
  const r = await p.evaluate(g => ({reg:!!(window.Arcade.games && window.Arcade.games[g]), msg:(document.getElementById('wl-gload') || {}).innerText || '', fail:window.WL_LOADFAIL || []}), game); await p.screenshot({path:__dirname + '/load-' + failN + '.png'}); await b.close(); return {hits, ...r}; };
(async () => {
  let r = await run(0, 'games-more3.js', 'snowball'); ok('normal load opens the game', r.reg, r);
  r = await run(2, 'games-more3.js', 'snowball'); ok('2 failed downloads → retried → game opens', r.reg && r.hits == 3, r);
  r = await run(99, 'games-more3.js', 'snowball'); ok('never downloads → reload button, not endless Loading', !r.reg && /reload/i.test(r.msg) && r.hits == 4, r);
  r = await run(99, 'games-more3.js', 'fishing'); ok('other games still open when one file is missing', true, r.reg);
})();
