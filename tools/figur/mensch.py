# Baut einen Menschen mit MakeHuman/MPFB (ohne Fenster) und speichert ihn als GLB mit dem Geruest "mixamo".
# Abgeschaut vom Polizeispiel (Police-Quest, tools/figur/mensch.py), hier mit drei Aenderungen:
#   - die Kleidung wird grau gemalt, damit das Spiel sie in jeder Farbe einfaerben kann (Jacke, Hose, Stiefel aus dem Outfit)
#   - jedes Teil bekommt einen festen Namen (haut, augen, brauen, wimpern, oberteil, hose, schuhe), daran erkennt das Spiel es
#   - Haare werden einzeln gespeichert (ohne Knochen), sie sitzen im Spiel fest am Kopf:  "nurhaare": true
#   python3 mensch.py aus.glb '{"gender":0,"age":0.22,"haut":"young_caucasian_female","oberteil":"toigo_fisherman_sweater","hose":"toigo_wool_pants","schuhe":"culturalibre_hero_boots_2"}'
# Die Teile kommen aus den CC0-Paketen von MakeHuman. Sie muessen im Daten-Ordner von MPFB ausgepackt liegen.
import sys, bpy, os, json, glob
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mh
HumanService, TargetService, HOP, AssetService = mh.start()
aus, wahl = sys.argv[1], json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
DATEN = os.path.expanduser('~/.config/blender/5.3/extensions/.user/user_default/mpfb/data')

def finde(ordner, name, endung):
    if not name: return None
    treffer = sorted(glob.glob(os.path.join(DATEN, ordner, name, '*' + endung)))
    if not treffer: raise SystemExit(f'nicht gefunden: {ordner}/{name}')
    return treffer[0]

for o in list(bpy.data.objects): bpy.data.objects.remove(o)
makro = TargetService.get_default_macro_info_dict()
makro['race'] = {'asian': 0.0, 'caucasian': 1.0, 'african': 0.0}
for k, v in wahl.items():
    if k in makro: makro[k] = v
h = HumanService.create_human(macro_detail_dict=makro, scale=0.1)
rig = HumanService.add_builtin_rig(h, "mixamo")
if wahl.get('haut'): HumanService.set_character_skin(finde('skins', wahl['haut'], '.mhmat'), h, skin_type='GAMEENGINE')
h['teil'] = 'haut'
teile = []
def dazu(ordner, name, art, teil):
    if not name: return
    t = HumanService.add_mhclo_asset(finde(ordner, name, '.mhclo'), h, asset_type=art, material_type='GAMEENGINE', subdiv_levels=0)
    t['teil'] = teil; teile.append(t); return t
augen = dazu('eyes', wahl.get('augen', 'low-poly'), 'Eyes', 'augen')
dazu('eyebrows', wahl.get('brauen', 'eyebrow001'), 'Eyebrows', 'brauen')
dazu('eyelashes', wahl.get('wimpern', 'eyelashes01'), 'Eyelashes', 'wimpern')
dazu('hair', wahl.get('haare'), 'Hair', 'haare')
dazu('clothes', wahl.get('oberteil'), 'Clothes', 'oberteil')
dazu('clothes', wahl.get('hose'), 'Clothes', 'hose')
dazu('clothes', wahl.get('schuhe'), 'Clothes', 'schuhe')

if augen and wahl.get('augenfarbe'):
    bild = bpy.data.images.load(os.path.join(DATEN, 'eyes', 'materials', wahl['augenfarbe'] + '_eye.png'))
    for n in augen.material_slots[0].material.node_tree.nodes:
        if n.type == 'TEX_IMAGE': n.image = bild

# Formen fest einrechnen, alles Versteckte (Haut unter der Kleidung) wirklich loeschen
for o in [h] + teile:
    bpy.context.view_layer.objects.active = o
    for x in bpy.data.objects: x.select_set(x == o)
    if o.data.shape_keys: bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    for m in list(o.modifiers):
        if m.type == 'MASK': bpy.ops.object.modifier_apply(modifier=m.name)
        elif m.type != 'ARMATURE': o.modifiers.remove(m)
    spar = wahl.get('sparen', {}).get(o['teil'], 1)
    if spar < 1:
        m = o.modifiers.new('sparen', 'DECIMATE'); m.ratio = spar; bpy.ops.object.modifier_apply(modifier=m.name)
    dick = wahl.get('dick', {}).get(o['teil'], 0)      # Teil ein Stueck aufblasen (Meter), damit das darunter nicht durchscheint
    if dick:
        for v in o.data.vertices: v.co += v.normal * dick
    for g in list(o.vertex_groups):
        if not g.name.startswith('mixamorig'): o.vertex_groups.remove(g)
    print('TEIL', o['teil'], o.name, 'Dreiecke', sum(len(p.vertices) - 2 for p in o.data.polygons))

