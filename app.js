/* Dalga - telepatik parti oyunu (tek cihaz, sırayla) */
(function () {
  'use strict';

  var SAVE_KEY = 'dalga.v1';

  /* ---------- Kadran geometrisi ---------- */
  var CX = 200, CY = 200, R = 174, R_IN = 26;
  var BAND_HALF = 10;           // hedef bölgesinin toplam yarı genişliği (0-100 ölçeğinde)
  var BANDS = [
    { from: -10, to: -6, pts: 2, color: '#e8734a' },
    { from: -6, to: -2, pts: 3, color: '#4d9de0' },
    { from: -2, to: 2, pts: 4, color: '#f2c14e' },
    { from: 2, to: 6, pts: 3, color: '#4d9de0' },
    { from: 6, to: 10, pts: 2, color: '#e8734a' }
  ];

  function pt(v, r) {
    var a = (180 - v * 1.8) * Math.PI / 180;
    return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
  }
  function f(n) { return Math.round(n * 100) / 100; }
  function wedge(v0, v1, r0, r1) {
    if (v1 <= v0) return '';
    var a1 = pt(v0, r1), b1 = pt(v1, r1), a0 = pt(v0, r0), b0 = pt(v1, r0);
    var large = (v1 - v0) > 50 ? 1 : 0;
    return 'M' + f(a0[0]) + ',' + f(a0[1]) +
      'L' + f(a1[0]) + ',' + f(a1[1]) +
      'A' + r1 + ',' + r1 + ' 0 ' + large + ' 1 ' + f(b1[0]) + ',' + f(b1[1]) +
      'L' + f(b0[0]) + ',' + f(b0[1]) +
      'A' + r0 + ',' + r0 + ' 0 ' + large + ' 0 ' + f(a0[0]) + ',' + f(a0[1]) + 'Z';
  }

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var svg = $('#dial'), dialWrap = $('#dialWrap');
  var elFace = $('#face'), elBands = $('#bands'), elTicks = $('#ticks'),
      elShield = $('#shield'), elNeedle = $('#needle');

  elFace.setAttribute('d', wedge(0, 100, R_IN - 8, R + 6));
  elShield.setAttribute('d', wedge(0, 100, R_IN, R));

  (function ticks() {
    var out = '';
    for (var v = 0; v <= 100; v += 5) {
      var big = (v % 25 === 0);
      var p1 = pt(v, R - 2), p2 = pt(v, R - (big ? 18 : 10));
      out += '<line x1="' + f(p1[0]) + '" y1="' + f(p1[1]) + '" x2="' + f(p2[0]) + '" y2="' + f(p2[1]) +
        '" stroke="' + (big ? '#7d8ac0' : '#4c578a') + '" stroke-width="' + (big ? 3 : 2) + '" stroke-linecap="round"/>';
    }
    elTicks.innerHTML = out;
  })();

  var dial = { value: 50, target: 50, showTarget: false, interactive: false, showNeedle: true };

  function drawDial() {
    var out = '';
    if (dial.showTarget) {
      for (var i = 0; i < BANDS.length; i++) {
        var b = BANDS[i];
        var v0 = Math.max(0, Math.min(100, dial.target + b.from));
        var v1 = Math.max(0, Math.min(100, dial.target + b.to));
        var d = wedge(v0, v1, R_IN, R);
        if (d) out += '<path d="' + d + '" fill="' + b.color + '" stroke="#0d1020" stroke-width="1.5"/>';
      }
    }
    elBands.innerHTML = out;
    elShield.style.display = dial.showTarget ? 'none' : '';
    var tip = pt(dial.value, R - 6);
    elNeedle.setAttribute('x2', f(tip[0]));
    elNeedle.setAttribute('y2', f(tip[1]));
    elNeedle.style.display = dial.showNeedle ? '' : 'none';
    $('#nudger').hidden = !dial.interactive;
  }

  function configDial(opts) {
    for (var k in opts) if (Object.prototype.hasOwnProperty.call(opts, k)) dial[k] = opts[k];
    drawDial();
  }

  /* Dokunma / sürükleme */
  var dragging = false;
  function valueFromEvent(e) {
    var p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    var m = svg.getScreenCTM();
    if (!m) return dial.value;
    var lp = p.matrixTransform(m.inverse());
    var ang = Math.atan2(CY - lp.y, lp.x - CX) * 180 / Math.PI; // 180 (sol) -> 0 (sağ)
    var v = (180 - ang) / 1.8;
    return Math.max(0, Math.min(100, v));
  }
  svg.addEventListener('pointerdown', function (e) {
    if (!dial.interactive) return;
    dragging = true;
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    configDial({ value: valueFromEvent(e) });
    e.preventDefault();
  });
  svg.addEventListener('pointermove', function (e) {
    if (!dragging || !dial.interactive) return;
    configDial({ value: valueFromEvent(e) });
    e.preventDefault();
  });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    svg.addEventListener(t, function () { dragging = false; });
  });
  $$('.nudge').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!dial.interactive) return;
      var step = parseFloat(b.dataset.nudge) * 0.5;
      configDial({ value: Math.max(0, Math.min(100, dial.value + step)) });
    });
  });

  /* ---------- Oyun durumu ---------- */
  var S = null;

  function shuffled(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = a.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function newState(cfg) {
    return {
      mode: cfg.mode,
      teams: cfg.teams,
      goal: cfg.goal,              // takım modu: kazanma puanı
      totalRounds: cfg.totalRounds, // kooperatif: tur sayısı
      round: 1,
      active: 0,
      deck: shuffled(CARDS.length),
      deckPos: 0,
      card: null,
      target: 50,
      guess: 50,
      clue: '',
      lastPts: 0,
      lastBonus: null,
      screen: 'pass'
    };
  }

  function nextCard() {
    if (S.deckPos >= S.deck.length) { S.deck = shuffled(CARDS.length); S.deckPos = 0; }
    var idx = S.deck[S.deckPos++];
    return CARDS[idx];
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.teams || !s.teams.length || !s.screen) return null;
      return s;
    } catch (e) { return null; }
  }
  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  /* ---------- Ekranlar ---------- */
  function setScreen(name) {
    if (S) { S.screen = name; save(); }
    document.body.dataset.screen = name;
    var host = document.querySelector('.screen[data-name="' + name + '"] .dial-slot');
    if (host) {
      host.appendChild(dialWrap);
      dialWrap.hidden = false;
    } else {
      dialWrap.hidden = true;
    }
    window.scrollTo(0, 0);
  }

  function teamName(i) { return S.teams[i].name || ('Takım ' + (i + 1)); }

  function startRound() {
    S.card = nextCard();
    S.target = 8 + Math.random() * 84;
    S.guess = 50;
    S.clue = '';
    S.lastPts = 0;
    S.lastBonus = null;
    $('#clueInput').value = '';
    renderPass();
    setScreen('pass');
  }

  function renderEnds() {
    $('#endLeft').textContent = S.card[0];
    $('#endRight').textContent = S.card[1];
  }

  function renderPass() {
    $('#passRound').textContent = S.round;
    $('#passTitle').textContent = teamName(S.active);
    $('#passTitle').style.color = S.active === 0 ? '#f2c14e' : '#4d9de0';
  }

  function goPsychic() {
    renderEnds();
    $('#psychicTeam').textContent = teamName(S.active);
    $('#psyRound').textContent = S.round;
    configDial({ target: S.target, showTarget: true, interactive: false, showNeedle: false });
    setScreen('psychic');
  }

  function goGuess() {
    S.clue = $('#clueInput').value.trim();
    renderEnds();
    $('#guessTeam').textContent = teamName(S.active);
    $('#guessRound').textContent = S.round;
    var banner = $('#clueBanner');
    if (S.clue) { banner.hidden = false; banner.textContent = '“' + S.clue + '”'; }
    else { banner.hidden = true; }
    configDial({ value: 50, showTarget: false, interactive: true, showNeedle: true });
    setScreen('guess');
  }

  function pointsFor(diff) {
    if (diff <= 2) return 4;
    if (diff <= 6) return 3;
    if (diff <= 10) return 2;
    return 0;
  }

  function lockGuess() {
    S.guess = dial.value;
    var diff = Math.abs(S.guess - S.target);
    S.lastPts = pointsFor(diff);
    S.teams[S.active].score += S.lastPts;
    if (S.mode === 'teams' && S.lastPts < 4) {
      $('#bonusTeam').textContent = teamName(1 - S.active);
      setScreen('bonus');
    } else {
      goReveal();
    }
  }

  function bonusPick(side) {
    var actual = S.target > S.guess ? 'right' : 'left';
    var ok = (side === actual);
    S.lastBonus = { team: 1 - S.active, ok: ok };
    if (ok) S.teams[1 - S.active].score += 1;
    goReveal();
  }

  function goReveal() {
    renderEnds();
    configDial({ value: S.guess, target: S.target, showTarget: true, interactive: false, showNeedle: true });
    $('#revealClue').textContent = S.clue ? '“' + S.clue + '”' : (S.card[0] + ' ↔ ' + S.card[1]);
    $('#scorePop').textContent = '+' + S.lastPts;
    $('#scorePop').style.color = S.lastPts === 4 ? '#f2c14e' : (S.lastPts ? '#7fbf6a' : '#e8734a');
    var txt = teamName(S.active) + (S.lastPts ? ' ' + S.lastPts + ' puan aldı!' : ' puan alamadı.');
    if (S.lastBonus) {
      txt += ' ' + teamName(S.lastBonus.team) + (S.lastBonus.ok ? ' yönü doğru bildi: +1 puan.' : ' yönü bilemedi.');
    }
    $('#revealText').textContent = txt;
    renderScoreboard($('#scoreboard'));
    $('#btnNext').textContent = isGameOver() ? 'Sonuçları gör' : 'Sonraki tur';
    setScreen('reveal');
  }

  function renderScoreboard(host) {
    var html = '';
    for (var i = 0; i < S.teams.length; i++) {
      html += '<div class="srow' + (i === S.active ? ' active' : '') + '">' +
        '<span>' + escapeHtml(teamName(i)) + '</span>' +
        '<span class="pts">' + S.teams[i].score + (S.mode === 'teams' ? ' / ' + S.goal : '') + '</span>' +
        '</div>';
    }
    if (S.mode === 'coop') {
      html += '<div class="srow"><span>Tur</span><span class="pts">' + S.round + ' / ' + S.totalRounds + '</span></div>';
    }
    host.innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isGameOver() {
    if (S.mode === 'coop') return S.round >= S.totalRounds;
    var a = S.teams[0].score, b = S.teams[1].score;
    var mx = Math.max(a, b);
    return mx >= S.goal && a !== b;
  }

  function nextRound() {
    if (isGameOver()) { goOver(); return; }
    S.round += 1;
    if (S.mode === 'teams') S.active = 1 - S.active;
    startRound();
  }

  function goOver() {
    if (S.mode === 'coop') {
      var max = S.totalRounds * 4;
      $('#winnerText').textContent = S.teams[0].score + ' / ' + max + ' puan!';
    } else {
      var w = S.teams[0].score > S.teams[1].score ? 0 : 1;
      $('#winnerText').textContent = teamName(w) + ' kazandı!';
    }
    renderScoreboard($('#finalBoard'));
    setScreen('over');
    clearSave();
  }

  /* ---------- Ana menü ---------- */
  var mode = 'teams';
  $$('#modeToggle .mode').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.mode;
      $$('#modeToggle .mode').forEach(function (x) { x.classList.toggle('active', x === b); });
      $('#teamsSetup').hidden = (mode !== 'teams');
      $('#coopSetup').hidden = (mode !== 'coop');
    });
  });

  $('#btnStart').addEventListener('click', function () {
    var cfg;
    if (mode === 'teams') {
      cfg = {
        mode: 'teams',
        teams: [
          { name: ($('#teamA').value.trim() || 'Takım A'), score: 0 },
          { name: ($('#teamB').value.trim() || 'Takım B'), score: 0 }
        ],
        goal: parseInt($('#targetScore').value, 10)
      };
    } else {
      cfg = {
        mode: 'coop',
        teams: [{ name: ($('#teamC').value.trim() || 'Bizimkiler'), score: 0 }],
        totalRounds: parseInt($('#coopRounds').value, 10)
      };
    }
    S = newState(cfg);
    startRound();
  });

  $('#btnPassOk').addEventListener('click', goPsychic);
  $('#btnClueDone').addEventListener('click', goGuess);
  $('#btnLock').addEventListener('click', lockGuess);
  $$('.btn.side').forEach(function (b) {
    b.addEventListener('click', function () { bonusPick(b.dataset.side); });
  });
  $('#btnNext').addEventListener('click', nextRound);
  $('#btnRematch').addEventListener('click', function () {
    var cfg = {
      mode: S.mode,
      teams: S.teams.map(function (t) { return { name: t.name, score: 0 }; }),
      goal: S.goal,
      totalRounds: S.totalRounds
    };
    S = newState(cfg);
    startRound();
  });
  $('#btnHome').addEventListener('click', function () {
    clearSave();
    document.body.dataset.screen = 'home';
    dialWrap.hidden = true;
    $('#btnResume').hidden = true;
  });

  $('#btnRules').addEventListener('click', function () { $('#rulesModal').hidden = false; });
  $('#btnCloseRules').addEventListener('click', function () { $('#rulesModal').hidden = true; });

  /* ---------- Devam et ---------- */
  var saved = load();
  if (saved) {
    $('#btnResume').hidden = false;
    $('#btnResume').addEventListener('click', function () {
      S = saved;
      if (!S.card) { startRound(); return; }
      $('#clueInput').value = S.clue || '';
      renderEnds();
      renderPass();
      switch (S.screen) {
        case 'psychic': goPsychic(); break;
        case 'guess': goGuess(); break;
        case 'bonus':
          $('#bonusTeam').textContent = teamName(1 - S.active);
          setScreen('bonus');
          break;
        case 'reveal': goReveal(); break;
        default: setScreen('pass');
      }
    });
  }

  drawDial();
})();
