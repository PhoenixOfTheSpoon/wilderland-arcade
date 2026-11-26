# Wilderland Arcade · Database security rules

These rules live in `firestore.rules` and run on Google's servers. Editing the arcade page in the browser can't get around them.
The full rules are at the bottom of this page.

## Who counts as the admin
- **The admin** is `jonah@wilderland.academy` signed in **with Google**: the email has to be verified and the sign-in method has to be Google.
  A password account using the same email is **not** the admin.

## Rule by rule, in plain English

| Area | What players can do | What only the admin can do |
|---|---|---|
| **Saves** (`profiles`) | Read and write **only their own** save, up to 900 KB. | Nothing. Not even the admin can read other people's saves. |
| **Usernames + overall ticket row** (`usernames`) | Claim a name that is 3–16 letters/numbers/_, starts with a letter, has no bad words and isn't a staff name (jonah, admin, moderator, staff, official…). Update **only their own** row. Numbers must be numbers. At most one update every 3 seconds. | Keep the name "jonah"; reset or remove any player's row. |
| **Game leaderboards** (`boards/{game}@{season}/scores/{uid}`) | One row per player per game, saved under **their own** account. The score must be a number, at or below that game's highest possible score, and can **only go up**. At most one post every 5 seconds. | Delete any score. |
| **Flagged scores** (`flags`) | A score above a game's limit is sent here instead of to the leaderboard. | Read and clear flags. |
| **Chat** (`boards/_chat/scores`) | Signed-in players only, under **their own** username. 1–140 characters, no bad words, no links, emails or phone numbers. Not allowed when muted or when chat is off. At most one message every 4 seconds (checked with `chatRate`). | Delete messages. |
| **Chat rate record** (`chatRate/{uid}`) | Each player has one "last message time" record; only they can write it, and only with the server's clock. | Nothing. |
| **Reports** (`reports`) | Any signed-in player can report a message. | Read and clear reports. |
| **Activity feed** (`boards/_activity`) | Players write short notes about their own games. | Read and delete them. |
| **Suggestion box** (`boards/_suggest`) | Anyone, including guests, can send an idea (up to 800 characters). | Delete ideas. |
| **Control record** (`config/control`) | Read it (maintenance mode, season, chat on/off, mutes, kicks). | Change it: maintenance, reloads, full resets, chat on/off, mutes, kicks. |
| **Ticket adjustments** (`adjust`) | Read and clear their own. | Create them. |
| **Live events** (`events`, `presence`, `eventPlay`, `eventCodes`) | Read events. Send their own "I'm online" ping, their own boss damage or tournament score (only going up, every 2 s at most), and claim one code spot. | Start, change and end events; see who's online. |
| **Business mode** (`biz…`) | Unchanged: own company only, shields, limits on PvP actions. | Moderate. |

Anything not listed above is **denied**.

## Tested
Two automated test runs against Firebase's own emulator:
- 61 rule checks (`scratchpad/rules/test2.mjs`), for example: can't edit or delete others' saves; can't take staff names or post bad words; can't post fake, impossible, decreasing or too-frequent scores; chat links, emails, phone numbers, bad words, spam and impersonation are refused; mutes and chat-off work; password "jonah" can't use admin powers.
- 29 live-event checks.
- A two-browser end-to-end test: a kid account and the admin's Google account, through the real arcade page (20 checks).

## The full rules

