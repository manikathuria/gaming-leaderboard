import { IsInt, Min } from 'class-validator';

export class SubmitScoreDto {

  @IsInt()
  @Min(0)
  score: number;

  gameMode?: string;
}

// npx prisma migrate dev --name snake_casing
