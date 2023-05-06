import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateGameDto, GameState, GameMode } from "./dto";
import { Game, User } from "@prisma/client";

@Injectable()
export class GameService {
	constructor(private prisma: PrismaService) {
		this.initAchievements();
	}

	async initAchievements() {
		const achievements: {
			title: string;
			description: string;
			image: string;
			id: number;
		}[] = [
			{
				title: "Ace",
				description:
					"Win a game without letting your opponents score a single point",
				image: "public/achievements/bottts-1682683777746.svg",
				id: 1,
			},
			{
				title: "Brave",
				description: "Win a game with 20pts or more",
				image: "public/achievements/bottts-1682683831025.svg",
				id: 2,
			},
			{
				title: "Lucky",
				description: "Win a game with 1pt or less",
				image: "public/achievements/bottts-1682683864276.svg",
				id: 3,
			},
			{
				title: "Beginner",
				description: "Win a game",
				image: "public/achievements/bottts-1682683889878.svg",
				id: 4,
			},
			{
				title: "Experienced",
				description: "Win 10 games",
				image: "public/achievements/bottts-1682683937087.svg",
				id: 5,
			},
			{
				title: "Veteran",
				description: "Reach Level 20",
				image: "public/achievements/bottts-1682684012756.svg",
				id: 6,
			},
		];
		for (const achievement of achievements) {
			try {
				await this.prisma.achievements.upsert({
					where: { id: achievement.id || 0 },
					update: {
						...achievement,
					},
					create: {
						...achievement,
					},
				});
			} catch (e) {
				// console.log(e);
			}
		}
	}

	async getGames(state: string | undefined = undefined) {
		let games: Game[];
		let ret: {
			gameMode: string;
			team: { img: string; level: number }[];
			date: string;
			hour: string;
			score: number[];
			map: string;
			state: string;
			id: number;
		}[] = [];
		if (state) {
			games = await this.prisma.game.findMany({
				where: {
					state: state.toUpperCase() as GameState,
				},
			});
		} else games = await this.prisma.game.findMany();
		let players = {} as { user1: User; user2: User; user3: User; user4 };
		for (const game of games) {
			players.user1 = await this.prisma.user.findUnique({
				where: {
					id: game.user1Id,
				},
			});
			players.user2 = await this.prisma.user.findUnique({
				where: {
					id: game.user2Id,
				},
			});
			players.user3 = await this.prisma.user.findUnique({
				where: {
					id: game.user3Id,
				},
			});
			players.user4 = await this.prisma.user.findUnique({
				where: {
					id: game.user4Id,
				},
			});
			const date = game.date.toISOString().split("T")[0].split("-");
			const hour = game.date.toISOString().split("T")[1].split(".")[0].split(":");
			ret.push({gameMode: game.mode === "ONEVONE" ? "1v1" : game.mode === "TWOVTWO" ? "2v2" : "FFA",
				team: game.mode === "ONEVONE" ? [
					{img: players.user1.avatar, level: Math.floor(players.user1.experience / 1000)},
					{img: players.user2.avatar, level: Math.floor(players.user2.experience / 1000)},
				] : [
					{img: players.user1.avatar, level: Math.floor(players.user1.experience / 1000)},
					{img: players.user2.avatar, level: Math.floor(players.user2.experience / 1000)},
					{img: players.user3.avatar, level: Math.floor(players.user3.experience / 1000)},
					{img: players.user4.avatar, level: Math.floor(players.user4.experience / 1000)},
				],
				date: date[2] + "/" + date[1] + "/" + date[0],
				hour: hour[0] + ":" + hour[1],
				score: game.mode === "ONEVONE" ? [game.score1, game.score2] : game.mode === "TWOVTWO" ? [game.score1, game.score3] : [game.score1, game.score2, game.score3, game.score4],
				map: game.map,
				state: game.state === "PLAYING" ? "inProgress" : game.state,
				id: game.id,
			});
		}
		return ret;
	}

	async getGame(gameId: number) {
		return this.prisma.game.findUnique({
			where: {
				id: gameId,
			},
		});
	}

	async createGame(dto: CreateGameDto) {
		return await this.prisma.game.create({
			data: {
				user1Id: dto.player1,
				user2Id: dto.player2,
				user3Id: dto.player3,
				user4Id: dto.player4,
				mode: dto.mode,
			},
		});
	}

	async sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async connectToGame(userLogin: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				login: userLogin,
			},
		});
		if (!user) return;
		const game = await this.prisma.game.findFirst({
			where: {
				state: "CREATING",
				OR: [{ user1Id: user.id }, { user2Id: user.id }],
			},
		});
		if (!game) return;
		return game;
	}

	async checkCanSpec(userLogin: string, gameId: number) {
		if (!userLogin)
			return ({spec: false, reason: "notFound"});
		const user = await this.prisma.user.findUnique({
			where: {login: userLogin,}});
		if (!user || user.state === "OFFLINE")
			return ({spec: false, reason: "notFound"});
		if (user.state === "PLAYING")
		{
			const game = await this.prisma.game.findFirst({
				where: {OR: [{state: "CREATING", user1Id: user.id}, {state: "PLAYING", user1Id: user.id},
					{state: "CREATING", user2Id: user.id}, {state: "PLAYING", user2Id: user.id},
					{state: "CREATING", user3Id: user.id}, {state: "PLAYING", user3Id: user.id},
					{state: "CREATING", user4Id: user.id}, {state: "PLAYING", user4Id: user.id}]}
			});
			if (game)
				return ({spec: false, reason: "playing", gameId: game.id, login: userLogin});

		}
		if (user.state === "SEARCHING")
			return ({spec: false, reason: "searching", login: userLogin});
		
		const game = await this.prisma.game.findFirst({
			where: {id: gameId}
		});
		if (!game)
			return ({spec: false, reason: "notFound"});
		if (game.state === "ENDED")
			return ({spec: false, reason: "ended", login: userLogin});
		return ({spec: true, login: userLogin});
	}

	async amISpec(user: any, gameId: number) {
		const game = await this.prisma.game.findFirst({
			where: {id: gameId}
		});
		if (!game)
			return {isSpec: true};
		if (game.state === "ENDED")
			return {isSpec: true};
		//console.log(game.user1Id, game.user2Id, game.user3Id, game.user4Id, user.id)
		if (game.user1Id === user.id || game.user2Id === user.id || game.user3Id === user.id || game.user4Id === user.id)
			return {isSpec: false};
		return {isSpec: true};
	}
}
