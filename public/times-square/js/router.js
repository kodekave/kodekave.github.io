/* Offline walking router + turn-by-turn instructions over the baked-in street graph. */
(function () {
  'use strict';
  var TS = window.TS;
  var G = TS.geo.graph;

  var nodes = G.nodes.map(function (n) { return { u: n[0], v: n[1], names: n[2] }; });
  var edges = G.edges.map(function (e, i) {
    var cum = [0];
    for (var k = 1; k < e[4].length; k++) cum.push(cum[k - 1] + Math.hypot(e[4][k][0] - e[4][k - 1][0], e[4][k][1] - e[4][k - 1][1]));
    return { id: i, a: e[0], b: e[1], len: cum[cum.length - 1], name: e[3], poly: e[4], cum: cum };
  });
  var N = nodes.length;

  function pointAtS(e, s) {
    s = Math.max(0, Math.min(e.len, s));
    for (var i = 0; i < e.poly.length - 1; i++) {
      if (s <= e.cum[i + 1] || i === e.poly.length - 2) {
        var seg = e.cum[i + 1] - e.cum[i] || 1;
        var t = (s - e.cum[i]) / seg;
        return [e.poly[i][0] + (e.poly[i + 1][0] - e.poly[i][0]) * t, e.poly[i][1] + (e.poly[i + 1][1] - e.poly[i][1]) * t];
      }
    }
    return e.poly[0];
  }
  function slice(e, s0, s1) {
    var pts = [pointAtS(e, s0)];
    for (var i = 1; i < e.poly.length - 1; i++) if (e.cum[i] > s0 + 1e-6 && e.cum[i] < s1 - 1e-6) pts.push(e.poly[i]);
    pts.push(pointAtS(e, s1));
    return pts;
  }

  function snap(u, v) {
    var best = null;
    edges.forEach(function (e) {
      for (var i = 0; i < e.poly.length - 1; i++) {
        var x1 = e.poly[i][0], y1 = e.poly[i][1], dx = e.poly[i + 1][0] - x1, dy = e.poly[i + 1][1] - y1;
        var L2 = dx * dx + dy * dy;
        var t = L2 === 0 ? 0 : Math.max(0, Math.min(1, ((u - x1) * dx + (v - y1) * dy) / L2));
        var qx = x1 + t * dx, qy = y1 + t * dy;
        var d = Math.hypot(u - qx, v - qy);
        if (!best || d < best.d) best = { e: e, d: d, u: qx, v: qy, s: e.cum[i] + t * Math.sqrt(L2) };
      }
    });
    return best;
  }

  function heading(du, dv) { return Math.atan2(du, dv) * 180 / Math.PI; }     // 0 = uptown, clockwise
  function norm180(a) { while (a > 180) a -= 360; while (a <= -180) a += 360; return a; }
  function polyLen(p) { var L = 0; for (var i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
  function headingAlong(poly, atEnd) {
    // direction of the first (or last) ~8 m of a polyline
    var pts = atEnd ? poly.slice().reverse() : poly;
    var o = pts[0];
    for (var i = 1; i < pts.length; i++) {
      var d = Math.hypot(pts[i][0] - o[0], pts[i][1] - o[1]);
      if (d >= 6 || i === pts.length - 1) {
        if (d < 0.01) continue;
        var h = heading(pts[i][0] - o[0], pts[i][1] - o[1]);
        return atEnd ? norm180(h + 180) : h;
      }
    }
    return 0;
  }
  var DIRS = ['uptown (north)', 'uptown-east (northeast)', 'east', 'downtown-east (southeast)', 'downtown (south)', 'downtown-west (southwest)', 'west', 'uptown-west (northwest)'];
  function dirWord(h) { return DIRS[Math.round(((h % 360) + 360) % 360 / 45) % 8]; }
  function sideOf(poly, pt) {
    // which side of the walking direction a point is on: 'left' | 'right'
    var best = null;
    for (var i = 0; i < poly.length - 1; i++) {
      var x1 = poly[i][0], y1 = poly[i][1], dx = poly[i + 1][0] - x1, dy = poly[i + 1][1] - y1;
      var L2 = dx * dx + dy * dy;
      var t = L2 === 0 ? 0 : Math.max(0, Math.min(1, ((pt[0] - x1) * dx + (pt[1] - y1) * dy) / L2));
      var d = Math.hypot(pt[0] - (x1 + t * dx), pt[1] - (y1 + t * dy));
      if (!best || d < best.d) best = { d: d, dx: dx, dy: dy, rx: pt[0] - x1, ry: pt[1] - y1, i: i, t: t };
    }
    var cross = best.dx * best.ry - best.dy * best.rx;
    return { d: best.d, side: cross > 0 ? 'left' : 'right', i: best.i, t: best.t };
  }
  function others(names, own) {
    var o = (names || []).filter(function (n) { return n !== own; });
    return o;
  }
  function nodeLabel(i, own) { return others(nodes[i].names, own).join(' & ') || nodes[i].names.join(' & '); }

  var MOVING = { characters: 1, 'midnight-moment': 1, bowtie: 1 };
  var LAND = TS.geo.features.filter(function (f) { return f.r >= 2 && !MOVING[f.sid]; });

  var ENDS = [];
  function landmarksNear(poly, exclude, maxD) {
    var out = [];
    LAND.forEach(function (f) {
      if (exclude[f.n.toLowerCase()]) return;
      if (ENDS.some(function (e) { return Math.hypot(e.u - f.u, e.v - f.v) < 20; })) return;   // that is the start or the destination itself
      // cheap bbox reject
      var s = sideOf(poly, [f.u, f.v]);
      if (s.d <= maxD) out.push({ name: f.n, rank: f.r, side: s.side, pos: s.i + s.t, d: s.d, u: f.u, v: f.v });
    });
    return out;
  }

  function route(from, to, opts) {
    opts = opts || {};
    var a = snap(from.u, from.v), b = snap(to.u, to.v);
    var adj = [];
    for (var i = 0; i < N + 2; i++) adj.push([]);
    function add(x, y, len, name, poly) {
      adj[x].push({ to: y, len: len, name: name, poly: poly });
      adj[y].push({ to: x, len: len, name: name, poly: poly.slice().reverse() });
    }
    var byEdge = {};
    [a, b].forEach(function (s, k) { (byEdge[s.e.id] = byEdge[s.e.id] || []).push({ s: s.s, id: N + k }); });
    edges.forEach(function (e) {
      var list = byEdge[e.id];
      if (!list) { add(e.a, e.b, e.len, e.name, e.poly); return; }
      list.sort(function (x, y) { return x.s - y.s; });
      var prev = { id: e.a, s: 0 };
      list.concat([{ id: e.b, s: e.len }]).forEach(function (q) {
        add(prev.id, q.id, q.s - prev.s, e.name, slice(e, prev.s, q.s));
        prev = q;
      });
    });

    // Dijkstra over ~100 nodes
    var dist = new Array(N + 2).fill(Infinity), prevN = new Array(N + 2).fill(-1), prevE = new Array(N + 2).fill(null), done = new Array(N + 2).fill(false);
    var S = N, T = N + 1;
    dist[S] = 0;
    for (;;) {
      var x = -1, bd = Infinity;
      for (var k = 0; k < N + 2; k++) if (!done[k] && dist[k] < bd) { bd = dist[k]; x = k; }
      if (x < 0 || x === T) break;
      done[x] = true;
      adj[x].forEach(function (e) {
        var c = bd + e.len + (e.to < N ? 8 : 0);      // small penalty per intersection to prefer fewer crossings
        if (c < dist[e.to]) { dist[e.to] = c; prevN[e.to] = x; prevE[e.to] = e; }
      });
    }
    if (!isFinite(dist[T])) return null;
    var pieces = [];
    for (var cur = T; cur !== S; cur = prevN[cur]) pieces.push({ e: prevE[cur], from: prevN[cur], to: cur });
    pieces.reverse();

    return describe(from, to, a, b, pieces, opts);
  }

  function describe(from, to, a, b, pieces, opts) {
    var startConn = Math.hypot(from.u - a.u, from.v - a.v);
    var endConn = Math.hypot(to.u - b.u, to.v - b.v);

    // group consecutive pieces on the same street
    var groups = [];
    pieces.forEach(function (p) {
      if (p.e.len < 0.3 && groups.length) { groups[groups.length - 1].endNode = p.to; return; }
      var nm = p.e.name || '';
      var g = groups[groups.length - 1];
      if (g && g.name === nm) {
        g.poly = g.poly.concat(p.e.poly.slice(1));
        g.len += p.e.len;
        g.nodes.push(p.to);
        g.endNode = p.to;
      } else {
        groups.push({ name: nm, poly: p.e.poly.slice(), len: p.e.len, nodes: [p.to], startNode: p.from, endNode: p.to });
      }
    });
    groups = groups.filter(function (g) { return g.len > 0.3; });
    // a very short first hop (a few steps to the corner) is folded into the walk to the street
    var pre = [];
    while (groups.length > 1 && groups[0].len < 12) {
      var g0 = groups.shift();
      pre = pre.concat(pre.length ? g0.poly.slice(1) : g0.poly);
      startConn += g0.len;
    }

    var fullPath = [[from.u, from.v], [a.u, a.v]].concat(pre.slice(1));
    groups.forEach(function (g) { fullPath = fullPath.concat(g.poly.slice(1)); });
    fullPath.push([b.u, b.v], [to.u, to.v]);

    ENDS = [from, to];
    var exclude = {};
    if (from.name) exclude[from.name.toLowerCase()] = 1;
    if (to.name) exclude[to.name.toLowerCase()] = 1;
    var usedRef = {};

    var steps = [];
    var totalLen = startConn + endConn;
    var totalCrossings = 0;

    // opening step
    steps.push({
      kind: 'start', title: 'Start at ' + (from.name || 'your spot'),
      detail: from.near ? 'Near ' + from.near + '.' : '', dist: 0, mins: 0,
      poly: [[from.u, from.v], [a.u, a.v]], icon: '●', rot: 0, refs: []
    });

    var prevHeading = null;
    groups.forEach(function (g, gi) {
      var hStart = headingAlong(g.poly, false), hEnd = headingAlong(g.poly, true);
      var len = g.len + (gi === 0 ? startConn : 0) + (gi === groups.length - 1 ? endConn : 0);
      var poly = g.poly;
      if (gi === 0) poly = [[from.u, from.v], [a.u, a.v]].concat(pre.slice(1)).concat(poly.slice(1));
      if (gi === groups.length - 1) poly = poly.concat([[b.u, b.v], [to.u, to.v]]);

      // intersections passed on the way (real nodes only, excluding the final one for the group)
      var realNodes = g.nodes.filter(function (n) { return n < N; });
      var passed = realNodes.slice(0, gi === groups.length - 1 ? realNodes.length : realNodes.length - 1);
      var crossings = realNodes.length;
      totalCrossings += crossings;
      var passedNames = [];
      passed.forEach(function (n) {
        var lab = others(nodes[n].names, g.name);
        lab.forEach(function (l) { if (passedNames.indexOf(l) < 0) passedNames.push(l); });
      });
      var endLabel = (g.endNode < N) ? nodeLabel(g.endNode, g.name) : '';
      var mins = TS.minutesFor(len, crossings);
      totalLen += g.len;

      var title, icon = '↑', rot = 0;
      var name = g.name || 'the pedestrian way';
      var dw = dirWord(hStart);
      if (prevHeading === null) {
        title = 'Head ' + dw + ' on ' + name;
        icon = '↑'; rot = Math.round(hStart);   // the map is turned so uptown is up, so this arrow matches the map
      } else {
        var delta = norm180(hStart - prevHeading);
        var ad = Math.abs(delta), right = delta > 0;
        if (ad < 22) { title = 'Continue straight onto ' + name; rot = 0; }
        else if (ad < 60) { title = 'Bear ' + (right ? 'right' : 'left') + ' onto ' + name; rot = right ? 45 : -45; }
        else if (ad < 135) { title = 'Turn ' + (right ? 'right' : 'left') + ' onto ' + name; rot = right ? 90 : -90; }
        else { title = 'Turn around and go back onto ' + name; rot = 180; }
        title += ' (' + dw.split(' ')[0] + ')';
      }
      prevHeading = hEnd;

      var detail = 'Walk about ' + TS.fmtDist(len) + ' (' + TS.fmtMins(mins) + ')';
      if (passedNames.length) {
        detail += passedNames.length <= 3 ? ', crossing ' + passedNames.join(', ') : ', crossing ' + passedNames.length + ' streets';
      }
      if (gi < groups.length - 1 && endLabel) detail += ', until you reach ' + endLabel + '.';
      else if (gi === groups.length - 1) detail += '.';
      else detail += '.';

      // reference points
      var refs = [];
      var near = landmarksNear(poly, exclude, 32).filter(function (l) { return l.rank >= 3 || l.rank === 2; });
      near.sort(function (x, y) { return y.rank - x.rank || x.d - y.d; });
      var picked = [];
      near.forEach(function (l) { if (picked.length < 3 && !usedRef[l.name]) { picked.push(l); usedRef[l.name] = 1; } });
      picked.sort(function (x, y) { return x.pos - y.pos; });
      picked.forEach(function (l) { refs.push(l.name + ' (' + l.side + ')'); });

      // landmark at the turn corner
      var corner = null;
      if (gi < groups.length - 1 && g.endNode < N) {
        var nn = nodes[g.endNode];
        var best = null;
        LAND.forEach(function (f) {
          if (exclude[f.n.toLowerCase()] || usedRef[f.n]) return;
          var d = Math.hypot(f.u - nn.u, f.v - nn.v);
          if (d <= 45 && f.r >= 3 && (!best || f.r > best.r || (f.r === best.r && d < best.d))) best = { n: f.n, r: f.r, d: d, u: f.u, v: f.v };
        });
        if (best) { corner = best.n + ' (' + sideOf(poly, [best.u, best.v]).side + ')'; usedRef[best.n] = 1; }
      }

      steps.push({
        kind: 'walk', title: title, detail: detail, dist: len, mins: mins, poly: poly, icon: icon, rot: rot,
        refs: refs, corner: corner, street: name
      });
    });

    // arrival
    var lastGroup = groups[groups.length - 1];
    var arrSide = '';
    if (lastGroup && endConn > 6) {
      var s = sideOf([[b.u, b.v], [b.u + Math.sin(headingAlong(lastGroup.poly, true) * Math.PI / 180), b.v + Math.cos(headingAlong(lastGroup.poly, true) * Math.PI / 180)]], [to.u, to.v]);
      arrSide = s.side;
    }
    steps.push({
      kind: 'end', title: 'You have arrived: ' + (to.name || 'your destination'),
      detail: endConn > 6 ? 'It should be on your ' + arrSide + ', about ' + TS.fmtDist(endConn) + ' from the street.' : 'It is right here beside you.',
      dist: 0, mins: 0, poly: [[b.u, b.v], [to.u, to.v]], icon: '⚑', rot: 0, refs: []
    });

    var minutes = TS.minutesFor(totalLen, totalCrossings);
    return {
      from: from, to: to, steps: steps, path: fullPath, dist: totalLen, mins: minutes, crossings: totalCrossings,
      startConn: startConn, endConn: endConn, tooFar: Math.min(from.d || 0, 0)
    };
  }

  TS.route = route;
  TS.snapDistance = function (u, v) { return snap(u, v).d; };
})();
