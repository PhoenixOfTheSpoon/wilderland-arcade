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
