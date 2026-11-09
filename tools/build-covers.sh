#!/usr/bin/env bash
# Write every size and format of the essay covers from each original.
#
# An original is assets/covers/<slug>.jpg at 1400 px wide. From it this
# writes <slug>-480 and <slug>-960 as JPEG, and AVIF and WebP at all three
# widths (<slug>.avif and <slug>.webp are the 1400). The home page offers
# them through <picture> and srcset (site-content.jsx, CoverPicture).
# Needs macOS sips (JPEG resizing and AVIF) and cwebp (brew install webp).
# Idempotent: rerun after adding or replacing an original.
set -euo pipefail

cd "$(dirname "$0")/../assets/covers"
command -v cwebp >/dev/null || { echo "cwebp not found: brew install webp" >&2; exit 1; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

for src in *.jpg; do
  case "$src" in *-480.jpg|*-960.jpg) continue ;; esac
  slug=${src%.jpg}
  # Chrome draws an AVIF with an odd side as empty space (macOS decodes it
  # fine), so an original with an odd height loses its bottom row of pixels.
  h=$(sips -g pixelHeight "$src" | awk '/pixelHeight/ {print $2}')
  w0=$(sips -g pixelWidth "$src" | awk '/pixelWidth/ {print $2}')
  h0=$h
  if [ $((h % 2)) -ne 0 ]; then
    sips -s formatOptions 92 -c $((h - 1)) "$w0" --cropOffset 0 0 "$src" --out "$tmp/even.jpg" >/dev/null
    mv "$tmp/even.jpg" "$src"
    h0=$((h - 1))
  fi
  for w in 480 960 1400; do
    if [ "$w" = 1400 ]; then out=$slug; jpg=$src
    else
      out=$slug-$w; jpg=$out.jpg
      # Height to the nearest even number, so no size has an odd side.
      th=$(( (w * h0 / w0 + 1) / 2 * 2 ))
      sips -s format jpeg -s formatOptions 80 --resampleHeightWidth "$th" "$w" "$src" --out "$jpg" >/dev/null
    fi
    sips -s format avif -s formatOptions 55 "$jpg" --out "$tmp/$out.avif" >/dev/null
    mv "$tmp/$out.avif" "$out.avif"
    cwebp -quiet -q 78 -metadata none "$jpg" -o "$out.webp"
  done
  echo "covers: $slug"
done
