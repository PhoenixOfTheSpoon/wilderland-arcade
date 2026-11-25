# Wilderland Arcade

18 browser arcade games with learn mode, achievements, Firebase accounts (email + Google) and a global leaderboard.

Play it: https://arcade.wilderland.academy/

Setup notes are in `README.txt`.

## Calendar

The site has two sections, switched with the **Arcade / Calendar** buttons at the top (or open `…/Wilderland%20Arcade.dc.html#calendar` directly).

Every visitor sees the events in **`calendar-events.json`** (same folder as the page). To change the calendar:

1. Edit `calendar-events.json` by hand, **or** sign in as jonah@wilderland.academy, open the Calendar, use **Edit events** (add / edit / delete, preview), then click **Download calendar-events.json**.
2. Upload the file to this repository (replace the old one). The calendar updates for everyone once GitHub Pages publishes it (about a minute).

Each event: `id`, `title`, `start` (YYYY-MM-DD), optional `end` (last day of a multi-day event), `allDay`, `time` / `endTime` (24-hour HH:MM), `location`, `description`, `category` (`classes`, `trips`, `holiday`, `deadline`, `clubs`, `arcade`, `special`), optional `link`, optional `repeat` (`{"freq":"daily|weekly|monthly","interval":1,"until":"YYYY-MM-DD","days":[1,2,3,4,5]}`).
`arcade` events also show a banner in the arcade on their days (display only — they don't change payouts).

## Admin Abuse (live events): publish the database rules

Live events only work after the rules in `firestore.rules` are published to Firebase, because the database itself is what
decides who may start events (only `jonah@wilderland.academy`, logged in **with Google**). Until then players simply see no events.

1. Open https://console.firebase.google.com → project **arcade-14b1a** → **Firestore Database** → **Rules**.
2. Replace everything there with the contents of `firestore.rules` from this repo and click **Publish**.
   (Or, with the Firebase CLI: `firebase deploy --only firestore:rules`.)
3. In the arcade, log in with **Continue with Google** as jonah@wilderland.academy, then press **F9** (or Menu → Admin Abuse).

What the rules enforce: `events/*` can be read by everyone and written only by that Google account; players can write only
their own presence ping, their own boss-damage/tournament row (only for an event the admin has open, only going up, at most
every 2 seconds) and one spot on a code drop. Nothing in these rules can touch anyone's saved progress.
