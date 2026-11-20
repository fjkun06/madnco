/*
 * MadnCo. overlays: live slots filled from /api/stream (admin panel).
 * Polls every 5 s; the countdown ticks every second in between.
 *
 *   data-text="topic|game|countdown|next-when|next-plan"  text of the element
 *   data-show="topic|game|next|countdown"  visible only when that value is set
 *   data-hide="topic|game|next|countdown"  visible only when it is NOT set
 *   data-bar="countdown"                   width follows the countdown
 *
 * Countdown extras (big timer on Starting Soon):
 *   cd-mm / cd-ss   minutes (total) and seconds, zero-padded
 *   cd-run          set while time is left
 *   cd-zero         set once the countdown hit zero (within the 30 min grace)
 *
 * BRB:
 *   brb-msg          the admin's BRB message (data-show/hide too)
 *   brb-mm / brb-ss  time left on the "back in" timer
 *   brb-run / brb-zero / brb-timer   timer running / hit zero / either
 *   brb-any          message or timer set (hides the default line)
 *
 * Side quest (follower goal for TikTok LIVE on @madnco8):
 *   quest-title, quest-followers, quest-goal   texts
 *   quest-brb / quest-starting                 set when the card should show
 *   quest-done                                 set once the goal is reached
 *   data-bar="quest"                           width follows the progress
 *
 * Ticker:
 *   data-ticker="gaming|chatting|brb|starting"  a scrolling track; filled with
 *     the admin's items (twice, for the loop) while that scene has the
 *     ticker on, otherwise it keeps its own default text
 *   ticker-gaming, ticker-chatting, ...         set while that scene has it
 *
 * Game modes (the game on stream, picked in the control room's Games tab):
 *   <html data-mood="action">  plus --mood-a / --mood-b / --mood-lab colours
 *   play                         set while a game is on stream
 *   play-name, play-unit, play-part ("Part 3"), play-part-n ("3"),
 *   play-goal, play-prev, play-hours, mood-name, ticker-label   texts
 *   play-part, play-goal, play-prev, play-final, play-completed  show/hide
 *   play-counters, play-c1-on, play-c2-on, play-c1-label, play-c1 ("4 / 16")…
 *   play-football, fb-w, fb-d, fb-l, fb-goals ("14:9")
 *   play-poll, poll-q, poll-o1…4 (show), poll-t1…4 ("!1 Yes · 40%"),
 *     data-bar="poll-1"… bar widths, poll-lead-1… set on the leader
 *   game-only                    the typed game, when no game mode is on
 * Poll votes come from Twitch chat (!1 … !4, one vote per viewer, last one
 * counts), read anonymously; ?channel= overrides the channel (madnco8).
 *
 * Home / Guest (control room → Live → Where are we live?), per canvas:
 * v-*.html pages read the vertical (TikTok) setting, the rest landscape.
 *   guest / home        set while streaming from a borrowed channel / our own
 *   guest-host          "@madhauzz"; guest-line  the Starting Soon line
 *   home-card           guest and the "Our home is @madnco8" card is on
 *   home-chip           "Home @madnco8" while guest (default text otherwise)
 *   quest-left          followers still needed for the side quest goal
 *
 * Co tonight:
 *   co / co-name        set while someone sits in the Co seat (their name)
 *   co-open             solo night: the Co slot is open
 *
 * Without an answer (offline, local file) every slot keeps its default.
 */
