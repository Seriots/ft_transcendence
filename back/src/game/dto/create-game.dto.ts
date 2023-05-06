import { IsInt, IsString, IsAlphanumeric, IsNotEmpty, IsDefined } from "class-validator";
import { Type } from "class-transformer";
import { isInt32Array } from "util/types";

export type GameMode = 'ONEVONE' | 'TWOVTWO' | 'FREEFORALL';

export class CreateGameDto {

	//@IsString()
	//@Type(() => Number)
	@IsDefined()
	@IsInt()
	player1: number;

	//@IsString()
	//@IsAlphanumeric()
	//@Type(() => Number)
	@IsDefined()
	@IsInt()
	player2: number;

	@IsInt()
	player3: number;

	@IsInt()
	player4: number;

	@IsDefined()
	mode: GameMode;

}