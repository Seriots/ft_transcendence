import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PrismaService } from "src/prisma/prisma.service";
import { SocketUser } from "./dto";
import * as jwt from "jsonwebtoken";
import { Game, GameMode, User } from "@prisma/client";
import { GameRoom, GameRoom2V2, GameRoomFFA } from "./class";

@WebSocketGateway({ namespace: "game", cors: { origin: "*" } })
export class GameGateway {
	constructor(private prisma: PrismaService) {}

	@WebSocketServer()
	server: Server;

	ConnectedSockets: SocketUser[] = [];
	GamePlaying: { room: number; mode: GameMode; specList: string[] }[] = [];

	async sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private getPlayerSocket(room: number) {
		const player1 = this.ConnectedSockets.find(
			(socket) =>
				socket.roomName === "game-" + room && socket.state === "player1"
		);
		const player2 = this.ConnectedSockets.find(
			(socket) =>
				socket.roomName === "game-" + room && socket.state === "player2"
		);
		const player3 = this.ConnectedSockets.find(
			(socket) =>
				socket.roomName === "game-" + room && socket.state === "player3"
		);
		const player4 = this.ConnectedSockets.find(
			(socket) =>
				socket.roomName === "game-" + room && socket.state === "player4"
		);
		return { player1, player2, player3, player4 };
	}

	private async moveBall(gameRoom: GameRoom, room: number) {
		let increment_x =
			gameRoom.ball.speed_x * Math.cos(gameRoom.ball.direction);
		let increment_y =
			gameRoom.ball.speed_y * Math.sin(gameRoom.ball.direction);

		gameRoom.checkBallBounce(increment_x);

		gameRoom.incrementBallY(increment_y);

		if (gameRoom.checkBallScore()) {
			await this.prisma.game.update({
				where: { id: room },
				data: {
					score1: gameRoom.player1.score,
					score2: gameRoom.player2.score,
				},
			});
		}
	}

	private movePlayer(gameRoom: GameRoom, room: number) {
		let players = this.getPlayerSocket(room);

		gameRoom.updatePlayerPosition(players.player1);
		gameRoom.updatePlayerPosition(players.player2);
	}

	private async moveBallFFA(gameRoom: GameRoomFFA, room: number) {
		let increment_x =
			gameRoom.ball.speed_x * Math.cos(gameRoom.ball.direction);
		let increment_y =
			gameRoom.ball.speed_y * Math.sin(gameRoom.ball.direction);

		gameRoom.checkBallBounce(increment_x);
		gameRoom.checkBallBounceY(increment_y);
		// gameRoom.incrementBallY(increment_y);

		if (gameRoom.checkBallScore()) {
			await this.prisma.game.update({
				where: { id: room },
				data: {
					score1: gameRoom.player1.score,
					score2: gameRoom.player2.score,
					score3: gameRoom.player3.score,
					score4: gameRoom.player4.score,
				},
			});
		}
	}

	private movePlayerFFA(gameRoom: GameRoomFFA, room: number) {
		let players = this.getPlayerSocket(room);

		if (players.player1 && !players.player1.surrender)
			gameRoom.updatePlayerPosition(players.player1);
		if (players.player2 && !players.player2.surrender)
			gameRoom.updatePlayerPosition(players.player2);
		if (players.player3 && !players.player3.surrender)
			gameRoom.updatePlayerPosition(players.player3);
		if (players.player4 && !players.player4.surrender)
			gameRoom.updatePlayerPosition(players.player4);
	}

	private async moveBall2V2(gameRoom: GameRoom2V2, room: number) {
		let increment_x =
			gameRoom.ball.speed_x * Math.cos(gameRoom.ball.direction);
		let increment_y =
			gameRoom.ball.speed_y * Math.sin(gameRoom.ball.direction);

		gameRoom.checkBallBounce(increment_x);

		gameRoom.incrementBallY(increment_y);

		if (gameRoom.checkBallScore()) {
			await this.prisma.game.update({
				where: { id: room },
				data: {
					score1: gameRoom.player1.score,
					score2: gameRoom.player2.score,
					score3: gameRoom.player3.score,
					score4: gameRoom.player4.score,
				},
			});
		}
	}