(function () {
  "use strict";
  var API =
    (location.protocol === "file:" ? "https://www.madnco.frankjordan.dev" : "") +
    "/api/stream";
  var status = null;
  var MOODS = {
    football: ["Football", "#30D5C8", "#E8557A", "#110A0C", "MadnCo."],
    horror: ["Horror", "#E0213A", "#E7DFD1", "#E7DFD1", "Survive"],
    action: ["Action", "#FFB23E", "#8C96A3", "#110A0C", "Mission"],
    story: ["Story", "#E8C26A", "#E8557A", "#110A0C", "Chapter"],
    retro: ["Retro", "#B48CFF", "#30D5C8", "#110A0C", "Retro"],
  };
  var VERTICAL = /\/v-[^/]*$/.test(location.pathname);
  var CHANNEL = (new URLSearchParams(location.search).get("channel") || "madnco8")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function countdownText(cd, now) {
    var left = Math.round((cd.to - now) / 1000);
    if (left <= 0) return "Any second now…";
    var h = Math.floor(left / 3600),
      m = Math.floor((left % 3600) / 60),
      s = left % 60;
    return "Live in " + (h ? h + ":" + pad(m) : m) + ":" + pad(s);
  }

  function nextWhen(at, now) {
    var d = new Date(at);
    var time = pad(d.getHours()) + ":" + pad(d.getMinutes());
    var week = at - now < 6 * 864e5;
    var day = d.toLocaleDateString(
      "en-GB",
      week ? { weekday: "short" } : { weekday: "short", day: "numeric", month: "short" },
    );
    return day.replace(/,/g, "") + " · " + time;
  }

  function tickerOn(s, scene) {
    var t = s.ticker;
    return t && t.items && t.items.length && t.scenes && t.scenes.indexOf(scene) >= 0
      ? "1"
      : "";
  }

  function counterText(c) {
    return c.total ? c.value + " / " + c.total : String(c.value);
  }

  /* ---------------------------------------------------------- poll votes */
  var votes = {}, voteKey = null, ws = null, wsRetry = 0;

  function pollVotes(poll) {
    var key = poll ? poll.openedAt + "|" + poll.options.length : null;
    if (key !== voteKey) {
      votes = {};
      voteKey = key;
    }
    if (poll && !ws && CHANNEL && typeof WebSocket === "function" && wsRetry < Date.now())
      connectChat();
    if (!poll && ws) {
      ws.close();
      ws = null;
    }
    var counts = [0, 0, 0, 0], total = 0;
    for (var user in votes) {
      if (votes[user] < (poll ? poll.options.length : 0)) {
        counts[votes[user]]++;
        total++;
      }
    }
    return { counts: counts, total: total };
  }

  function connectChat() {
    try {
      ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    } catch (e) {
      ws = null;
      return;
    }
    ws.onopen = function () {
      ws.send("PASS SCHMOOPIIE");
      ws.send("NICK justinfan" + Math.floor(10000 + Math.random() * 80000));
      ws.send("JOIN #" + CHANNEL);
    };
    ws.onmessage = function (e) {
      var lines = String(e.data).split("\r\n");
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf("PING") === 0) {
          ws.send("PONG :tmi.twitch.tv");
          continue;
        }
        var m = line.match(/^:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :\s*!([1-4])\b/);
        if (m) votes[m[1].toLowerCase()] = Number(m[2]) - 1;
      }
    };
    ws.onclose = function () {
      ws = null;
      wsRetry = Date.now() + 15000;
    };
  }

  function setMood(play) {
    var root = document.documentElement;
    var mood = play && MOODS[play.mood] ? play.mood : "";
    if (root.getAttribute("data-mood") === (mood || null)) return;
    if (!mood) {
      root.removeAttribute("data-mood");
      return;
    }
    root.setAttribute("data-mood", mood);
    root.style.setProperty("--mood-a", MOODS[mood][1]);
    root.style.setProperty("--mood-b", MOODS[mood][2]);
    root.style.setProperty("--mood-lab", MOODS[mood][3]);
  }

  function playValues(s, out) {
    var p = s.play || null;
    setMood(p);
    var c = p && p.widget === "counters" ? p.counters || [] : [];
    var fb = p && p.football ? p.football : {};
    var poll = p && p.widget === "poll" ? p.poll : null;
    var pv = pollVotes(poll);
    out.play = p ? "1" : "";
    out["game-only"] = !p && s.game ? "1" : "";
    out["play-name"] = p ? p.name : "";
    out["play-unit"] = p ? p.unit : "";
    out["play-part"] = p && p.part !== null ? p.unit + " " + p.part : "";
    out["play-part-n"] = p && p.part !== null ? String(p.part) : "";
    out["play-goal"] = p ? p.goal : "";
    out["play-prev"] = p ? p.previously : "";
    var part = p && p.part !== null ? p.unit + " " + p.part : "";
    out["play-up"] = p ? (p.finalPart ? "Final " + (part || p.unit) : "Up next" + (part ? " · " + part : "")) : "";
    out["play-wrap"] = !p
      ? ""
      : p.completed
        ? "Completed" + (p.hours ? " · " + p.hours + " h total" : "")
        : (p.mood === "horror" ? "Survived " : "Played ") +
          (part || p.name) +
          (p.hours ? " · " + p.hours + " h so far" : "");
    out["play-hours"] = p && p.hours ? p.hours + " h played" : "";
    out["play-final"] = p && p.finalPart ? "1" : "";
    out["play-completed"] = p && p.completed ? "1" : "";
    out["mood-name"] = p && MOODS[p.mood] ? MOODS[p.mood][0] : "";
    out["ticker-label"] = p && MOODS[p.mood] ? MOODS[p.mood][4] : "";
    out["play-counters"] = c.length ? "1" : "";
    out["play-c1-on"] = c[0] ? "1" : "";
    out["play-c2-on"] = c[1] ? "1" : "";
    out["play-c1-label"] = c[0] ? c[0].label : "";
    out["play-c2-label"] = c[1] ? c[1].label : "";
    out["play-c1"] = c[0] ? counterText(c[0]) : "";
    out["play-c2"] = c[1] ? counterText(c[1]) : "";
    out["play-football"] = p && p.widget === "football" ? "1" : "";
    out["fb-w"] = String(fb.w || 0);
    out["fb-d"] = String(fb.d || 0);
    out["fb-l"] = String(fb.l || 0);
    out["fb-goals"] = (fb.gf || 0) + ":" + (fb.ga || 0);
    out["play-poll"] = poll ? "1" : "";
    out["poll-q"] = poll ? poll.question : "";
    out["poll-votes"] = poll ? pv.total + (pv.total === 1 ? " vote" : " votes") : "";
    var lead = Math.max.apply(null, pv.counts);
    out._poll = [];
    for (var i = 0; i < 4; i++) {
      var opt = poll && poll.options[i];
      var pct = pv.total ? Math.round((pv.counts[i] / pv.total) * 100) : 0;
      out["poll-o" + (i + 1)] = opt ? "1" : "";
      out["poll-t" + (i + 1)] = opt ? "!" + (i + 1) + " " + opt + " · " + pct + "%" : "";
      out["poll-lead-" + (i + 1)] = opt && lead > 0 && pv.counts[i] === lead ? "1" : "";
      out._poll.push(pct);
    }
    out._playTicker = p && p.ticker ? p.ticker : [];
  }

  function values(now) {
    var s = status || {};
    var cd = s.countdown && s.countdown.to + 30 * 60e3 > now ? s.countdown : null;
    var left = cd ? Math.max(0, Math.round((cd.to - now) / 1000)) : 0;
    var brb = s.brb || {};
    var bu = brb.until && brb.until + 30 * 60e3 > now ? brb.until : 0;
    var bleft = bu ? Math.max(0, Math.round((bu - now) / 1000)) : 0;
    var q = s.quest || null;
    var qShow = q && !(q.hideWhenDone && q.done);
    return {
      "brb-msg": brb.message || "",
      "brb-mm": bu ? pad(Math.floor(bleft / 60)) : "",
      "brb-ss": bu ? pad(bleft % 60) : "",
      "brb-run": bu && bleft > 0 ? "1" : "",
      "brb-zero": bu && bleft <= 0 ? "1" : "",
      "brb-timer": bu ? "1" : "",
      "brb-any": brb.message || bu ? "1" : "",
      "quest-title": q ? q.title : "",
      "quest-followers": q && q.followers !== null ? String(q.followers) : "",
      "quest-goal": q ? String(q.goal) : "",
      "quest-brb": qShow && q.onBrb ? "1" : "",
      "quest-starting": qShow && q.onStarting ? "1" : "",
      "quest-done": q && q.done ? "1" : "",
      "ticker-gaming": tickerOn(s, "gaming"),
      "ticker-chatting": tickerOn(s, "chatting"),
      "ticker-brb": tickerOn(s, "brb"),
      "ticker-starting": tickerOn(s, "starting"),
      _quest: q,
      _items: s.ticker && s.ticker.items ? s.ticker.items : [],
      "cd-mm": cd ? pad(Math.floor(left / 60)) : "",
      "cd-ss": cd ? pad(left % 60) : "",
      "cd-run": cd && left > 0 ? "1" : "",
      "cd-zero": cd && left <= 0 ? "1" : "",
      topic: s.topic || "",
      game: s.game || "",
      countdown: cd ? countdownText(cd, now) : "",
      next: s.next ? "1" : "",
      "next-when": s.next ? nextWhen(s.next.at, now) : "",
      "next-plan": s.next ? s.next.plan || "" : "",
      _cd: cd,
    };
  }

  function crewValues(s, v) {
    var chs = s.channels || null;
    var ch = chs ? (VERTICAL ? chs.vertical : chs.landscape) : null;
    var guest = !!(ch && ch.guest);
    v.guest = guest ? "1" : "";
    v.home = guest ? "" : "1";
    v["guest-host"] = guest ? ch.host : "";
    v["guest-line"] = guest ? chs.guestLine || "" : "";
    v["home-card"] = guest && chs.homeCard ? "1" : "";
    v["home-chip"] = guest ? "Home @madnco8" : "";
    var co = s.co && s.co.name ? s.co.name : "";
    v.co = co ? "1" : "";
    v["co-name"] = co;
    v["co-open"] = status && !co ? "1" : "";
    var q = s.quest || null;
    v["quest-left"] =
      q && q.followers !== null ? String(Math.max(0, q.goal - q.followers)) : q ? String(q.goal) : "";
    v._guestLine = guest ? "Guest stream on " + ch.host + ": our home is @madnco8" : "";
  }

  function allValues(now) {
    var s = status || {};
    var v = values(now);
    playValues(s, v);
    crewValues(s, v);
    if (v.guest) v["ticker-label"] = "Guest";
    // The game's own ticker lines (and the guest line) join the gaming ticker.
    var extra = v._playTicker.slice();
    if (v._guestLine) extra.unshift(v._guestLine);
    if (extra.length) {
      v._gaming = (v["ticker-gaming"] ? v._items : []).concat(extra);
      v["ticker-gaming"] = "1";
    }
    return v;
  }

  function render() {
    var now = Date.now(),
      v = allValues(now),
      i,
      el,
      key;
    var texts = document.querySelectorAll("[data-text]");
    for (i = 0; i < texts.length; i++) {
      el = texts[i];
      key = el.getAttribute("data-text");
      if (!el.hasAttribute("data-fallback"))
        el.setAttribute("data-fallback", el.textContent);
      el.textContent = v[key] || el.getAttribute("data-fallback");
    }
    var shows = document.querySelectorAll("[data-show]");
    for (i = 0; i < shows.length; i++)
      shows[i].hidden = !v[shows[i].getAttribute("data-show")];
    var hides = document.querySelectorAll("[data-hide]");
    for (i = 0; i < hides.length; i++)
      hides[i].hidden = !!v[hides[i].getAttribute("data-hide")];
    var qbars = document.querySelectorAll('[data-bar="quest"]');
    for (i = 0; i < qbars.length; i++) {
      var qp = v._quest && v._quest.followers !== null && v._quest.goal > 0
        ? Math.min(1, v._quest.followers / v._quest.goal)
        : 0;
      qbars[i].style.width = (Math.max(qp, 0.02) * 100).toFixed(1) + "%";
    }
    var tracks = document.querySelectorAll("[data-ticker]");
    for (i = 0; i < tracks.length; i++) {
      var scene = tracks[i].getAttribute("data-ticker");
      var list = scene === "gaming" && v._gaming ? v._gaming : v._items;
      fillTicker(tracks[i], v["ticker-" + scene] ? list : null);
    }
    var pbars = document.querySelectorAll("[data-bar^='poll-']");
    for (i = 0; i < pbars.length; i++) {
      var idx = Number(pbars[i].getAttribute("data-bar").slice(5)) - 1;
      pbars[i].style.width = (v._poll[idx] || 0) + "%";
    }
    var leads = document.querySelectorAll("[data-lead]");
    for (i = 0; i < leads.length; i++)
      leads[i].classList.toggle("lead", !!v["poll-lead-" + leads[i].getAttribute("data-lead")]);
    var bars = document.querySelectorAll('[data-bar="countdown"]');
    for (i = 0; i < bars.length; i++) {
      if (v._cd) {
        var p = Math.min(1, Math.max(0.02, (now - v._cd.from) / (v._cd.to - v._cd.from)));
        bars[i].style.animation = "none";
        bars[i].style.width = (p * 100).toFixed(1) + "%";
      } else {
        bars[i].style.animation = "";
        bars[i].style.width = "";
      }
    }
  }

  /*
   * Put the items into a scrolling track (twice, so the loop is seamless),
   * or bring back its default text. Built with DOM nodes, never innerHTML,
   * and only when the items change, so the scroll doesn't restart.
   */
  function fillTicker(track, items) {
    if (track._default === undefined) track._default = track.cloneNode(true);
    var key = items ? JSON.stringify(items) : "";
    if (track._key === key) return;
    track._key = key;
    var model = track._default;
    while (track.firstChild) track.removeChild(track.firstChild);
    if (!items) {
      for (var c = 0; c < model.childNodes.length; c++)
        track.appendChild(model.childNodes[c].cloneNode(true));
      track.style.animationDuration = "";
      return;
    }
    var span = model.querySelector("span");
    var sep = model.querySelector("i");
    var perRound = 0;
    for (var k = 0; k < items.length; k++) perRound += items[k].length + 4;
    // Short lists repeat inside each half, so the line never shows a gap.
    var reps = Math.max(1, Math.ceil(90 / Math.max(1, perRound)));
    var chars = 0;
    for (var round = 0; round < 2 * reps; round++) {
      for (var n = 0; n < items.length; n++) {
        var a = document.createElement("span");
        if (span) a.setAttribute("style", span.getAttribute("style") || "");
        a.textContent = track.hasAttribute("data-upper") ? items[n].toUpperCase() : items[n];
        track.appendChild(a);
        var b = document.createElement("i");
        if (sep) b.setAttribute("style", sep.getAttribute("style") || "");
        b.textContent = "//";
        track.appendChild(b);
        if (round < reps) chars += items[n].length + 4;
      }
    }
    // Same reading speed whatever the length: about 6 characters a second.
    track.style.animationDuration = Math.max(18, Math.round(chars / 6)) + "s";
  }

  function poll() {
    fetch(API, { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (s) {
        if (s) {
          status = s;
          render();
        }
      })
      .catch(function () {});
  }

  poll();
  setInterval(poll, 5000);
  setInterval(render, 1000);
})();
