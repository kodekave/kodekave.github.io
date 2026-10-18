/* The map engine: a tiny canvas renderer with pan, pinch-zoom, markers and an animated footprint trail.
   World units are metres on the Manhattan grid: +u = east (towards 6th Ave), +v = uptown. */
(function () {
  'use strict';
  var TS = window.TS;
  var geo = TS.geo, R = geo.rect;
  var INK = '#3a2616', INK_RGB = '58,38,22', WAX = '#9c2f27', PARCH = '#ead9ae';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function MapView(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.W = 0; this.H = 0;
    this.cx = (R.u0 + R.u1) / 2; this.cy = (R.v0 + R.v1) / 2; this.scale = 0.6;
    this.pad = { l: 0, t: 0, r: 0, b: 0 };
    this.filter = 'all'; this.maxMins = 0;
    this.selected = null; this.hover = null;
    this.you = null; this.origin = null; this.route = null; this.hiStep = null;
    this.routeT0 = 0; this.routeDur = 0;
    this.introT0 = 0; this.introDone = false;
    this.fly = null; this.dirty = true; this.raf = 0;
    this.onTap = null; this.picking = false;
    this.labelCache = {};
    this.markers = [];
    this._resize = this.resize.bind(this);
    this.bind();
    this.resize();
    window.addEventListener('resize', this._resize);
    if (window.ResizeObserver) new ResizeObserver(this._resize).observe(canvas);
  }

  var P = MapView.prototype;

  P.contain = function () {
    var w = R.u1 - R.u0, h = R.v1 - R.v0;
    return Math.min(this.W / w, (this.H - this.pad.t - 8) / h) * 0.97;
  };
  // you can zoom out a little past "whole map" so a long route still fits above the pop-up
  P.minScale = function () { return Math.max(0.15, this.contain() * 0.5); };
  P.maxScale = function () { return 7; };

  P.resize = function () {
    var r = this.c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var first = this.W === 0;
    this.W = r.width; this.H = r.height;
    this.c.width = Math.round(r.width * this.dpr);
    this.c.height = Math.round(r.height * this.dpr);
    if (first) this.fit(true);
    this.constrain();
    this.invalidate();
  };

  P.setPad = function (pad) {
    this.pad = { l: pad.l || 0, t: pad.t || 0, r: pad.r || 0, b: pad.b || 0 };
    if (this.W) { this.constrain(); this.invalidate(); }
  };

  P.constrain = function () {
    var s = this.scale = clamp(this.scale, this.minScale(), this.maxScale());
    var p = this.pad, W = this.W, H = this.H, slack = 30;
    var fw = (W - p.l - p.r) / s, fh = (H - p.t - p.b) / s;
    var w = R.u1 - R.u0, h = R.v1 - R.v0;
    var offU = (p.l + (W - p.r)) / 2 - W / 2, offV = (p.t + (H - p.b)) / 2 - H / 2;   // free-area centre vs canvas centre (px)
    var fcU = this.cx + offU / s, fcV = this.cy - offV / s;
    fcU = fw >= w ? (R.u0 + R.u1) / 2 : clamp(fcU, R.u0 + fw / 2 - slack, R.u1 - fw / 2 + slack);
    fcV = fh >= h ? (R.v0 + R.v1) / 2 : clamp(fcV, R.v0 + fh / 2 - slack, R.v1 - fh / 2 + slack);
    this.cx = fcU - offU / s; this.cy = fcV + offV / s;
  };

  P.fit = function (immediate) {
    var w = R.u1 - R.u0, h = R.v1 - R.v0;
    var aw = this.W - this.pad.l - this.pad.r, ah = this.H - this.pad.t - this.pad.b;
    var target = { scale: clamp(Math.min(aw / w, ah / h) * 0.97, this.minScale(), this.maxScale()) };
    this.centerOn(target, (R.u0 + R.u1) / 2, (R.v0 + R.v1) / 2);
    if (immediate) { this.cx = target.cx; this.cy = target.cy; this.scale = target.scale; this.constrain(); this.invalidate(); }
    else this.flyTo(target);
  };

  // set target.cx/cy so that world point (u,v) shows in the middle of the free area
  P.centerOn = function (target, u, v) {
    var s = target.scale || this.scale;
    var fx = this.pad.l + (this.W - this.pad.l - this.pad.r) / 2, fy = this.pad.t + (this.H - this.pad.t - this.pad.b) / 2;
    target.cx = u - (fx - this.W / 2) / s;
    target.cy = v + (fy - this.H / 2) / s;
  };

  P.focus = function (u, v, scale) {
    var t = { scale: clamp(scale || Math.max(this.scale, 1.7), this.minScale(), this.maxScale()) };
    this.centerOn(t, u, v);
    this.flyTo(t);
  };

  P.fitBox = function (u0, v0, u1, v1, maxScale) {
    var aw = this.W - this.pad.l - this.pad.r - 70, ah = this.H - this.pad.t - this.pad.b - 90;
    var s = Math.min(aw / Math.max(40, u1 - u0), ah / Math.max(40, v1 - v0));
    var t = { scale: clamp(Math.min(s, maxScale || 3.2), this.minScale(), this.maxScale()) };
    this.centerOn(t, (u0 + u1) / 2, (v0 + v1) / 2);
    this.flyTo(t);
  };

  P.flyTo = function (t, ms) {
    var self = this;
    if (REDUCED) { this.cx = t.cx; this.cy = t.cy; this.scale = t.scale; this.constrain(); this.invalidate(); return; }
    this.fly = { t0: performance.now(), ms: ms || 650, from: { cx: this.cx, cy: this.cy, scale: this.scale }, to: t };
    this.invalidate();
  };

  P.screen = function (u, v) { return [(u - this.cx) * this.scale + this.W / 2, this.H / 2 - (v - this.cy) * this.scale]; };
  P.world = function (x, y) { return [this.cx + (x - this.W / 2) / this.scale, this.cy - (y - this.H / 2) / this.scale]; };

  P.zoomAt = function (sx, sy, f) {
    var w = this.world(sx, sy);
    this.scale = clamp(this.scale * f, this.minScale(), this.maxScale());
    this.cx = w[0] - (sx - this.W / 2) / this.scale;
    this.cy = w[1] + (sy - this.H / 2) / this.scale;
    this.fly = null;
    this.constrain(); this.invalidate();
  };
  P.zoomBy = function (f) {
    var t = { scale: clamp(this.scale * f, this.minScale(), this.maxScale()), cx: this.cx, cy: this.cy };
    this.flyTo(t, 300);
  };

  /* ---- input ---- */
  P.bind = function () {
    var self = this, c = this.c, ptrs = {}, n = 0, moved = 0, t0 = 0, start = null, lastDist = 0;
    function pos(e) { var r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    c.addEventListener('pointerdown', function (e) {
      c.setPointerCapture(e.pointerId);
      ptrs[e.pointerId] = pos(e); n = Object.keys(ptrs).length;
      if (n === 1) { moved = 0; t0 = performance.now(); start = pos(e); self.fly = null; }
      if (n === 2) { var k = Object.keys(ptrs); lastDist = Math.hypot(ptrs[k[0]][0] - ptrs[k[1]][0], ptrs[k[0]][1] - ptrs[k[1]][1]); }
    });
    c.addEventListener('pointermove', function (e) {
      var p = pos(e);
      if (!ptrs[e.pointerId]) { self.hoverAt(p[0], p[1]); return; }
      var prev = ptrs[e.pointerId];
      ptrs[e.pointerId] = p;
      if (n === 1) {
        var dx = p[0] - prev[0], dy = p[1] - prev[1];
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 6) {
          c.classList.add('dragging');
          self.cx -= dx / self.scale; self.cy += dy / self.scale;
          self.constrain(); self.invalidate();
        }
      } else if (n === 2) {
        var k = Object.keys(ptrs), a = ptrs[k[0]], b = ptrs[k[1]];
        var d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (lastDist > 0) self.zoomAt(mx, my, d / lastDist);
        lastDist = d; moved = 99;
      }
    });
    function up(e) {
      var wasOne = n === 1;
      delete ptrs[e.pointerId]; n = Object.keys(ptrs).length;
      c.classList.remove('dragging');
      if (wasOne && moved <= 6 && performance.now() - t0 < 600) {
        var p = pos(e);
        if (self.onTap) self.onTap(p[0], p[1]);
      }
      if (n < 2) lastDist = 0;
    }
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = pos(e);
      self.zoomAt(p[0], p[1], Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)));
    }, { passive: false });
    c.addEventListener('dblclick', function (e) { var p = pos(e); self.zoomAt(p[0], p[1], 1.8); });
  };

  P.hoverAt = function (x, y) {
    var h = this.hit(x, y, 6);
    var id = h ? h.id : null;
    if (id !== this.hover) { this.hover = id; this.c.style.cursor = id ? 'pointer' : (this.picking ? 'crosshair' : ''); this.invalidate(); }
  };

  P.hit = function (x, y, extra) {
    var best = null;
    for (var i = 0; i < this.markers.length; i++) {
      var m = this.markers[i];
      var d = Math.hypot(m.x - x, m.y - y);
      if (d <= m.r + (extra == null ? 10 : extra) && (!best || d < best.d)) best = { id: m.id, d: d };
    }
    return best;
  };

  /* ---- state setters ---- */
  P.invalidate = function () {
    if (this.raf) return;
    var self = this;
    this.raf = requestAnimationFrame(function (t) { self.raf = 0; self.frame(t); });
  };
  P.setFilter = function (kind, maxMins) { this.filter = kind; this.maxMins = maxMins || 0; this.invalidate(); };
  P.select = function (id) { this.selected = id; this.invalidate(); };
  P.setYou = function (p) { this.you = p; this.invalidate(); };
  P.setOrigin = function (p) { this.origin = p; this.invalidate(); };
  P.setRoute = function (r) {
    this.route = r; this.hiStep = null;
    if (r) {
      var cum = [0];
      for (var i = 1; i < r.path.length; i++) cum.push(cum[i - 1] + Math.hypot(r.path[i][0] - r.path[i - 1][0], r.path[i][1] - r.path[i - 1][1]));
      this.routeCum = cum; this.routeLen = cum[cum.length - 1];
      this.routeT0 = performance.now();
      this.routeDur = REDUCED ? 1 : clamp(1200 + this.routeLen * 4, 1500, 4200);
    }
    this.invalidate();
  };
  P.highlightStep = function (i) { this.hiStep = i; this.invalidate(); };
  P.startIntro = function () { this.introT0 = performance.now(); this.introDone = false; this.invalidate(); };

  P.visible = function (s) {
    if (s.kind === 'gateway') return true;
    if (this.filter !== 'all' && s.kind !== this.filter) return false;
    return true;
  };
  P.dimmed = function (s) { return this.maxMins && s.kind !== 'gateway' && s.mins > this.maxMins; };

  /* ---- drawing ---- */
  P.textWidth = function (font, text) {
    var key = font + '|' + text;
    var c = this.labelCache[key];
    if (c == null) { this.ctx.font = font; c = this.labelCache[key] = this.ctx.measureText(text).width; }
    return c;
  };

  P.frame = function (now) {
    var animating = false;
    // fly
    if (this.fly) {
      var f = this.fly, t = Math.min(1, (now - f.t0) / f.ms), e = ease(t);
      this.cx = f.from.cx + (f.to.cx - f.from.cx) * e;
      this.cy = f.from.cy + (f.to.cy - f.from.cy) * e;
      this.scale = f.from.scale * Math.pow(f.to.scale / f.from.scale, e);
      this.constrain();
      if (t >= 1) this.fly = null; else animating = true;
    }
    var intro = 1;
    if (!this.introDone && this.introT0) {
      intro = REDUCED ? 1 : clamp((now - this.introT0) / 1700, 0, 1);
      if (intro >= 1) this.introDone = true; else animating = true;
    }
    if (!this.introT0) intro = 0;
    this.draw(now, intro);
    var pulsing = (this.selected || this.you || this.origin) && !REDUCED;
    var routeAnim = this.route && (now - this.routeT0) < this.routeDur + 600;
    if (animating || pulsing || routeAnim) this.invalidate();
  };

  function hand(ctx, pts, X, Y, close) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var x = X(pts[i][0]), y = Y(pts[i][1]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    if (close) ctx.closePath();
  }

  P.draw = function (now, intro) {
    var ctx = this.ctx, W = this.W, H = this.H, S = this.scale, self = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var cx = this.cx, cy = this.cy;
    function X(u) { return (u - cx) * S + W / 2; }
    function Y(v) { return H / 2 - (v - cy) * S; }
    var x0 = X(R.u0), x1 = X(R.u1), y0 = Y(R.v1), y1 = Y(R.v0);

    var ease0 = ease(intro);
    var content = this.introT0 ? ease0 : 0;

    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    ctx.globalAlpha = content;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // plazas
    ctx.fillStyle = 'rgba(86,118,70,.17)';
    ctx.strokeStyle = 'rgba(' + INK_RGB + ',.35)'; ctx.lineWidth = 1;
    geo.plazas.forEach(function (p) { hand(ctx, p, X, Y, true); ctx.fill(); ctx.stroke(); });

    // walking lines (faint, dashed)
    ctx.strokeStyle = 'rgba(' + INK_RGB + ',.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
    geo.graph.edges.forEach(function (e) { hand(ctx, e[4], X, Y, false); ctx.stroke(); });
    ctx.setLineDash([]);

    // buildings
    var lw = clamp(S * 0.45, 0.9, 2.1);
    var named = [];
    geo.buildings.forEach(function (b) {
      hand(ctx, b.p, X, Y, true);
      ctx.fillStyle = b.n ? 'rgba(120,76,36,.17)' : 'rgba(120,76,36,.09)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + INK_RGB + ',.82)'; ctx.lineWidth = lw; ctx.stroke();
      if (b.n && S > 1.5) named.push(b);
    });
    // second, offset outline for an inked look
    ctx.strokeStyle = 'rgba(' + INK_RGB + ',.18)'; ctx.lineWidth = 1;
    ctx.save(); ctx.translate(0.7, 0.7);
    geo.buildings.forEach(function (b) { hand(ctx, b.p, X, Y, true); ctx.stroke(); });
    ctx.restore();

    // street names
    ctx.fillStyle = 'rgba(' + INK_RGB + ',.78)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var fs = clamp(9 + S * 1.6, 10, 15);
    var font = 'italic ' + fs + 'px ' + getComputedStyle(document.body).fontFamily;
    var drawn = {};
    geo.graph.edges.forEach(function (e, i) {
      var name = e[3]; if (!name) return;
      var poly = e[4], a = poly[0], b = poly[poly.length - 1];
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]) * S;
      var tw = self.textWidth(font, name);
      if (len < tw + 26) return;
      var mid = poly[Math.floor(poly.length / 2)];
      if (poly.length % 2 === 0) mid = [(poly[poly.length / 2 - 1][0] + poly[poly.length / 2][0]) / 2, (poly[poly.length / 2 - 1][1] + poly[poly.length / 2][1]) / 2];
      var ang = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
      if (ang > Math.PI / 2) ang -= Math.PI; else if (ang < -Math.PI / 2) ang += Math.PI;
      var key = name + Math.round(mid[0] / 60) + ',' + Math.round(mid[1] / 60);
      if (S < 1.0 && drawn[key]) return;
      drawn[key] = 1;
      ctx.save();
      ctx.translate(X(mid[0]), Y(mid[1])); ctx.rotate(-ang);
      ctx.font = font;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(234,217,174,.9)'; ctx.strokeText(name, 0, 0);
      ctx.fillText(name, 0, 0);
      ctx.restore();
    });
    // building names when zoomed in
    if (named.length) {
      var f2 = 'italic ' + clamp(8 + S * 1.3, 10, 13) + 'px ' + getComputedStyle(document.body).fontFamily;
      ctx.font = f2; ctx.fillStyle = 'rgba(' + INK_RGB + ',.62)';
      named.forEach(function (b) {
        var mx = 0, my = 0, minx = 1e9, maxx = -1e9;
        b.p.forEach(function (q) { mx += q[0]; my += q[1]; minx = Math.min(minx, q[0]); maxx = Math.max(maxx, q[0]); });
        mx /= b.p.length; my /= b.p.length;
        if ((maxx - minx) * S < self.textWidth(f2, b.n) * 0.8) return;
        ctx.fillText(b.n, X(mx), Y(my));
      });
    }
    ctx.restore();

    // fog outside the district + page border
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = 'rgba(86,56,24,.34)'; ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(' + INK_RGB + ',.9)'; ctx.lineWidth = 2.5; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.lineWidth = 1; ctx.setLineDash([5, 4]); ctx.strokeRect(x0 + 5, y0 + 5, x1 - x0 - 10, y1 - y0 - 10); ctx.setLineDash([]);
    ctx.restore();

    // edge captions (visible once the page edge is on screen)
    ctx.save();
    ctx.fillStyle = 'rgba(244,232,200,.92)'; ctx.font = 'italic 12px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (y0 > 18) ctx.fillText('↑ Uptown (north) · W 49th St', (x0 + x1) / 2, y0 - 11);
    if (y1 < H - 18) ctx.fillText('↓ Downtown (south) · W 41st St', (x0 + x1) / 2, y1 + 11);
    ctx.restore();

    if (!this.introT0) { this.markers = []; return; }

    // route
    if (this.route) this.drawRoute(ctx, now, X, Y, S);

    // markers
    this.drawMarkers(ctx, now, X, Y, S, content);

    // origin / you
    var pins = [];
    if (this.origin) pins.push({ p: this.origin, c: '#3f6b49', t: 'A' });
    if (this.you) pins.push({ p: this.you, c: '#2f5d8a', t: '●' });
    pins.forEach(function (pin) {
      var sx = X(pin.p.u), sy = Y(pin.p.v);
      var pr = REDUCED ? 0 : ((now / 900) % 1);
      ctx.beginPath(); ctx.arc(sx, sy, 10 + pr * 18, 0, 7); ctx.strokeStyle = 'rgba(47,93,138,' + (0.5 * (1 - pr)) + ')'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(sx, sy, 8, 0, 7); ctx.fillStyle = pin.c; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fbf3da'; ctx.stroke();
      if (pin.t === 'A') { ctx.fillStyle = '#fbf3da'; ctx.font = 'bold 10px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', sx, sy + .5); }
    });
    if (this.you || this.origin) {
      var p = this.origin || this.you;
      ctx.font = 'italic 600 13px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(234,217,174,.95)'; ctx.fillStyle = INK;
      var lbl = this.origin ? 'You are here' : 'You are here';
      ctx.strokeText(lbl, X(p.u) + 14, Y(p.v)); ctx.fillText(lbl, X(p.u) + 14, Y(p.v));
    }
  };

  function foot(ctx, x, y, ang, mirror, size, alpha) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.scale(mirror ? -1 : 1, 1);
    var k = size / 11;
    ctx.scale(k, k);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#5b1d17';
    ctx.beginPath(); ctx.ellipse(0.4, -2.1, 2.5, 3.7, 0.12, 0, 7); ctx.fill();         // sole
    ctx.beginPath(); ctx.ellipse(0, 3.4, 1.8, 2.1, 0, 0, 7); ctx.fill();               // heel
    ctx.beginPath(); ctx.arc(-1.9, -6.3, .75, 0, 7); ctx.arc(-0.7, -7.1, .8, 0, 7); ctx.arc(.7, -7.2, .75, 0, 7); ctx.arc(1.9, -6.7, .7, 0, 7); ctx.arc(2.9, -5.5, .6, 0, 7); ctx.fill();
    ctx.restore();
  }

  P.pointAt = function (d) {
    var cum = this.routeCum, path = this.route.path;
    d = clamp(d, 0, this.routeLen);
    var lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
    var seg = cum[hi] - cum[lo] || 1, t = (d - cum[lo]) / seg;
    var x = path[lo][0] + (path[hi][0] - path[lo][0]) * t, y = path[lo][1] + (path[hi][1] - path[lo][1]) * t;
    return { u: x, v: y, du: path[hi][0] - path[lo][0], dv: path[hi][1] - path[lo][1] };
  };

  P.drawRoute = function (ctx, now, X, Y, S) {
    var r = this.route, path = r.path;
    var prog = REDUCED ? 1 : clamp((now - this.routeT0) / this.routeDur, 0, 1);
    var shownLen = this.routeLen * ease(prog);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // soft underlay (whole path)
    ctx.beginPath();
    path.forEach(function (p, i) { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); });
    ctx.strokeStyle = 'rgba(156,47,39,.13)'; ctx.lineWidth = 11; ctx.stroke();
    // highlighted step
    if (this.hiStep != null && r.steps[this.hiStep] && r.steps[this.hiStep].poly) {
      var hp = r.steps[this.hiStep].poly;
      ctx.beginPath();
      hp.forEach(function (p, i) { if (i) ctx.lineTo(X(p[0]), Y(p[1])); else ctx.moveTo(X(p[0]), Y(p[1])); });
      ctx.strokeStyle = 'rgba(176,122,20,.55)'; ctx.lineWidth = 14; ctx.stroke();
    }
    // trail up to progress
    var cum = this.routeCum;
    ctx.beginPath();
    ctx.moveTo(X(path[0][0]), Y(path[0][1]));
    for (var i = 1; i < path.length; i++) {
      if (cum[i] <= shownLen) ctx.lineTo(X(path[i][0]), Y(path[i][1]));
      else { var q = this.pointAt(shownLen); ctx.lineTo(X(q.u), Y(q.v)); break; }
    }
    ctx.setLineDash([1, 7]); ctx.strokeStyle = 'rgba(' + INK_RGB + ',.55)'; ctx.lineWidth = 2.4; ctx.stroke(); ctx.setLineDash([]);

    // footprints, constant size on screen
    var spacePx = 26, spaceW = spacePx / S;
    var count = Math.floor(shownLen / spaceW);
    var size = clamp(10 + S * 0.8, 10, 15);
    for (var k = 0; k <= count; k++) {
      var d = k * spaceW + spaceW * 0.5;
      if (d > this.routeLen) break;
      var pt = this.pointAt(d);
      var ang = Math.atan2(-(pt.dv), pt.du);
      var sx = X(pt.u), sy = Y(pt.v);
      var side = (k % 2 === 0) ? 1 : -1;
      sx += Math.cos(ang + Math.PI / 2) * 4.5 * side; sy += Math.sin(ang + Math.PI / 2) * 4.5 * side;
      var age = shownLen - d;
      var fade = prog < 1 ? clamp(age / (spaceW * 1.2), 0, 1) : 1;
      foot(ctx, sx, sy, ang, side < 0, size, 0.82 * fade);
    }
    ctx.restore();
  };

  var KIND_R = { famous: 13, lesser: 11.5, local: 11.5, hidden: 11.5, gateway: 10 };

  P.drawMarkers = function (ctx, now, X, Y, S, alpha) {
    var self = this, placed = [], list = [];
    var introAge = now - this.introT0;
    var fam = getComputedStyle(document.body).fontFamily;
    geo.spots.forEach(function (s, idx) {
      if (!self.visible(s)) return;
      var sx = X(s.u), sy = Y(s.v);
      if (sx < -30 || sx > self.W + 30 || sy < -30 || sy > self.H + 30) return;
      var pop = REDUCED ? 1 : clamp((introAge - 700 - idx * 35) / 320, 0, 1);
      if (pop <= 0) return;
      list.push({ s: s, x: sx, y: sy, pop: pop });
    });
    // draw lower priority first so important ones sit on top
    list.sort(function (a, b) {
      var sa = a.s.id === self.selected ? 99 : a.s.idx, sb = b.s.id === self.selected ? 99 : b.s.idx;
      return sa - sb;
    });
    this.markers = [];
    list.forEach(function (m) {
      var s = m.s, sel = s.id === self.selected, hov = s.id === self.hover, dim = self.dimmed(s) || (!!self.route && !sel && !hov);
      var base = (KIND_R[s.kind] || 12) + clamp((S - 0.6) * 2.4, 0, 5);
      var r = base * (sel ? 1.3 : hov ? 1.12 : 1) * (0.5 + 0.5 * ease(m.pop));
      var col = TS.KINDS[s.kind].color;
      ctx.save();
      ctx.globalAlpha = (dim ? (self.route ? 0.3 : 0.38) : 1) * ease(m.pop);
      if (sel && !REDUCED) {
        var pr = (now / 1100) % 1;
        ctx.beginPath(); ctx.arc(m.x, m.y, r + 4 + pr * 16, 0, 7); ctx.strokeStyle = 'rgba(' + INK_RGB + ',' + (0.55 * (1 - pr)) + ')'; ctx.lineWidth = 2; ctx.stroke();
      }
      // shadow
      ctx.beginPath(); ctx.ellipse(m.x + 1.5, m.y + r * 0.9, r * 0.85, r * 0.35, 0, 0, 7); ctx.fillStyle = 'rgba(' + INK_RGB + ',.28)'; ctx.fill();
      // wax seal with a slightly wavy edge
      ctx.beginPath();
      for (var a = 0; a <= 24; a++) {
        var th = a / 24 * Math.PI * 2, rr = r * (1 + 0.045 * Math.sin(th * 7 + s.idx));
        var px = m.x + Math.cos(th) * rr, py = m.y + Math.sin(th) * rr;
        if (a) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = col; ctx.fill();
      ctx.lineWidth = sel ? 3 : 2; ctx.strokeStyle = sel ? '#fbf3da' : INK; ctx.stroke();
      if (sel) { ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(m.x, m.y, r + 2.2, 0, 7); ctx.stroke(); }
      // inner ring + highlight
      ctx.beginPath(); ctx.arc(m.x, m.y, r * 0.72, 0, 7); ctx.strokeStyle = 'rgba(255,240,205,.35)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(m.x - r * 0.3, m.y - r * 0.38, r * 0.3, r * 0.17, -0.6, 0, 7); ctx.fillStyle = 'rgba(255,240,205,.28)'; ctx.fill();
      // icon
      ctx.font = Math.round(r * 1.0) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(TS.ICONS[s.t] || '✨', m.x, m.y + r * 0.06);
      ctx.restore();
      self.markers.push({ id: s.id, x: m.x, y: m.y, r: r });
    });

    // labels, best-first, no overlaps
    var cand = list.slice().sort(function (a, b) {
      var sa = a.s.id === self.selected ? 99 : a.s.idx, sb = b.s.id === self.selected ? 99 : b.s.idx;
      return sb - sa;
    });
    var fs = clamp(10.5 + S * 0.9, 11.5, 15);
    var font = 'italic 600 ' + fs + 'px ' + fam;
    list.forEach(function (m) { placed.push({ x: m.x - 14, y: m.y - 14, w: 28, h: 28, own: m.s.id }); });
    ctx.save();
    ctx.textBaseline = 'middle';
    cand.forEach(function (m) {
      var s = m.s, sel = s.id === self.selected, hov = s.id === self.hover;
      if (self.route && !sel) return;     // during a route only the destination is labelled
      var tw = self.textWidth(font, s.short || s.name) + 8, th = fs + 6;
      var r = 13;
      var tries = [['r', m.x + r + 3, m.y - th / 2], ['l', m.x - r - 3 - tw, m.y - th / 2], ['b', m.x - tw / 2, m.y + r + 1], ['t', m.x - tw / 2, m.y - r - th - 1]];
      for (var i = 0; i < tries.length; i++) {
        var t = tries[i], rect = { x: t[1], y: t[2], w: tw, h: th };
        if (rect.x < 4 || rect.x + rect.w > self.W - 4 || rect.y < 4 || rect.y + rect.h > self.H - 4) continue;
        var clash = placed.some(function (p) { return p.own !== s.id && rect.x < p.x + p.w && rect.x + rect.w > p.x && rect.y < p.y + p.h && rect.y + rect.h > p.y; });
        if (clash && !sel) continue;
        placed.push(rect);
        ctx.font = font; ctx.textAlign = 'left';
        ctx.globalAlpha = self.dimmed(s) ? 0.5 : 1;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(244,232,200,.96)'; ctx.strokeText(s.short || s.name, rect.x + 4, rect.y + th / 2);
        ctx.fillStyle = INK; ctx.fillText(s.short || s.name, rect.x + 4, rect.y + th / 2);
        break;
      }
    });
    ctx.restore();
  };

  TS.MapView = MapView;
})();
