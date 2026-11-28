// What's New shows only unseen items
const { chromium } = require('playwright');
const ok = (n, c, v) => console.log((c ? 'PASS ' : 'FAIL ') + n + (v !== undefined ? ' → ' + JSON.stringify(v) : ''));
(async () => { const b = await chromium.launch(), ctx = await b.newContext(); await ctx.route(/gstatic\.com|googleapis\.com/, r => r.abort()); const p = await ctx.newPage();
  await p.goto('http://localhost:8770/Wilderland%20Arcade.dc.html'); await p.waitForTimeout(5000);
  const run = (pre, force) => p.evaluate(([pre, force]) => { document.querySelectorAll('.wlq-ov').forEach(o => o.remove()); localStorage.removeItem('wl-wn-seen'); Object.entries(pre).forEach(([k, v]) => v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v));
    const r = window.WLQ.whatsNew(force); const n = document.querySelectorAll('.wlq-ov .wlq-item').length; document.querySelectorAll('.wlq-ov').forEach(o => o.remove()); return {r, n, total:window.WLQ.WN.items.length}; }, [pre, force]);
  let r = await run({'wl-wn':'2026-12-14y'}); ok('old save: only the newest item pops up', r.r && r.n == 1, r);
  r = await p.evaluate(() => { const r2 = window.WLQ.whatsNew(); document.querySelectorAll('.wlq-ov').forEach(o => o.remove()); return r2; }); ok('seen → no popup next time', r === false, r);
  r = await p.evaluate(() => { window.WLQ.WN.items.unshift(['🧪', 'Test item', 'x']); const r2 = window.WLQ.whatsNew(); const n = document.querySelectorAll('.wlq-ov .wlq-item').length; document.querySelectorAll('.wlq-ov').forEach(o => o.remove()); window.WLQ.WN.items.shift(); return [r2, n]; }); ok('a new item later → only that one shows', r[0] && r[1] == 1, r);
  r = await run({'wl-wn':null}); ok('brand-new player sees only the newest 6', r.r && r.n == 6, r);
  r = await run({'wl-wn':'2026-12-14z'}, true); ok('menu button shows the recent 12', r.r && r.n == 12, r);
  await b.close(); })();