	private movePlayer2V2(gameRoom: GameRoom2V2, room: number) {
		let players = this.getPlayerSocket(room);

		if (
			players.player1 &&
			players.player2 &&
			!(players.player1.surrender && players.player2.surrender)
		)
			gameRoom.updatePlayerPosition(players.player1);
		if (
			players.player2 &&
			players.player1 &&
			!(players.player1.surrender && players.player2.surrender)
		)
			gameRoom.updatePlayerPosition(players.player2);
		if (
			players.player3 &&
			players.player4 &&
			!(players.player3.surrender && players.player4.surrender)
		)
			gameRoom.updatePlayerPosition(players.player3);
		if (
			players.player4 &&
			players.player3 &&
			!(players.player3.surrender && players.player4.surrender)
		)
			gameRoom.updatePlayerPosition(players.player4);
	}

	private async waitingPlayerConnection(room: number, mode: GameMode) {
		let count = 0;
		while (
			this.ConnectedSockets.findIndex(
				(socket) =>
					socket.roomName === "game-" + room &&
					socket.state === "player1"
			) === -1 ||
			this.ConnectedSockets.findIndex(
				(socket) =>
					socket.roomName === "game-" + room &&
					socket.state === "player2"
			) === -1 ||
			(mode !== "ONEVONE" &&
				this.ConnectedSockets.findIndex(
					(socket) =>
						socket.roomName === "game-" + room &&
						socket.state === "player3"
				) === -1) ||
			(mode !== "ONEVONE" &&
				this.ConnectedSockets.findIndex(
					(socket) =>
						socket.roomName === "game-" + room &&
						socket.state === "player4"
				) === -1)
		) {
			count += 1;
			if (count > 30) return { state: true, mode: "disconnected" };
			await this.sleep(1000);
		}
		await this.prisma.game.update({
			where: { id: room },
			data: { state: "PLAYING" },
		});
		return null;
	}

	private checkConnected(room: number) {
		let players = this.getPlayerSocket(room);
		if (players.player1 === undefined && players.player2 === undefined)
			return { state: true, mode: "disconnected" };
		else if (players.player1 && players.player1.surrender)
			return { state: true, mode: "surrender", player: 1 };
		else if (players.player2 && players.player2.surrender)
			return { state: true, mode: "surrender", player: 2 };
		return { state: false, mode: "none" };
	}

	private checkConnectedFFA(room: number) {
		let players = this.getPlayerSocket(room);
		if (
			players.player1 === undefined &&
			players.player2 === undefined &&
			players.player3 === undefined &&
			players.player4 === undefined
		)
			return { state: true, mode: "disconnected" };
		else if (
			players.player1 &&
			players.player1.surrender &&
			players.player2 &&
			players.player2.surrender &&
			players.player3 &&
			players.player3.surrender
		)
			return { state: true, mode: "surrender", player: 4 };
		else if (
			players.player1 &&
			players.player1.surrender &&
			players.player2 &&
			players.player2.surrender &&
			players.player4 &&
			players.player4.surrender
		)
			return { state: true, mode: "surrender", player: 3 };
		else if (
			players.player1 &&
			players.player1.surrender &&
			players.player3 &&
			players.player3.surrender &&
			players.player4 &&
			players.player4.surrender
		)
			return { state: true, mode: "surrender", player: 2 };
		else if (
			players.player2 &&
			players.player2.surrender &&
			players.player3 &&
			players.player3.surrender &&
			players.player4 &&
			players.player4.surrender
		)
			return { state: true, mode: "surrender", player: 1 };
		return { state: false, mode: "none" };
	}

	private checkConnected2V2(room: number) {
		let players = this.getPlayerSocket(room);
		if (
			players.player1 === undefined &&
			players.player2 === undefined &&
			players.player3 === undefined &&
			players.player4 === undefined
		)
			return { state: true, mode: "disconnected" };
		else if (
			players.player1 &&
			players.player1.surrender &&
			players.player2 &&
			players.player2.surrender
		)
			return { state: true, mode: "surrender", player: 2 };
		else if (
			players.player3 &&
			players.player3.surrender &&
			players.player4 &&
			players.player4.surrender
		)
			return { state: true, mode: "surrender", player: 1 };
		return { state: false, mode: "none" };
	}

	private async gameRun(gameRoom: GameRoom, room: number) {
		let end;
		let wait = 0;

		while (true) {
			this.movePlayer(gameRoom, room);
			await this.moveBall(gameRoom, room);
			this.server
				.to("game-" + room)
				.emit("gameState", gameRoom.getGameRoomInfo());
			end = gameRoom.checkEndGame();
			if (end.state) return end;
			end = this.checkConnected(room);
			if (end.state && end.mode === "disconnected") {
				if (wait > 2500) return end;
				else wait += 1;
			} else if (end.state) return end;
			else wait = 0;
			await this.sleep(5);
		}
	}

