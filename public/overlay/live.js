/*
 * MadnCo. overlays: live slots filled from /api/stream (admin panel).
 * Polls every 5 s; the countdown ticks every second in between.
 *
 *   data-text="topic|game|countdown|next-when|next-plan"  text of the element
 *   data-show="topic|game|next|countdown"  visible only when that value is set
 *   data-hide="topic|game|next|countdown"  visible only when it is NOT set
 *   data-bar="countdown"                   width follows the countdown
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

  function values(now) {
    var s = status || {};
    var cd = s.countdown && s.countdown.to + 30 * 60e3 > now ? s.countdown : null;
    return {
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
