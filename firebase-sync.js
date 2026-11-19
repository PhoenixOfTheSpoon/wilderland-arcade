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
// Season comes from config/global so an admin's FULL RESET can start a brand-new empty leaderboard for everyone.
let SEASON = 's2', RESET_AT = 0, FROZEN = false;
try { const c = await Promise.race([getDoc(doc(db, 'config', 'global')), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]); if (c && c.exists()) { const d = c.data(); if (d.season) SEASON = d.season; RESET_AT = d.resetAt || 0; } } catch (e) {}
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
    let rows = r.docs.map(d => ({ ...d.data(), id: d.id })); if (game == '_tix') { const seen = new Set(); rows = rows.filter(x => !seen.has(x.uid) && seen.add(x.uid)); } return rows.slice(0, n); },
};
// Admin moderation (the database rules only allow this for admin accounts).
WLCloud.deleteScore = (game, id) => deleteDoc(doc(db, 'boards', game + '@' + SEASON, 'scores', id));
WLCloud.deleteUserScores = async (game, uid) => { const r = await getDocs(query(board(game), where('uid', '==', uid))); await Promise.all(r.docs.map(d => deleteDoc(d.ref))); return r.size; };
// Admin: queue a ticket removal for a player (amount < 0 means remove ALL). Applied by that player's game on next load.
WLCloud.adjust = (uid, amount) => setDoc(doc(db, 'adjust', uid), amount < 0 ? { all: true, at: serverTimestamp() } : { rm: increment(amount), at: serverTimestamp() }, { merge: true });
WLCloud.takeAdjust = async uid => { const ref = doc(db, 'adjust', uid), s = await getDoc(ref); if (!s.exists()) return null; const d = s.data(); await deleteDoc(ref); return d; };
WLCloud.resetAt = () => RESET_AT;
WLCloud.adminFlag = (uid, data) => setDoc(doc(db, 'adjust', uid), { ...data, at: serverTimestamp() }, { merge: true });
WLCloud.resetEveryone = async () => { const now = Date.now(), season = 's' + now.toString(36); await setDoc(doc(db, 'config', 'global'), { season, resetAt: now }, { merge: true }); return season; };
WLCloud.reloadEveryone = () => setDoc(doc(db, 'config', 'global'), { reloadAt: Date.now() }, { merge: true });
// Live: when an admin does a full reset or presses "Reload everyone", every open arcade tab reloads itself.
let RELOAD_AT = null;
try { onSnapshot(doc(db, 'config', 'global'), snap => { const d = snap.exists() ? snap.data() : {};
  if (RELOAD_AT === null) { RELOAD_AT = d.reloadAt || 0; return; }
  if ((d.resetAt || 0) > RESET_AT || (d.reloadAt || 0) > RELOAD_AT) { if ((d.resetAt || 0) > RESET_AT) FROZEN = true; RELOAD_AT = d.reloadAt || 0; RESET_AT = d.resetAt || 0; setTimeout(() => location.reload(), 600 + Math.random() * 1500); } }, () => {}); } catch (e) {}
window.WLCloud = WLCloud;
window.dispatchEvent(new Event('wlcloud-ready'));