	private async gameRunFFA(gameRoom: GameRoomFFA, room: number) {
		let end;
		let wait = 0;

		while (true) {
			this.movePlayerFFA(gameRoom, room);
			await this.moveBallFFA(gameRoom, room);
			this.server
				.to("game-" + room)
				.emit("gameState", gameRoom.getGameRoomInfo());
			end = gameRoom.checkEndGame();
			if (end.state) return end;
			end = this.checkConnectedFFA(room);
			if (end.state && end.mode === "disconnected") {
				if (wait > 2500) return end;
				else wait += 1;
			} else if (end.state) return end;
			else wait = 0;
			await this.sleep(5);
		}
	}

	private async gameRun2V2(gameRoom: GameRoom2V2, room: number) {
		let end;
		let wait = 0;

		while (true) {
			this.movePlayer2V2(gameRoom, room);
			await this.moveBall2V2(gameRoom, room);
			this.server
				.to("game-" + room)
				.emit("gameState", gameRoom.getGameRoomInfo());
			end = gameRoom.checkEndGame();
			if (end.state) return end;
			end = this.checkConnected2V2(room);
			if (end.state && end.mode === "disconnected") {
				if (wait > 2500) return end;
				else wait += 1;
			} else if (end.state) return end;
			else wait = 0;
			await this.sleep(5);
		}
	}

	private async updateAchievements(
		winner: User,
		loser: User,
		winnerScore: number,
		loserScore: number
	) {
		console.log("winner: ", winner.login, "loser: ", loser.login);
		if (winnerScore === 10 && loserScore === 0) {
			await this.prisma.achievements.update({
				where: { id: 1 },
				data: { users: { connect: { id: winner.id } } },
			});
		}
		if (winnerScore >= 20) {
			await this.prisma.achievements.update({
				where: { id: 2 },
				data: { users: { connect: { id: winner.id } } },
			});
		}
		if (winnerScore <= 1) {
			await this.prisma.achievements.update({
				where: { id: 3 },
				data: { users: { connect: { id: winner.id } } },
			});
		}
		if (winner.wins >= 1 && winner.wins <= 10) {
			await this.prisma.achievements.update({
				where: { id: 4 },
				data: { users: { connect: { id: winner.id } } },
			});
		}
		if (winner.wins >= 10 && winner.wins <= 20) {
			await this.prisma.achievements.update({
				where: { id: 5 },
				data: { users: { connect: { id: winner.id } } },
			});
		}
		if (winner.experience >= 20000) {
			await this.prisma.achievements.update({
				where: { id: 6 },
				data: { users: { connect: { id: winner.id } } },
			});
		}
		if (loser.experience >= 20000) {
			await this.prisma.achievements.update({
				where: { id: 6 },
				data: { users: { connect: { id: loser.id } } },
			});
		}
	}