# Hose in die Stiefel stecken: alles von der Hose wegschneiden, was tiefer liegt als der Stiefelrand ("instiefel": true)
if wahl.get('instiefel'):
    import bmesh
    nach = {t['teil']: t for t in teile}
    if 'hose' in nach and 'schuhe' in nach:
        rand = max((nach['schuhe'].matrix_world @ v.co).z for v in nach['schuhe'].data.vertices) - 0.07
        o = nach['hose']; bm = bmesh.new(); bm.from_mesh(o.data)
        weg = [v for v in bm.verts if (o.matrix_world @ v.co).z < rand]
        bmesh.ops.delete(bm, geom=weg, context='VERTS'); bm.to_mesh(o.data); bm.free()
        print('Hose gekuerzt bei', round(rand, 3), 'weg', len(weg))

def farbbild(mat):
    for n in mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image and any(l.to_socket.name == 'Base Color' for l in n.outputs['Color'].links): return n
for o in [h] + teile:
    teil = o['teil']
    for s in o.material_slots:
        mat = s.material; mat.name = teil + '_' + (wahl.get('name') or 'x'); baum = mat.node_tree
        for n in baum.nodes:
            if n.type != 'BSDF_PRINCIPLED': continue
            # nur das Farbbild bleibt: keine Beulen-, Glanz- oder Schattenbilder (spart Platz)
            for name in ('Normal', 'Roughness', 'Metallic', 'Specular IOR Level'):
                if name in n.inputs:
                    for l in list(n.inputs[name].links): baum.links.remove(l)
            n.inputs['Metallic'].default_value = 0; n.inputs['Roughness'].default_value = 0.8
            if teil not in ('haare', 'brauen', 'wimpern'):      # nur Haare, Brauen und Wimpern haben Loecher im Bild
                for l in list(n.inputs['Alpha'].links): baum.links.remove(l)
                n.inputs['Alpha'].default_value = 1.0
        fb = farbbild(mat)
        if not fb: continue
        b = fb.image; gross = wahl.get('bild', {}).get(teil, 512)
        if b.size[0] > gross: b.scale(gross, max(1, int(b.size[1] * gross / b.size[0])))
        if teil in ('oberteil', 'hose', 'schuhe', 'haare', 'brauen'):
            # grau malen und aufhellen: Das Spiel malt spaeter die Farbe aus dem Outfit darueber
            px = np.array(b.pixels[:], dtype=np.float32).reshape(-1, 4)
            hell = px[:, 0] * 0.3 + px[:, 1] * 0.59 + px[:, 2] * 0.11
            sicht = px[:, 3] > 0.5
            oben = np.percentile(hell[sicht], 92) if sicht.any() else 1
            hell = np.clip(hell / max(oben, 0.02), 0, 1) ** wahl.get('kontrast', {}).get(teil, 0.45 if teil == 'haare' else 0.75)
            px[:, 0] = px[:, 1] = px[:, 2] = hell
            b.pixels[:] = px.ravel(); b.update(); print('grau', teil, b.name, round(float(oben), 3))

rig_ort = {b.name: tuple(round(x, 4) for x in (rig.matrix_world @ b.head_local)) for b in rig.data.bones if b.name in ('mixamorig:Head', 'mixamorig:Hips')}
print('KOPF', json.dumps(rig_ort))
if wahl.get('nurhaare'):
    # nur die Haare speichern, ohne Knochen; der Ort des Kopf-Gelenks steht als "extras" in der Datei
    haare = [t for t in teile if t['teil'] == 'haare'][0]
    for m in list(haare.modifiers): haare.modifiers.remove(m)
    haare.parent = None
    k = rig_ort['mixamorig:Head']; haare['kopf'] = [k[0], k[2], -k[1]]      # in der Datei ist y oben
    haare['kopfhoch'] = round(max((h.matrix_world @ v.co).z for v in h.data.vertices) - k[2], 4)      # vom Kopf-Gelenk bis zum Scheitel: danach richtet sich die Groesse auf anderen Koepfen
    for o in list(bpy.data.objects):
        if o != haare: bpy.data.objects.remove(o)
print('Masse', tuple(round(x, 3) for x in h.dimensions) if not wahl.get('nurhaare') else '')
bpy.ops.export_scene.gltf(filepath=aus, export_format='GLB', export_yup=True, export_extras=True, export_animations=False)
print('gespeichert', aus, os.path.getsize(aus))
