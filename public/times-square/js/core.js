/* Core helpers: projection, formatting, and the "what can you see?" search index. */
(function () {
  'use strict';
  var geo = window.TS_GEO;
  var TS = window.TS = { geo: geo };

  var LAT0 = geo.origin[0], LON0 = geo.origin[1];
  var KLAT = 110574, KLON = 111320 * Math.cos(LAT0 * Math.PI / 180);
  var CT = Math.cos(geo.theta), ST = Math.sin(geo.theta);

  TS.toUV = function (lat, lon) {
    var e = (lon - LON0) * KLON, n = (lat - LAT0) * KLAT;
    return [e * CT - n * ST, e * ST + n * CT];
  };
  TS.rect = geo.rect;
  TS.inRect = function (u, v, m) {
    m = m || 0;
    var r = geo.rect;
    return u >= r.u0 - m && u <= r.u1 + m && v >= r.v0 - m && v <= r.v1 + m;
  };
  TS.clampToRect = function (u, v) {
    var r = geo.rect;
    return [Math.min(r.u1, Math.max(r.u0, u)), Math.min(r.v1, Math.max(r.v0, v))];
  };

  TS.store = {
    get: function (k) { try { return window.localStorage.getItem('tsmap.' + k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem('tsmap.' + k, v); } catch (e) { /* private mode */ } }
  };

  TS.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  TS.KINDS = {
    famous: { label: 'Tourist favourite', chip: 'Tourist favourites', color: '#9c2f27' },
    lesser: { label: 'Less famous', chip: 'Less famous', color: '#b07a14' },
    local: { label: 'Non-tourist, still worth it', chip: 'Non-tourist, worth it', color: '#3f6b49' },
    hidden: { label: 'Hidden gem', chip: 'Hidden gems', color: '#5b3f8f' },
    gateway: { label: 'Getting here', chip: 'Getting here', color: '#5a5148' }
  };
  TS.ICONS = { see: '✨', show: '🎭', eat: '🍴', drink: '🍸', shop: '🛍️', history: '🏛️', view: '🌆', worship: '⛪', gateway: '🚇' };
  TS.INDEX_LABELS = { 5: 'Tourist magnet', 4: 'Very popular', 3: 'Visitors and locals', 2: 'Mostly locals', 1: 'Hidden gem', 0: '' };

  TS.spots = geo.spots;
  TS.spotById = {};
  geo.spots.forEach(function (s) { TS.spotById[s.id] = s; });

  /* ---- distances and time ---- */
  var WALK_M_PER_MIN = 75;      // busy sidewalks
  var CROSSING_SEC = 12;        // waiting for a light
  TS.minutesFor = function (meters, crossings) {
    return meters / WALK_M_PER_MIN + (crossings || 0) * CROSSING_SEC / 60;
  };
  TS.units = TS.store.get('units') || ((navigator.language || '').toLowerCase() === 'en-us' ? 'ft' : 'm');
  TS.setUnits = function (u) { TS.units = u; TS.store.set('units', u); };
  TS.fmtDist = function (m, unit) {
    unit = unit || TS.units;
    if (unit === 'ft') {
      var ft = m * 3.28084;
      if (ft >= 1000) return (ft / 5280).toFixed(2) + ' mi';
      return Math.max(10, Math.round(ft / 10) * 10) + ' ft';
    }
    if (m >= 1000) return (m / 1000).toFixed(2) + ' km';
    return Math.max(5, Math.round(m / 5) * 5) + ' m';
  };
  TS.fmtMins = function (min) {
    var m = Math.max(1, Math.round(min));
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + ' h ' + (m % 60) + ' min';
  };

  /* ---- search ---- */
  var SYN = [
    [/\bavenue of the americas\b/g, '6th ave'], [/\bsixth\b/g, '6th'], [/\bseventh\b/g, '7th'], [/\beighth\b/g, '8th'],
    [/\bwest\b/g, 'w'], [/\bstreet\b/g, 'st'], [/\bavenue\b/g, 'ave'], [/\btheater\b/g, 'theatre']
  ];
  TS.norm = function (s) {
    s = String(s || '').toLowerCase();
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { /* old browsers */ }
    s = s.replace(/&/g, ' and ').replace(/['’`]/g, '').replace(/[^a-z0-9½]+/g, ' ').trim();
    SYN.forEach(function (r) { s = s.replace(r[0], r[1]); });
    return s.replace(/\s+/g, ' ');
  };

  var places = [];
  var seenCorner = {};
  geo.features.forEach(function (f) {
    var sp = f.sid ? TS.spotById[f.sid] : null;
    var alias = sp && sp.alias ? sp.alias.map(TS.norm) : [];
    places.push({
      name: f.n, label: f.k, u: f.u, v: f.v, rank: f.r, near: f.x, nearD: f.xd, sid: f.sid || null,
      norm: TS.norm(f.n), alias: alias, kindKey: TS.norm(f.k)
    });
  });
  geo.graph.nodes.forEach(function (n) {
    var names = n[2];
    for (var i = 0; i < names.length; i++) {
      for (var j = i + 1; j < names.length; j++) {
        var key = names[i] + '|' + names[j];
        if (seenCorner[key]) continue;
        seenCorner[key] = 1;
        var nm = names[i] + ' & ' + names[j];
        places.push({ name: nm, label: 'Street corner', u: n[0], v: n[1], rank: 0, near: '', nearD: 0, sid: null, corner: true, norm: TS.norm(nm), alias: [], kindKey: 'street corner' });
      }
    }
  });
  TS.places = places;

  TS.search = function (q, limit) {
    var nq = TS.norm(q);
    if (!nq) return [];
    var toks = nq.split(' ');
    var out = [];
    places.forEach(function (p) {
      var hay = p.norm + ' ' + p.alias.join(' ') + ' ' + p.kindKey;
      var words = hay.split(' ');
      var ok = toks.every(function (t) {
        return words.some(function (w) { return w.indexOf(t) === 0; }) || (t.length > 2 && hay.indexOf(t) >= 0);
      });
      if (!ok) return;
      var score = 20;
      if (p.norm === nq) score = 100;
      else if (p.norm.indexOf(nq) === 0) score = 85;
      else if (p.alias.indexOf(nq) >= 0) score = 90;
      else if (p.norm.indexOf(' ' + nq) >= 0) score = 70;
      else if (p.norm.indexOf(nq) >= 0) score = 55;
      else if (toks.every(function (t) { return p.norm.indexOf(t) >= 0; })) score = 45;
      score += p.rank * 3;
      if (p.corner) score -= 4;
      out.push({ p: p, s: score });
    });
    out.sort(function (a, b) { return b.s - a.s || a.p.name.localeCompare(b.p.name); });
    return out.slice(0, limit || 8).map(function (o) { return o.p; });
  };

  TS.quickPicks = ['Times Sq-42 St subway hub', 'One Times Square (the New Year\'s Eve ball)', 'TKTS Red Steps (Duffy Square)', 'Hard Rock Cafe', 'M&M\'s World', 'Madame Tussauds New York', 'Port Authority Bus Terminal', 'Marriott Marquis atrium and The View'];

  TS.cornerStreets = function () {
    var set = {};
    geo.graph.nodes.forEach(function (n) { if (n[2].length >= 2) n[2].forEach(function (s) { set[s] = 1; }); });
    var rank = function (n) {
      var m = /^W (\d+)/.exec(n); if (m) return [1, +m[1]];
      m = /^(\d+)/.exec(n); if (m) return [0, +m[1]];
      return [0, 7.5];
    };
    return Object.keys(set).sort(function (a, b) { var x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1]; });
  };
  TS.cornerNodes = function (a, b) {
    return geo.graph.nodes.filter(function (n) { return n[2].indexOf(a) >= 0 && n[2].indexOf(b) >= 0; }).map(function (n) { return { u: n[0], v: n[1], names: n[2] }; });
  };
  TS.crossStreets = function (a) {
    var set = {};
    geo.graph.nodes.forEach(function (n) { if (n[2].indexOf(a) >= 0) n[2].forEach(function (s) { if (s !== a) set[s] = 1; }); });
    return TS.cornerStreets().filter(function (s) { return set[s]; });
  };
})();
