/* UI: splash, filters, spot pop-up, "what do you see?" prompt, route panel. */
(function () {
  'use strict';
  var TS = window.TS, esc = TS.esc, KINDS = TS.KINDS;
  var $ = function (id) { return document.getElementById(id); };
  var desktop = window.matchMedia('(min-width: 760px)');

  var canvas = $('map'), sheet = $('sheet'), body = $('sheetBody'), hud = document.querySelector('.hud');
  var map = new TS.MapView(canvas);
  TS.mapView = map;

  var st = { filter: 'all', maxMins: 0, sel: null, dest: null, origin: null, route: null, view: '', picking: false, listSort: 'popular' };

  /* ------------------------------------------------------------ toast */
  var toastTimer = 0;
  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, ms || 3600);
  }

  /* ------------------------------------------------------------ sheet */
  function updatePad() {
    var top = desktop.matches ? 120 : 108;
    document.body.classList.toggle('sheet-open', !sheet.hidden);
    $('btnRoute').hidden = !(st.route && sheet.hidden);
    if (sheet.hidden) { map.setPad({ t: top }); hud.style.bottom = ''; return; }
    if (desktop.matches) map.setPad({ t: top, l: 14 + 410 + 14 });
    else {
      sheet.style.transition = 'none';          // measure the final height, not a mid-transition one
      var h = sheet.offsetHeight;
      void sheet.offsetWidth;
      sheet.style.transition = '';
      map.setPad({ t: top, b: h });
      hud.style.bottom = (h + 12) + 'px';
    }
  }
  function openSheet(html, size) {
    var wasHidden = sheet.hidden;
    body.innerHTML = html;
    body.scrollTop = 0;
    sheet.classList.remove('tall', 'mini', 'peek');
    if (size) sheet.classList.add(size);
    if (wasHidden) { sheet.classList.add('enter'); sheet.hidden = false; void sheet.offsetWidth; }
    updatePad();
    sheet.classList.remove('enter');
    var x = document.createElement('button');
    x.className = 'x'; x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.textContent = '×';
    x.onclick = closeSheet;
    body.insertBefore(x, body.firstChild);
  }
  function closeSheet() {
    sheet.hidden = true; st.view = '';
    updatePad();
    if (st.sel && !st.route) { st.sel = null; map.select(null); }
  }
  function sizeSheet(size) {
    sheet.classList.remove('tall', 'mini', 'peek');
    if (size) sheet.classList.add(size);
    updatePad();
  }
  $('grab').addEventListener('click', function () { var peek = sheet.classList.contains('peek'), tall = sheet.classList.contains('tall'); sizeSheet(tall ? (st.view === 'route' || st.view === 'nearby' ? 'peek' : '') : 'tall'); });
  $('grab').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); } });
  (function () {
    var y0 = null, g = $('grab');
    g.addEventListener('pointerdown', function (e) { y0 = e.clientY; g.setPointerCapture(e.pointerId); });
    g.addEventListener('pointerup', function (e) {
      if (y0 == null) return;
      var dy = e.clientY - y0; y0 = null;
      if (Math.abs(dy) < 14) return;
      var tall = sheet.classList.contains('tall'), mini = sheet.classList.contains('mini');
      if (dy < 0) sizeSheet(mini ? '' : 'tall'); else sizeSheet(tall ? '' : 'mini');
      e.preventDefault();
    });
  })();
  desktop.addEventListener ? desktop.addEventListener('change', updatePad) : desktop.addListener(updatePad);
  window.addEventListener('resize', updatePad);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

  /* ------------------------------------------------------------ filters */
  function buildChips() {
    var nav = $('chips');
    var items = [['all', 'All spots', '#3a2616'], ['famous', KINDS.famous.chip, KINDS.famous.color], ['lesser', KINDS.lesser.chip, KINDS.lesser.color], ['local', KINDS.local.chip, KINDS.local.color], ['hidden', KINDS.hidden.chip, KINDS.hidden.color]];
    nav.innerHTML = items.map(function (it) {
      return '<button class="chip" type="button" data-k="' + it[0] + '" aria-pressed="' + (it[0] === st.filter) + '"><i style="--c:' + it[2] + '"></i>' + esc(it[1]) + '</button>';
    }).join('');
    nav.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      st.filter = b.dataset.k;
      [].forEach.call(nav.children, function (c) { c.setAttribute('aria-pressed', c === b); });
      map.setFilter(st.filter, st.maxMins);
      var s = st.sel && TS.spotById[st.sel];
      if (s && !map.visible(s) && !st.route) { closeSheet(); }
      if (st.view === 'list') showList(true);
    });
  }

  /* ------------------------------------------------------------ helpers */
  function nearestCorner(u, v) {
    var best = null;
    TS.geo.graph.nodes.forEach(function (n) {
      if (n[2].length < 2) return;
      var d = Math.hypot(n[0] - u, n[1] - v);
      if (!best || d < best.d) best = { d: d, names: n[2] };
    });
    return best ? best.names.slice(0, 2).join(' & ') : '';
  }
  function kindBadge(k) {
    return '<span class="badge" style="--c:' + KINDS[k].color + '">' + esc(KINDS[k].label) + '</span>';
  }
  function meter(idx) {
    if (!idx) return '';
    var pos = ((idx - 1) / 4) * 100;
    return '<div class="meter" aria-label="Tourist index ' + idx + ' of 5: ' + esc(TS.INDEX_LABELS[idx]) + '">' +
      '<div class="val">' + esc(TS.INDEX_LABELS[idx]) + '</div>' +
      '<div class="track"><span class="pin" style="left:' + pos + '%"></span></div>' +
      '<div class="ends"><span>Hidden gem</span><span>Tourist magnet</span></div></div>';
  }

  /* ------------------------------------------------------------ spot view */
  function showSpot(id, fly) {
    var s = TS.spotById[id]; if (!s) return;
    st.sel = id; st.view = 'spot';
    map.select(id);
    var facts = [];
    if (s.mins) facts.push('⏱ <b>~' + TS.fmtMins(s.mins) + '</b>');
    if (s.cost) facts.push('💵 <b>' + esc(s.cost) + '</b>');
    if (s.best) facts.push('🌗 Best: <b>' + esc(s.best) + '</b>');
    openSheet(
      '<div class="kicker">' + kindBadge(s.kind) + '</div>' +
      '<h2>' + esc(s.name) + '</h2>' +
      meter(s.idx) +
      '<div class="facts">' + facts.map(function (f) { return '<span>' + f + '</span>'; }).join('') + '</div>' +
      '<h3>What it is</h3><p>' + esc(s.what) + '</p>' +
      '<h3>Famous for</h3><p>' + esc(s.famous) + '</p>' +
      '<h3>Local tip</h3><p>' + esc(s.tip) + '</p>' +
      '<p class="fine" style="margin-top:12px">Opening hours and prices change. Check before you go.</p>' +
      '<div class="cta sticky"><button class="btn primary block" id="goBtn" type="button">Take me there →</button></div>'
    );
    $('goBtn').onclick = function () { st.dest = s; showAsk(); };
    if (fly !== false) map.focus(s.u, s.v, Math.max(map.scale, 1.5));
  }

  /* ------------------------------------------------------------ ask view */
  function showAsk() {
    st.view = 'ask';
    var d = st.dest;
    var head = d
      ? '<div class="dest-note">Heading to <b>' + esc(d.name) + '</b></div><h2>Where are you right now?</h2>'
      : '<h2>Where am I?</h2>';
    var last = TS.store.get('lastOrigin');
    var lastO = null; try { lastO = last ? JSON.parse(last) : null; } catch (e) { /* ignore */ }
    var still = st.origin && d
      ? '<button class="btn primary block" id="stillBtn" type="button" style="margin:2px 0 14px">Still at ' + esc(st.origin.name) + '. Show the way →</button>'
      : '';
    openSheet(
      head + still +
      '<p class="sub">What do you see in front of you or around you? Type the name of a shop, hotel, theatre, statue or street sign.</p>' +
      '<div class="search"><input id="q" type="search" inputmode="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. Starbucks, Hard Rock Cafe, W 44th St…" aria-label="What can you see?"></div>' +
      '<ul class="results" id="results" role="listbox"></ul>' +
      '<div class="alts">' +
      '<button class="btn" id="aGps" type="button"><span>📡</span>Use my location</button>' +
      '<button class="btn" id="aTap" type="button"><span>👆</span>Tap on the map</button>' +
      '<button class="btn" id="aCorner" type="button"><span>🚦</span>Pick a street corner</button></div>' +
      '<div class="corner" id="corner" hidden><select id="s1" aria-label="Street"></select><select id="s2" aria-label="Cross street"></select><button class="btn primary" id="cGo" type="button">Use this corner</button></div>' +
      (lastO ? '<h3>Last time</h3><div class="quick"><button class="chip" id="aLast" type="button">↩ ' + esc(lastO.name) + '</button></div>' : '') +
      '<h3>Easy to spot</h3><div class="quick" id="quick"></div>' +
      '<p class="hint">Street signs hang on every corner and show both street names, so a corner is always a safe answer.</p>' +
      '<div class="cta"><button class="btn ghost block" id="backBtn" type="button">' + (d ? '← Back to ' + esc(d.name) : 'Close') + '</button></div>'
    , 'tall');
    var q = $('q'), results = $('results');
    function renderResults() {
      var rs = TS.search(q.value, 8);
      results.innerHTML = rs.map(function (p, i) {
        var meta = esc(p.label) + (p.near && !p.corner ? ' · near ' + esc(p.near) : '');
        return '<li><button type="button" data-i="' + i + '" role="option"><span class="nm">' + esc(p.name) + '</span><span class="meta">' + meta + '</span></button></li>';
      }).join('') || (q.value.trim() ? '<li><p class="hint" style="padding:8px 4px">Nothing by that name. Try a nearby street sign or a bigger landmark.</p></li>' : '');
      results._rs = rs;
    }
    q.addEventListener('input', renderResults);
    results.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var p = results._rs[+b.dataset.i];
      chooseOrigin({ name: p.name, u: p.u, v: p.v, near: p.corner ? '' : p.near });
    });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && results._rs && results._rs[0]) { var p = results._rs[0]; chooseOrigin({ name: p.name, u: p.u, v: p.v, near: p.corner ? '' : p.near }); }
    });
    var quick = $('quick');
    TS.quickPicks.forEach(function (name) {
      var p = TS.search(name, 1)[0]; if (!p) return;
      var b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = p.name.replace(/ \(.*\)$/, '');
      b.onclick = function () { chooseOrigin({ name: p.name.replace(/ \(.*\)$/, ''), u: p.u, v: p.v, near: p.near }); };
      quick.appendChild(b);
    });
    if ($('stillBtn')) $('stillBtn').onclick = function () { chooseOrigin(st.origin); };
    if (lastO && $('aLast')) $('aLast').onclick = function () { chooseOrigin(lastO); };
    $('aGps').onclick = useGps;
    $('aTap').onclick = startPick;
    $('aCorner').onclick = function () {
      var c = $('corner'); c.hidden = !c.hidden;
      if (c.hidden) return;
      var s1 = $('s1'), s2 = $('s2');
      var streets = TS.cornerStreets();
      s1.innerHTML = streets.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
      s1.value = 'W 45th St';
      function fill() {
        var cs = TS.crossStreets(s1.value);
        s2.innerHTML = cs.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
        if (cs.indexOf('7th Ave') >= 0) s2.value = '7th Ave';
      }
      s1.onchange = fill; fill();
    };
    $('cGo').onclick = function () {
      var ns = TS.cornerNodes($('s1').value, $('s2').value);
      if (!ns.length) { toast('Those two streets do not meet inside this map.'); return; }
      chooseOrigin({ name: $('s1').value + ' & ' + $('s2').value, u: ns[0].u, v: ns[0].v, near: '' });
    };
    $('backBtn').onclick = function () { if (st.dest) showSpot(st.dest.id, false); else closeSheet(); };
    if (desktop.matches) setTimeout(function () { q.focus(); }, 60);
  }

  function useGps() {
    if (!navigator.geolocation) { toast('This device cannot share its location. Try the search box instead.'); return; }
    toast('Finding you…', 8000);
    navigator.geolocation.getCurrentPosition(function (pos) {
      var uv = TS.toUV(pos.coords.latitude, pos.coords.longitude);
      if (!TS.inRect(uv[0], uv[1], 80)) { toast('Your location is outside Times Square. Pick something you can see instead.', 5200); return; }
      var c = TS.clampToRect(uv[0], uv[1]);
      chooseOrigin({ name: 'Your location (GPS)', u: c[0], v: c[1], near: nearestCorner(c[0], c[1]) }, true);
    }, function () {
      toast('Could not get your location. Allow location access, or type what you can see.', 5200);
    }, { enableHighAccuracy: true, timeout: 9000, maximumAge: 15000 });
  }

  function startPick() {
    st.picking = true; map.picking = true; canvas.classList.add('picking');
    sizeSheet('mini');
    var kept = document.createElement('div'); kept.className = 'keep';
    kept.innerHTML = '<h2>Tap where you are</h2><p class="sub">Tap the spot on the map that matches what you can see around you.</p><button class="btn ghost" id="pickCancel" type="button">Cancel</button>';
    body.appendChild(kept);
    $('pickCancel').onclick = function () { endPick(); showAsk(); };
  }
  function endPick() { st.picking = false; map.picking = false; canvas.classList.remove('picking'); }

  function chooseOrigin(o, isGps) {
    endPick();
    if (!o.near) o.near = nearestCorner(o.u, o.v);
    st.origin = o;
    if (!isGps) TS.store.set('lastOrigin', JSON.stringify(o));
    map.setOrigin({ u: o.u, v: o.v });
    map.setYou(null);
    if (st.dest) goRoute(); else showNearby();
  }

  /* ------------------------------------------------------------ nearby (origin only) */
  function showNearby() {
    st.view = 'nearby';
    var o = st.origin;
    var rows = TS.spots.filter(function (s) { return s.kind !== 'gateway'; }).map(function (s) {
      var r = TS.route(o, { name: s.name, u: s.u, v: s.v });
      return { s: s, r: r };
    }).filter(function (x) { return x.r; }).sort(function (a, b) { return a.r.dist - b.r.dist; }).slice(0, 8);
    openSheet(
      '<div class="kicker"><span class="badge" style="--c:#2f5d8a">You are here</span></div><h2>' + esc(o.name) + '</h2>' +
      (o.near ? '<p class="sub">Near ' + esc(o.near) + '.</p>' : '') +
      '<h3>Closest spots</h3><ul class="spotlist">' +
      rows.map(function (x) {
        return '<li><button type="button" data-id="' + x.s.id + '"><span class="dot" style="--c:' + KINDS[x.s.kind].color + '">' + (TS.ICONS[x.s.t] || '✨') + '</span><span><span class="nm">' + esc(x.s.name) + '</span><br><span class="meta">' + TS.fmtMins(x.r.mins) + ' walk · ' + TS.fmtDist(x.r.dist) + ' · ' + esc(TS.INDEX_LABELS[x.s.idx] || KINDS[x.s.kind].label) + '</span></span></button></li>';
      }).join('') + '</ul>' +
      '<div class="cta"><button class="btn ghost block" id="chg" type="button">Change my position</button></div>'
    , 'peek');
    body.querySelector('.spotlist').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var s = TS.spotById[b.dataset.id];
      st.dest = s; showSpot(s.id);
    });
    $('chg').onclick = function () { st.dest = null; showAsk(); };
    map.fitBox(o.u - 120, o.v - 120, o.u + 120, o.v + 120, 2.2);
  }

  /* ------------------------------------------------------------ route view */
  function goRoute() {
    var o = st.origin, d = st.dest;
    var r = TS.route(o, { name: d.name, u: d.u, v: d.v });
    if (!r) { toast('Sorry, I could not find a walking route.'); return; }
    if (r.dist < 12) { toast('You are practically there already.'); showSpot(d.id); return; }
    st.route = r;
    map.select(d.id);
    map.setRoute(r);
    showRoute();
    var xs = r.path.map(function (p) { return p[0]; }), ys = r.path.map(function (p) { return p[1]; });
    map.fitBox(Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys), 3);
  }

  function showRoute() {
    st.view = 'route';
    var r = st.route, o = st.origin, d = st.dest;
    var other = TS.units === 'ft' ? 'm' : 'ft';
    openSheet(
      '<div class="summary keep">' +
      '<div class="fromto">To</div><h2 style="margin-top:0">' + esc(d.name) + '</h2>' +
      '<div class="big">' + TS.fmtMins(r.mins) + ' <small>walk · ' + TS.fmtDist(r.dist) + ' (' + TS.fmtDist(r.dist, other) + ')</small></div>' +
      '<div class="fromto">From <b>' + esc(o.name) + '</b>' + (o.near ? ' · near ' + esc(o.near) : '') + '</div>' +
      '</div>' +
      '<div class="row" style="align-items:center;margin-top:8px">' +
      '<span class="units" role="group" aria-label="Units"><button type="button" data-u="m" aria-pressed="' + (TS.units === 'm') + '">metres</button><button type="button" data-u="ft" aria-pressed="' + (TS.units === 'ft') + '">feet</button></span></div>' +
      '<ol class="steps" id="steps">' + r.steps.map(function (s, i) {
        var refs = '';
        if (s.corner) refs += '<em>At the corner: ' + esc(s.corner) + '</em>';
        if (s.refs && s.refs.length) refs += '<em>Look for</em>' + s.refs.map(function (x) { return '<em>' + esc(x) + '</em>'; }).join('');
        return '<li data-i="' + i + '" class="' + s.kind + '"><div class="ic"><span style="--r:' + s.rot + 'deg">' + s.icon + '</span></div><div><div class="t">' + esc(s.title) + '</div>' +
          (s.detail ? '<div class="d">' + esc(s.detail) + '</div>' : '') + (refs ? '<div class="n">' + refs + '</div>' : '') + '</div></li>';
      }).join('') + '</ol>' +
      '<p class="fine">Times assume a busy-sidewalk pace plus waiting at crossings. Left and right are as you walk. Streets run east and west, avenues run uptown and downtown.</p>' +
      '<div class="cta"><div class="row"><button class="btn" id="chgStart" type="button">Change start</button><button class="btn" id="otherSpot" type="button">Pick another spot</button></div>' +
      '<button class="btn primary block" id="done" type="button">Mischief managed</button></div>'
    , 'peek');
    body.querySelector('.units').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      TS.setUnits(b.dataset.u); var y = body.scrollTop; showRoute(); body.scrollTop = y;
    });
    $('steps').addEventListener('click', function (e) {
      var li = e.target.closest('li'); if (!li) return;
      var i = +li.dataset.i, s = r.steps[i];
      [].forEach.call($('steps').children, function (c) { c.classList.toggle('on', c === li); });
      map.highlightStep(i);
      var xs = s.poly.map(function (p) { return p[0]; }), ys = s.poly.map(function (p) { return p[1]; });
      map.fitBox(Math.min.apply(null, xs) - 25, Math.min.apply(null, ys) - 25, Math.max.apply(null, xs) + 25, Math.max.apply(null, ys) + 25, 3.4);
    });
    $('chgStart').onclick = function () { showAsk(); };
    $('otherSpot').onclick = function () { clearRoute(true); closeSheet(); };
    $('done').onclick = function () { clearRoute(false); closeSheet(); toast('Mischief managed.', 2600); };
  }

  function clearRoute(keepOrigin) {
    st.route = null; st.dest = null;
    map.setRoute(null); map.select(null); st.sel = null;
    if (!keepOrigin) { st.origin = null; map.setOrigin(null); }
    map.fit();
  }

  /* ------------------------------------------------------------ list + help */
  function showList(keepScroll) {
    st.view = 'list';
    var y = body.scrollTop;
    var items = TS.spots.filter(function (s) { return st.filter === 'all' || s.kind === st.filter || s.kind === 'gateway'; });
    var sorts = {
      popular: function (a, b) { return b.idx - a.idx || a.name.localeCompare(b.name); },
      hidden: function (a, b) { return (a.idx || 9) - (b.idx || 9) || a.name.localeCompare(b.name); },
      quick: function (a, b) { return (a.mins || 99) - (b.mins || 99) || a.name.localeCompare(b.name); }
    };
    items = items.slice().sort(sorts[st.listSort]);
    openSheet(
      '<h2>All the spots</h2><p class="sub">Pick by how long you have. Tap one to see it on the map.</p>' +
      '<div class="tools"><label class="sub">I have <select id="tmax" aria-label="Time available"><option value="0">any amount of time</option><option value="20">20 minutes</option><option value="45">45 minutes</option><option value="90">90 minutes</option></select></label>' +
      '<label class="sub">Sort <select id="sortBy" aria-label="Sort order"><option value="popular">most famous first</option><option value="hidden">hidden gems first</option><option value="quick">quickest first</option></select></label></div>' +
      '<ul class="spotlist" id="spotlist">' + items.map(function (s) {
        var dim = st.maxMins && s.kind !== 'gateway' && s.mins > st.maxMins;
        return '<li style="' + (dim ? 'opacity:.4' : '') + '"><button type="button" data-id="' + s.id + '"><span class="dot" style="--c:' + KINDS[s.kind].color + '">' + (TS.ICONS[s.t] || '✨') + '</span><span><span class="nm">' + esc(s.name) + '</span><br><span class="meta">' + esc(KINDS[s.kind].label) + (s.mins ? ' · ~' + TS.fmtMins(s.mins) : '') + (s.cost ? ' · ' + esc(s.cost) : '') + '</span></span></button></li>';
      }).join('') + '</ul>', 'tall');
    $('tmax').value = String(st.maxMins); $('sortBy').value = st.listSort;
    $('tmax').onchange = function () { st.maxMins = +this.value; map.setFilter(st.filter, st.maxMins); showList(true); };
    $('sortBy').onchange = function () { st.listSort = this.value; showList(true); };
    $('spotlist').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showSpot(b.dataset.id); });
    if (keepScroll) body.scrollTop = y;
  }

  function showHelp() {
    st.view = 'help';
    var legend = ['famous', 'lesser', 'local', 'hidden', 'gateway'].map(function (k) {
      var txt = { famous: 'Famous: the places everyone has heard of.', lesser: 'Less famous: good, but fewer people queue for them.', local: 'Non-tourist, still worth it: where people who work here go.', hidden: 'Hidden gems: easy to walk past, worth a detour.', gateway: 'Getting here: subway and bus.' }[k];
      return '<div><span class="dot" style="--c:' + KINDS[k].color + '"></span><span>' + esc(txt) + '</span></div>';
    }).join('');
    openSheet(
      '<h2>How this map works</h2>' +
      '<p>This map covers Times Square only, from W 41st to W 49th Street and from 8th Avenue to 6th Avenue. It works offline once it has loaded once.</p>' +
      '<h3>The pins</h3><div class="legend">' + legend + '</div>' +
      '<p>Each pop-up has a <b>tourist index</b>, from "Hidden gem" to "Tourist magnet", plus how long a visit takes, to help you choose.</p>' +
      '<h3>Getting directions</h3><p>Open a spot and press <b>Take me there</b>. Tell the map what you can see around you (a shop, hotel or street sign) and it draws the route, with turns, distances, minutes and landmarks to look for.</p>' +
      '<h3>Finding your way</h3><ul class="tipslist"><li>The map is turned so that <b>uptown is up</b>. Avenues run up and down the map. Streets run across it.</li><li>Street numbers go up as you walk uptown. Broadway is the diagonal.</li><li>Left and right in the directions are as you walk.</li></ul>' +
      '<h3>Stay savvy</h3><ul class="tipslist"><li>Costumed characters expect a tip for photos.</li><li>Politely ignore people selling "free" CDs, tours or tickets.</li><li>Use official ticket booths, and keep bags zipped in the crowds.</li></ul>' +
      '<p class="fine">Opening hours, prices and what is on all change, so check before you go. Street data © OpenStreetMap contributors (ODbL). Walking times are estimates.</p>' +
      '<div class="cta"><button class="btn primary block" id="ok" type="button">Got it</button></div>', 'tall');
    $('ok').onclick = closeSheet;
  }

  /* ------------------------------------------------------------ map taps */
  map.onTap = function (x, y) {
    if (st.picking) {
      var w = map.world(x, y);
      if (!TS.inRect(w[0], w[1])) { toast('That is outside the Times Square map. Tap inside the page.'); return; }
      chooseOrigin({ name: 'Your tapped spot', u: w[0], v: w[1], near: nearestCorner(w[0], w[1]) });
      return;
    }
    var h = map.hit(x, y);
    if (h) { if (st.route && st.dest && h.id !== st.dest.id) { /* keep route, just preview */ } showSpot(h.id); return; }
    if (st.view === 'spot') closeSheet();
  };

  /* ------------------------------------------------------------ buttons */
  $('btnHere').onclick = function () { st.dest = st.route ? st.dest : null; showAsk(); };
  $('btnList').onclick = function () { showList(); };
  $('btnHelp').onclick = showHelp;
  $('btnRoute').onclick = function () { if (st.route) showRoute(); };
  $('zIn').onclick = function () { map.zoomBy(1.6); };
  $('zOut').onclick = function () { map.zoomBy(1 / 1.6); };
  $('zFit').onclick = function () { map.fit(); };

  /* ------------------------------------------------------------ north arrow */
  $('northArrow').setAttribute('transform', 'rotate(' + (-(TS.geo.theta * 180 / Math.PI)).toFixed(1) + ' 40 40)');

  /* ------------------------------------------------------------ splash */
  var OATH = 'I solemnly swear that I am up to no good.';
  var oath = $('oath');
  OATH.split(' ').forEach(function (w, i) {
    var s = document.createElement('span');
    s.className = 'w'; s.textContent = w; s.style.animationDelay = (0.35 + i * 0.27) + 's';
    oath.appendChild(s);
  });
  var opened = false;
  function openMap() {
    if (opened) return; opened = true;
    $('splash').classList.add('gone');
    map.startIntro();
    setTimeout(function () { $('splash').hidden = true; }, 1300);
  }
  $('splash').addEventListener('click', openMap);
  setTimeout(openMap, 4300);

  buildChips();
  map.setPad({ t: desktop.matches ? 120 : 108 });
  map.fit(true);

  /* ------------------------------------------------------------ offline */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ }); });
  }
})();
