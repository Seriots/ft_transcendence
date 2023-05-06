import { Body, Controller, Delete, Get, Post, Req } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { GetCookie, GetUser } from "src/auth/decorator";
import { AddQueueDto } from "./dto";
import { GameService } from "src/game/game.service";

@Controller("queues")
export class QueueController {
	constructor(private queueService: QueueService, private game: GameService) {}

	@Get("joinable")
	async canIJoinQueue(@GetUser("login") userLogin: string) {
		// console.log("userLogin", userLogin);
		return this.queueService.checkPermission(userLogin);
	}

}