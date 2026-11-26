// Wilderland Arcade · Firebase connection (accounts, cloud saves, usernames, global leaderboard).
// Loaded as an ES module. If it can't load (offline, blocked), the arcade keeps working in on-device mode.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { connectAuthEmulator, signInWithCredential, getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, setPersistence, GoogleAuthProvider, signInWithPopup, browserLocalPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { connectFirestoreEmulator, getFirestore, doc, getDoc, setDoc, deleteDoc, where, collection, addDoc, query, orderBy, limit, getDocs, runTransaction, serverTimestamp, increment, onSnapshot, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCVBNMAm4oDibHmWru9LIYnnT898NXFNu0",
  authDomain: "arcade-14b1a.firebaseapp.com",
  projectId: "arcade-14b1a",
  storageBucket: "arcade-14b1a.firebasestorage.app",
  messagingSenderId: "78745017621",
  appId: "1:78745017621:web:af73c75eca6c9235839d1c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Local testing only: on localhost with wl-emu set, talk to the Firebase emulators instead of the real database.
const EMU = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && (() => { try { return localStorage.getItem('wl-emu') == '1'; } catch (e) { return false; } })();
if (EMU) { connectFirestoreEmulator(db, '127.0.0.1', 8085); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); }
// ADMIN CONTROL RECORD — lives at usernames/~admin so it works with the database rules the arcade already has
// (anyone can read usernames; only the account that created a name can change it). The admin's game creates it the first
// time jonah@wilderland.academy logs in, so after that nobody else can edit it. It holds: the leaderboard season, full-reset
// time, reload time, shutdown timer, chat mutes/hidden messages, hidden scores and per-player admin adjustments.
// Stability & Security update: the control record moved to config/control, which ONLY the admin's Google account can
// write (enforced by firestore.rules). The old usernames/~admin record is still read until the new one exists.
const CTRL = doc(db, 'config', 'control'), LEGACY = doc(db, 'usernames', '~admin');
const ctrlGet = async () => { const c = await getDoc(CTRL); if (c.exists()) return c; return getDoc(LEGACY); };
let SEASON = 's2', RESET_AT = 0, FROZEN = false, DOWN = {until:0, msg:''}, MUTES = [], C = {};
const setDown = d => { MUTES = d.mutes || []; DOWN = {until: d.downUntil || 0, msg: d.downMsg || ''}; window.dispatchEvent(new CustomEvent('wl-down', {detail: DOWN})); };
try { const c = await Promise.race([ctrlGet(), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]); if (c && c.exists()) { C = c.data(); if (C.season) SEASON = C.season; RESET_AT = C.resetAt || 0; DOWN = {until: C.downUntil || 0, msg: C.downMsg || ''}; MUTES = C.mutes || []; } } catch (e) {}
const board = game => collection(db, 'boards', game + '@' + SEASON, 'scores');

