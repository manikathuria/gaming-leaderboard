/*
  Warnings:

  - You are about to drop the column `userId` on the `game_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `leaderboard` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `leaderboard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `game_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `leaderboard` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."game_sessions" DROP CONSTRAINT "game_sessions_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."leaderboard" DROP CONSTRAINT "leaderboard_userId_fkey";

-- DropIndex
DROP INDEX "public"."game_sessions_userId_idx";

-- DropIndex
DROP INDEX "public"."idx_leaderboard_score_user";

-- DropIndex
DROP INDEX "public"."leaderboard_userId_key";

-- AlterTable
ALTER TABLE "public"."game_sessions" DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."leaderboard" DROP COLUMN "userId",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "game_sessions_user_id_idx" ON "public"."game_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_user_id_key" ON "public"."leaderboard"("user_id");

-- CreateIndex
CREATE INDEX "idx_leaderboard_score_user" ON "public"."leaderboard"("total_score", "user_id");

-- AddForeignKey
ALTER TABLE "public"."game_sessions" ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leaderboard" ADD CONSTRAINT "leaderboard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
