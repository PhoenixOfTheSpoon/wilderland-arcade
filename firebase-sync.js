// Wilderland Arcade · Firebase connection (accounts, cloud saves, usernames, global leaderboard).
// Loaded as an ES module. If it can't load (offline, blocked), the arcade keeps working in on-device mode.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, setPersistence, GoogleAuthProvider, signInWithPopup, browserLocalPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, where, collection, addDoc, query, orderBy, limit, getDocs, runTransaction, serverTimestamp, increment, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
// ADMIN CONTROL RECORD — lives at usernames/~admin so it works with the database rules the arcade already has
// (anyone can read usernames; only the account that created a name can change it). The admin's game creates it the first
// time jonah@wilderland.academy logs in, so after that nobody else can edit it. It holds: the leaderboard season, full-reset
// time, reload time, shutdown timer, chat mutes/hidden messages, hidden scores and per-player admin adjustments.
const CTRL = doc(db, 'usernames', '~admin');
let SEASON = 's2', RESET_AT = 0, FROZEN = false, DOWN = {until:0, msg:''}, MUTES = [], C = {};
const setDown = d => { MUTES = d.mutes || []; DOWN = {until: d.downUntil || 0, msg: d.downMsg || ''}; window.dispatchEvent(new CustomEvent('wl-down', {detail: DOWN})); };
try { const c = await Promise.race([getDoc(CTRL), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]); if (c && c.exists()) { C = c.data(); if (C.season) SEASON = C.season; RESET_AT = C.resetAt || 0; DOWN = {until: C.downUntil || 0, msg: C.downMsg || ''}; MUTES = C.mutes || []; } } catch (e) {}
const board = game => collection(db, 'boards', game + '@' + SEASON, 'scores');

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
  postScore(game, row) { return addDoc(board(game), { ...row, s: Math.min(Number(row.s) || 0, 9.99e299) }); },
  // Overall ticket board: ONE always-current row per player, kept on the player's own username record
  // (the existing rules let each player update the name they own). This replaced a row-per-game board that filled up
  // with one player's old rows and stopped showing everyone else.
  setTix(uid, row) { if (!row || !row.u) return Promise.resolve(); const key = String(row.u).toLowerCase();
    return setDoc(doc(db, 'usernames', key), { uid, name: row.u, s: Math.min(Number(row.s) || 0, 9.99e299), av: row.av || '', al: row.al || 0, d: row.d || '', rb: row.rb || 0, ss: SEASON, at: Date.now() }, { merge: true }); },
  async top(game, n = 100) { const hs = new Set(C.hiddenScores || []);
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
  const cur = await getDoc(CTRL); if (cur.exists() && cur.data().uid !== ME.uid) throw Object.assign(new Error('The admin control record belongs to a different account.'), { code: 'permission-denied' });
  return setDoc(CTRL, { ...patch, uid: ME.uid, name: '~admin' }, { merge: true }); };
WLCloud.ensureAdmin = async () => { if (!ME) return false; const cur = await getDoc(CTRL); if (!cur.exists()) { await setDoc(CTRL, { uid: ME.uid, name: '~admin', email: ME.email || '' }); return true; } return cur.data().uid === ME.uid; };
const hide = async (field, vals) => { const cur = await getDoc(CTRL); const list = new Set((cur.exists() && cur.data()[field]) || []); [].concat(vals).forEach(v => list.add(v)); return ctrlSet({ [field]: [...list].slice(-5000) }); };
// Real deletes still work if the newer rules are ever published; otherwise the score is hidden for everyone.
WLCloud.deleteScore = async (game, id) => { try { await deleteDoc(doc(db, 'boards', game + '@' + SEASON, 'scores', id)); } catch (e) { await hide('hiddenScores', id); } };
WLCloud.deleteUserScores = async (game, uid) => { if (game == '_tix') { const r = await getDocs(query(collection(db, 'usernames'), where('uid', '==', uid))); const names = r.docs.map(d => d.id).filter(id => id !== '~admin'), ids = []; try { const o = await getDocs(query(board('_tix'), where('uid', '==', uid))); o.docs.forEach(d => ids.push(d.id)); } catch (e) {}
  // A player's ticket row is hidden only until their game posts a fresh total (so nobody vanishes from the board for good).
  if (names.length) { const cur = await getDoc(CTRL); const ht = { ...((cur.exists() && cur.data().hiddenTix) || {}) }; names.forEach(n => ht[n] = Date.now()); await ctrlSet({ hiddenTix: ht }); }
  if (ids.length) await hide('hiddenScores', ids); return names.length + ids.length; }
  const r = await getDocs(query(board(game), where('uid', '==', uid))); const failed = [];
  for (const d of r.docs) { try { await deleteDoc(d.ref); } catch (e) { failed.push(d.id); } } if (failed.length) await hide('hiddenScores', failed); return r.size; };