const PL = {rows:null, at:0};   // shared cache for the player boards
const POSTED = {}, TIXAT = {};   // best score already on the board this session, per game
const WLCloud = {
  ready: true,
  onAuth: cb => onAuthStateChanged(auth, cb),
  async signUp(email, pw, remember) { await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence); return (await createUserWithEmailAndPassword(auth, email, pw)).user; },
  async signIn(email, pw, remember) { await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence); return (await signInWithEmailAndPassword(auth, email, pw)).user; },
  async google(remember) { await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence); const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return (await signInWithPopup(auth, p)).user; },
  signOut: () => signOut(auth),
  reset: email => sendPasswordResetEmail(auth, email),
  async loadProfile(uid) { const s = await getDoc(doc(db, 'profiles', uid)); if (!s.exists()) return null; const d = s.data(); let P = null, bk = null; try { P = JSON.parse(d.data); } catch (e) {} try { bk = d.bk ? JSON.parse(d.bk) : null; } catch (e) {} return { P, bk, name: d.name || '', created: d.created || '', updated: (d.updated && d.updated.toMillis) ? d.updated.toMillis() : 0 }; },
  saveProfile(uid, P, meta, bk) { if (FROZEN) return Promise.resolve(); const data = JSON.stringify(P), extra = bk && data.length + bk.length < 850000 ? { bk } : {}; return setDoc(doc(db, 'profiles', uid), { ...extra, data, name: (meta && meta.name) || '', created: (meta && meta.created) || '', updated: serverTimestamp() }, { merge: true }); },
  claimUsername(name, uid, old) { const key = name.toLowerCase();
    return runTransaction(db, async tx => { const ref = doc(db, 'usernames', key), s = await tx.get(ref);
      if (s.exists() && s.data().uid !== uid) throw Object.assign(new Error('taken'), { code: 'taken' });
      tx.set(ref, { uid, name }); if (old && old.toLowerCase() !== key) tx.delete(doc(db, 'usernames', old.toLowerCase())); }); },
  // Leaderboard season: bump SEASON to start a fresh, empty leaderboard.
  postScore(game, row, cap) { const s2 = Math.min(Number(row.s) || 0, 9.99e299); if (!ME || !(s2 > 0)) return Promise.resolve();
    if (cap && s2 > cap) return addDoc(collection(db, 'flags'), { uid: ME.uid, u: String(row.u || '').slice(0, 16), g: String(game).slice(0, 20), s: s2, at: serverTimestamp() });
    const k = game + '@' + SEASON; if ((POSTED[k] || 0) >= s2) return Promise.resolve();
    const ref = doc(board(game), ME.uid);
    return runTransaction(db, async tx => { const cur = await tx.get(ref); const old = cur.exists() ? (cur.data().s || 0) : 0; POSTED[k] = Math.max(old, s2); if (old >= s2) return;
      tx.set(ref, { ...row, uid: ME.uid, s: s2, ts: serverTimestamp() }); })
      // (until the new database rules are published, the old ones only allow a new row per score)
      .catch(e => { if (String(e && e.code).includes('permission')) return addDoc(board(game), { ...row, s: s2 }); throw e; }); },
  // Overall ticket board: ONE always-current row per player, kept on the player's own username record
  // (the existing rules let each player update the name they own). This replaced a row-per-game board that filled up
  // with one player's old rows and stopped showing everyone else.
  setTix(uid, row) { if (!row || !row.u) return Promise.resolve(); const key = String(row.u).toLowerCase();
    const now = Date.now(); if (now - (TIXAT[key] || 0) < 3500) return Promise.resolve(); TIXAT[key] = now;
    return setDoc(doc(db, 'usernames', key), { uid, name: row.u, s: Math.min(Number(row.s) || 0, 9.99e299), av: row.av || '', al: row.al || 0, d: row.d || '', rb: row.rb || 0, db: row.db || 0, ov: Math.min(Number(row.ov) || 0, 9.99e299), ss: SEASON, at: now, ts: serverTimestamp() }, { merge: true }); },
  // Every player's progress row (rebirths, prestige, achievements) for the Overall / Rebirths / Diamond Stars / Achievements boards.
  // One shared fetch (cached a minute) feeds all of them, to keep reads low.
  async players() { if (PL.at && Date.now() - PL.at < 60000 && PL.rows) return PL.rows;
    const hs = new Set(C.hiddenScores || []), ht = C.hiddenTix || {}, hid = x => (hs.has(x.id) && !x.at) || (ht[x.id] && (x.at || 0) < ht[x.id]);
    const qs = await Promise.allSettled(['ov', 'rb', 'al'].map(f => getDocs(query(collection(db, 'usernames'), orderBy(f, 'desc'), limit(100)))));
    const by = {}; qs.forEach(q => { if (q.status == 'fulfilled') q.value.docs.forEach(d => { by[d.id] = { ...d.data(), id: d.id, u: d.data().name }; }); });
    PL.rows = Object.values(by).filter(x => x.uid && x.ss === SEASON && !hid(x) && x.id !== '~admin'); PL.at = Date.now(); return PL.rows; },
  async top(game, n = 100) { if (game == '_pl') return WLCloud.players(); const hs = new Set(C.hiddenScores || []);
    if (game == '_tix') { const r = await getDocs(query(collection(db, 'usernames'), orderBy('s', 'desc'), limit(150))); const ht = C.hiddenTix || {};
      // old-style hides (no time) only count until the player posts again with the newer page
      const hid = x => (hs.has(x.id) && !x.at) || (ht[x.id] && (x.at || 0) < ht[x.id]);
      const fresh = r.docs.map(d => ({ ...d.data(), id: d.id, u: d.data().name })).filter(x => x.uid && x.ss === SEASON && !hid(x) && x.id !== '~admin');
      if (fresh.length >= 25) return fresh.slice(0, n);
      // While players are still moving over, also show each player's best row from the old board.
      const have = new Set(fresh.map(x => x.uid)); let old = [];
      try { const o = await getDocs(query(board('_tix'), orderBy('s', 'desc'), limit(250))); const seen = new Set();
        old = o.docs.map(d => ({ ...d.data(), id: d.id })).filter(x => !hs.has(x.id) && !have.has(x.uid) && !seen.has(x.uid) && seen.add(x.uid)); } catch (e) {}
      return fresh.concat(old).sort((a, b) => b.s - a.s).slice(0, n); }
    const r = await getDocs(query(board(game), orderBy('s', 'desc'), limit(200)));
    // each player's best score only, so one player can't fill the whole board
    const seen = new Set(); return r.docs.map(d => ({ ...d.data(), id: d.id })).filter(x => !hs.has(x.id) && !seen.has(x.uid) && seen.add(x.uid)).slice(0, n); },
};
// ---------- admin (writes go to the control record; only its owner can change it) ----------
let ME = null; onAuthStateChanged(auth, u => { ME = u; });
const ctrlSet = async patch => { if (!ME) throw Object.assign(new Error('Log in first'), { code: 'not-logged-in' });
  const cur = await getDoc(CTRL); if (!cur.exists()) { const old = await getDoc(LEGACY); const base = old.exists() ? { ...old.data() } : {}; delete base.uid; delete base.name; delete base.email; return setDoc(CTRL, { ...base, ...patch }); }
  return setDoc(CTRL, patch, { merge: true }); };
