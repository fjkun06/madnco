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
 * Without an answer (offline, local file) every slot keeps its default.
 */
(function () {
  "use strict";
  var API =
    (location.protocol === "file:" ? "https://www.madnco.frankjordan.dev" : "") +
    "/api/stream";
  var status = null;

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

  function render() {
    var now = Date.now(),
      v = values(now),
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
      var qp =
        v._quest && v._quest.followers !== null && v._quest.goal > 0
          ? Math.min(1, v._quest.followers / v._quest.goal)
          : 0;
      qbars[i].style.width = (Math.max(qp, 0.02) * 100).toFixed(1) + "%";
    }
    var tracks = document.querySelectorAll("[data-ticker]");
    for (i = 0; i < tracks.length; i++)
      fillTicker(
        tracks[i],
        v["ticker-" + tracks[i].getAttribute("data-ticker")] ? v._items : null,
      );
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
        a.textContent = track.hasAttribute("data-upper")
          ? items[n].toUpperCase()
          : items[n];
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
