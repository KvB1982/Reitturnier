// ============================================================
//  GALOPPRENNEN  -  eine Runde auf der Rennbahn gegen fuenf Gegner
//  hoch / runter = treiben oder zuruecknehmen, links / rechts = Spur wechseln,
//  tippen oder Leertaste = anfeuern.  Die Ausdauer muss bis ins Ziel reichen!
// ============================================================
WELTEN.rennen = (function () {
  'use strict';
  var L = 160, R = 42, W = 8;                 // Gerade, Kurvenradius (Bahnmitte), halbe Bahnbreite
  var RUNDE = 2 * L + 2 * Math.PI * R, START = 30;
  var STUFE = { sehrleicht: 0.9, leicht: 0.94, mittel: 0.975, schwer: 1.0 };
  var NAMEN = ['Lotte auf Pfeil', 'Mia auf Komet', 'Emma auf Sturmwind', 'Paula auf Rakete', 'Greta auf Wolke'];
  var FELLE = ['fuchs', 'rappe', 'schimmel', 'dunkel', 'falbe'];
  var gebaut = false, szene, kamera, sonne, opt = {}, feld = [], ich = null;
  var modus = 'aus', uhr = 0, einlauf = [], stopp = null, fertigZeit = 0, zuschauer = null, zeit = 0;

  // Punkt auf der Bahn: u = Strecke entlang der Bahnmitte, ab = Abstand von der Mitte nach aussen
  function bahn(u, ab, ziel) {
    u = ((u % RUNDE) + RUNDE) % RUNDE;
    var r = R + ab, a;
    if (u < L) { ziel.x = -L / 2 + u; ziel.z = r; ziel.kurs = Math.PI / 2; ziel.kurve = false; }
    else if (u < L + Math.PI * R) { a = (u - L) / R; ziel.x = L / 2 + Math.sin(a) * r; ziel.z = Math.cos(a) * r; ziel.kurs = Math.atan2(Math.cos(a), -Math.sin(a)); ziel.kurve = true; }
    else if (u < 2 * L + Math.PI * R) { ziel.x = L / 2 - (u - L - Math.PI * R); ziel.z = -r; ziel.kurs = -Math.PI / 2; ziel.kurve = false; }
    else { a = (u - 2 * L - Math.PI * R) / R; ziel.x = -L / 2 - Math.sin(a) * r; ziel.z = -Math.cos(a) * r; ziel.kurs = Math.atan2(-Math.cos(a), Math.sin(a)); ziel.kurve = true; }
    return ziel;
  }
  function umriss(r, n) {
    var p = [], i;
    for (i = 0; i <= n; i++) { var a = Math.PI * i / n; p.push([L / 2 + Math.sin(a) * r, Math.cos(a) * r]); }
    for (i = 0; i <= n; i++) { var b = Math.PI * i / n; p.push([-L / 2 - Math.sin(b) * r, -Math.cos(b) * r]); }
    p.push(p[0]);
    return p;
  }

  function baue() {
    szene = new THREE.Scene();
    sonne = BAU.licht(szene, { schatten: 45, nebelNah: 120, nebelFern: 420 });
    kamera = REITEN.neueKamera();
    var wiese = BAU.netz(new THREE.PlaneGeometry(700, 500), 0x6dbb52, szene); wiese.rotation.x = -Math.PI / 2; wiese.castShadow = false;
    // Sandbahn: aeusseres Oval mit Loch
    function oval(form, r) { form.moveTo(-L / 2, -r); form.lineTo(L / 2, -r); form.absarc(L / 2, 0, r, -Math.PI / 2, Math.PI / 2, false); form.lineTo(-L / 2, r); form.absarc(-L / 2, 0, r, Math.PI / 2, Math.PI * 1.5, false); }
    var form = new THREE.Shape(), loch = new THREE.Path();
    oval(form, R + W); oval(loch, R - W); form.holes.push(loch);
    var sand = BAU.netz(new THREE.ShapeGeometry(form, 40), 0xcfb27a, szene, 0, 0.03, 0); sand.rotation.x = -Math.PI / 2; sand.castShadow = false;
    szene.add(BAU.zaun(umriss(R - W - 0.3, 26), { hoehe: 1.1, abstand: 4, latten: 1 }));
    szene.add(BAU.zaun(umriss(R + W + 0.3, 30), { hoehe: 1.1, abstand: 4, latten: 1 }));
    // Ziellinie und Zielpfosten
    var linie = BAU.netz(new THREE.PlaneGeometry(0.5, 2 * W), new THREE.MeshBasicMaterial({ color: 0xffffff }), szene, -L / 2 + START, 0.05, R); linie.rotation.x = -Math.PI / 2;
    BAU.walze(0.12, 0.12, 6, 0xe5412d, szene, -L / 2 + START, 3, R - W - 0.8);
    var scheibe = BAU.walze(0.7, 0.7, 0.1, 0xffffff, szene, -L / 2 + START, 6, R - W - 0.8, 20); scheibe.rotation.x = Math.PI / 2;
    var ziel = BAU.tafel('ZIEL', 0.9, { grund: '#e5412d', farbe: '#ffffff' }); ziel.position.set(-L / 2 + START, 7.3, R - W - 0.8); szene.add(ziel);
    // Tribuene mit Zuschauern
    var tx = -L / 2 + START + 6, tz = R + W + 5;
    for (var st = 0; st < 6; st++) BAU.kasten(70, 0.7, 1.6, 0xb9b2a4, szene, tx, 0.35 + st * 0.7, tz + st * 1.6);
    BAU.kasten(70, 0.3, 11, 0xa9432f, szene, tx, 8.4, tz + 4.5);
    for (var pf = 0; pf < 6; pf++) BAU.walze(0.15, 0.15, 8.4, 0x7a7f86, szene, tx - 35 + pf * 14, 4.2, tz + 9.6, 8);
    var n = 330, farben = [0xe84393, 0x1f6fd0, 0xf1c40f, 0x27ae60, 0xe5412d, 0xf5f5f5, 0x8e44ad, 0xff8a3c];
    zuschauer = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.75, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), n);
    zuschauer.userData.pos = [];
    var d = new THREE.Object3D();
    for (var i = 0; i < n; i++) {
      var reihe = i % 6, px = tx - 34 + Math.floor(i / 6) * 1.25 + (reihe % 2) * 0.4;
      zuschauer.userData.pos.push([px, 1.05 + reihe * 0.7, tz + reihe * 1.6, Math.random() * 6]);
      d.position.set(px, 1.05 + reihe * 0.7, tz + reihe * 1.6); d.updateMatrix(); zuschauer.setMatrixAt(i, d.matrix);
      zuschauer.setColorAt(i, new THREE.Color(farben[(i * 7 + reihe) % farben.length]));
    }
    szene.add(zuschauer);
    for (var f = 0; f < 8; f++) { var fl = BAU.flagge([0xe5412d, 0xf1c40f, 0x1f6fd0][f % 3], 5); fl.position.set(tx - 35 + f * 10, 0, tz - 2.2); szene.add(fl); }
    // Entfernungsschilder
    [400, 300, 200, 100].forEach(function (m) {
      var p = bahn(START + RUNDE - m, -W - 1.6, {});
      var t = BAU.tafel(m + ' m', 0.7, { grund: '#ffffff', farbe: '#1f3a93' }); t.position.set(p.x, 1.9, p.z); t.rotation.y = p.kurs + Math.PI; szene.add(t);
      BAU.walze(0.06, 0.06, 1.6, 0xffffff, szene, p.x, 0.8, p.z, 6);
    });
    // Innenfeld: Teich und Baeume, aussen Wald
    var teich = BAU.netz(new THREE.CircleGeometry(14, 28), new THREE.MeshStandardMaterial({ color: 0x4aa3df, roughness: 0.25 }), szene, 10, 0.04, 0); teich.rotation.x = -Math.PI / 2; teich.scale.set(1.8, 1, 1); teich.castShadow = false;
    var baeume = [], zf = 11;
    function zuf() { zf = (zf * 16807) % 2147483647; return zf / 2147483647; }
    for (var b = 0; b < 26; b++) { var bx = -70 + zuf() * 140, bz = -22 + zuf() * 44; if (Math.hypot((bx - 10) / 1.8, bz) > 17) baeume.push([bx, 0, bz, 0.9 + zuf() * 0.8, zuf() < 0.3 ? 1 : 0]); }
    for (var b2 = 0; b2 < 110; b2++) {
      var w = zuf() * Math.PI * 2, rr = 1.12 + zuf() * 0.7, ax = Math.cos(w) * (L / 2 + R + W) * rr, az = Math.sin(w) * (R + W + 16) * rr * 1.25;
      if (az > R + W && Math.abs(ax - tx) < 50) continue;
      baeume.push([ax, 0, az, 1 + zuf() * 1.2, zuf() < 0.4 ? 1 : 0]);
    }
    szene.add(BAU.wald(baeume));
    // Gegner
    for (var g = 0; g < 5; g++) {
      var tier = HERDE.bauePferd({ fell: FELLE[g], saat: 20 + g });
      var o = KERN.zufallsOutfit('maedchen');
      REITEN.reiterAuf(tier, o, 'rennsitz');
      tier.setzeSattel(true, o.jacke);
      szene.add(tier.wurzel);
      feld.push({ tier: tier, ki: true, name: NAMEN[g] });
    }
    ich = { tier: KERN.pferd, ki: false, name: '' };
    feld.push(ich);
    gebaut = true;
  }

  function neuesRennen() {
    var faktor = STUFE[KERN.gegnerStufe()] || 0.95;
    var def = opt.pferd && opt.pferd.def ? opt.pferd.def : { tempo: 4, ausdauer: 4 };
    var laune = opt.pferd ? 0.94 + 0.06 * opt.pferd.laune : 1;
    var spuren = [0, 1, 2, 3, 4, 5].sort(function () { return Math.random() - 0.5; });
    feld.forEach(function (h, i) {
      var tempo = h.ki ? 2.5 + Math.random() * 2.5 : def.tempo, ausdauer = h.ki ? 2.5 + Math.random() * 2.5 : def.ausdauer;
      h.top = (15.2 + tempo * 0.45) * (h.ki ? faktor : laune);
      h.frei = h.top * 0.83;
      h.dauer = 8 + ausdauer * 1.7;                      // Sekunden voller Spurt
      h.kraft = 1; h.v = 0; h.u = START; h.ab = -W + 1.6 + spuren[i] * 2.2; h.phase = Math.random() * 6; h.imZiel = false; h.zielZeit = 0;
      h.spurt = h.dauer * h.top * (0.7 + Math.random() * 0.5);     // so viele Meter vor dem Ziel legt der Gegner los
      h.wunsch = h.frei; h.schub = 0; h.zielAb = h.ab; h.fehlstart = 0.1 + Math.random() * 0.35;
    });
    ich.name = KERN.spieler().name + (opt.pferd ? ' auf ' + opt.pferd.name : '');
    KERN.pferd.setzeOutfit(REITEN.outfitMit(opt.pferd));
    KERN.pferd.setzeAuszeichnung(false);
    KERN.pferd.setzeReiterin(true);
    szene.add(KERN.pferd.wurzel);
    uhr = 0; einlauf = []; fertigZeit = 0;
    kamera.userData.sprung = true;
    modus = 'start';
    feld.forEach(function (h) { stelle(h, 0, 0.016); });
    if (stopp) stopp();
    stopp = REITEN.countdown(function () { modus = 'rennen'; });
    document.body.className = 'im-welt welt-rennen mit-lenken mit-tempo';
    KERN.setzeAktion('📣 Anfeuern');
  }

  var p = {}, k = { x: 0, y: 0, z: 0, kurs: 0, luft: 0 };
  function stelle(h, dt, tick) {
    bahn(h.u, h.ab, p);
    var w = h.tier.wurzel;
    w.position.set(p.x, 0, p.z);
    w.rotation.y = p.kurs;
    var st = Math.min(1, h.v / 9);
    h.tier.koerper.position.y = Math.abs(Math.sin(h.phase * 0.5)) * 0.07 * st;
    if (h.ki) h.tier.bewege(h.v > 0.3 ? 'galopp' : 'steh', h.phase, st, -1, tick);
    else { h.tier.setzeGang('galopp'); h.tier.koerper.rotation.x = 0; h.tier.koerper.rotation.z = 0; h.tier.bewege(h.phase, st, -1, zeit); }
  }

  function schritt(dt, z) {
    zeit = z;
    if (modus === 'aus') return;
    var laeuft = modus === 'rennen' || modus === 'ziel';
    if (laeuft) uhr += dt;
    var ziel = START + RUNDE;
    feld.forEach(function (h) {
      if (!laeuft) { stelle(h, dt, dt); return; }
      var rest = ziel - h.u;
      // Wunschtempo
      if (h.imZiel) h.wunsch = 4;
      else if (h.ki) {
        if (uhr < h.fehlstart) h.wunsch = 0;
        else h.wunsch = rest < h.spurt ? h.top : h.frei * (0.97 + 0.03 * Math.sin(zeit * 0.5 + h.spurt));
      } else {
        var gas = REITEN.gas();
        h.wunsch = Math.max(8, Math.min(h.top, h.wunsch + gas * 5 * dt));
        h.schub = Math.max(0, h.schub - dt);
      }
      var max = h.kraft > 0 ? h.top + (h.schub > 0 ? 1.0 : 0) : h.frei * 0.92;
      var soll = Math.min(h.wunsch + (h.schub > 0 ? 1.0 : 0), max);
      // Ausdauer
      if (!h.imZiel) {
        if (h.v > h.frei) h.kraft = Math.max(0, h.kraft - Math.pow((h.v - h.frei) / (h.top - h.frei), 1.4) * dt / h.dauer);
        else h.kraft = Math.min(1, h.kraft + 0.012 * dt);
      }
      // Vordermann: nicht durch ein anderes Pferd hindurch
      var blockiert = false;
      feld.forEach(function (a) {
        if (a === h) return;
        var du = a.u - h.u;
        if (du > 0 && du < 3.6 && Math.abs(a.ab - h.ab) < 1.5) { soll = Math.min(soll, a.v * 0.98); blockiert = true; }
      });
      h.v += Math.max(-9 * dt, Math.min(6.5 * dt, soll - h.v));
      // Spur
      var seit = 0;
      if (h.ki) {
        if (blockiert && !h.imZiel) h.zielAb = Math.min(W - 1.4, h.ab + 2.2);
        else if (!blockiert && h.zielAb > -W + 1.6) {
          var innenFrei = true;
          feld.forEach(function (a) { if (a !== h && Math.abs(a.u - h.u) < 6 && a.ab < h.ab - 0.4 && a.ab > h.ab - 3.4) innenFrei = false; });
          if (innenFrei) h.zielAb = Math.max(-W + 1.6, h.zielAb - 0.8 * dt);
        }
        seit = Math.max(-1, Math.min(1, (h.zielAb - h.ab) * 2));
      } else seit = -REITEN.lenkung();
      var neuAb = Math.max(-W + 1.3, Math.min(W - 1.3, h.ab + seit * 3.2 * dt * Math.min(1, h.v / 6)));
      var frei = true;
      feld.forEach(function (a) { if (a !== h && Math.abs(a.u - h.u) < 3.4 && Math.abs(a.ab - neuAb) < 1.5 && Math.abs(a.ab - neuAb) < Math.abs(a.ab - h.ab)) frei = false; });
      if (frei) h.ab = neuAb;
      // vorwaerts: in der Kurve ist der Weg aussen laenger
      bahn(h.u, h.ab, p);
      var weg = h.v * dt;
      h.u += weg * (p.kurve ? R / (R + h.ab) : 1);
      var alt = h.phase;
      h.phase += weg * Math.PI * 2 / 5.2;
      if (!h.ki && h.v > 1) KERN.galoppTon(alt, h.phase, Math.min(1, h.v / 9));
      if (!h.imZiel && h.u >= ziel) {
        h.imZiel = true; h.zielZeit = uhr;
        einlauf.push(h);
        if (!h.ki) { modus = 'ziel'; fertigZeit = 0; KERN.klang('ziel'); KERN.applaus(3, 0.2); KERN.meldung(einlauf.length + '. Platz!', einlauf.length === 1 ? 'perfekt' : einlauf.length <= 3 ? 'gut' : 'knapp'); }
      }
      stelle(h, dt, dt);
    });
    // Kamera hinter dem eigenen Pferd
    bahn(ich.u, ich.ab, p);
    k.x = p.x; k.z = p.z; k.kurs = p.kurs;
    REITEN.folge(kamera, k, dt, { hinten: 9.5, hoch: 4.6, vor: 8 });
    sonne.folge(p.x, 0, p.z);
    // Zuschauer huepfen
    if (zuschauer && Math.abs(p.x + L / 2 - START) < 90) {
      var d = dm, pos = zuschauer.userData.pos, wild = modus === 'ziel' || ziel - ich.u < 120 ? 1 : 0.25;
      for (var i = 0; i < pos.length; i++) { d.position.set(pos[i][0], pos[i][1] + Math.max(0, Math.sin(zeit * 9 + pos[i][3])) * 0.22 * wild, pos[i][2]); d.updateMatrix(); zuschauer.setMatrixAt(i, d.matrix); }
      zuschauer.instanceMatrix.needsUpdate = true;
    }
    // Anzeige
    var rang = feld.slice().sort(function (a, b) { return (b.imZiel ? 1e6 - b.zielZeit : b.u) - (a.imZiel ? 1e6 - a.zielZeit : a.u); });
    var platz = rang.indexOf(ich) + 1;
    KERN.setzeHud(REITEN.kachel('Platz', platz + ' / 6', 'gross2') + REITEN.kachel('Noch', Math.max(0, Math.round(ziel - ich.u)) + ' m') +
      REITEN.kachel('Tempo', Math.round(ich.v * 3.6) + ' km/h') + REITEN.kachel('Ausdauer', REITEN.messer(ich.kraft), ich.kraft < 0.2 ? 'warn' : ''));
    if (modus === 'ziel') {
      fertigZeit += dt;
      if (fertigZeit > 3.2) zeigeErgebnis(rang);
    }
  }
  var dm = new THREE.Object3D();

  function zeigeErgebnis(rang) {
    modus = 'fertig';
    var platz = rang.indexOf(ich) + 1;
    STAND.merke('rennen', platz, true);
    var lohn = STAND.belohne(PREISGELD.rennen[platz - 1] || 4, 'Galopprennen');
    if (platz === 1) KERN.klang('fanfare');
    KERN.setzeAktion(null);
    KERN.zeigeKarte('mitte', '<div class="klein">Galopprennen</div><h2>' + (platz === 1 ? '🏆 Gewonnen!' : platz + '. Platz') + '</h2>' +
      '<div class="details">Zeit: <b>' + ich.zielZeit.toFixed(1) + ' s</b>' + (ich.kraft <= 0.01 ? '<br>Tipp: Teil dir die Ausdauer ein und treibe erst auf der Zielgeraden richtig.' : '') + '</div>' +
      REITEN.tabelle(rang.map(function (h) { return { name: h.name, wert: h.imZiel ? h.zielZeit.toFixed(1) + ' s' : '…', ich: !h.ki }; }), 'Zeit') + lohn,
      [{ text: 'Nochmal', aktion: function () { KERN.schliesseKarte(); neuesRennen(); } },
       { text: REITEN.heimText(opt), klasse: 'zweit', aktion: function () { REITEN.heim(opt, { art: 'rennen', platz: platz }); } }]);
  }

  var API = {
    name: '🏁 Galopprennen',
    text: 'Eine Runde auf der Rennbahn gegen fünf Gegner. <b>↑ ↓</b> treiben oder zurücknehmen, <b>← →</b> die Spur wechseln, <b>Leertaste</b> anfeuern. Innen ist der Weg kürzer. Teil dir die Ausdauer gut ein!<br><b>iPad / iPhone:</b> hoch / runter und links / rechts wischen, tippen feuert an.',
    knopf: '🏁 Rennen starten',
    start: function (o) {
      opt = o || {};
      if (!gebaut) baue();
      API.szene = szene; API.kamera = kamera;
      KERN.betrete(API);
      neuesRennen();
    },
    schritt: schritt,
    aktion: function () {
      if (modus !== 'rennen' || ich.schub > 0 || ich.kraft <= 0.05) return;
      ich.schub = 1.3; ich.kraft = Math.max(0, ich.kraft - 0.05);
      ich.wunsch = Math.min(ich.top, ich.wunsch + 1.5);
      KERN.ton(700, 0.08, 'triangle', 0.15);
    },
    tipp: function () { API.aktion(); },
    zurueck: function () { if (stopp) stopp(); modus = 'aus'; REITEN.heim(opt, null); },
    verlaesst: function () { if (stopp) stopp(); modus = 'aus'; },
    zustand: function () { return { modus: modus, ich: ich, feld: feld, uhr: uhr }; }
  };
  return API;
})();
