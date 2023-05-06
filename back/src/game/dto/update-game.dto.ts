import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGameDto {
	@IsOptional()
	@Type(() => Number)
	score1?: number;

	@IsOptional()
	@Type(() => Number)
	score2?: number;
}