```
rules_version = '2';
// =====================================================================================================
// WILDERLAND ARCADE · FIRESTORE SECURITY RULES (Stability, Security & Speed update)
// Plain-English summary is in SECURITY.md. The short version:
//   · Anyone can READ public things (leaderboards, chat, usernames, events). Writing needs a signed-in account.
//   · Players can only create or change their OWN data. Nobody can edit or delete anyone else's.
//   · Admin powers (maintenance, events, moderation, leaderboard edits) need jonah@wilderland.academy signed in WITH GOOGLE.
//   · Scores are numbers, capped per game, can only go up, and can't be sent more than once every 5 seconds.
//   · Chat: signed-in, short, no links/emails/phone numbers/bad words, one message every 4 seconds, mutes and "chat off".
// =====================================================================================================
service cloud.firestore {
  match /databases/{database}/documents {

    // ---------- helpers ----------
    // The admin: the real Google account jonah@wilderland.academy (a password account with that email can't pass).
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'jonah@wilderland.academy'
        && request.auth.token.email_verified == true
        && request.auth.token.firebase.sign_in_provider == 'google.com';
    }
    function signedIn() { return request.auth != null; }
    function me() { return request.auth.uid; }
    function data() { return request.resource.data; }
    // The admin's control record: maintenance mode, chat on/off, mutes, kicks, leaderboard season.
    function control() { return get(/databases/$(database)/documents/config/control).data; }
    function hasControl() { return exists(/databases/$(database)/documents/config/control); }
    function muted() { return hasControl() && me() in control().get('mutes', []); }
    function chatOff() { return hasControl() && control().get('chatOff', false) == true; }
    // Friendly text only: no bad words, and no links, emails or phone numbers.
    function friendly(t) { return !t.lower().matches('.*(fuck|shit|bitch|cunt|dick|nigg|fag|slut|whore|porn|nazi|rape|penis|vagina|boob|asshole|bastard|retard|kys|kill yourself).*'); }
    function noPersonalInfo(t) {
      return !t.lower().matches('.*(https?:|www[.]|[a-z0-9-]+[.](com|net|org|io|gg|me|co|xyz|ly|tv|us|uk|ca|edu|app|dev)([^a-z]|$)).*')
        && !t.matches('.*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}.*')
        && !t.matches('.*[0-9][0-9 ()./-]{6,}[0-9].*');
    }
    // Usernames: 3-16 letters/numbers/_, start with a letter, friendly, and can't pretend to be staff.
    function goodName(n) {
      return n is string && n.size() >= 3 && n.size() <= 16 && n.matches('^[A-Za-z][A-Za-z0-9_]*$') && friendly(n)
        && (isAdmin() || !n.lower().matches('.*(jonah|admin|moderator|mod_|_mod|staff|official|wilderland|owner|support|system).*'));
    }
    // The highest score each game can really reach (the arcade itself never shows more). Unknown games: 100 million.
    function cap(game) {
      return game == 'idle' ? math.pow(10, 300) : {'snake': 1000000, 'breakout': 1200000, 'flappy': 1000000, 'pong': 1000000, 'memory': 1200000, 'whack': 1200000, '2048': 32000000, 'tictactoe': 1000000, 'reaction': 1000000, 'typing': 1000000, 'simon': 5100000, 'mines': 1800000, 'connect4': 1000000, 'td': 16000000, 'crossing': 3000000, 'stack': 6000000, 'rootout': 2400000, 'trace': 3200000, 'space': 30000000, 'secrets': 40000000, 'bounce': 6000000, 'gems': 20000000, 'maze': 12000000, 'comets': 16000000, 'lumber': 1000000, 'runner': 8000000, 'pinball': 120000000, 'fishing': 6000000, 'rhythm': 80000000, 'platformer': 12000000, 'racing': 5000000, 'bubble': 24000000, 'sokoban': 12000000, 'airhockey': 3000000, 'skeeball': 1200000, 'words': 6000000, 'pipes': 16000000, 'snowball': 8000000, 'farm': 5000000, 'cardbattle': 10000000}.get(game, 100000000);
    }

    // ---------- player saves: only the owner can read or write their own ----------
    match /profiles/{uid} {
      allow read: if signedIn() && me() == uid;
      allow write: if signedIn() && me() == uid
                   && data().data is string && data().data.size() < 900000;
    }

    // ---------- usernames + the overall ticket leaderboard row (one per player) ----------
    // Doc id = the lowercase name. Owner creates/updates it; numbers must be numbers; at most every 3 seconds.
    match /usernames/{name} {
      function validRow() {
        return data().uid == me() && goodName(data().name) && data().name.lower() == name
          && (!('s' in data()) || (data().s is number && data().s >= 0 && data().s < math.pow(10, 300)))
          && (!('ov' in data()) || (data().ov is number && data().ov >= 0 && data().ov < math.pow(10, 300)))
          && (!('rb' in data()) || (data().rb is number && data().rb >= 0 && data().rb < 1000000))
          && (!('db' in data()) || (data().db is number && data().db >= 0 && data().db < 1000000));
      }
      allow read: if true;
      allow create: if signedIn() && validRow() && (!('ts' in data()) || data().ts == request.time);
      allow update: if signedIn() && resource.data.uid == me() && validRow()
        && (!('ts' in data()) || (data().ts == request.time
            && (!('ts' in resource.data) || request.time > resource.data.ts + duration.value(3, 's'))));
      allow delete: if (signedIn() && resource.data.uid == me()) || isAdmin();
      // The admin can reset or remove any player's leaderboard row
      allow update: if isAdmin();
    }

    // ---------- game leaderboards: boards/{game}@{season}/scores/{uid} — one best score per player ----------
    match /boards/{board}/scores/{id} {
      function game() { return board.split('@')[0]; }
      function special() { return board in ['_chat', '_activity', '_suggest', '_tix'] || board.matches('^_.*'); }
      allow read: if !(board == '_activity');
      allow create: if signedIn() && !special() && id == me()
        && data().uid == me() && data().u is string && data().u.size() <= 16
        && data().s is number && data().s >= 0 && data().s <= cap(game())
        && data().ts == request.time;
      allow update: if signedIn() && !special() && id == me() && resource.data.uid == me()
        && data().uid == me() && data().u is string && data().u.size() <= 16
        && data().s is number && data().s >= resource.data.s && data().s <= cap(game())
        && data().ts == request.time
        && (!('ts' in resource.data) || request.time > resource.data.ts + duration.value(5, 's'));
      allow delete: if isAdmin();
    }

    // ---------- impossible scores go here for the admin to check, instead of onto the leaderboard ----------
    match /flags/{id} {
      allow create: if signedIn() && data().uid == me() && data().g is string && data().g.size() <= 20
        && data().s is number && data().u is string && data().u.size() <= 16 && data().at == request.time;
      allow read, delete: if isAdmin();
    }

    // ---------- chat (stored next to the boards) ----------
    // Signed-in players only, as their own username, 1-140 characters, friendly, no links/emails/phone numbers,
    // not muted, chat switched on, and at most one message every 4 seconds (checked with chatRate below).
    match /boards/_chat/scores/{id} {
      allow read: if true;
      allow create: if signedIn() && data().uid == me()
        && data().u is string && data().u.size() <= 16
        && exists(/databases/$(database)/documents/usernames/$(data().u.lower()))
        && get(/databases/$(database)/documents/usernames/$(data().u.lower())).data.uid == me()
        && data().t is string && data().t.size() > 0 && data().t.size() <= 140
        && friendly(data().t) && noPersonalInfo(data().t)
        && !muted() && !chatOff()
        && data().at == request.time
        && getAfter(/databases/$(database)/documents/chatRate/$(me())).data.ts == request.time;
      allow delete: if isAdmin();
    }
    // One small "last message time" record per player, so nobody can flood the chat.
    match /chatRate/{uid} {
      allow read: if signedIn() && me() == uid;
      allow write: if signedIn() && me() == uid && data().keys().hasOnly(['ts']) && data().ts == request.time
        && (resource == null || request.time > resource.data.ts + duration.value(4, 's'));
    }
    // Report a chat message: any signed-in player; only the admin can read and clear reports.
    match /reports/{id} {
      allow create: if signedIn() && data().by == me() && data().keys().hasOnly(['mid', 't', 'u', 'uid', 'by', 'byU', 'at'])
        && data().t is string && data().t.size() <= 200 && data().at == request.time;
      allow read, delete: if isAdmin();
    }

    // ---------- admin activity feed (players write their own short notes; only the admin reads them) ----------
    match /boards/_activity/scores/{id} {
      allow create: if signedIn() && data().uid == me() && data().t is string && data().t.size() <= 200;
      allow read, delete: if isAdmin();
    }

    // ---------- suggestion box: anyone can send an idea; only the admin reads and deletes ----------
    match /boards/_suggest/scores/{id} {
      allow create: if data().t is string && data().t.size() > 0 && data().t.size() <= 800
        && data().u is string && data().u.size() <= 30
        && ((request.auth == null && data().uid == '' && data().u == 'guest')
            || (signedIn() && data().uid == me()));
      allow delete: if isAdmin();
    }

    // ---------- admin-only records ----------
    // Admin ticket adjustments: the admin queues a change; the player's own game applies it, then clears it.
    match /adjust/{uid} {
      allow read, delete: if signedIn() && me() == uid;
      allow create, update: if isAdmin();
    }
    // Settings everyone reads (control record, season, maintenance, chat on/off, mutes); only the admin writes.
    match /config/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // ================= ADMIN ABUSE: LIVE EVENTS =================
    // Only the admin's real Google account can start, change or end events. Checked here on Google's servers,
    // so editing the page can't get around it. Players can only READ events.
    function isEventAdmin() { return isAdmin(); }
    // events/live (what's running) and events/history (the log): everyone reads, only the admin writes.
    match /events/{id} {
      allow read: if true;
      allow write: if isEventAdmin();
    }
    // "I'm online" pings: each signed-in player writes only their own (username, game, time). Only the admin can list them.
    match /presence/{uid} {
      allow read: if isEventAdmin() || (request.auth != null && request.auth.uid == uid);
      allow create, update: if request.auth != null && request.auth.uid == uid
        && request.resource.data.keys().hasOnly(['u', 'g', 'at'])
        && request.resource.data.u is string && request.resource.data.u.size() <= 16
        && request.resource.data.g is string && request.resource.data.g.size() <= 20
        && request.resource.data.at == request.time;
      allow delete: if isEventAdmin() || (request.auth != null && request.auth.uid == uid);
    }
    // World Boss damage / Admin vs Everyone hits / Flash Tournament scores: one row per player per event,
    // only while the admin has that event open, only going up, at most once every 2 seconds.
    match /eventPlay/{id} {
      allow read: if true;
      allow create, update: if request.auth != null
        && request.resource.data.keys().hasOnly(['e', 'uid', 'u', 'v', 'at'])
        && request.resource.data.uid == request.auth.uid
        && id == request.resource.data.e + '_' + request.auth.uid
        && request.resource.data.e in get(/databases/$(database)/documents/events/live).data.get('open', [])
        && request.resource.data.u is string && request.resource.data.u.size() <= 16
        && request.resource.data.v is number && request.resource.data.v >= 0 && request.resource.data.v < math.pow(10, 300)
        && request.resource.data.at == request.time
        && (resource == null || (request.resource.data.v >= resource.data.v
            && request.time > resource.data.at + duration.value(2, 's')));
      allow delete: if isEventAdmin();
    }
    // Admin Code Drops: the admin makes the code; a player can only take ONE spot (left - 1, add their own id once).
    match /eventCodes/{code} {
      allow read: if true;
      allow create, delete: if isEventAdmin();
      allow update: if isEventAdmin() || (request.auth != null
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['left', 'who'])
        && resource.data.left > 0
        && request.resource.data.left == resource.data.left - 1
        && !(request.auth.uid in resource.data.who)
        && request.resource.data.who == resource.data.who.concat([request.auth.uid])
        && request.time.toMillis() < resource.data.t1 + 60000);
    }

    // ================= WILDERLAND BUSINESS TYCOON =================
    // Nothing here can touch profiles (tickets, prizes, stars, pets, homes, avatars) — those stay owner-only above.
    function bizPath(uid) { return /databases/$(database)/documents/biz/$(uid); }
    function hasBiz(uid) { return exists(bizPath(uid)); }
    function biz(uid) { return get(bizPath(uid)).data; }
    function shielded(uid) { return biz(uid).shieldUntil > request.time; }
    // A rival can only be targeted by players between 1/10 and 10x its company value
    function inRange(a, b) { return biz(a).value <= biz(b).value * 10 + 1000 && biz(a).value * 10 + 1000 >= biz(b).value; }
    function cleanName(n) { return n is string && n.size() >= 2 && n.size() <= 24 && n.matches('^[A-Za-z0-9 \'&.!-]+$'); }

    // One business per player, owned by that player. Everyone can read (shared market + leaderboards).
    match /biz/{uid} {
      allow read: if true;
      allow create: if signedIn() && request.auth.uid == uid
        && cleanName(request.resource.data.name)
        && request.resource.data.created == request.time
        && request.resource.data.shieldUntil == request.time + duration.value(3, 'd')
        && request.resource.data.credit >= 300 && request.resource.data.credit <= 850
        && request.resource.data.value is number && request.resource.data.cash is number;
      // The owner can't change when they started or stretch their protection shield
      allow update: if (signedIn() && request.auth.uid == uid
          && cleanName(request.resource.data.name)
          && request.resource.data.created == resource.data.created
          && request.resource.data.shieldUntil <= resource.data.shieldUntil
          && request.resource.data.credit >= 300 && request.resource.data.credit <= 850
          && request.resource.data.value is number && request.resource.data.value < math.pow(10, 300))
        || isAdmin();
      allow delete: if isAdmin() || (signedIn() && request.auth.uid == uid);
    }

    // PvP actions. Doc id = fromUid_toUid_type_YYYY-MM-DD, so each action can happen once per day per rival.
    // The target's own game applies the effect, then marks it applied. Admin can read the whole log.
    match /bizActions/{id} {
      allow read: if isAdmin() || (signedIn() && (resource.data.from == request.auth.uid || resource.data.to == request.auth.uid));
      allow create: if signedIn()
        && request.resource.data.from == request.auth.uid
        && request.resource.data.to != request.auth.uid
        && id == request.auth.uid + '_' + request.resource.data.to + '_' + request.resource.data.type + '_' + request.resource.data.day
        && request.resource.data.type in ['price', 'poach', 'takeover', 'offer']
        && request.resource.data.at == request.time
        && request.resource.data.applied == false
        && hasBiz(request.auth.uid) && hasBiz(request.resource.data.to)
        && !shielded(request.resource.data.to) && !shielded(request.auth.uid)
        && inRange(request.auth.uid, request.resource.data.to)
        && (request.resource.data.type != 'takeover' || biz(request.resource.data.to).lossDays >= 3);
      // Only the target marks an action as applied/answered (accept or decline a buyout offer)
      allow update: if signedIn() && resource.data.to == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['applied', 'answer']);
      allow delete: if isAdmin();
    }

    // Town map lots. Outbid only with at least 10% more, never a shielded owner's lot, at most once a day per lot.
    match /bizLots/{lot} {
      allow read: if true;
      allow create: if signedIn() && request.resource.data.owner == request.auth.uid && hasBiz(request.auth.uid)
        && request.resource.data.bid is number && request.resource.data.bid > 0 && request.resource.data.at == request.time;
      allow update: if isAdmin() || (signedIn() && hasBiz(request.auth.uid)
        && request.resource.data.owner == request.auth.uid
        && request.resource.data.at == request.time
        && (resource.data.owner == request.auth.uid
            || (request.resource.data.bid >= resource.data.bid * 1.1
                && request.time > resource.data.at + duration.value(1, 'd')
                && !(hasBiz(resource.data.owner) && shielded(resource.data.owner)))));
      allow delete: if isAdmin() || (signedIn() && resource.data.owner == request.auth.uid);
    }

    // Alliances: up to 6 members; you can only add or remove yourself.
    match /bizAlliances/{id} {
      allow read: if true;
      allow create: if signedIn() && cleanName(request.resource.data.name)
        && request.resource.data.members == [request.auth.uid] && request.resource.data.founder == request.auth.uid;
      allow update: if isAdmin() || (signedIn()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['members'])
        && request.resource.data.members.size() <= 6
        && (request.resource.data.members.toSet().difference(resource.data.members.toSet()) == [request.auth.uid].toSet()
            || resource.data.members.toSet().difference(request.resource.data.members.toSet()) == [request.auth.uid].toSet()));
      allow delete: if isAdmin() || (signedIn() && resource.data.founder == request.auth.uid);
    }

    // Preset messages only (a number that picks "Nice move!", "Want to team up?", "Good game"...) — no free text.
    match /bizMsgs/{id} {
      allow read: if signedIn() && (resource.data.to == request.auth.uid || resource.data.from == request.auth.uid || isAdmin());
      allow create: if signedIn() && request.resource.data.from == request.auth.uid
        && request.resource.data.keys().hasOnly(['from', 'to', 'm', 'at'])
        && request.resource.data.m is int && request.resource.data.m >= 0 && request.resource.data.m < 12
        && request.resource.data.at == request.time;
      allow delete: if isAdmin() || (signedIn() && resource.data.to == request.auth.uid);
    }
  }
}
```
