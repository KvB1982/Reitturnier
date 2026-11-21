# Startet MPFB im Blender-Modul (ohne Fenster)
import bpy, addon_utils, importlib
def start():
    import bpy
    bpy.ops.preferences.addon_enable(module='bl_ext.user_default.mpfb')
    m = lambda n: importlib.import_module('bl_ext.user_default.mpfb.' + n)
    return m('services.humanservice').HumanService, m('services.targetservice').TargetService, m('entities.objectproperties').HumanObjectProperties, m('services.assetservice').AssetService