WLCloud.ensureAdmin = async () => { if (!ME) return false; try { const cur = await getDoc(CTRL); if (!cur.exists()) await ctrlSet({ adminSince: Date.now() }); return true; } catch (e) { return false; } };
const hide = async (field, vals) => { const cur = await ctrlGet(); const list = new Set((cur.exists() && cur.data()[field]) || []); [].concat(vals).forEach(v => list.add(v)); return ctrlSet({ [field]: [...list].slice(-5000) }); };
// Real deletes still work if the newer rules are ever published; otherwise the score is hidden for everyone.
WLCloud.deleteScore = async (game, id) => { try { await deleteDoc(doc(db, 'boards', game + '@' + SEASON, 'scores', id)); } catch (e) { await hide('hiddenScores', id); } };
WLCloud.deleteUserScores = async (game, uid) => { if (game == '_tix') { const r = await getDocs(query(collection(db, 'usernames'), where('uid', '==', uid))); const names = r.docs.map(d => d.id).filter(id => id !== '~admin'), ids = []; try { const o = await getDocs(query(board('_tix'), where('uid', '==', uid))); o.docs.forEach(d => ids.push(d.id)); } catch (e) {}
  // A player's ticket row is hidden only until their game posts a fresh total (so nobody vanishes from the board for good).
  if (names.length) { const cur = await ctrlGet(); const ht = { ...((cur.exists() && cur.data().hiddenTix) || {}) }; names.forEach(n => ht[n] = Date.now()); await ctrlSet({ hiddenTix: ht }); }
  if (ids.length) await hide('hiddenScores', ids); return names.length + ids.length; }
  const r = await getDocs(query(board(game), where('uid', '==', uid))); const failed = [];
  for (const d of r.docs) { try { await deleteDoc(d.ref); } catch (e) { failed.push(d.id); } } if (failed.length) await hide('hiddenScores', failed); return r.size; };
