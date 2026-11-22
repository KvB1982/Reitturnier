// ============================================================
//  HOFKINDER  -  die anderen Kinder vom Hof und ihr Tag
//  Emma, Jonas, Hanna, Ben, Lina und Paul kommen morgens, holen
//  ihr Pferd aus der Box und gehen damit reiten: Springen auf dem
//  Trainingsplatz, Turnier, Longieren, Schrittmaschine, Weide,
//  Putzplatz oder ein Ausritt ins Grüne.
//  Wenn es regnet oder gewittert, bringen alle ihr Pferd in die
//  Box und warten im Stall. Abends bringen sie die Pferde weg
//  und fahren nach Hause.
//  Wird von hof.js eingebunden (baue, schritt).
// ============================================================
var HOFKINDER = (function () {
  'use strict';
  var d = STAND.daten, H = null, kinder = [], zeit = 0, regenWar = false;
  var NAMEN = ['Emma', 'Jonas', 'Hanna', 'Ben', 'Lina', 'Paul'], JUNGE = { Jonas: 1, Ben: 1, Paul: 1 };

  // ---------- Zum Einstellen ----------
  var GEHEN = 1.7, FUEHREN = 1.5, RENNEN = 3.1, RENNEN_MIT_PFERD = 2.6;    // Tempo zu Fuß (Meter pro Sekunde)
  var GALOPP = 5.9, TRAB = 3.7;                                           // Tempo im Sattel
  var SPRUNG_DAUER = 0.74;                                                // so lange ist das Pferd in der Luft (Sekunden)
  var KOMMT = 7.05, GEHT = 19.0;                                          // um diese Uhrzeit kommt das erste Kind und geht das erste Kind

  // ---------- Die Reitplätze: ein Oval, auf dem die Hindernisse stehen ----------
  // s ist die Stelle auf dem Oval (ein Winkel), an der ein Hindernis steht
  var PLATZ = {
    training: { m: [-37, 22], a: 11.5, b: 7, ein: 'trainIn', s0: 0, text: 'beim Springtraining',
      hind: [[-2.0, 'steil', 0.7], [-1.1, 'kreuz', 0.6], [1.57, 'oxer', 0.8]] },
    turnier: { m: [37, 22], a: 11.5, b: 7, ein: 'turnIn', s0: Math.PI, text: 'auf dem Turnierplatz',
      hind: [[-2.1, 'steil', 0.9], [-1.0, 'oxer', 0.9], [1.0, 'mauer', 0.9], [2.1, 'kreuz', 0.8]] }
  };
  function ovalPunkt(L, s, o) { o.x = L.m[0] + Math.cos(s) * L.a; o.z = L.m[1] + Math.sin(s) * L.b; return o; }
  // Wo stehen die Hindernisse? x, z = Ort, k = in diese Richtung wird gesprungen, h = Höhe
  var alleHind = null;
  function hindernisse() {
    if (alleHind) return alleHind;
    alleHind = [];
    ['training', 'turnier'].forEach(function (name) {
      var L = PLATZ[name];
      L.liste = L.hind.map(function (e) {
        var o = ovalPunkt(L, e[0], { art: e[1], h: e[2], platz: name });
        o.k = Math.atan2(-Math.sin(e[0]) * L.a, Math.cos(e[0]) * L.b);
        alleHind.push(o);
        return o;
      });
    });
    return alleHind;
  }

  // ---------- Das Wege-Netz: Punkte auf dem Hof und welche miteinander verbunden sind ----------
  var KNOTEN = {
    westTor: [-13.6, 0], g0: [-10, 0], g1: [-6, 0], g2: [-2, 0], gO: [6.5, 0], ostTor: [10.2, 0],
    hofSO: [10.4, 10.6], wegN: [1.5, 13], kreuz: [0, 22],
    trainTor: [-19.5, 22], trainIn: [-24.3, 22], turnTor: [19.5, 22], turnIn: [24.3, 22],
    longeVor: [-10, 22.6], longeTor: [-10, 26.4], longeMitte: [-10, 34],
    maschVor: [12, 22.8], maschTor: [12, 27.4], suedTor: [0, 44.5], draussen: [0, 63],
    putzVor: [-4.2, 16.2], putz: [-11.8, 15.2], weideTor: [-16.6, -1.6], weideIn: [-21.5, -2],
    ostHof: [16, -0.6], rad: [19.6, -10.2]
  };
  var KANTEN = [['westTor', 'g0'], ['g0', 'g1'], ['g1', 'g2'], ['g2', 'gO'], ['gO', 'ostTor'], ['ostTor', 'hofSO'], ['hofSO', 'wegN'], ['wegN', 'kreuz'],
    ['kreuz', 'trainTor'], ['trainTor', 'trainIn'], ['kreuz', 'turnTor'], ['turnTor', 'turnIn'], ['kreuz', 'longeVor'], ['longeVor', 'longeTor'], ['longeTor', 'longeMitte'],
    ['kreuz', 'maschVor'], ['maschVor', 'maschTor'], ['kreuz', 'suedTor'], ['suedTor', 'draussen'], ['wegN', 'putzVor'], ['putzVor', 'putz'],
    ['westTor', 'weideTor'], ['weideTor', 'weideIn'], ['ostTor', 'ostHof'], ['ostHof', 'rad']];
  var nachbarn = null;
  function baueNetz() {
    H.boxen.forEach(function (b) { KNOTEN['box' + b.nr] = [b.xc - 0.9, b.v * 3.3]; KANTEN.push(['box' + b.nr, 'g' + (b.nr % 3)]); });
    nachbarn = {};
    KANTEN.forEach(function (k) { (nachbarn[k[0]] = nachbarn[k[0]] || []).push(k[1]); (nachbarn[k[1]] = nachbarn[k[1]] || []).push(k[0]); });
  }
  function weite(a, b) { return Math.hypot(KNOTEN[a][0] - KNOTEN[b][0], KNOTEN[a][1] - KNOTEN[b][1]); }
  // der kürzeste Weg von Punkt zu Punkt (Liste der Namen, der Start steht vorn)
  function route(von, nach) {
    var lang = {}, her = {}, offen = [von], fertig = {};
    lang[von] = 0;
    while (offen.length) {
      offen.sort(function (a, b) { return lang[a] - lang[b]; });
      var n = offen.shift();
      if (n === nach) break;
      if (fertig[n]) continue;
      fertig[n] = true;
      (nachbarn[n] || []).forEach(function (m) {
        var l = lang[n] + weite(n, m);
        if (lang[m] === undefined || l < lang[m]) { lang[m] = l; her[m] = n; offen.push(m); }
      });
    }
    var weg = [nach];
    while (weg[0] !== von && her[weg[0]]) weg.unshift(her[weg[0]]);
    return weg;
  }

  // Wo man im Stall steht, wenn es regnet (Platz 6 und 7 sind für Lotte und Mia)
  function stallPlatz(nr) { return [-9 + nr * 2, nr % 2 ? 0.95 : -0.95]; }
  // Wo die Kinder zu Fuß Pause machen: [Punkt im Netz, x, z, Blickrichtung, Spruch]
  var PAUSEN = [
    ['hofSO', 11.9, 7.7, 3.4, 'Kurze Pause!'], ['ostHof', 14.2, -1.6, 2.6, 'Ich fülle den Wassertrog auf.'], ['hofSO', 14.9, 10.4, 2.4, 'Ich schaue mir die Reitabzeichen an.'],
    ['wegN', -1.2, 12.2, 0.4, 'Schön hier auf dem Hof, oder?'], ['trainTor', -21.2, 18.6, -1.3, 'Ich schaue beim Springen zu.'], ['weideTor', -17.2, -4.4, -1.3, 'Das Fohlen ist so süß!'],
    ['turnTor', 21.2, 18.6, 1.3, 'Ich drücke beim Turnier die Daumen.'], ['g1', -6, 0.6, 3.14, 'Ich fege gleich die Stallgasse.']
  ];

  // ---------- Bauen ----------
  function baue(ctx) {
    H = ctx; kinder = [];
    baueNetz(); hindernisse();
    var h = d.stunde;
    NAMEN.forEach(function (name, i) {
      var o = KERN.zufallsOutfit(JUNGE[name] ? 'junge' : 'maedchen');
      var f = baueFigur(o, { helm: false });
      var K = { name: name, nr: i, figur: f, x: KNOTEN.rad[0], z: KNOTEN.rad[1], kurs: 0, phase: i, laeuft: 0, knoten: 'rad', zuKnoten: null,
        plan: [], frisch: true, t: 0, lage: 'frei', modus: null, da: false, reitet: false, sprung: null, s: 0, gruss: -3 - i, spruch: 'Hallo!',
        kommt: KOMMT + i * 0.12, geht: GEHT + ((i * 3) % 6) * 0.22, pause: 0 };
      K.schild = BAU.schwebeText(name, 0.3, { schrift: 40 }); K.schild.position.y = 1.95; f.wurzel.add(K.schild);
      K.strick = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x3a2a1c }));
      K.strick.frustumCulled = false; K.strick.visible = false; H.szene.add(K.strick);
      f.wurzel.visible = false;
      H.szene.add(f.wurzel);
      kinder.push(K);
      // mitten am Tag geladen: Die Kinder sind schon da
      if (h > K.kommt + 0.3 && h < K.geht) {
        var p = PAUSEN[i % PAUSEN.length];
        K.da = true; K.knoten = p[0]; K.x = p[1]; K.z = p[2]; K.kurs = p[3]; K.spruch = p[4];
        K.plan = [['warte', 2 + i * 7, 'steh']];
        f.wurzel.visible = true;
      }
    });
  }
  // Welches Pferd gehört zu wem? Das eigene Pferd der Spielerin nimmt niemand.
  function pferdVon(K) {
    var P = H.pferde.filter(function (p) { return STAND.betreuer(p.def.id) === K.name; })[0];
    return P && !STAND.istMeins(P.def.id) ? P : null;
  }
  function belegt(art) {
    return H.pferde.filter(function (P) { return (P.ort === 'kind' ? P.kindArt : P.ort) === art; }).length;
  }
  function aufPlatz(name) { return kinder.filter(function (K) { return K.platz === name && K.da; }).length; }

  // ---------- Sprechblase ----------
  function sag(K, text, sek) {
    var f = K.figur;
    if (K.blase) { f.wurzel.remove(K.blase); K.blase.material.map.dispose(); K.blase.material.dispose(); }
    K.blase = BAU.schwebeText(text, 0.34, { schrift: 36, immerSichtbar: true });
    K.blase.position.y = K.reitet ? 1.6 : 2.45; K.blase.renderOrder = 5; f.wurzel.add(K.blase);
    K.blasZeit = sek || 3.2;
  }

  // ---------- Pläne: eine Liste von Schritten, die ein Kind nacheinander macht ----------
  function mitPferd(K, was) {
    var P = K.pferd, box = 'box' + P.box.nr, n = P.def.name, p = [['geh', box], ['nimm', was]];
    if (was === 'training' || was === 'turnier') {
      var L = PLATZ[was], e = KNOTEN[L.ein];
      K.spruch = was === 'training' ? 'Ich übe mit ' + n + ' Springen.' : n + ' und ich starten beim Turnier!';
      p.push(['geh', L.ein], ['auf'], ['reite', was, was === 'turnier' ? 42 : 55 + Math.random() * 40], ['reiteZu', L.m[0], L.m[1]], ['reiteZu', e[0], e[1]], ['ab']);
    } else if (was === 'longe') {
      K.spruch = 'Ich longiere ' + n + '.';
      p.push(['geh', 'longeMitte'], ['longe', 50 + Math.random() * 30], ['nimmHand']);
    } else if (was === 'maschine') {
      K.spruch = n + ' geht in die Schrittmaschine.';
      p.push(['geh', 'maschTor'], ['stell', 'maschine'], ['geh', 'maschVor'], ['punkt', 14.4, 24.4], ['warte', 45 + Math.random() * 25, 'steh', -0.4], ['hol']);
    } else if (was === 'weide') {
      K.spruch = n + ' darf auf die Weide.';
      p.push(['geh', 'weideIn'], ['stell', 'weide'], ['geh', 'weideTor'], ['punkt', -17.2, -4.4], ['warte', 60 + Math.random() * 40, 'steh', -1.3], ['hol']);
    } else if (was === 'putz') {
      K.spruch = 'Ich putze ' + n + ' am Putzplatz.';
      p.push(['geh', 'putz'], ['putz', 30 + Math.random() * 12]);
    } else {
      K.spruch = 'Wir reiten ins Grüne!';
      p.push(['geh', 'suedTor'], ['auf'], ['reiteZu', KNOTEN.draussen[0], KNOTEN.draussen[1], 'raus'], ['fort', 70 + Math.random() * 60], ['reiteZu', KNOTEN.suedTor[0], KNOTEN.suedTor[1]], ['ab']);
    }
    p.push(['geh', box], ['box'], ['pause']);
    return p;
  }
  function zuFuss(K) {
    var p = PAUSEN[Math.floor(Math.random() * PAUSEN.length)];
    K.spruch = p[4];
    return [['geh', p[0]], ['punkt', p[1], p[2]], ['warte', 18 + Math.random() * 22, 'steh', p[3]], ['geh', p[0]]];
  }
  function pferdFrei(K) {
    var P = K.pferd;
    return P && P.ort === 'box' && !HOFLEBEN.krank(P) && H.inBoxVon(H.S.x, H.S.z) !== P.box;
  }
  function neuerPlan(K) {
    K.pferd = pferdVon(K); K.platz = null;
    if (!pferdFrei(K) || K.pause > 0) { K.pause = 0; return zuFuss(K); }
    var wahl = ['ausritt'];
    if (aufPlatz('training') < 2) wahl.push('training', 'training', 'training');
    if (aufPlatz('turnier') < 1) wahl.push('turnier', 'turnier');
    if (!belegt('longe') && !aufPlatz('longe')) wahl.push('longe', 'longe');
    if (!belegt('maschine') && !aufPlatz('maschine')) wahl.push('maschine');
    if (belegt('weide') < 2) wahl.push('weide');
    if (!aufPlatz('putz')) wahl.push('putz');
    if (d.stunde > 17) wahl = wahl.filter(function (w) { return w !== 'ausritt' && w !== 'weide'; });
    var was = wahl[Math.floor(Math.random() * wahl.length)] || 'putz';
    K.platz = was;
    return mitPferd(K, was);
  }
  // Regen oder Abend: erst das Pferd nach Hause bringen
  function heimPlan(K) {
    var P = K.pferd, p = [], box = P ? 'box' + P.box.nr : null;
    if (K.lage === 'frei' || !P) return p;
    if (K.lage === 'reitet') {
      var L = PLATZ[K.platz];
      if (L) { var e = KNOTEN[L.ein]; p.push(['reiteZu', L.m[0], L.m[1]], ['reiteZu', e[0], e[1]], ['ab']); }
      else p.push(['reiteZu', KNOTEN.suedTor[0], KNOTEN.suedTor[1]], ['ab']);
    } else if (K.lage === 'fort') {
      zurueckVomAusritt(K);
      p.push(['reiteZu', KNOTEN.suedTor[0], KNOTEN.suedTor[1]], ['ab']);
    } else if (K.lage === 'longe') p.push(['nimmHand']);
    else if (K.lage === 'steht') p.push(['hol']);
    p.push(['geh', box], ['box']);
    return p;
  }
  function soll(K) {
    var h = d.stunde;
    if (h >= K.geht || h < K.kommt) return 'abend';
    return WETTER.regnet() ? 'regen' : null;
  }

  // ---------- Aufsteigen, Absteigen ----------
  function steigAuf(K) {
    var P = K.pferd, f = K.figur;
    P.kindArt = 'geritten'; P.tempo = 0;
    P.tier.setzeSattel(true, P.st.ausruestung && P.st.ausruestung.decke); P.tier.setzeZaum(true, true);
    H.szene.remove(f.wurzel); P.tier.koerper.add(f.wurzel);
    f.wurzel.position.set(0, 1.66, 0.02); f.wurzel.rotation.set(0, 0, 0);
    f.spiele(null); f.gehe(0, 0); f.setzeHoehe(0, true); f.setzePose('reiten', true); f.setzeHelm(true);
    K.schild.position.y = 1.1;
    K.reitet = true; K.lage = 'reitet'; K.sprung = null;
  }
  function steigAb(K) {
    var P = K.pferd, f = K.figur;
    if (!K.reitet) return;
    K.reitet = false; K.sprung = null;
    P.hoch = 0; P.nick = 0; P.sprungQ = -1; P.tempo = 0;
    P.tier.koerper.remove(f.wurzel); H.szene.add(f.wurzel);
    f.setzeHoehe(0.8, true); f.setzePose('steh', true); f.setzeHelm(false);
    f.huefte.position.y = 0.8;
    P.tier.setzeSattel(false); P.tier.setzeZaum(true, false);
    K.schild.position.y = 1.95;
    K.x = P.x + Math.cos(P.kurs) * 1.2; K.z = P.z - Math.sin(P.kurs) * 1.2; K.kurs = P.kurs;
    P.kindArt = 'hand'; K.lage = 'hand';
  }
  function zurueckVomAusritt(K) {
    var P = K.pferd;
    P.tier.wurzel.visible = true;
    P.x = KNOTEN.draussen[0]; P.z = KNOTEN.draussen[1]; P.kurs = Math.PI; P.tempo = TRAB;
    K.lage = 'reitet'; K.platz = 'ausritt';
  }

  // ---------- Reiten: auf ein Ziel zu, und über die Hindernisse springen ----------
  function reitBewegung(K, dt, zx, zz, v, L) {
    var P = K.pferd, f = K.figur, J = K.sprung;
    P.tempo += (v - P.tempo) * Math.min(1, dt * 1.3);
    if (!J) {
      var ziel = Math.atan2(zx - P.x, zz - P.z), diff = Math.atan2(Math.sin(ziel - P.kurs), Math.cos(ziel - P.kurs));
      P.kurs += Math.max(-2.4, Math.min(2.4, diff * 4)) * dt;
    }
    var weg = P.tempo * dt;
    P.x += Math.sin(P.kurs) * weg; P.z += Math.cos(P.kurs) * weg;
    P.reitWeg = (P.reitWeg || 0) + weg;
    P.gang = P.tempo < 0.15 ? 'steh' : P.tempo < 2.7 ? 'schritt' : P.tempo < 4.8 ? 'trab' : 'galopp';
    var nah = Math.hypot(H.S.x - P.x, H.S.z - P.z) < 34;
    if (J) {
      // in der Luft: hoch und wieder runter, vorn zuerst hoch, dann vorn zuerst runter
      J.t += dt;
      var q = J.t / SPRUNG_DAUER;
      if (q >= 1) {
        K.sprung = null; P.hoch = 0; P.nick = 0; P.sprungQ = -1;
        f.setzePose('reiten');
        if (nah) KERN.huf(0.25, 1100);
      } else {
        P.hoch = Math.sin(q * Math.PI) * (J.h + 0.5);
        P.nick = Math.cos(q * Math.PI) * -0.3;
        P.sprungQ = q;
      }
    } else if (L && P.tempo > 4.2) {
      // kommt ein Hindernis? Dann rechtzeitig abspringen
      for (var i = 0; i < L.liste.length; i++) {
        var O = L.liste[i], vx = Math.sin(O.k), vz = Math.cos(O.k);
        var vor = (O.x - P.x) * vx + (O.z - P.z) * vz, seit = Math.abs((O.x - P.x) * vz - (O.z - P.z) * vx);
        if (vor > 0 && vor < P.tempo * SPRUNG_DAUER * 0.5 && seit < 1.9) {
          K.sprung = { t: 0, h: O.h };
          P.kurs = O.k;                       // gerade über die Stange
          f.setzePose('rennsitz');
          if (nah) KERN.huf(0.2, 1500);
          break;
        }
      }
    }
    f.huefte.position.y = K.sprung ? 0.05 : Math.abs(Math.sin(P.phase)) * (P.gang === 'trab' ? 0.06 : 0.03);
    K.x = P.x; K.z = P.z; K.kurs = P.kurs;
  }

  // ---------- Zu Fuß ----------
  function tempoZuFuss(K) {
    var eilig = K.modus === 'regen', fuehrt = K.lage === 'hand';
    return eilig ? (fuehrt ? RENNEN_MIT_PFERD : RENNEN) : (fuehrt ? FUEHREN : GEHEN);
  }
  // geht zum Punkt, gibt true zurück, wenn es da ist
  function laufZu(K, x, z, dt) {
    var dx = x - K.x, dz = z - K.z, dist = Math.hypot(dx, dz), v = tempoZuFuss(K);
    if (dist < 0.2) return true;
    var zielKurs = Math.atan2(dx, dz), diff = Math.atan2(Math.sin(zielKurs - K.kurs), Math.cos(zielKurs - K.kurs));
    K.kurs += diff * Math.min(1, dt * 9);
    var s = Math.min(dist, v * dt);
    K.x += dx / dist * s; K.z += dz / dist * s;
    K.phase += v * dt * 4.2; K.laeuft = v > 2.4 ? 1 : 0.8;
    return false;
  }
  function weiter(K) { K.plan.shift(); K.frisch = true; K.t = 0; }
  function nimmPlan(K, plan) { K.plan = plan; K.frisch = true; K.t = 0; }

  // ---------- Ein Schritt aus dem Plan ----------
  function tu(K, dt) {
    var s = K.plan[0], P = K.pferd, f = K.figur, neu = K.frisch;
    K.frisch = false; K.t += dt;
    switch (s[0]) {
      case 'geh':
        if (neu) {
          var ab = K.zuKnoten || K.knoten, r = route(ab, s[1]);
          if (K.zuKnoten && r[1] === K.knoten) r = route(K.knoten, s[1]);       // umdrehen ist kürzer
          K.pfad = r;
        }
        if (!K.pfad.length) { weiter(K); break; }
        K.zuKnoten = K.pfad[0];
        if (laufZu(K, KNOTEN[K.pfad[0]][0], KNOTEN[K.pfad[0]][1], dt)) { K.knoten = K.pfad.shift(); K.zuKnoten = null; if (!K.pfad.length) weiter(K); }
        break;
      case 'punkt':
        if (laufZu(K, s[1], s[2], dt)) weiter(K);
        break;
      case 'nimm':                   // Halfter anlegen und das Pferd aus der Box holen
        if (neu && !pferdFrei(K)) { K.platz = null; nimmPlan(K, zuFuss(K)); break; }
        K.kurs = Math.atan2(P.x - K.x, P.z - K.z); f.setzePose('putzen');
        if (K.t > 1.6) {
          if (!pferdFrei(K)) { K.platz = null; nimmPlan(K, zuFuss(K)); break; }
          P.ort = 'kind'; P.kind = K; P.kindArt = 'hand'; P.tempo = 0; P.frisst = 0;
          P.kindText = s[1] === 'ausritt' ? 'beim Ausritt' : s[1] === 'longe' ? 'beim Longieren' : s[1] === 'maschine' ? 'in der Schrittmaschine' : s[1] === 'weide' ? 'auf der Weide' : s[1] === 'putz' ? 'am Putzplatz' : PLATZ[s[1]].text;
          P.tier.setzeZaum(true, false); P.tier.setzeKopfTief(0); P.blick = 0;
          K.lage = 'hand'; H.zeigeZustand(P);
          weiter(K);
        }
        break;
      case 'box':                    // zurück in die Box, dort wird das Pferd gleich versorgt
        P.hoch = 0; P.nick = 0; P.sprungQ = -1; P.kind = null;
        H.inBox(P); STAND.versorge(P.st); H.zeigeZustand(P, true);
        K.lage = 'frei'; K.platz = null;
        weiter(K);
        break;
      case 'auf': steigAuf(K); weiter(K); break;
      case 'ab': steigAb(K); if (K.platz === 'turnier') sag(K, 'Geschafft! 🏆'); weiter(K); break;
      case 'reite': {
        var L = PLATZ[s[1]];
        if (neu) K.s = L.s0;
        for (var n = 0; n < 40; n++) { ovalPunkt(L, K.s, op); if (Math.hypot(op.x - P.x, op.z - P.z) < 3.4) K.s += 0.03; else break; }
        reitBewegung(K, dt, op.x, op.z, GALOPP, L);
        if (K.t > s[2] && !K.sprung) weiter(K);
        break;
      }
      case 'reiteZu':
        reitBewegung(K, dt, s[1], s[2], K.modus === 'regen' || s[3] ? 5.4 : TRAB, PLATZ[K.platz]);
        if (Math.hypot(s[1] - P.x, s[2] - P.z) < 1.5 && !K.sprung) { if (!s[3]) P.tempo = Math.min(P.tempo, 1.2); weiter(K); }
        break;
      case 'fort':                   // unterwegs im Grünen: Man sieht Kind und Pferd nicht
        if (neu) { P.tier.wurzel.visible = false; K.lage = 'fort'; }
        if (K.t > s[1]) { zurueckVomAusritt(K); weiter(K); }
        break;
      case 'longe': {
        var LO = H.ORT.longe;
        if (neu) { P.kindArt = 'longe'; P.winkel = Math.atan2(P.x - LO.mitte[0], P.z - LO.mitte[1]); P.longeTempo = 1.5; K.lage = 'longe'; f.setzePose('longe'); }
        var teil = K.t / s[1];
        P.longeTempo = teil < 0.2 ? 1.5 : teil < 0.5 ? 3.8 : teil < 0.75 ? 6.5 : teil < 0.92 ? 3.8 : 1.5;
        K.kurs = Math.atan2(P.x - K.x, P.z - K.z) + 0.5; K.laeuft = 0;
        if (K.t > s[1]) weiter(K);
        break;
      }
      case 'nimmHand':
        P.kindArt = 'hand'; P.tempo = Math.min(P.tempo, 1.5); P.tier.setzeZaum(true, false); P.tier.setzeKopfTief(0); P.blick = 0;
        K.lage = 'hand'; f.setzePose('fuehren');
        weiter(K);
        break;
      case 'stell':                  // Pferd in die Schrittmaschine oder auf die Weide lassen
        P.kindArt = s[1]; K.lage = 'steht'; K.steht = s[1];
        if (s[1] === 'maschine') { var andere = H.pferde.filter(function (Q) { return Q !== P && Q.ort === 'maschine'; })[0]; P.winkel = andere ? andere.winkel + Math.PI : Math.PI; }
        else { P.ziel = null; P.warte = 0; P.tier.setzeZaum(false); }
        weiter(K);
        break;
      case 'hol':                    // das Pferd wieder abholen
        K.plan.shift();
        if (K.steht === 'maschine') K.plan.unshift(['geh', 'maschTor'], ['nimmHand']);
        else K.plan.unshift(['geh', 'weideIn'], ['zuPferd'], ['nimmHand']);
        K.frisch = true; K.t = 0;
        break;
      case 'zuPferd':
        if (Math.hypot(P.x - K.x, P.z - K.z) < 2.3 || laufZu(K, P.x, P.z, dt)) weiter(K);
        break;
      case 'putz':
        if (neu) { P.kindArt = 'steh'; P.tempo = 0; K.lage = 'putz'; }
        K.kurs = Math.atan2(P.x - K.x, P.z - K.z); f.setzePose('putzen');
        f.gelenke.rumpf.rotation.y = Math.sin(zeit * 5 + K.nr) * 0.25;
        if (K.t > s[1]) { P.kindArt = 'hand'; K.lage = 'hand'; weiter(K); }
        break;
      case 'warte':
        if (neu && s[3] !== undefined) K.kurs = s[3];
        if (K.gruss <= 0) f.setzePose(s[2] || 'steh');
        if (K.t > s[1]) weiter(K);
        break;
      case 'schutz':                 // im Stall warten, bis der Regen vorbei ist
        if (neu) { K.kurs = K.z < 0 ? 0 : Math.PI; K.spruch = WETTER.gewitter() ? 'Bei Gewitter bleiben wir im Stall!' : 'Hier drin ist es schön trocken.'; }
        if (K.gruss <= 0) f.setzePose('steh');
        if (!WETTER.regnet() && K.t > 2) { K.pause = 0; weiter(K); }
        break;
      case 'pause': K.pause = 1; weiter(K); break;
      case 'heim':                   // mit dem Fahrrad nach Hause
        K.da = false; f.wurzel.visible = false; K.strick.visible = false; K.plan = []; K.modus = 'abend';
        break;
      default: weiter(K);
    }
  }
  var op = { x: 0, z: 0 }, hv = new THREE.Vector3();

  // ---------- Jedes Bild ----------
  function schritt(dt, z) {
    if (!H) return;
    zeit = z;
    var regen = WETTER.regnet();
    if (regen && !regenWar && !WETTER.gewitter() && kinder.some(function (K) { return K.da; })) KERN.meldung('🌧️ Es regnet! Alle laufen in den Stall.', 'knapp');
    regenWar = regen;
    kinder.forEach(function (K) {
      var f = K.figur, P, was = soll(K);
      if (!K.da) {
        // morgens kommen die Kinder mit dem Fahrrad
        if (was === 'abend') return;
        K.da = true; K.modus = null; K.lage = 'frei'; K.knoten = 'rad'; K.zuKnoten = null; K.x = KNOTEN.rad[0] + (K.nr % 3) * 0.6; K.z = KNOTEN.rad[1]; K.kurs = Math.PI;
        f.wurzel.visible = true; f.setzePose('steh', true);
        K.spruch = 'Guten Morgen!'; nimmPlan(K, [['geh', 'ostTor']]);
      }
      // Regen oder Abend: alles stehen lassen, Pferd in die Box
      if (was !== K.modus) {
        K.modus = was;
        if (was) {
          var p = heimPlan(K);
          if (was === 'abend') { p.push(['geh', 'rad'], ['heim']); K.spruch = 'Feierabend! Bis morgen!'; }
          else { var sp = stallPlatz(K.nr); p.push(['geh', 'g' + Math.min(2, Math.floor((sp[0] + 12) / 4))], ['punkt', sp[0], sp[1]], ['schutz']); K.spruch = 'Schnell in den Stall!'; }
          nimmPlan(K, p);
        }
      }
      if (!K.plan.length) nimmPlan(K, neuerPlan(K));
      K.laeuft = 0;
      tu(K, dt);
      if (!K.da) return;
      P = K.pferd;
      // Gruß, wenn die Spielerin vorbeikommt
      K.gruss -= dt;
      if (K.gruss <= -7 && !K.reitet && K.lage !== 'fort' && Math.hypot(H.S.x - K.x, H.S.z - K.z) < 2.6) {
        K.gruss = 3; sag(K, K.spruch);
        if (K.lage === 'frei' && K.laeuft === 0) f.setzePose('winken');
      }
      if (K.blase) { K.blasZeit -= dt; K.blase.visible = K.blasZeit > 0; }
      if (K.reitet) { f.bewege(dt); K.strick.visible = false; return; }
      if (K.laeuft > 0 && K.gruss <= 0) f.setzePose(K.lage === 'hand' ? 'fuehren' : 'steh');
      f.gehe(K.phase, K.laeuft);
      f.bewege(dt);
      f.wurzel.position.set(K.x, 0, K.z);
      f.wurzel.rotation.y = K.kurs;
      // Strick oder Longe zum Pferd
      var leine = P && P.ort === 'kind' && (K.lage === 'hand' || K.lage === 'longe' || K.lage === 'putz');
      K.strick.visible = !!leine;
      if (leine) {
        var pos = K.strick.geometry.attributes.position, kopf = P.tier.knochen.jaw001 || P.tier.knochen.skull;
        kopf.getWorldPosition(hv);
        pos.setXYZ(0, K.x + Math.sin(K.kurs + 0.9) * -0.25, 0.95, K.z + Math.cos(K.kurs + 0.9) * -0.25);
        pos.setXYZ(1, hv.x, hv.y - 0.05, hv.z);
        pos.needsUpdate = true;
      }
    });
  }

  // Nachts (oder wenn die Spielerin schlafen geht): alle Kinder sind weg, alle ihre Pferde in der Box
  function alleHeim() {
    kinder.forEach(function (K) {
      var P = K.pferd;
      if (K.reitet) steigAb(K);
      if (P && P.ort === 'kind') { P.tier.wurzel.visible = true; P.hoch = 0; P.nick = 0; P.sprungQ = -1; P.kind = null; H.inBox(P); STAND.versorge(P.st); H.zeigeZustand(P, true); }
      K.lage = 'frei'; K.platz = null; K.plan = []; K.da = false; K.modus = 'abend'; K.zuKnoten = null;
      K.figur.wurzel.visible = false; K.strick.visible = false;
    });
  }

  // ---------- Lotte und Mia (aus hof.js): bei Regen in den Stall, abends nach Hause ----------
  // gibt true zurück, solange das Mädchen nicht seiner normalen Arbeit nachgeht
  function fuehre(M, dt, nr) {
    var h = d.stunde, f = M.figur;
    var was = h >= 20.3 + nr * 0.25 ? 'abend' : WETTER.regnet() ? 'regen' : null;
    if (was !== M.sonder) {
      var vorher = M.sonder;
      M.sonder = was; M.sonderWeg = null;
      if (!was) {
        // wieder an die Arbeit: vom Stallgang aus
        f.wurzel.visible = true;
        if (vorher === 'abend') { M.x = nr === 0 ? 6 : -8; M.z = nr === 0 ? 0 : 0.6; }
        M.schritt = nr === 0 ? 0 : 1; M.warte = 0; M.gruss = -3;
        return false;
      }
      // Weg ausrechnen: erst in die Stallgasse oder zum Tor, dann zum Ziel
      var weg = [], imStall = M.x > -12.2 && M.x < 8.2 && Math.abs(M.z) < 6.6;
      if (imStall && Math.abs(M.z) > 1.2) weg.push([M.x, 0]);
      if (was === 'regen') {
        var sp = stallPlatz(6 + nr);
        if (!imStall) weg.push(M.x > -2 ? KNOTEN.ostTor : KNOTEN.westTor);
        weg.push([sp[0], 0], sp);
      } else {
        if (imStall || M.x < 8) { if (!imStall && M.x < -12) weg.push(KNOTEN.westTor); weg.push(KNOTEN.gO, KNOTEN.ostTor); }
        weg.push(KNOTEN.ostHof);
        if (nr === 0) weg.push([13.3, -12.4], [13, -13.8]); else weg.push(KNOTEN.rad);     // Lotte wohnt auf dem Hof, Mia fährt mit dem Rad
      }
      M.sonderWeg = weg;
    }
    if (!was) return false;
    var laeuft = 0;
    if (M.sonderWeg && M.sonderWeg.length) {
      var zl = M.sonderWeg[0], dx = zl[0] - M.x, dz = zl[1] - M.z, dist = Math.hypot(dx, dz), v = was === 'regen' ? (M.karre ? 2.4 : RENNEN) : GEHEN;
      if (dist < 0.2) M.sonderWeg.shift();
      else { M.kurs = Math.atan2(dx, dz); M.x += dx / dist * Math.min(dist, v * dt); M.z += dz / dist * Math.min(dist, v * dt); M.phase += v * dt * 4.2; laeuft = v > 2.4 ? 1 : 0.8; }
      if (!M.sonderWeg.length) { if (was === 'abend') f.wurzel.visible = false; else M.kurs = M.z < 0 ? 0 : Math.PI; }
    }
    f.spiele(null);
    f.setzePose(M.karre || M.traegt ? 'tragen' : 'steh');
    if (M.blase) M.blase.visible = false;
    f.gehe(M.phase, laeuft); f.bewege(dt);
    f.wurzel.position.set(M.x, 0, M.z); f.wurzel.rotation.y = M.kurs;
    return true;
  }

  return {
    baue: baue, schritt: schritt, hindernisse: hindernisse, alleHeim: alleHeim, fuehre: fuehre, belegt: belegt,
    // wer longiert gerade? (damit die Spielerin nicht in denselben Zirkel geht)
    werLongiert: function () { var K = kinder.filter(function (k) { return k.da && k.platz === 'longe'; })[0]; return K ? K.name : null; },
    kinder: function () { return kinder; }, knoten: KNOTEN, platz: PLATZ
  };
})();
