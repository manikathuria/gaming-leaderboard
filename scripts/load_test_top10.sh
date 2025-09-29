#!/bin/bash
set -e

API_BASE_URL="http://localhost:3002/api/v1/leaderboard"
AUTH_URL="http://localhost:3002/api/v1/auth/login"

# helper: random int between min and max
rand_int() {
  local min=$1
  local max=$2
  echo $(( min + RANDOM % (max - min + 1) ))
}

while true; do
  echo "📥 Fetching current TOP 10..."
  TOP_RESPONSE=$(curl -s "$API_BASE_URL/top" | jq '.data')

  TOP_COUNT=$(echo "$TOP_RESPONSE" | jq 'length')

  if [ "$TOP_COUNT" -eq 0 ]; then
    echo "❌ No top users found, skipping..."
    sleep 1
    continue
  fi

  # Pick random index from 0..TOP_COUNT-1
  INDEX=$(( RANDOM % TOP_COUNT ))
  USER_ID=$(echo "$TOP_RESPONSE" | jq -r ".[$INDEX].user_id")

  SCORE=$(rand_int 100 10000)

  echo "==== Iteration for TOP user_$USER_ID with new score $SCORE ===="

  # 1. Login as this user
  echo "🔑 Logging in as user_$USER_ID"
  LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user_$USER_ID\",\"password\":\"password\"}")

  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.access_token')

  if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Failed to login as user_$USER_ID"
    echo "$LOGIN_RESPONSE"
    sleep 1
    continue
  fi

  # 2. Submit score
  echo "📤 Calling POST /submit"
  SUBMIT_RESPONSE=$(curl -s -w "\nHTTP %{http_code}\n" -X POST "$API_BASE_URL/submit" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"user_id\": $USER_ID, \"score\": $SCORE}")
  echo "Response from submit:"
  echo "$SUBMIT_RESPONSE"

  # 3. Get top leaderboard
  echo "📥 Calling GET /top"
  TOP_AGAIN=$(curl -s -w "\nHTTP %{http_code}\n" "$API_BASE_URL/top")
  echo "Response from top:"
  echo "$TOP_AGAIN"

  # 4. Get user rank
  echo "📥 Calling GET /rank/$USER_ID"
  RANK_RESPONSE=$(curl -s -w "\nHTTP %{http_code}\n" "$API_BASE_URL/rank/$USER_ID")
  echo "Response from rank:"
  echo "$RANK_RESPONSE"

  echo "---------------------------------------"

  # Sleep 0.5–2 seconds
  SLEEP_TIME=$(awk -v min=0.5 -v max=2 'BEGIN{srand(); print min+rand()*(max-min)}')
  sleep $SLEEP_TIME
done
