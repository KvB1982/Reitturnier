// ============================================================
//  WETTER  -  Tageszeiten und Wetter fuer alle Welten
//  Die Uhr laeuft, solange man auf dem Pferdehof ist: eine Minute in echt
//  ist eine Stunde im Spiel (UHR in config.js), ein Tag von 7 bis 22 Uhr dauert also 15 Minuten. Nachts muss man schlafen gehen (hoftag.js). Das Wetter wechselt
//  alle paar Minuten: Sonne, Wolken, Regen, morgens manchmal Nebel.
// ============================================================
var WETTER = (function () {
  'use strict';
  var d = STAND.daten;
  if (typeof d.stunde !== 'number') d.stunde = 9;
  if (!d.wetter) { d.wetter = 'sonne'; d.wetterRest = 150; }
  var SEK_PRO_STUNDE = typeof UHR !== 'undefined' && UHR.sekProStunde > 0 ? UHR.sekProStunde : 60;
  var BILD = { sonne: '☀️', wolken: '⛅', regen: '🌧️', nebel: '🌫️', gewitter: '⛈️' };
  var NAME = { sonne: 'Sonne', wolken: 'Wolken', regen: 'Regen', nebel: 'Nebel', gewitter: 'Gewitter' };
  // Stimmung im Tageslauf: [Stunde, Himmel, Sonnenfarbe, Sonnenstaerke, Helligkeit]
  var LAUF = [
    [0, 0x16213d, 0x8ea6ff, 0.45, 0.34], [5, 0x16213d, 0x8ea6ff, 0.45, 0.34], [6.5, 0xf3c6a5, 0xffc48a, 1.3, 1.0],
    [8.5, 0x9fd4f5, 0xfff3d6, 2.2, 1.5], [17.5, 0x9fd4f5, 0xfff3d6, 2.2, 1.5], [19.5, 0xf0a070, 0xff9a5a, 1.2, 0.95],
    [21, 0x16213d, 0x8ea6ff, 0.45, 0.34], [24, 0x16213d, 0x8ea6ff, 0.45, 0.34]
  ];
  var c1 = new THREE.Color(), c2 = new THREE.Color(), grau = new THREE.Color();
  var Z = { himmel: new THREE.Color(), farbe: new THREE.Color(), sonne: 1, hell: 1, nah: 1, fern: 1, ri: new THREE.Vector3() };

  function istNacht(h) { return h >= 21 || h < 5; }
  function tageszeit(h) {
    h = h === undefined ? d.stunde : h;
    return h < 5 ? 'Nacht' : h < 9 ? 'Morgen' : h < 12 ? 'Vormittag' : h < 14 ? 'Mittag' : h < 18 ? 'Nachmittag' : h < 21 ? 'Abend' : 'Nacht';
  }
  // Zielwerte fuer Stunde h und das aktuelle Wetter
  function ziel(h, wetter) {
    var i = 1;
    while (i < LAUF.length - 1 && LAUF[i][0] <= h) i++;
    var a = LAUF[i - 1], b = LAUF[i], t = Math.max(0, Math.min(1, (h - a[0]) / (b[0] - a[0])));
    Z.himmel.set(a[1]).lerp(c1.set(b[1]), t);
    Z.farbe.set(a[2]).lerp(c1.set(b[2]), t);
    Z.sonne = a[3] + (b[3] - a[3]) * t; Z.hell = a[4] + (b[4] - a[4]) * t;
    Z.nah = 1; Z.fern = 1;
    var dunkel = Z.hell / 1.5;
    if (wetter === 'wolken') { Z.himmel.lerp(grau.set(0xb9c3ca).multiplyScalar(dunkel), 0.55); Z.sonne *= 0.6; }
    else if (wetter === 'regen') { Z.himmel.lerp(grau.set(0x8d99a3).multiplyScalar(dunkel), 0.8); Z.sonne *= 0.35; Z.hell *= 0.88; Z.nah = 0.5; Z.fern = 0.6; }
    else if (wetter === 'gewitter') { Z.himmel.lerp(grau.set(0x49515c).multiplyScalar(Math.max(0.45, dunkel)), 0.93); Z.sonne *= 0.12; Z.hell *= 0.5; Z.nah = 0.4; Z.fern = 0.5; }
    else if (wetter === 'nebel') { Z.himmel.lerp(grau.set(0xd5dadb).multiplyScalar(dunkel), 0.85); Z.sonne *= 0.5; Z.nah = 0.12; Z.fern = 0.3; }
    // Sonne wandert von Osten nach Westen, nachts steht der Mond
    if (h >= 6 && h <= 20) { var w = (h - 6) / 14 * Math.PI; Z.ri.set(Math.cos(w) * 42, 14 + Math.sin(w) * 44, 25); }
    else Z.ri.set(-22, 50, 25);
    return Z;
  }

  function neuesWetter() {
    var z = Math.random(), h = d.stunde;
    var w = z < 0.42 ? 'sonne' : z < 0.67 ? 'wolken' : z < 0.83 ? 'regen' : z < 0.93 ? 'gewitter' : 'nebel';
    if (w === 'nebel' && !(h >= 5 && h < 10)) w = 'wolken';
    // Gewitter nur tagsüber und höchstens einmal am Tag
    if (w === 'gewitter' && (h < 8.5 || h > 19 || d.gewitterTag === d.tag || d.wetter === 'regen')) w = 'regen';
    if (w === 'gewitter') d.gewitterTag = d.tag;
    if (w === d.wetter) w = w === 'sonne' ? 'wolken' : 'sonne';
    d.wetter = w; d.wetterRest = w === 'gewitter' ? 120 : 165 + Math.random() * 195;
  }

  // Regen: Striche, die rund um die Kamera fallen
  var TROPFEN = 700, HOCH = 15, WEIT = 26;
  function baueRegen(szene) {
    var pos = new Float32Array(TROPFEN * 6), daten = [];
    for (var i = 0; i < TROPFEN; i++) daten.push([(Math.random() - 0.5) * WEIT * 2, Math.random() * HOCH, (Math.random() - 0.5) * WEIT * 2, 13 + Math.random() * 6]);
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var linien = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xd8ecfa, transparent: true, opacity: 0.6, fog: false }));
    linien.frustumCulled = false; linien.visible = false;
    szene.add(linien);
    return { linien: linien, daten: daten, staerke: 0 };
  }
  var vor = new THREE.Vector3();
  function bewegeRegen(R, dt, kamera, an, wind) {
    R.staerke += ((an ? 1 : 0) - R.staerke) * Math.min(1, dt * 0.8);
    R.linien.visible = R.staerke > 0.03;
    if (!R.linien.visible) return;
    kamera.getWorldDirection(vor);
    var mx = kamera.position.x + vor.x * 12, mz = kamera.position.z + vor.z * 12;
    var pos = R.linien.geometry.attributes.position.array, n = Math.round(TROPFEN * R.staerke);
    for (var i = 0; i < n; i++) {
      var t = R.daten[i];
      t[1] -= t[3] * dt;
      if (t[1] < 0) { t[1] += HOCH; t[0] = (Math.random() - 0.5) * WEIT * 2; t[2] = (Math.random() - 0.5) * WEIT * 2; }
      var k = i * 6;
      pos[k] = mx + t[0]; pos[k + 1] = t[1]; pos[k + 2] = mz + t[2];
      t[0] += wind * 9 * dt; if (t[0] > WEIT) t[0] -= WEIT * 2;
      pos[k + 3] = mx + t[0] + 0.06 - wind * 0.45; pos[k + 4] = t[1] + 0.55; pos[k + 5] = mz + t[2] - wind * 0.15;
    }
    R.linien.geometry.setDrawRange(0, n * 2);
    R.linien.geometry.attributes.position.needsUpdate = true;
  }

  // jedes Bild: Uhr weiterdrehen (nur auf dem Hof) und Licht der aktiven Welt anpassen
  function schritt(dt, welt) {
    var szene = welt.szene, L = szene && szene.userData.licht;
    var aufHof = typeof WELTEN !== 'undefined' && welt === WELTEN.hof;
    if (aufHof) {
      // um Mitternacht bleibt die Uhr stehen: dann wird geschlafen (siehe hoftag.js)
      var neu = Math.min(23.99, d.stunde + dt / SEK_PRO_STUNDE);
      d.wach = (d.wach || 0) + (neu - d.stunde);      // die Uhr für Hunger, Schmutz und Wachsen (siehe KALENDER in stand.js)
      d.stunde = neu;
      d.wetterRest -= dt;
      if (d.wetterRest <= 0) neuesWetter();
    }
    if (!L) return;
    // bei Wettbewerben wird es nie ganz dunkel (Flutlicht)
    var h = d.stunde;
    if (!aufHof && !welt.mitNacht && (h > 20 || h < 6)) h = h > 20 ? 20 : 6;
    // Gewitter gibt es nur auf dem Hof und beim Ausritt, bei Wettbewerben regnet es dann einfach
    var wetter = d.wetter === 'gewitter' && !welt.mitSturm ? 'regen' : d.wetter;
    var z = ziel(h, wetter), k = L.wetterBereit ? Math.min(1, dt * 0.6) : 1;
    L.wetterBereit = true;
    szene.background.lerp(z.himmel, k);
    szene.fog.color.copy(szene.background);
    szene.fog.near += (L.basis.nah * z.nah - szene.fog.near) * k;
    szene.fog.far += (L.basis.fern * z.fern - szene.fog.far) * k;
    L.sonne.color.lerp(z.farbe, k);
    L.sonne.intensity += (L.basis.sonne * z.sonne / 2.2 - L.sonne.intensity) * k;
    L.hemi.color.lerp(c2.set(0xffffff).lerp(z.farbe, 0.6), k);
    L.hemi.intensity += (L.basis.hell * z.hell / 1.5 - L.hemi.intensity) * k;
    L.ri.lerp(z.ri, k);
    L.folge(L.mitte.x, L.mitte.y, L.mitte.z);
    if (!L.regen) L.regen = baueRegen(szene);
    var sturm = typeof STURM !== 'undefined' ? STURM.staerke() : 0;
    bewegeRegen(L.regen, dt, welt.kamera, (wetter === 'regen' || (wetter === 'gewitter' && sturm > 0.35)) && !szene.userData.unterDach, sturm);
    if (blitzZeit > 0) {                 // Wetterleuchten: kurz ist alles taghell
      blitzZeit -= dt;
      var bl = Math.max(0, blitzZeit / 0.3) * blitzKraft;
      L.hemi.intensity += 1.9 * bl; szene.background.lerp(c2.set(0xdfe6ff), 0.45 * bl); szene.fog.color.copy(szene.background);
    }
    if (typeof STURM !== 'undefined') STURM.effekte(dt, welt);
  }

  var blitzZeit = 0, blitzKraft = 1;
  return {
    blitz: function (kraft) { blitzZeit = 0.3; blitzKraft = kraft || 1; },
    gewitter: function () { return d.wetter === 'gewitter'; },
    schritt: schritt, tageszeit: tageszeit, istNacht: function () { return istNacht(d.stunde); },
    regnet: function () { return d.wetter === 'regen' || d.wetter === 'gewitter'; },
    text: function () { return (d.wetter === 'sonne' && istNacht(d.stunde) ? '🌙' : BILD[d.wetter]) + ' ' + tageszeit(); },
    uhr: function () { var h = Math.floor(d.stunde), m = Math.floor((d.stunde - h) * 6) * 10; return h + ':' + (m < 10 ? '0' : '') + m; },
    setze: function (stunde, wetter) { if (stunde !== undefined && stunde !== null) d.stunde = stunde; if (wetter) { d.wetter = wetter; d.wetterRest = 150; if (wetter === 'gewitter') d.gewitterTag = d.tag; } },
    NAME: NAME, BILD: BILD
  };
})();
