import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	@MinLength(4)
	@MaxLength(20)
	username?: string;

	@IsOptional()
	@IsString()
	avatar?: string;
}
