import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGameSessionDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 100, description: 'Score achieved' })
  @IsInt()
  @Min(0)
  score: number;

  @ApiProperty({ example: 'classic', description: 'Game mode' })
  @IsString()
  gameMode: string;
}
