import { IsNumber, IsString, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";

export class CookieDto {
	@IsNotEmpty()
	@IsString()
	login: string;

	@IsNotEmpty()
	@IsString()
	username: string;

	@IsNotEmpty()
	@IsNumber()
	@Type(() => Number)
	id: number;
}
