// Wilderland Arcade · Firebase connection (accounts, cloud saves, usernames, global leaderboard).
// Loaded as an ES module. If it can't load (offline, blocked), the arcade keeps working in on-device mode.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, setPersistence, GoogleAuthProvider, signInWithPopup, browserLocalPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, where, collection, addDoc, query, orderBy, limit, getDocs, runTransaction, serverTimestamp, increment } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
const SEASON = 's2';
const board = game => collection(db, 'boards', game + '@' + SEASON, 'scores');

const WLCloud = {
  ready: true,
  onAuth: cb => onAuthStateChanged(auth, cb),
  async signUp(email, pw, remember) { await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence); return (await createUserWithEmailAndPassword(auth, email, pw)).user; },
  async signIn(email, pw, remember) { await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence); return (await signInWithEmailAndPassword(auth, email, pw)).user; },
  async google(remember) { await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence); const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return (await signInWithPopup(auth, p)).user; },
  signOut: () => signOut(auth),
  reset: email => sendPasswordResetEmail(auth, email),
  async loadProfile(uid) { const s = await getDoc(doc(db, 'profiles', uid)); if (!s.exists()) return null; const d = s.data(); let P = null; try { P = JSON.parse(d.data); } catch (e) {} return { P, name: d.name || '', created: d.created || '' }; },
  saveProfile(uid, P, meta) { return setDoc(doc(db, 'profiles', uid), { data: JSON.stringify(P), name: (meta && meta.name) || '', created: (meta && meta.created) || '', updated: serverTimestamp() }, { merge: true }); },
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
window.WLCloud = WLCloud;
window.dispatchEvent(new Event('wlcloud-ready'));
