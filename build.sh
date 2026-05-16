#!/usr/bin/env bash
# build.sh – produces dist/chrome/ and dist/firefox/ extension packages
# Usage: bash build.sh
# Requires: bash, zip (for .xpi packaging)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/src"
DIST="$SCRIPT_DIR/dist"

# ── Icons ───────────────────────────────────────────────────────────
# If src/icons/icon.svg exists, render it to PNG at each required size.
# Tries rsvg-convert, inkscape, then convert (ImageMagick) in that order.

ICONS_DIR="$SRC/icons"
mkdir -p "$ICONS_DIR"

ICON_SVG="$ICONS_DIR/icon.svg"
if [[ -f "$ICON_SVG" ]]; then
  for SIZE in 16 48 128; do
    ICON_PNG="$ICONS_DIR/icon${SIZE}.png"
    if command -v rsvg-convert &>/dev/null; then
      rsvg-convert -w "$SIZE" -h "$SIZE" "$ICON_SVG" > "$ICON_PNG"
    elif command -v inkscape &>/dev/null; then
      inkscape --export-type=png --export-width="$SIZE" --export-height="$SIZE" \
               --export-filename="$ICON_PNG" "$ICON_SVG" 2>/dev/null
    elif command -v convert &>/dev/null; then
      convert -background none -resize "${SIZE}x${SIZE}" "$ICON_SVG" "$ICON_PNG"
    else
      # No renderer – fall back to pre-built PNGs if they exist
      if [[ -f "$ICON_PNG" ]]; then
        echo "  WARNING: No SVG renderer found (rsvg-convert/inkscape/imagemagick); using existing $ICON_PNG"
      else
        echo "ERROR: No SVG renderer found and no pre-built icon${SIZE}.png exists." >&2
        echo "       Install rsvg-convert, inkscape, or imagemagick to render icon.svg." >&2
        exit 1
      fi
      continue
    fi
    echo "  Generated icon${SIZE}.png from icon.svg"
  done
  echo "Icons generated."
else
  echo "ERROR: $ICON_SVG not found. Add an icon.svg to src/icons/." >&2
  exit 1
fi

# ── Build targets ───────────────────────────────────────────────────
build_target() {
  local TARGET="$1"           # chrome or firefox
  local MANIFEST_SRC="$2"    # path to manifest file

  local OUT="$DIST/$TARGET"
  rm -rf "$OUT"
  mkdir -p "$OUT/icons"

  # Copy extension files
  cp "$MANIFEST_SRC" "$OUT/manifest.json"
  cp "$SRC/content.js"  "$OUT/content.js"
  cp "$SRC/content.css" "$OUT/content.css"

  # Firefox-only: page-context injected script for XHR/fetch interception
  if [[ "$TARGET" == "firefox" ]]; then
    cp "$SRC/injected.js" "$OUT/injected.js"
  fi

  # Copy icons
  for SIZE in 16 48 128; do
    local ICON_PNG="$ICONS_DIR/icon${SIZE}.png"
    if [[ -f "$ICON_PNG" ]]; then
      cp "$ICON_PNG" "$OUT/icons/icon${SIZE}.png"
    else
      echo "  WARNING: Missing icon${SIZE}.png – extension will load but may show no icon"
    fi
  done

  echo "Built $TARGET → $OUT"

  # Create zip package
  local ZIP="$DIST/autodarts-training-${TARGET}.zip"
  rm -f "$ZIP"
  (cd "$OUT" && zip -qr "$ZIP" .)
  echo "Packaged → $ZIP"
}

build_target "chrome"  "$SRC/manifest.chrome.json"
build_target "firefox" "$SRC/manifest.firefox.json"

echo ""
echo "Done!"
echo ""
echo "Load in Chrome:  chrome://extensions → Enable 'Developer mode' → 'Load unpacked' → select dist/chrome/"
echo "Load in Firefox: about:debugging → 'This Firefox' → 'Load Temporary Add-on' → select dist/firefox/manifest.json"
echo "                 (or submit dist/autodarts-training-firefox.zip to AMO)"
