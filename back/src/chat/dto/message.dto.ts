import { IsString } from "class-validator";

export class MessageDto {
	@IsString()
	username: string;

	@IsString()
	content: string;

	@IsString()
	channel: string;
}
