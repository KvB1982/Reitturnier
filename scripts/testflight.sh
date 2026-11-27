#!/bin/bash
# Baut die App und lädt sie zu TestFlight (App Store Connect) hoch.
# Aufruf im Hauptordner:  scripts/testflight.sh
#
# Ablauf: Spiel nach www/ kopieren, cap sync, Build-Nummer um 1 erhöhen,
# archivieren, hochladen. Geht etwas schief, wird die alte Build-Nummer
# wiederhergestellt.
#
# Anmeldung bei Apple: mit einem App-Store-Connect-API-Schlüssel (derselbe wie beim
# Rennspiel, er gilt für das ganze Team). Das Skript sucht außerhalb des Repositorys
# zuerst ~/.appstoreconnect/reitturnier.env, sonst ~/.appstoreconnect/rennspiel.env:
#   ASC_KEY_ID=…        Schlüssel-ID
#   ASC_ISSUER_ID=…     Issuer-ID
#   ASC_KEY_PATH=…      Pfad zur Datei AuthKey_….p8 (fehlt die Angabe: ~/.appstoreconnect/private_keys/AuthKey_<Schlüssel-ID>.p8)
# Gibt es keine der Dateien, nimmt xcodebuild das Konto, das in Xcode angemeldet ist
# (das ist für xcodebuild manchmal nicht sichtbar, dann scheitert der Upload).
# Der Schlüssel selbst gehört nie ins Repository.
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

# Anmeldung: API-Schlüssel, wenn es die Datei gibt, sonst das Konto aus Xcode
ANMELDUNG=()
for DATEI in "$HOME/.appstoreconnect/reitturnier.env" "$HOME/.appstoreconnect/rennspiel.env"; do
  if [ -f "$DATEI" ]; then
    # shellcheck disable=SC1090
    . "$DATEI"
    break
  fi
done
if [ -n "${ASC_KEY_ID:-}" ] && [ -n "${ASC_ISSUER_ID:-}" ]; then
  SCHLUESSEL="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_$ASC_KEY_ID.p8}"
  if [ ! -f "$SCHLUESSEL" ]; then
    echo "FEHLER: API-Schlüssel nicht gefunden: $SCHLUESSEL" >&2
    exit 1
  fi
  ANMELDUNG=(-authenticationKeyPath "$SCHLUESSEL" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
  echo "==> Anmeldung: App-Store-Connect-API-Schlüssel $ASC_KEY_ID"
else
  echo "==> Anmeldung: Konto aus Xcode"
fi

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
  ${ANMELDUNG[@]+"${ANMELDUNG[@]}"} \
  -quiet

echo "==> Hochladen zu App Store Connect"
xcodebuild -exportArchive \
  -archivePath "$ARCHIV" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_DIR" \
  -allowProvisioningUpdates \
  ${ANMELDUNG[@]+"${ANMELDUNG[@]}"}

fertig=1
echo "==> Fertig: Version $VERSION, Build $NEU ist hochgeladen."
