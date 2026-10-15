# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[
        ('C:\\Windows\\System32\\msvcp140.dll', '.'),
        ('D:\\software\\Anconda\\msvcp140.dll', '.'),
        ('D:\\software\\Anconda\\Library\\bin\\msvcp140.dll', '.'),
    ],
    datas=[
        ('templates', 'templates'),
        ('static', 'static'),
        ('utils','utils'),
        ('data', 'data'),
        ('map.png', '.'),
        
    ],
    hiddenimports=[
        'utils',
        'utils.data_analysis_simple',
        'utils.kmeans_clustering',
        'utils.genetic_algorithm',
        'utils.greenspeed',
        'utils.stopCar',
        'json',
        'csv',
        'datetime',
        'webbrowser',
        'threading',
        'werkzeug',
        'werkzeug.utils',
        'flask',
        'os',
        'sys',
        'time',
        'random',
    ],
    hookspath=['hooks'],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['paramiko', 'zmq', 'tkinter', 'astropy._erfa' ,'erfa','pyerfa','matplotlib', 'PyQt5', 'PySide2', 'backports', 'setuptools', 'pkg_resources', 'jaraco'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
    optimize=1,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [], 
    exclude_binaries=True,
    name='app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='traffic.ico',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='app',
)