	private async gameEnd(gameRoom: GameRoom, room: number, endMode: any) {
		await this.prisma.game.update({
			where: { id: room },
			data: { state: "ENDED", enddate: new Date() },
		});
		const game = await this.prisma.game.findUnique({ where: { id: room } });
		if (!game) return false;

		if (endMode.mode === "normal") {
			if (gameRoom.player1.score > gameRoom.player2.score) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user1Id },
				});
				await this.prisma.user.update({
					where: { id: game.user1Id },
					data: {
						state: "ONLINE",
						wins: { increment: 1 },
						elo: { increment: 10 },
						experience: {
							increment: 170 + gameRoom.player1.score * 20,
						},
					},
				});
				await this.prisma.user.update({
					where: { id: game.user2Id },
					data: {
						state: "ONLINE",
						losses: { increment: 1 },
						elo: { decrement: 10 },
						experience: {
							increment: 100 + gameRoom.player2.score * 20,
						},
					},
				});
			} else {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user2Id },
				});
				await this.prisma.user.update({
					where: { id: game.user2Id },
					data: {
						state: "ONLINE",
						wins: { increment: 1 },
						elo: { increment: 10 },
						experience: {
							increment: 170 + gameRoom.player2.score * 20,
						},
					},
				});
				await this.prisma.user.update({
					where: { id: game.user1Id },
					data: {
						state: "ONLINE",
						losses: { increment: 1 },
						elo: { decrement: 10 },
						experience: {
							increment: 100 + gameRoom.player1.score * 20,
						},
					},
				});
			}
		} else if (endMode.mode === "surrender") {
			if (endMode.player === 2) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user1Id },
				});
				await this.prisma.user.update({
					where: { id: game.user1Id },
					data: {
						state: "ONLINE",
						wins: { increment: 1 },
						elo: { increment: 10 },
						experience: {
							increment: 170 + gameRoom.player1.score * 20,
						},
					},
				});
				await this.prisma.user.update({
					where: { id: game.user2Id },
					data: {
						state: "ONLINE",
						losses: { increment: 1 },
						elo: { decrement: 10 },
						experience: {
							increment: 100 + gameRoom.player2.score * 20,
						},
					},
				});
			} else {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user2Id },
				});
				await this.prisma.user.update({
					where: { id: game.user2Id },
					data: {
						state: "ONLINE",
						wins: { increment: 1 },
						elo: { increment: 10 },
						experience: {
							increment: 170 + gameRoom.player2.score * 20,
						},
					},
				});
				await this.prisma.user.update({
					where: { id: game.user1Id },
					data: {
						state: "ONLINE",
						losses: { increment: 1 },
						elo: { decrement: 10 },
						experience: {
							increment: 100 + gameRoom.player1.score * 20,
						},
					},
				});
			}
		}
		let players = this.getPlayerSocket(room);
		let ids = [];
		for (const player of [players.player1, players.player2]) {
			if (player) ids.push(player.prismaId);
		}
		for (const id of [game.user1Id, game.user2Id]) {
			if (ids.includes(id)) {
				await this.prisma.user.update({
					where: { id: id },
					data: { state: "ONLINE" },
				});
			} else {
				await this.prisma.user.update({
					where: { id: id },
					data: { state: "OFFLINE" },
				});
			}
		}
		let player1 = await this.prisma.user.findUnique({
			where: { id: game.user1Id },
		});
		let player2 = await this.prisma.user.findUnique({
			where: { id: game.user2Id },
		});
		let gameAfter = await this.prisma.game.findUnique({
			where: { id: room },
		});
		if (player1 && player2) {
			if (gameAfter.winner === player1.id)
				await this.updateAchievements(
					player1,
					player2,
					gameRoom.player1.score,
					gameRoom.player2.score
				);
			else
				await this.updateAchievements(
					player2,
					player1,
					gameRoom.player2.score,
					gameRoom.player1.score
				);
		}

		// this.GamePlaying.splice(this.GamePlaying.indexOf(room), 1);
		this.GamePlaying.splice(
			this.GamePlaying.findIndex((game) => game.room === room),
			1
		);
		//disconnect all socket to the room associated and navigate to the end page
		this.server.to("game-" + room).emit("endGame", {
			player1_score: gameRoom.player1.score,
			player2_score: gameRoom.player2.score,
		});
		//jE PENSE QU'IL FAUDRAIT AUSSI DELETE ROOM
	}

	private async gameEndFFA(
		gameRoom: GameRoomFFA,
		room: number,
		endMode: any
	) {
		await this.prisma.game.update({
			where: { id: room },
			data: { state: "ENDED", enddate: new Date() },
		});
		const game = await this.prisma.game.findUnique({ where: { id: room } });
		if (!game) return false;

		if (endMode.mode === "normal") {
			if (
				gameRoom.player1.score > gameRoom.player2.score &&
				gameRoom.player1.score > gameRoom.player3.score &&
				gameRoom.player1.score > gameRoom.player4.score
			) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user1Id },
				});
			} else if (
				gameRoom.player2.score > gameRoom.player1.score &&
				gameRoom.player2.score > gameRoom.player3.score &&
				gameRoom.player2.score > gameRoom.player4.score
			) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user2Id },
				});
			} else if (
				gameRoom.player3.score > gameRoom.player1.score &&
				gameRoom.player3.score > gameRoom.player2.score &&
				gameRoom.player3.score > gameRoom.player4.score
			) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user3Id },
				});
			} else if (
				gameRoom.player4.score > gameRoom.player1.score &&
				gameRoom.player4.score > gameRoom.player2.score &&
				gameRoom.player4.score > gameRoom.player3.score
			) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user4Id },
				});
			}
		} else if (endMode.mode === "surrender") {
			if (endMode.player === 1) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user1Id },
				});
			} else if (endMode.player === 2) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user2Id },
				});
			} else if (endMode.player === 3) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user3Id },
				});
			} else if (endMode.player === 4) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user4Id },
				});
			}
		}
		let players = this.getPlayerSocket(room);
		let ids = [];
		for (const player of [
			players.player1,
			players.player2,
			players.player3,
			players.player4,
		]) {
			if (player) ids.push(player.prismaId);
		}
		for (const id of [
			game.user1Id,
			game.user2Id,
			game.user3Id,
			game.user4Id,
		]) {
			if (ids.includes(id)) {
				await this.prisma.user.update({
					where: { id: id },
					data: {
						state: "ONLINE",
						experience: {
							increment: 100 + gameRoom.player1.score * 100,
						},
					},
				});
			} else {
				await this.prisma.user.update({
					where: { id: id },
					data: {
						state: "OFFLINE",
						experience: {
							increment: 100 + gameRoom.player1.score * 100,
						},
					},
				});
			}
		}

		// this.GamePlaying.splice(this.GamePlaying.indexOf(room), 1);
		this.GamePlaying.splice(
			this.GamePlaying.findIndex((game) => game.room === room),
			1
		);
		//disconnect all socket to the room associated and navigate to the end page
		this.server.to("game-" + room).emit("endGame", {
			player1_score: gameRoom.player1.score,
			player2_score: gameRoom.player2.score,
			player3_score: gameRoom.player3.score,
			player4_score: gameRoom.player4.score,
		});
	}

	private async gameEnd2V2(
		gameRoom: GameRoom2V2,
		room: number,
		endMode: any
	) {
		await this.prisma.game.update({
			where: { id: room },
			data: { state: "ENDED", enddate: new Date() },
		});
		const game = await this.prisma.game.findUnique({ where: { id: room } });
		if (!game) return false;

		if (endMode.mode === "normal") {
			if (gameRoom.player1.score > gameRoom.player3.score) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user1Id },
				});
			} else {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user3Id },
				});
			}
		} else if (endMode.mode === "surrender") {
			if (endMode.player === 2) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user3Id },
				});
			} else if (endMode.player === 1) {
				await this.prisma.game.update({
					where: { id: room },
					data: { winner: game.user1Id },
				});
			}
		}
		let players = this.getPlayerSocket(room);
		let ids = [];
		for (const player of [
			players.player1,
			players.player2,
			players.player3,
			players.player4,
		]) {
			if (player) ids.push(player.prismaId);
		}
		for (const id of [
			game.user1Id,
			game.user2Id,
			game.user3Id,
			game.user4Id,
		]) {
			if (ids.includes(id)) {
				await this.prisma.user.update({
					where: { id: id },
					data: {
						state: "ONLINE",
						experience: {
							increment: 100 + gameRoom.player1.score * 100,
						},
					},
				});
			} else {
				await this.prisma.user.update({
					where: { id: id },
					data: {
						state: "OFFLINE",
						experience: {
							increment: 100 + gameRoom.player1.score * 100,
						},
					},
				});
			}
		}

		// this.GamePlaying.splice(this.GamePlaying.indexOf(room), 1);
		this.GamePlaying.splice(
			this.GamePlaying.findIndex((game) => game.room === room),
			1
		);
		//disconnect all socket to the room associated and navigate to the end page
		this.server.to("game-" + room).emit("endGame", {
			player1_score: gameRoom.player1.score,
			player2_score: gameRoom.player2.score,
			player3_score: gameRoom.player3.score,
			player4_score: gameRoom.player4.score,
		});
	}

	async gameLoop1V1(room: number, map: string) {
		let gameRoom = new GameRoom(room, map);
		let end;

		end = await this.waitingPlayerConnection(room, "ONEVONE");
		if (!end) end = await this.gameRun(gameRoom, room);

		await this.gameEnd(gameRoom, room, end);
	}

	async gameLoopFFA(room: number, map: string) {
		let end;
		let gameRoom = new GameRoomFFA(room, map);

		end = await this.waitingPlayerConnection(room, "FREEFORALL");
		if (!end) end = await this.gameRunFFA(gameRoom, room);

		await this.gameEndFFA(gameRoom, room, end);
	}

	async gameLoop2V2(room: number, map: string) {
		let gameRoom = new GameRoom2V2(room, map);

		let end;

		end = await this.waitingPlayerConnection(room, "TWOVTWO");
		if (!end) end = await this.gameRun2V2(gameRoom, room);

		await this.gameEnd2V2(gameRoom, room, end);
	}

	private async checkUserConnection(client: Socket, data: any) {
		const cookies = client.handshake.headers.cookie;
		const token = cookies.split("jwt=")[1].split(";")[0];
		const userCookie = JSON.parse(atob(token.split(".")[1]));
		//	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => { if (err) return (null); });

		const user = await this.prisma.user.findUnique({
			where: { login: userCookie.login },
		});
		if (!user) return null;
		if (!data || !data.room) return null;
		const room = data.room;

		const game = await this.prisma.game.findUnique({ where: { id: room } });
		if (!game || game.state == "ENDED") return null;
		return { login: userCookie.login, user, game, room };
	}

	private addSpecToRoom(room: number, login: string) {
		const game = this.GamePlaying.find((x) => x.room === room);
		if (game && game.specList.find((x) => x === login) === undefined) {
			game.specList.push(login);
			this.server
				.to("game-" + room)
				.emit("updateSpectator", { spectator: game.specList.length });
		}
	}

	private removeSpecToRoom(room: number, login: string) {
		const game = this.GamePlaying.find((x) => x.room === room);
		if (game && game.specList.find((x) => x === login) !== undefined) {
			game.specList.splice(
				game.specList.findIndex((spec) => spec === login),
				1
			);
			this.server
				.to("game-" + room)
				.emit("updateSpectator", { spectator: game.specList.length });
		}
	}

	private setupUserSocket(
		client: Socket,
		user: User,
		game: Game,
		userLogin: string,
		room: number
	) {
		let state: string;

		if (game.user1Id == user.id) state = "player1";
		else if (game.user2Id == user.id) state = "player2";
		else if (game.user3Id == user.id) state = "player3";
		else if (game.user4Id == user.id) state = "player4";
		else {
			state = "spectator";
			this.addSpecToRoom(room, user.login);
		}

		const sockUser: SocketUser = this.ConnectedSockets.find(
			(x) => x.login === user.login
		);

		if (sockUser != null) {
			if (sockUser.roomName !== "game-" + room)
				client.leave(sockUser.roomName);
			if (sockUser.state === "spectator")
			{
				this.removeSpecToRoom(
					parseInt(sockUser.roomName.split("game-")[0]),
					sockUser.login
					);
			}
			if (sockUser.roomName !== "game-" + room) {
				sockUser.roomName = "game-" + room;
				sockUser.state = state;
				sockUser.up = 0;
				sockUser.down = 0;
				sockUser.socketId = client.id;

				client.join("game-" + room);
			}
		} else {
			this.ConnectedSockets.push({
				prismaId: user.id,
				socketId: client.id,
				login: userLogin,
				roomName: "game-" + room,
				state: state,
				up: 0,
				down: 0,
				left: 0,
				right: 0,
				surrender: false,
			});
			client.join("game-" + room);
		}
	}

	private async checkAndSave(client: Socket, data: any) {
		let userCheck = await this.checkUserConnection(client, data);

		if (userCheck === null) {
			client.emit("error");
			return false;
		}

		this.setupUserSocket(
			client,
			userCheck.user,
			userCheck.game,
			userCheck.login,
			userCheck.room
		);
		// console.log("data", data);
		if (userCheck.game.state === "CREATING") {
			// || userCheck.game.state === "PLAYING")
			if (userCheck.game.mode === "ONEVONE")
				client.emit("gameState", {
					ball_x: 0.5,
					ball_y: 0.5,
					ball_size: 0.03,
					player1_x: 0.006,
					player1_y: 0.5,
					player1_size: 0.2,
					player1_score: 0,
					player2_x: 0.994,
					player2_y: 0.5,
					player2_size: 0.2,
					player2_score: 0,
					board: 1,
					map: userCheck.game.map,
					mode: "ONEVONE",
				});
			if (userCheck.game.mode === "TWOVTWO")
				client.emit("gameState", {
					ball_x: 0.5,
					ball_y: 0.5,
					ball_size: 0.03,
					player1_x: 0.006,
					player1_y: 0.5,
					player1_size: 0.2,
					player1_score: 0,
					player2_x: 0.02,
					player2_y: 0.5,
					player2_size: 0.2,
					player2_score: 0,
					player3_x: 0.994,
					player3_y: 0.5,
					player3_size: 0.2,
					player3_score: 0,
					player4_x: 0.98,
					player4_y: 0.5,
					player4_size: 0.2,
					player4_score: 0,
					board: 3,
					map: userCheck.game.map,
					mode: "TWOVTWO",
				});
			if (userCheck.game.mode === "FREEFORALL")
				client.emit("gameState", {
					ball_x: 0.5,
					ball_y: 0.5,
					ball_size: 0.03,
					player1_x: 0.006,
					player1_y: 0.5,
					player1_size: 0.2,
					player1_score: 4,
					player2_x: 0.994,
					player2_y: 0.5,
					player2_size: 0.2,
					player2_score: 4,
					player3_x: 0.5,
					player3_y: 0.006,
					player3_size: 0.2,
					player3_score: 4,
					player4_x: 0.5,
					player4_y: 0.994,
					player4_size: 0.2,
					player4_score: 4,
					board: 2,
					map: userCheck.game.map,
					mode: "FREEFORALL",
				});
		}
		if (
			this.GamePlaying.findIndex((x) => x.room === userCheck.room) === -1
		) {
			this.GamePlaying.push({
				room: userCheck.room,
				mode: userCheck.game.mode,
				specList: [],
			});
			if (userCheck.game.mode === "ONEVONE")
				this.gameLoop1V1(userCheck.room, userCheck.game.map);
			else if (userCheck.game.mode === "FREEFORALL")
				this.gameLoopFFA(userCheck.room, userCheck.game.map);
			else this.gameLoop2V2(userCheck.room, userCheck.game.map);
		}
		return true;
	}

	async handleConnection(client: Socket) {
		return;
	}

	handleDisconnect(client: Socket) {
		const sockUser: SocketUser = this.ConnectedSockets.find(
			(x) => x.socketId === client.id
		);
		if (sockUser != null) {
			client.leave(sockUser.roomName);
			this.ConnectedSockets.splice(
				this.ConnectedSockets.findIndex(
					(x) => x.socketId === client.id
				),
				1
			);
		}
		return;
	}

	@SubscribeMessage("gameConnection")
	async handleGameConnection(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: any
	) {
		return await this.checkAndSave(client, data);
	}

	@SubscribeMessage("gameDisconnection")
	async handleGameDisconnection(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: any
	) {
		const sockUser: SocketUser = this.ConnectedSockets.find(
			(x) => x.socketId === client.id
		);
		if (sockUser != null) {
			client.leave(sockUser.roomName);
			//this.server.to(client.id).socketsLeave(sockUser.roomName);
			if (sockUser.state === "spectator")
			{
				this.removeSpecToRoom(
					parseInt(sockUser.roomName.split("game-")[0]),
					sockUser.login
				);
				client.leave(sockUser.roomName);
			}
			this.ConnectedSockets.splice(
				this.ConnectedSockets.findIndex(
					(x) => x.socketId === client.id
				),
				1
			);
		}
	}

	@SubscribeMessage("endGameStatus")
	async handleEndGameStatus(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: any
	) {
		const sockUser: SocketUser = this.ConnectedSockets.find(
			(x) => x.socketId === client.id
		);
		if (sockUser != null) {
			const game = await this.prisma.game.findFirst({
				where: { id: data.room },
			});
			if (game) {
				const player1 = await this.prisma.user.findFirst({
					where: { id: game.user1Id },
				});
				const player2 = await this.prisma.user.findFirst({
					where: { id: game.user2Id },
				});
				let player3 = undefined;
				let player4 = undefined;
				if (game.mode !== "ONEVONE") {
					player3 = await this.prisma.user.findFirst({
						where: { id: game.user3Id },
					});
					player4 = await this.prisma.user.findFirst({
						where: { id: game.user4Id },
					});
				}
				if (player1 && player2) {
					if (game.mode === "TWOVTWO") {
						if (game.winner === game.user1Id)
							client.emit("getEndStatus", {
								mode: game.mode,
								score1: game.score1,
								score2: game.score3,
								avatar1: player1.avatar,
								avatar2: player2.avatar,
								avatar3: player3.avatar,
								avatar4: player4.avatar,
							});
						else if (game.winner === game.user3Id)
							client.emit("getEndStatus", {
								mode: game.mode,
								score1: game.score3,
								score2: game.score1,
								avatar1: player3.avatar,
								avatar2: player4.avatar,
								avatar3: player1.avatar,
								avatar4: player2.avatar,
							});
					} else {
						if (game.winner === game.user1Id)
							client.emit("getEndStatus", {
								mode: game.mode,
								score1: game.score1,
								score2: game.score2,
								score3: player3 ? game.score3 : null,
								avatar1: player1.avatar,
								avatar2: player2.avatar,
								avatar3: player3 ? player3.avatar : null,
							});
						else if (game.winner === game.user2Id)
							client.emit("getEndStatus", {
								mode: game.mode,
								score1: game.score2,
								score2: game.score1,
								score3: player3 ? game.score3 : null,
								avatar1: player2.avatar,
								avatar2: player1.avatar,
								avatar3: player3 ? player3.avatar : null,
							});
						else if (game.winner === game.user3Id)
							client.emit("getEndStatus", {
								mode: game.mode,
								score1: game.score3,
								score2: game.score1,
								score3: game.score2,
								avatar1: player3.avatar,
								avatar2: player1.avatar,
								avatar3: player2.avatar,
							});
						else if (game.winner === game.user4Id)
							client.emit("getEndStatus", {
								mode: game.mode,
								score1: game.score4,
								score2: game.score2,
								score3: game.score1,
								avatar1: player4.avatar,
								avatar2: player2.avatar,
								avatar3: player1.avatar,
							});
					}
				}
			}
		}
	}

	@SubscribeMessage("keyPress")
	HandleKeyPress(
		@MessageBody() data: string,
		@ConnectedSocket() client: Socket
	) {
		const sockUser: SocketUser = this.ConnectedSockets.find(
			(x) => x.socketId === client.id
		);
		if (sockUser != null) {
			if (data === "UP") {
				sockUser.up = 1;
				if (sockUser.down === 1) sockUser.down = 2;
			} else if (data === "DOWN") {
				sockUser.down = 1;
				if (sockUser.up === 1) sockUser.up = 2;
			}
			if (data === "LEFT") {
				sockUser.left = 1;
				if (sockUser.right === 1) sockUser.right = 2;
			} else if (data === "RIGHT") {
				sockUser.right = 1;
				if (sockUser.left === 1) sockUser.left = 2;
			}
		}
	}

	@SubscribeMessage("keyRelease")
	HandleKeyRelease(
		@MessageBody() data: string,
		@ConnectedSocket() client: Socket
	) {
		const sockUser: SocketUser = this.ConnectedSockets.find(
			(x) => x.socketId === client.id
		);
		if (sockUser != null) {
			if (data === "UP") {
				sockUser.up = 0;
				if (sockUser.down === 2) sockUser.down = 1;
			} else if (data === "DOWN") {
				sockUser.down = 0;
				if (sockUser.up === 2) sockUser.up = 1;
			}
			if (data === "LEFT") {
				sockUser.left = 0;
				if (sockUser.right === 2) sockUser.right = 1;
			} else if (data === "RIGHT") {
				sockUser.right = 0;
				if (sockUser.left === 2) sockUser.left = 1;
			}
		}
	}

	@SubscribeMessage("surrender")
	HandleSurrender(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: any
	) {
		const players = this.getPlayerSocket(data.room);

		if (players.player1 != null && players.player1.socketId === client.id)
			players.player1.surrender = true;
		if (players.player2 != null && players.player2.socketId === client.id)
			players.player2.surrender = true;
		if (players.player3 != null && players.player3.socketId === client.id)
			players.player3.surrender = true;
		if (players.player4 != null && players.player4.socketId === client.id)
			players.player4.surrender = true;
	}

	@SubscribeMessage("quickChatMessage")
	async HandleQuickChatMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: any
	) {
		const sockUser: SocketUser = this.ConnectedSockets.find(
			(x) => x.socketId === client.id
		);
		if (sockUser === null) return;

		const game = await this.prisma.game.findUnique({
			where: { id: data.room },
		});

		if (
			game === null ||
			game.state === "ENDED" ||
			(game.user1Id !== sockUser.prismaId &&
				game.user2Id !== sockUser.prismaId &&
				game.user3Id !== sockUser.prismaId &&
				game.user4Id !== sockUser.prismaId)
		)
			return;

		//console.log("quickChatMessageResponse");
		this.server.to("game-" + data.room).emit("quickChatMessageResponse", {
			login: sockUser.login,
			message: parseInt(data.key),
		});
	}

	@SubscribeMessage("getSpectator")
	HanldeGetSpectator(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: any
	) {
		const sockUser: SocketUser = this.ConnectedSockets.find(
			(x) => x.socketId === client.id
		);
		if (sockUser === null) return;

		const game = this.GamePlaying.find((x) => x.room === data.room);
		if (game === undefined) return;

		client.emit("updateSpectator", { spectator: game.specList.length });
	}
}
