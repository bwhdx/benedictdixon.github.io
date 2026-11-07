#!/usr/bin/env bash
# Rasterise the favicon set from its two SVG sources (needs rsvg-convert
# and pngquant, as build:og does). favicon.svg is the rounded tile browsers
# show; favicon-maskable.svg is the full-bleed square for the iOS home
# screen and Android's maskable icon, which apply their own mask.
set -euo pipefail
cd "$(dirname "$0")/../favicons"

render() { # source size output
  rsvg-convert -w "$2" -h "$2" "$1" -o "$3"
  pngquant --quality=80-100 --strip --force --output "$3" "$3"
}

for size in 16 32 48 96 180 192 512; do
  render favicon.svg "$size" "favicon-$size.png"
done
render favicon-maskable.svg 180 apple-touch-icon.png
render favicon-maskable.svg 512 favicon-maskable-512.png
echo "Wrote the favicon set to favicons/"