// Per-player adjustments: a list of {id, rm|all|upg|full}. The player's game applies any it hasn't seen yet.
const addAdj = async (uid, item) => { const cur = await ctrlGet(); const adj = { ...((cur.exists() && cur.data().adj) || {}) }; adj[uid] = [...(adj[uid] || []), { id: Date.now(), ...item }].slice(-20); return ctrlSet({ adj }); };
WLCloud.adjust = (uid, amount) => addAdj(uid, amount < 0 ? { all: true } : { rm: amount });
WLCloud.adminFlag = (uid, data) => addAdj(uid, data);
WLCloud.adjList = uid => ((C.adj || {})[uid] || []);
WLCloud.takeAdjust = async uid => null; // (old path, kept so older pages don't break)
WLCloud.resetAt = () => RESET_AT;
WLCloud.resetEveryone = async () => { const now = Date.now(), season = 's' + now.toString(36); await ctrlSet({ season, resetAt: now, hiddenScores: [], adj: {} }); return season; };
WLCloud.reloadEveryone = () => ctrlSet({ reloadAt: Date.now() });
// Live: shutdown, reloads, resets and adjustments reach every open tab within a second or two.
let RELOAD_AT = null;
let CTRL_OK = false, CTRL_AT = 0, ctrlRetry = 0;
const onCtrl = d => { C = d; CTRL_AT = Date.now(); setDown(d);
  window.dispatchEvent(new CustomEvent('wl-ctrl', { detail: d }));
  if (RELOAD_AT === null) { RELOAD_AT = d.reloadAt || 0; return; }
  if ((d.resetAt || 0) > RESET_AT || (d.reloadAt || 0) > RELOAD_AT) { if ((d.resetAt || 0) > RESET_AT) FROZEN = true; RELOAD_AT = d.reloadAt || 0; RESET_AT = d.resetAt || 0; setTimeout(() => location.reload(), 600 + Math.random() * 1500); } };
const listenCtrl = () => { try { onSnapshot(CTRL, async snap => { CTRL_OK = true; ctrlRetry = 0; if (snap.exists()) onCtrl(snap.data()); else { try { const o = await getDoc(LEGACY); onCtrl(o.exists() ? o.data() : {}); } catch (e) { onCtrl({}); } } },
  e => { CTRL_OK = false; console.warn('[cloud] control listener stopped:', e && (e.code || e.message)); ctrlRetry = Math.min(ctrlRetry + 1, 6); setTimeout(listenCtrl, 15000 * ctrlRetry); }); } catch (e) {} };
listenCtrl();
// Backup check so a shutdown still arrives if the live listener died (bad wifi, iPad asleep, database busy).
const pollCtrl = async force => { if (document.hidden) return; if (!force && CTRL_OK && Date.now() - CTRL_AT < 600000) return;
  try { const c = await ctrlGet(); onCtrl(c.exists() ? c.data() : {}); } catch (e) {} };
setInterval(() => pollCtrl(false), 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - CTRL_AT > 30000) pollCtrl(true); });
WLCloud.down = () => DOWN;
WLCloud.shutdown = async (minutes, msg) => { const until = minutes > 0 ? Date.now() + minutes * 60000 : 0; await ctrlSet({ downUntil: until, downMsg: msg || '' }); setDown({ ...C, downUntil: until, downMsg: msg || '' }); return until; };
// Arcade chat: stored with the leaderboards (allowed by the existing rules). The page filters words, links and personal info.
const CHAT = collection(db, 'boards', '_chat', 'scores');
WLCloud.chatListen = cb => onSnapshot(query(CHAT, orderBy('at', 'desc'), limit(60)), snap => { const hid = new Set(C.hiddenChat || []);
  cb(snap.docs.filter(d => !hid.has(d.id)).map(d => ({ id: d.id, ...d.data(), at: d.data().at && d.data().at.toMillis ? d.data().at.toMillis() : Date.now() })).reverse()); }, () => cb(null));
WLCloud.chatSend = row => { if (!ME) return Promise.reject(Object.assign(new Error('login'), { code: 'not-logged-in' })); const b = writeBatch(db);
  const msg = { ...row, uid: ME.uid, s: 0, d: new Date().toISOString().slice(0, 10), at: serverTimestamp() };
  b.set(doc(db, 'chatRate', ME.uid), { ts: serverTimestamp() }); b.set(doc(CHAT), msg);
  // (until the new database rules are published, the old ones don't know chatRate; then a plain message still works)
  return b.commit().catch(e => { if (String(e && e.code).includes('permission') && !C.rulesV2) return addDoc(CHAT, msg); throw e; }); };
