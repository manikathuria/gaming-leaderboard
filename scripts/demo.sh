#!/bin/bash
set -e

API_URL="http://localhost:3002/api/v1"
OUTPUT_FILE="./output/demo.txt"

mkdir -p ./output
echo "🚀 Demo run on $(date)" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

log() {
  echo "$1" | tee -a "$OUTPUT_FILE"
}

log "=== DEMO SCRIPT STARTED ==="
log ""

# 1. Create 20 users
log "👥 Creating 20 users..."
for i in $(seq 1 20); do
  USERNAME="user$i"
  RESPONSE=$(curl -s -X POST "$API_URL/users" \
    -H "Content-Type: application/json" \
    -d "{\"username\": \"$USERNAME\"}")
  log "Created user $i → $RESPONSE"
done
log "✅ Created 20 users."
log ""

# 2. Submit scores
log "🎮 Submitting scores..."
for i in $(seq 1 10); do
  SCORE=$((RANDOM % 500 + 1)) # random score 1–500
  RESPONSE=$(curl -s -X POST "$API_URL/leaderboard/submit" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": $i, \"score\": $SCORE}")
  log "User $i scored $SCORE → $RESPONSE"
done
log "✅ Scores submitted."
log ""

# 3. Get leaderboard
log "🏆 Top 10 leaderboard:"
RESPONSE=$(curl -s "$API_URL/leaderboard/top")
log "$RESPONSE"
log ""

# 4. Get ranks for a few users
for id in 3 7 15; do
  log "📊 Rank for user $id:"
  RESPONSE=$(curl -s "$API_URL/leaderboard/rank/$id")
  log "$RESPONSE"
  log ""
done

log "🎉 Demo complete!"
