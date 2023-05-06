import { IsString, IsNotEmpty, IsIn, IsOptional } from "class-validator";

export class AddQueueDto {
	@IsString()
	@IsNotEmpty()
	@IsIn(["1v1", "2v2"])
	readonly mode: string;

	@IsString()
	@IsOptional()
	bonus1?: string;

	@IsString()
	@IsOptional()
	bonus2?: string;
}