WLCloud.chatOff = () => !!C.chatOff;
WLCloud.setChatOff = off => ctrlSet({ chatOff: !!off });
WLCloud.report = m => ME ? addDoc(collection(db, 'reports'), { mid: String(m.id || ''), t: String(m.t || '').slice(0, 200), u: String(m.u || '').slice(0, 16), uid: String(m.uid || ''), by: ME.uid, byU: String(m.byU || '').slice(0, 16), at: serverTimestamp() }) : Promise.reject(Object.assign(new Error('login'), { code: 'not-logged-in' }));
// ---------- admin moderation (all of these are refused by the rules unless you're the admin's Google account) ----------
const rows = s => s.docs.map(d => ({ id: d.id, ...d.data(), at: d.data().at && d.data().at.toMillis ? d.data().at.toMillis() : (d.data().at || 0) }));
WLCloud.mod = {
  reports: cb => onSnapshot(query(collection(db, 'reports'), orderBy('at', 'desc'), limit(100)), s => cb(rows(s)), e => cb(null, e)),
  clearReport: id => deleteDoc(doc(db, 'reports', id)),
  flags: cb => onSnapshot(query(collection(db, 'flags'), orderBy('at', 'desc'), limit(100)), s => cb(rows(s)), e => cb(null, e)),
  clearFlag: id => deleteDoc(doc(db, 'flags', id)),
  // remove every leaderboard row a player has this season (all games), and zero their overall ticket row
  resetPlayer: async (uid, games) => { let n = 0; for (const g of games) { try { const r = await getDocs(query(board(g), where('uid', '==', uid))); for (const d of r.docs) { await deleteDoc(d.ref); n++; } } catch (e) {} }
    const u = await getDocs(query(collection(db, 'usernames'), where('uid', '==', uid))); for (const d of u.docs) if (d.id !== '~admin') { await setDoc(d.ref, { s: 0, ov: 0 }, { merge: true }); n++; } return n; },
  findPlayer: async name => { const d = await getDoc(doc(db, 'usernames', String(name).toLowerCase())); return d.exists() ? { id: d.id, ...d.data() } : null; },
  clearChat: async () => { const r = await getDocs(query(CHAT, orderBy('at', 'desc'), limit(200))); for (const d of r.docs) await deleteDoc(d.ref); return r.size; },
};
WLCloud.chatDelete = async id => { try { await deleteDoc(doc(db, 'boards', '_chat', 'scores', id)); } catch (e) { await hide('hiddenChat', id); } };
WLCloud.setMutes = mutes => ctrlSet({ mutes });
WLCloud.mutes = () => MUTES;
// Temporary kick: the player's tabs show a countdown screen until the time is up.
WLCloud.kick = async (uid, minutes) => { const cur = await ctrlGet(); const kicks = { ...((cur.exists() && cur.data().kicks) || {}) }; const now = Date.now();
  Object.keys(kicks).forEach(k => { if (kicks[k] < now) delete kicks[k]; }); if (minutes > 0) kicks[uid] = now + minutes * 60000; else delete kicks[uid]; return ctrlSet({ kicks }); };
