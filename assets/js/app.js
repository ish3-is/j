/* =========================================================
   app.js — interactions & UX
   nav, reveal, scroll progress, copy, lightbox, cursor, prototype
   ========================================================= */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Navbar scrolled state + scroll progress ---------- */
  var nav = $("#nav");
  var progress = $("#progress");
  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    nav.classList.toggle("scrolled", y > 20);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? (y / h) * 100 : 0;
    progress.style.width = p + "%";
    // back to top
    $("#toTop").classList.toggle("show", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = $("#hamburger");
  var menu = $("#mobilemenu");
  function closeMenu() {
    burger.classList.remove("open");
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
  burger.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$("#mobilemenu a").forEach(function (a) { a.addEventListener("click", closeMenu); });

  /* ---------- Smooth anchor scroll (account for fixed nav) ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("in"); });
  }

  /* ---------- Active nav link via sections ---------- */
  var sections = $$("main section[id], header.hero[id]");
  var navLinks = $$("#navlinks a");
  var linkMap = {};
  navLinks.forEach(function (l) { linkMap[l.getAttribute("href")] = l; });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove("active"); });
          var link = linkMap["#" + en.target.id];
          if (link) link.classList.add("active");
        }
      });
    }, { threshold: 0.5, rootMargin: "-20% 0px -40% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Language toggle (AR default) ---------- */
  (function () {
    var html = document.documentElement;
    var btn = $("#langBtn");
    var btnM = $("#langBtnMobile");
    var KEY = "aljory_lang";

    var translations = {
      ar: { htmlLang: "ar", dir: "rtl", label: "EN" },
      en: { htmlLang: "en", dir: "ltr", label: "ع" }
    };

    function apply(lang) {
      var t = translations[lang];
      html.setAttribute("lang", t.htmlLang);
      html.setAttribute("dir", t.dir);
      // swap all [data-ar]/[data-en]
      $$("[data-en]").forEach(function (el) {
        var txt = el.getAttribute(lang === "en" ? "data-en" : "data-ar");
        if (txt !== null && txt !== el.getAttribute("data-current")) {
          // don't override child elements that themselves have data-en (handled separately)
          if (!el.querySelector("[data-en]")) {
            el.textContent = txt;
            el.setAttribute("data-current", txt);
          }
        }
      });
      btn.textContent = t.label;
      if (btnM) btnM.textContent = t.label;
      // store
      try { localStorage.setItem(KEY, lang); } catch (e) {}
    }

    function toggle() {
      var cur = html.getAttribute("lang") === "en" ? "en" : "ar";
      apply(cur === "en" ? "ar" : "en");
    }

    btn.addEventListener("click", toggle);
    if (btnM) btnM.addEventListener("click", toggle);

    // restore saved (default = ar)
    var saved = "ar";
    try { saved = localStorage.getItem(KEY) || "ar"; } catch (e) {}
    if (saved === "en") apply("en");
  })();

  /* ---------- Toast ---------- */
  var toast = $("#toast");
  var toastMsg = $("#toastMsg");
  var toastT = null;
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove("show"); }, 2400);
  }

  /* ---------- Copy email ---------- */
  var copyBtn = $("#copyEmail");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = $("#emailText").textContent.trim();
      var lang = document.documentElement.getAttribute("lang") === "en" ? "en" : "ar";
      var doneMsg = lang === "en" ? "Email copied: " : "تم نسخ البريد: ";
      var failMsg = lang === "en" ? "Copy failed" : "تعذّر النسخ";
      var done = function () { showToast(doneMsg + email); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(fallback);
      } else { fallback(); }
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = email; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) { showToast(failMsg); }
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = $("#lightbox");
  var lbImg = $("#lbImg");
  var lbClose = $("#lbClose");
  function openLb(src) {
    lbImg.src = src; lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLb() {
    lb.classList.remove("open"); lbImg.src = ""; document.body.style.overflow = "";
  }
  $$(".cert").forEach(function (c) {
    c.addEventListener("click", function () { openLb(c.getAttribute("data-src")); });
  });
  lbClose.addEventListener("click", closeLb);
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && lb.classList.contains("open")) closeLb(); });

  /* ---------- Back to top ---------- */
  $("#toTop").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Biometric Tickets prototype ---------- */
  (function () {
    var btn = $("#verifyBtn");
    var home = $("#bt-home"), scan = $("#bt-scan"), done = $("#bt-done");
    var status = $("#verifyStatus"), scanStatus = $("#scanStatus");
    if (!btn) return;
    var busy = false;
    function txt(el) {
      var lang = document.documentElement.getAttribute("lang") === "en" ? "en" : "ar";
      return el.getAttribute(lang === "en" ? "data-en" : "data-ar");
    }
    btn.addEventListener("click", function () {
      if (busy) return; busy = true;
      btn.disabled = true;
      home.classList.add("hidden");
      scan.classList.remove("hidden");
      var t1 = setTimeout(function () {
        scanStatus.textContent = txt(scanStatus);
        var t2 = setTimeout(function () {
          scan.classList.add("hidden");
          done.classList.remove("hidden");
          var t3 = setTimeout(function () {
            btn.disabled = false; busy = false;
            // reset back to home for replay
            done.classList.add("hidden");
            home.classList.remove("hidden");
            status.textContent = txt(status);
            scanStatus.textContent = txt(scanStatus);
          }, 2600);
        }, 1600);
      }, 900);
    });
  })();

  /* ---------- Custom cursor (desktop fine pointers only) ---------- */
  (function () {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var dot = $("#cursorDot"), ring = $("#cursorRing");
    if (!dot || !ring) return;
    document.body.classList.add("cursor-on");
    var rx = 0, ry = 0, mx = 0, my = 0;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    var hoverables = "a, button, .cert, input, [role='button']";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(hoverables)) ring.classList.add("hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(hoverables)) ring.classList.remove("hover");
    });
    document.addEventListener("mouseleave", function () { dot.style.opacity = "0"; ring.style.opacity = "0"; });
    document.addEventListener("mouseenter", function () { dot.style.opacity = "1"; ring.style.opacity = "1"; });
  })();
})();
