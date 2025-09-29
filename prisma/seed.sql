-- Insert 1000 users
INSERT INTO users (username)
SELECT 'user_' || generate_series(1, 1000000);

-- Populate Game Sessions with Random Scores
INSERT INTO game_sessions (user_id, score, game_mode, timestamp)
SELECT
    floor(random() * 1000 + 1)::int,
    floor(random() * 10000 + 1)::int,
    CASE WHEN random() > 0.5 THEN 'solo' ELSE 'team' END,
    NOW() - INTERVAL '1 day' * floor(random() * 365)
FROM generate_series(1, 5000);

-- Populate Leaderboard by Aggregating Scores
INSERT INTO leaderboard (user_id, total_score, rank)
SELECT user_id,
       SUM(score) AS total_score,
       RANK() OVER (ORDER BY SUM(score) DESC)
FROM game_sessions
GROUP BY user_id;