WLCloud.kickedUntil = uid => ((C.kicks || {})[uid]) || 0;
// Admin activity tracker: short notes about what signed-in players do (games finished, rebirths, big prizes, coming online).
// Stored next to the leaderboards like chat. Only usernames and game events — never emails or personal info.
const ACT = collection(db, 'boards', '_activity', 'scores');
WLCloud.logAct = row => addDoc(ACT, { ...row, s: 0, d: new Date().toISOString().slice(0, 10), at: serverTimestamp() });
WLCloud.actListen = (cb, n = 200) => onSnapshot(query(ACT, orderBy('at', 'desc'), limit(n)), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data(), at: d.data().at && d.data().at.toMillis ? d.data().at.toMillis() : Date.now() }))), () => cb(null));
// Suggestion box (used when no Google Form link is set): stored with the boards, read in Admin tools.
const SUG = collection(db, 'boards', '_suggest', 'scores');
WLCloud.suggest = row => addDoc(SUG, { ...row, s: 0, d: new Date().toISOString().slice(0, 10), at: serverTimestamp() });
WLCloud.sugDelete = id => deleteDoc(doc(db, 'boards', '_suggest', 'scores', id));
WLCloud.sugListen = cb => onSnapshot(query(SUG, orderBy('at', 'desc'), limit(200)), snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data(), at: d.data().at && d.data().at.toMillis ? d.data().at.toMillis() : Date.now() }))), () => cb(null));
// ================= ADMIN ABUSE: live arcade-wide events =================
// events/live holds every running, upcoming and finished-but-not-cleared event. Everyone reads it live; ONLY the admin's
// Google account can write it (enforced by the Firestore rules in firestore.rules, not just by this page).
const EV = doc(db, 'events', 'live'), EVH = doc(db, 'events', 'history');
const msOf = v => v && v.toMillis ? v.toMillis() : (typeof v == 'number' ? v : 0);
WLCloud.ev = {
  listen: cb => { let off = null, n = 0; const go = () => { try { off = onSnapshot(EV, s => { n = 0; cb(s.exists() ? s.data() : {}); }, e => { cb(null, e); n = Math.min(n + 1, 6); setTimeout(go, 10000 * n); }); } catch (e) {} }; go(); return () => off && off(); },
  get: async () => { const s = await getDoc(EV); return s.exists() ? s.data() : {}; },
  put: data => setDoc(EV, { ...data, at: serverTimestamp() }),
  hist: async () => { const s = await getDoc(EVH); return s.exists() ? (s.data().items || []) : []; },
  histAdd: async items => { const s = await getDoc(EVH); const cur = (s.exists() && s.data().items) || []; return setDoc(EVH, { items: cur.concat(items).slice(-150) }); },
  me: () => ME ? { uid: ME.uid, email: (ME.email || '').toLowerCase(), verified: !!ME.emailVerified, google: (ME.providerData || []).some(p => p.providerId == 'google.com') } : null,
  // presence: signed-in players say "I'm here" every minute. The reply also tells us how far this device's clock is off.
  presence: async row => { if (!ME) return null; const ref = doc(db, 'presence', ME.uid), t0 = Date.now();
    await setDoc(ref, { u: String(row.u || '').slice(0, 16), g: String(row.g || '').slice(0, 20), at: serverTimestamp() });
    const s = await getDoc(ref), t1 = Date.now(), at = s.exists() ? msOf(s.data().at) : 0; return at ? at - (t0 + t1) / 2 : null; },
  online: async () => { const r = await getDocs(query(collection(db, 'presence'), where('at', '>', new Date(Date.now() - 150000)))); return r.docs.map(d => ({ uid: d.id, ...d.data(), at: msOf(d.data().at) })); },
  // shared boss bars and tournament boards: one row per player per event, written by that player
  play: (eid, u, v) => ME ? setDoc(doc(db, 'eventPlay', eid + '_' + ME.uid), { e: eid, uid: ME.uid, u: String(u || 'player').slice(0, 16), v: Math.min(Math.max(0, Number(v) || 0), 9.99e299), at: serverTimestamp() }) : Promise.resolve(),
  playListen: (eid, cb) => onSnapshot(query(collection(db, 'eventPlay'), where('e', '==', eid), limit(500)), s => cb(s.docs.map(d => d.data())), () => cb(null)),
  // one-time codes: the first X players to type it get the reward
  codeMake: (code, o) => setDoc(doc(db, 'eventCodes', code), { left: o.max, max: o.max, who: [], pct: o.pct, t1: o.t1 }),
  codeClaim: code => runTransaction(db, async tx => { if (!ME) throw Object.assign(new Error('login'), { code: 'login' });
    const ref = doc(db, 'eventCodes', code), s = await tx.get(ref); if (!s.exists()) throw Object.assign(new Error('none'), { code: 'none' });
    const d = s.data(); if ((d.who || []).includes(ME.uid)) throw Object.assign(new Error('again'), { code: 'again' });
    if (d.t1 && d.t1 < Date.now() - 60000) throw Object.assign(new Error('expired'), { code: 'expired' }); if (!(d.left > 0)) throw Object.assign(new Error('gone'), { code: 'gone' });
    tx.update(ref, { left: d.left - 1, who: [...(d.who || []), ME.uid] }); return d; }),
};
if (EMU) WLCloud._emuGoogle = (email, sub) => signInWithCredential(auth, GoogleAuthProvider.credential(JSON.stringify({ sub: sub || email, email, email_verified: true })));
window.WLCloud = WLCloud;
window.dispatchEvent(new Event('wlcloud-ready'));
