import { IsInt, IsPositive, Min } from 'class-validator';

export class SubmitScoreDto {
  @IsInt()
  @Min(0)
  @IsPositive()
  score: number;

  gameMode?: string;
}

// npx prisma migrate dev --name snake_casing
