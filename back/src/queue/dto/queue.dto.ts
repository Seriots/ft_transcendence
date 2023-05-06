import { IsString, IsNotEmpty, IsIn, IsOptional } from "class-validator";
import { GameMode } from "src/game/dto";

export class QueueDto {

	@IsNotEmpty()
	@IsString()
	login: string;

	@IsNotEmpty()
	@IsString()
	@IsIn(["1v1", "2v2"])
	readonly mode: string;

	@IsNotEmpty()
	@IsString()
	bonus1: string;

	@IsNotEmpty()
	@IsString()
	bonus2: string;
}

export enum QueueState {
	Searching = "Searching",
	Waiting = "WaitingRep",
	Accepted = "Accepted",
	Declined = "Declined",
}

export class QueueObject {

	id: number;
	login: string;
	socketId: string;
	state: QueueState;
}

export class QueueGroup {
	player1: QueueObject;
	player2: QueueObject | null;
	player3: QueueObject | null;
	player4: QueueObject | null;
	mode: GameMode;
	map: string | null;
	timeData: number;
}

export class GameMatched {
	group1: QueueGroup;
	group2: QueueGroup;
	group3: QueueGroup;
	group4: QueueGroup;
	time: number;
	mode: GameMode;
}