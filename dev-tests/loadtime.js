// Load-time benchmark: "school Chromebook" profile = CPU ×4 slower, ~10 Mbit/s, 60 ms latency. Cold cache each run.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:8770/Wilderland%20Arcade.dc.html', runs = +(process.argv[3] || 2);
(async()=>{ const b = await chromium.launch(); const out = [];
 for (let r = 0; r < runs; r++) { const ctx = await b.newContext({viewport:{width:1366,height:768}}); await ctx.route(/gstatic\.com|googleapis\.com|firebase/, rt=>rt.abort());
  await ctx.addInitScript(()=>{ localStorage.setItem('wl-arcade-v1', JSON.stringify({econV:5, achV:2, tickets:5e6, earned:1e9, founderChk:1, savedAt:Date.now()})); localStorage.setItem('wl-wn','2099-01-01'); localStorage.setItem('wl-road-welcomed','1'); });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', {offline:false, latency:60, downloadThroughput:10e6/8, uploadThroughput:2e6/8});
  await cdp.send('Emulation.setCPUThrottlingRate', {rate:4});
  let bytes = 0; const big = {}; cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; }); cdp.on('Network.responseReceived', e => { big[e.requestId] = e.response.url; });
  const sizes = {}; cdp.on('Network.loadingFinished', e => { sizes[big[e.requestId]] = e.encodedDataLength; });
  const t0 = Date.now(); await p.goto(url, {waitUntil:'commit'});
  let tPaint = 0, tFloor = 0, tReady = 0, tUse = 0;
  for (let i = 0; i < 600; i++) { await p.waitForTimeout(100); const st = await p.evaluate(()=>({ any: document.body && document.body.innerText.trim().length > 20, floor: /Snowball Showdown|Deep Mines|Trailhead/.test(document.body ? document.body.innerText : ''), ready: !!(window.Arcade && window.Arcade.snowWorld), use: !!(window.WLQ && !document.getElementById('wl-boot') && /Snowball Showdown|Deep Mines/.test(document.body.innerText)) })).catch(()=>({}));
    const t = Date.now() - t0; if (!tPaint && st.any) tPaint = t; if (!tFloor && st.floor) tFloor = t; if (!tUse && st.use) tUse = t; if (!tReady && st.ready) tReady = t; if (tReady && (tUse || !st.use === false)) break; if (tReady && tUse) break; }
  await p.waitForTimeout(1500);
  out.push({T: await p.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(window.WL_T||{}).map(([k,v])=>[k,Math.round(v)])))), firstText:tPaint, floor:tFloor, floorUsable:tUse, allGamesLoaded:tReady, MB:(bytes/1e6).toFixed(2)});
  if (r == 0) console.log('largest downloads:\n' + Object.entries(sizes).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([u,s])=>'  '+(s/1e3).toFixed(0)+' KB  '+u.replace(/^.*\//,'').slice(0,60)).join('\n'));
  await ctx.close(); }
 console.log(JSON.stringify(out)); await b.close(); })();
