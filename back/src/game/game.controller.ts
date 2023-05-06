import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req } from '@nestjs/common';
import { GameService } from './game.service';
import { GetCookie, GetUser } from 'src/auth/decorator';

@Controller("games")
export class GameController {
	constructor(private gameService: GameService) {}

	@Get()
	async getGames() {
		return this.gameService.getGames();
	}
	
	@Get("connect")
	async connectToGame(@GetCookie("login") userLogin: string) {
		return this.gameService.connectToGame(userLogin);
	}

	@Get(":id")
	async getGame(@Param("id", ParseIntPipe) gameId: number) {
		return this.gameService.getGame(gameId);
	}

	@Get("all/:state")
	async getAllPlayingGames(@Param("state") state: string) {
		return this.gameService.getGames(state);
	}

	@Get("progress/:id")
	async canIJoinQueue(@GetUser("login") userLogin: string, @Param("id", ParseIntPipe) gameId: number) {
		// console.log("userLogin", userLogin);
		return this.gameService.checkCanSpec(userLogin, gameId);
	}

	@Get("spec/:id")
	async amISpec(@GetUser() user: any, @Param("id", ParseIntPipe) gameId: number) {
		return this.gameService.amISpec(user, gameId);
	}
}