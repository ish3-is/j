/* =========================================================
   neural.js — animated AI node-network hero visual
   Lightweight, performant, respects reduced-motion.
   ========================================================= */
(function () {
  "use strict";
  var canvas = document.getElementById("neural");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var nodes = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var raf = null;

  function size() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    nodes = [];
    var area = W * H;
    var count = Math.max(26, Math.min(64, Math.round(area / 9000)));
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.8 + 1.2,
        pulse: Math.random() * Math.PI * 2
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // connect nodes
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      a.pulse += 0.02;
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;

      // gentle pull toward mouse
      if (mouse.active) {
        var dxm = mouse.x - a.x, dym = mouse.y - a.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 140) { a.x += dxm * 0.0016; a.y += dym * 0.0016; }
      }

      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          var alpha = (1 - d / 130) * 0.5;
          ctx.strokeStyle = "rgba(120,150,255," + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // draw nodes
    for (var k = 0; k < nodes.length; k++) {
      var n = nodes[k];
      var glow = (Math.sin(n.pulse) + 1) / 2; // 0..1
      var rad = n.r + glow * 1.4;
      var grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, rad * 3);
      grad.addColorStop(0, "rgba(140,170,255," + (0.9).toFixed(2) + ")");
      grad.addColorStop(1, "rgba(140,170,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, rad * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(220,230,255,0.95)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  // static frame for reduced motion
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = n.x - b.x, dy = n.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.strokeStyle = "rgba(120,150,255," + ((1 - d / 130) * 0.4).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var m = nodes[k];
      ctx.fillStyle = "rgba(220,230,255,0.95)";
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  canvas.addEventListener("mousemove", function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  canvas.addEventListener("mouseleave", function () { mouse.active = false; });

  // Pause when off-screen to save CPU
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting && !reduce) {
        if (!raf) raf = requestAnimationFrame(step);
      } else if (raf) {
        cancelAnimationFrame(raf); raf = null;
      }
    });
  }, { threshold: 0.05 });
  io.observe(canvas);

  size();
  window.addEventListener("resize", debounce(size, 200));

  if (reduce) { drawStatic(); }
  else { raf = requestAnimationFrame(step); }

  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
})();
