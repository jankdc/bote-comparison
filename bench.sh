#!/usr/bin/env bash
#
# Creates the https://github.com/jankdc/bote comparison table.
#
#   ./bench.sh             # 5 runs each (default)
#   RUNS=10 ./bench.sh     # custom sample size
#   FILE=/path/to.json ./bench.sh

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNS="${RUNS:-5}"
FILE="${FILE:-$DIR/citylots.json}"

LABELS=('JSON.parse' 'bote' '@streamparser/json' 'JSONStream' 'oboe.js' 'stream-json')
SCRIPTS=('json-parse' 'bote' 'streamparser' 'jsonstream' 'oboe' 'stream-json')

if [[ ! -f "$FILE" ]]; then
  echo "fixture not found: $FILE" >&2
  exit 1
fi
command -v hyperfine >/dev/null || { echo "hyperfine not found on PATH" >&2; exit 1; }

footprint_mb() {
  local script="$1" tmp fp vals=()
  /usr/bin/time -l node "$DIR/scripts/$script.js" "$FILE" >/dev/null 2>/dev/null  # warmup
  for ((r = 1; r <= RUNS; r++)); do
    printf ' %d' "$r" >&2
    tmp="$(mktemp)"
    /usr/bin/time -l node "$DIR/scripts/$script.js" "$FILE" >/dev/null 2>"$tmp"
    fp="$(awk '/peak memory footprint/{print $1}' "$tmp")"
    rm -f "$tmp"
    [[ -n "$fp" ]] || { echo "could not parse footprint for $script" >&2; exit 1; }
    vals+=("$fp")
  done
  # mean ± sample stddev (matches how hyperfine reports timing), in MB
  printf '%s\n' "${vals[@]}" | awk -v n="$RUNS" '
    { x = $1 / (1024 * 1024); v[NR] = x; sum += x }
    END {
      mean = sum / n
      if (n > 1) { for (i = 1; i <= n; i++) { d = v[i] - mean; ss += d * d } sd = sqrt(ss / (n - 1)) }
      printf "%.1f ± %.1f", mean, sd
    }'
}

emit_rows() {
  local i=0 _ cmd mean stddev rest
  read -r _  # header
  while IFS=, read -r cmd mean stddev rest; do
    printf '%s\t%s\t%s\t%s\n' "$mean" "$stddev" "${FOOTPRINTS[$i]}" "${LABELS[$i]}"
    i=$((i + 1))
  done
}

pad() {
  local s="$1" w="$2" n=$(( $2 - ${#1} ))
  (( n < 0 )) && n=0
  printf '%s%*s' "$s" "$n" ''
}

hf_csv="$(mktemp)"
trap 'rm -f "$hf_csv"' EXIT

hf_args=(--warmup 1 --min-runs "$RUNS" --export-csv "$hf_csv")
for i in "${!SCRIPTS[@]}"; do
  hf_args+=(-n "${LABELS[$i]}" "node '$DIR/scripts/${SCRIPTS[$i]}.js' '$FILE'")
done
hyperfine "${hf_args[@]}" >&2

echo >&2
echo "measuring peak memory footprint ($RUNS runs each)" >&2
FOOTPRINTS=()
for i in "${!SCRIPTS[@]}"; do
  printf '[mem] %s:' "${LABELS[$i]}" >&2
  FOOTPRINTS+=("$(footprint_mb "${SCRIPTS[$i]}")")
  printf '\n' >&2
done

{
  printf '\n'
  printf '| method             | mean time         | mean peak footprint (MB) |\n'
  printf '| ------------------ | ----------------- | ------------------------ |\n'
  emit_rows <"$hf_csv" | sort -t$'\t' -k1,1n | while IFS=$'\t' read -r mean stddev mb label; do
    printf '| %s | %s | %s |\n' "$(pad "$label" 18)" "$(pad "$(printf '%.3f ± %.3f s' "$mean" "$stddev")" 17)" "$(pad "$mb" 24)"
  done
  printf '\n'
}
