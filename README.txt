WILDERLAND ARCADE · FIREBASE EDITION
====================================

This folder is ready to put online with Firebase Hosting, connected to your
Firebase project "arcade-14b1a". Online it has:
  - real email + password accounts (sign up, log in, forgot password)
  - "Sign up / Log in with Google"
  - saves, tickets and achievements that follow a player to any device
  - a global leaderboard with unique usernames

If Firebase can't be reached, the arcade still works in on-device mode.


ONE-TIME SETUP (in the Firebase console, console.firebase.google.com)
-----------------------------------------------------------------------
1. Build > Authentication > Sign-in method > Email/Password > Enable > Save.
   Then Add new provider > Google > Enable, pick a support email > Save.
2. Build > Firestore Database > Create database (production mode).
   (The security rules are in firestore.rules; step 3 below uploads them.)


PUT IT ONLINE (on your computer, needs Node.js from nodejs.org)
----------------------------------------------------------------
Open a terminal in this folder and run:

   npm install -g firebase-tools
   firebase login
   firebase deploy

That uploads the site and the database rules. When it finishes it prints your
address, for example:  https://arcade-14b1a.web.app

To update the site later, change the files and run "firebase deploy" again.


TRY IT ON YOUR COMPUTER FIRST (optional)
----------------------------------------
   python3 -m http.server 8000
   then open http://localhost:8000

Sign-up and the global leaderboard need the rules from "firebase deploy"
(or pasted into Firestore > Rules) before they work.


FILES
-----
index.html                  opens the arcade
Wilderland Arcade.dc.html   the arcade floor, accounts, achievements, learn mode, leaderboard
firebase-sync.js            the Firebase connection (your project's config is in here)
firestore.rules             who can read and write what in the database
firebase.json, .firebaserc  Firebase Hosting settings for project arcade-14b1a
arcade-core.js, games-*.js  the 18 games and the learn-mode question generator
support.js, fonts/, assets/ page runtime, Uncut Sans fonts, logo

Notes
- The parent code and learn-mode lock stay on each device on purpose.
- Scores are calculated in the browser, so a very determined cheater could
  post a fake score. The rules block anything out of range.
