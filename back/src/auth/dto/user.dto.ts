import { IsNotEmpty, IsString } from "class-validator";

export class UserDto {
	@IsNotEmpty()
	id: number;

	@IsString()
	@IsNotEmpty()
	avatar?: string;

	@IsString()
	@IsNotEmpty()
	login: string;
}
