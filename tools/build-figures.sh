#!/usr/bin/env bash
# Write every size and format of the figures set inside essays.
#
# An original is assets/figures/<name>.jpg at 1280 px wide, twice the
# column, so it is sharp on a 2x screen. From it this writes <name>-640
# as JPEG, and AVIF and WebP at both widths (<name>.avif and <name>.webp
# are the 1280). An essay offers them through <picture> and srcset, in a
# <figure class="essay-figure"> (writing.css).
# Needs macOS sips (JPEG resizing and AVIF) and cwebp (brew install webp).
# Idempotent: rerun after adding or replacing an original.
set -euo pipefail

cd "$(dirname "$0")/../assets/figures"
command -v cwebp >/dev/null || { echo "cwebp not found: brew install webp" >&2; exit 1; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

for src in *.jpg; do
  case "$src" in *-640.jpg) continue ;; esac
  name=${src%.jpg}
  w0=$(sips -g pixelWidth "$src" | awk '/pixelWidth/ {print $2}')
  h0=$(sips -g pixelHeight "$src" | awk '/pixelHeight/ {print $2}')
  if [ "$w0" != 1280 ]; then echo "$src is $w0 px wide; an original is 1280" >&2; exit 1; fi
  # Chrome draws an AVIF with an odd side as empty space (see build-covers.sh).
  if [ $((h0 % 2)) -ne 0 ]; then echo "$src is ${w0}x${h0}; an original's height must be even" >&2; exit 1; fi
  for w in 640 1280; do
    if [ "$w" = 1280 ]; then out=$name; jpg=$src
    else
      out=$name-$w; jpg=$out.jpg
      # Height to the nearest even number, so no size has an odd side.
      th=$(( (w * h0 / w0 + 1) / 2 * 2 ))
      sips -s format jpeg -s formatOptions 82 --resampleHeightWidth "$th" "$w" "$src" --out "$jpg" >/dev/null
    fi
    sips -s format avif -s formatOptions 55 "$jpg" --out "$tmp/$out.avif" >/dev/null
    mv "$tmp/$out.avif" "$out.avif"
    cwebp -quiet -q 80 -metadata none "$jpg" -o "$out.webp"
  done
  echo "figures: $name"
done
