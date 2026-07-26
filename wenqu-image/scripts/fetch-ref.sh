#!/usr/bin/env bash
# Download a wenqu-image style reference image from GitHub to a local cache,
# for use as --ref in gpt-image-2-gen.sh (which requires a local file path;
# codex -i does not accept URLs).
#
# Style images live in the repo at wenqu-image-assets/styles/ -- kept out of
# the distributed skill so the skill stays light (~200KB instead of 50MB).
# This helper fetches on demand and caches, so repeated uses don't re-download.
#
# Usage:
#   fetch-ref.sh <style-relative-path>
#   e.g. fetch-ref.sh handdrawn/handdrawn-01-skill-creation-loop.png
#   -> prints local cache path to stdout (use as: --ref "$(bash fetch-ref.sh X)")
#
# Override base URL with WENQU_IMAGE_ASSETS_BASE (default: GitHub raw for
# gogoingai/wenqu-skills master). Override cache dir with WENQU_IMAGE_CACHE.
#
# Exit codes: 0 success (path printed on stdout); 2 bad args; 3 download failed.

set -euo pipefail

BASE="${WENQU_IMAGE_ASSETS_BASE:-https://raw.githubusercontent.com/gogoingai/wenqu-skills/master/wenqu-image-assets/styles}"
CACHE_ROOT="${WENQU_IMAGE_CACHE:-$HOME/.cache/wenqu-image/styles}"

if [[ $# -ne 1 || -z "$1" ]]; then
  echo "Usage: $0 <style-relative-path> (e.g. handdrawn/handdrawn-01-skill-creation-loop.png)" >&2
  exit 2
fi

REL="$1"
REL="${REL#styles/}"   # tolerate "styles/..." prefix
REL="${REL#/}"          # tolerate leading slash

URL="$BASE/$REL"
CACHE="$CACHE_ROOT/$REL"

if [[ -s "$CACHE" ]]; then
  printf '%s\n' "$CACHE"
  exit 0
fi

mkdir -p "$(dirname "$CACHE")"
echo "Fetching $URL -> $CACHE" >&2
if curl -fsSL "$URL" -o "$CACHE"; then
  printf '%s\n' "$CACHE"
  exit 0
else
  rm -f "$CACHE"
  echo "Failed to download $URL (network error or wrong path). Check the path and your network." >&2
  exit 3
fi
