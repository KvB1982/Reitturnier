#!/bin/bash
# Baut die App und lädt sie zu TestFlight (App Store Connect) hoch.
# Aufruf im Hauptordner:  scripts/testflight.sh
#
# Ablauf: Spiel nach www/ kopieren, cap sync, Build-Nummer um 1 erhöhen,
# archivieren, hochladen. Geht etwas schief, wird die alte Build-Nummer
# wiederhergestellt. Voraussetzung: In Xcode ist das Apple-Konto angemeldet.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PBX="ios/App/App.xcodeproj/project.pbxproj"
EXPORT_OPTIONS="ios/ExportOptions.plist"

ALT=$(grep -m1 -E 'CURRENT_PROJECT_VERSION = [0-9]+;' "$PBX" | sed -E 's/.*= ([0-9]+);/\1/')
NEU=$((ALT + 1))
VERSION=$(grep -m1 -E 'MARKETING_VERSION = ' "$PBX" | sed -E 's/.*= (.*);/\1/')

ARCHIV="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/Reitturnier $VERSION ($NEU).xcarchive"
EXPORT_DIR="$(mktemp -d)"

fertig=0
aufraeumen() {
  rm -rf "$EXPORT_DIR"
  if [ "$fertig" != 1 ]; then
    sed -i '' -E "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = $ALT;/" "$PBX"
    echo "FEHLER: Hochladen nicht gelungen. Build-Nummer bleibt bei $ALT." >&2
  fi
}
trap aufraeumen EXIT

echo "==> Version $VERSION, Build $ALT -> $NEU"

if [ ! -d node_modules ]; then
  echo "==> npm install"
  npm install
fi

echo "==> Spiel kopieren und cap sync"
npm run sync

sed -i '' -E "s/CURRENT_PROJECT_VERSION = [0-9]+;/CURRENT_PROJECT_VERSION = $NEU;/" "$PBX"

echo "==> Archivieren"
xcodebuild archive \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIV" \
  -allowProvisioningUpdates \
  -quiet

echo "==> Hochladen zu App Store Connect"
xcodebuild -exportArchive \
  -archivePath "$ARCHIV" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_DIR" \
  -allowProvisioningUpdates

fertig=1
echo "==> Fertig: Version $VERSION, Build $NEU ist hochgeladen."
