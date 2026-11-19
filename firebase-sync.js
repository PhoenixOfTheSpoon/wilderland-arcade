// Wilderland Arcade · Firebase connection (accounts, cloud saves, usernames, global leaderboard).
// Loaded as an ES module. If it can't load (offline, blocked), the arcade keeps working in on-device mode.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, setPersistence, GoogleAuthProvider, signInWithPopup, browserLocalPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
  postScore(game, row) { return addDoc(collection(db, 'boards', game, 'scores'), row); },
  setTix(uid, row) { return setDoc(doc(db, 'boards', '_tix', 'scores', uid), row); },
  async top(game, n = 100) { const r = await getDocs(query(collection(db, 'boards', game, 'scores'), orderBy('s', 'desc'), limit(n))); return r.docs.map(d => d.data()); },
};
window.WLCloud = WLCloud;
window.dispatchEvent(new Event('wlcloud-ready'));
