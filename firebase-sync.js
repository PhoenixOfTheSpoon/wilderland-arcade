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
  async loadProfile(uid) { const s = await getDoc(doc(db, 'profiles', uid)); if (!s.exists()) return null; const d = s.data(); let P = null; try { P = JSON.parse(d.data); } catch (e) {} return { P, name: d.name || '', created: d.created || '', updated: (d.updated && d.updated.toMillis) ? d.updated.toMillis() : 0 }; },
  saveProfile(uid, P, meta) { if (FROZEN) return Promise.resolve(); return setDoc(doc(db, 'profiles', uid), { data: JSON.stringify(P), name: (meta && meta.name) || '', created: (meta && meta.created) || '', updated: serverTimestamp() }, { merge: true }); },
  claimUsername(name, uid, old) { const key = name.toLowerCase();
    return runTransaction(db, async tx => { const ref = doc(db, 'usernames', key), s = await tx.get(ref);
      if (s.exists() && s.data().uid !== uid) throw Object.assign(new Error('taken'), { code: 'taken' });
      tx.set(ref, { uid, name }); if (old && old.toLowerCase() !== key) tx.delete(doc(db, 'usernames', old.toLowerCase())); }); },
  // Leaderboard season: bump SEASON to start a fresh, empty leaderboard.
  postScore(game, row) { return addDoc(board(game), row); },
  setTix(uid, row) { return addDoc(board('_tix'), row); },
  async top(game, n = 100) { const r = await getDocs(query(board(game), orderBy('s', 'desc'), limit(game == '_tix' ? 300 : n)));
    const hs = new Set(C.hiddenScores || []);
    let rows = r.docs.map(d => ({ ...d.data(), id: d.id })).filter(x => !hs.has(x.id)); if (game == '_tix') { const seen = new Set(); rows = rows.filter(x => !seen.has(x.uid) && seen.add(x.uid)); } return rows.slice(0, n); },
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
WLCloud.deleteUserScores = async (game, uid) => { const r = await getDocs(query(board(game), where('uid', '==', uid))); const failed = [];
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
try { onSnapshot(CTRL, snap => { const d = snap.exists() ? snap.data() : {}; C = d; setDown(d);
  window.dispatchEvent(new CustomEvent('wl-ctrl', { detail: d }));
  if (RELOAD_AT === null) { RELOAD_AT = d.reloadAt || 0; return; }
  if ((d.resetAt || 0) > RESET_AT || (d.reloadAt || 0) > RELOAD_AT) { if ((d.resetAt || 0) > RESET_AT) FROZEN = true; RELOAD_AT = d.reloadAt || 0; RESET_AT = d.resetAt || 0; setTimeout(() => location.reload(), 600 + Math.random() * 1500); } }, () => {}); } catch (e) {}
WLCloud.down = () => DOWN;
WLCloud.shutdown = (minutes, msg) => ctrlSet({ downUntil: minutes > 0 ? Date.now() + minutes * 60000 : 0, downMsg: msg || '' });
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
window.WLCloud = WLCloud;
window.dispatchEvent(new Event('wlcloud-ready'));
