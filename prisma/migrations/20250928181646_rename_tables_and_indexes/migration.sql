/*
  Warnings:

  - You are about to drop the `GameSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Leaderboard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GameSession" DROP CONSTRAINT "GameSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Leaderboard" DROP CONSTRAINT "Leaderboard_userId_fkey";

-- DropTable
DROP TABLE "public"."GameSession";

-- DropTable
DROP TABLE "public"."Leaderboard";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "join_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."game_sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "game_mode" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leaderboard" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "rank" INTEGER,

    CONSTRAINT "leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "game_sessions_userId_idx" ON "public"."game_sessions"("userId");

-- CreateIndex
CREATE INDEX "game_sessions_timestamp_idx" ON "public"."game_sessions"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_userId_key" ON "public"."leaderboard"("userId");

-- CreateIndex
CREATE INDEX "leaderboard_total_score_idx" ON "public"."leaderboard"("total_score");

-- CreateIndex
CREATE INDEX "idx_leaderboard_score_user" ON "public"."leaderboard"("total_score", "userId");

-- AddForeignKey
ALTER TABLE "public"."game_sessions" ADD CONSTRAINT "game_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leaderboard" ADD CONSTRAINT "leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