// Per-player adjustments: a list of {id, rm|all|upg|full}. The player's game applies any it hasn't seen yet.
const addAdj = async (uid, item) => { const cur = await getDoc(CTRL); const adj = { ...((cur.exists() && cur.data().adj) || {}) }; adj[uid] = [...(adj[uid] || []), { id: Date.now(), ...item }].slice(-20); return ctrlSet({ adj }); };
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
const listenCtrl = () => { try { onSnapshot(CTRL, snap => { CTRL_OK = true; ctrlRetry = 0; onCtrl(snap.exists() ? snap.data() : {}); },
  e => { CTRL_OK = false; console.warn('[cloud] control listener stopped:', e && (e.code || e.message)); ctrlRetry = Math.min(ctrlRetry + 1, 6); setTimeout(listenCtrl, 15000 * ctrlRetry); }); } catch (e) {} };
listenCtrl();
// Backup check so a shutdown still arrives if the live listener died (bad wifi, iPad asleep, database busy).
const pollCtrl = async force => { if (document.hidden) return; if (!force && CTRL_OK && Date.now() - CTRL_AT < 600000) return;
  try { const c = await getDoc(CTRL); onCtrl(c.exists() ? c.data() : {}); } catch (e) {} };
setInterval(() => pollCtrl(false), 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - CTRL_AT > 30000) pollCtrl(true); });
WLCloud.down = () => DOWN;
WLCloud.shutdown = async (minutes, msg) => { const until = minutes > 0 ? Date.now() + minutes * 60000 : 0; await ctrlSet({ downUntil: until, downMsg: msg || '' }); setDown({ ...C, downUntil: until, downMsg: msg || '' }); return until; };
// Arcade chat: stored with the leaderboards (allowed by the existing rules). The page filters words, links and personal info.
const CHAT = collection(db, 'boards', '_chat', 'scores');
WLCloud.chatListen = cb => onSnapshot(query(CHAT, orderBy('at', 'desc'), limit(60)), snap => { const hid = new Set(C.hiddenChat || []);
  cb(snap.docs.filter(d => !hid.has(d.id)).map(d => ({ id: d.id, ...d.data(), at: d.data().at && d.data().at.toMillis ? d.data().at.toMillis() : Date.now() })).reverse()); }, () => cb(null));
WLCloud.chatSend = row => addDoc(CHAT, { ...row, s: 0, d: new Date().toISOString().slice(0, 10), at: serverTimestamp() });
WLCloud.chatDelete = async id => { try { await deleteDoc(doc(db, 'boards', '_chat', 'scores', id)); } catch (e) { await hide('hiddenChat', id); } };
WLCloud.setMutes = mutes => ctrlSet({ mutes });
WLCloud.mutes = () => MUTES;
// Temporary kick: the player's tabs show a countdown screen until the time is up.
WLCloud.kick = async (uid, minutes) => { const cur = await getDoc(CTRL); const kicks = { ...((cur.exists() && cur.data().kicks) || {}) }; const now = Date.now();
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
window.WLCloud = WLCloud;
window.dispatchEvent(new Event('wlcloud-ready'));
