import { Body, Inject, Injectable, Param, Res } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Response } from "express";
import { UpdateUserDto } from "./dto";
import { GetUser } from "src/auth/decorator";
import { FileService } from "src/file/file.service";
import * as fs from "fs";
import * as path from "path";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { AuthService } from "src/auth/auth.service";

@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		@Inject(AuthService) private authService: AuthService,
		private fileservice: FileService,
		private config: ConfigService
	) {}

	async GetUserByLogin(@Param("login") login: string, @Res() res: Response) {
		const user = await this.prisma.user.findUnique({
			where: {
				login,
			},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		return res.status(200).json(user);
	}

	async GetUserByUsername(
		@Param("username") username: string,
		@Res() res: Response
	) {
		const user = await this.prisma.user.findUnique({
			where: {
				username,
			},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		return res.status(200).json(user);
	}

	async GetAllUser(@Res() res: Response) {
		const users = await this.prisma.user.findMany();
		return res.status(200).json(users);
	}

	async UpdateUser(
		@Res() res: Response,
		@GetUser() user: any,
		@Body("updateUser") updateUserDto: UpdateUserDto
	) {
		if (!user) {
			return res.status(204).json({ message: `User not found` });
		}

		if (updateUserDto.username) user.username = updateUserDto.username;
		if (updateUserDto.avatar) user.avatar = updateUserDto.avatar;

		const updatedUser = await this.prisma.user.update({
			where: {
				login: user.login,
			},
			data: user,
		});

		return res.status(200).json(updatedUser);
	}

	Logout(@Res() res: Response) {
		res.clearCookie("jwt", { httpOnly: false });
		return res.status(200).json({ message: "Logged out" });
	}

	async GetAllPseudo() {
		const res = await this.prisma.user.findMany({
			select: {
				username: true,
			},
		});
		return res;
	}

	async ConfigUser(
		@GetUser() user: any,
		@Res() res: Response,
		file: any,
		text: string
	) {
		if ((await this.fileservice.checkFile(file)) === false)
			return res.status(400).json({ message: "Bad file" });
		const extension = path.extname(file.originalname);
		const filepath: string = path.join(
			"public",
			"uploads",
			user.id + "-" + uuidv4() + extension
		);
		try {
			await fs.promises.writeFile(filepath, file.buffer);
		} catch (error) {
			// console.log(error);
			return res.status(400).json({ message: "Write File error" });
		}
		if (!user) {
			return res.status(204).json({ message: `User not found` });
		}
		if (text) user.username = text;
		if (file) user.avatar = filepath;
		user.config = true;
		const updatedUser = await this.prisma.user.update({
			where: {
				login: user.login,
			},
			data: user,
		});
		return res.status(200).json(updatedUser);
	}

	async UpdateUserConfig(
		@GetUser() user: any,
		@Res() res: Response,
		file: any,
		text: string,
		source: string
	) {
		if (source !== "set") {
			if ((await this.fileservice.checkFile(file)) === false)
				return res.status(400).json({ message: "Bad file" });
			try {
				await fs.promises.unlink(user.avatar);
			} catch (error) {
				return res.status(400).json({ message: "Delete File error" });
			}
			const extension = path.extname(file.originalname);
			const filepath: string = path.join(
				"public",
				"uploads",
				user.id + "-" + uuidv4() + extension
			);
			try {
				await fs.promises.writeFile(filepath, file.buffer);
			} catch (error) {
				return res.status(400).json({ message: "Write File error" });
			}
			if (!user) {
				return res.status(404).json({ message: `User not found` });
			}
			if (text) user.username = text;
			if (file) user.avatar = filepath;
			const updatedUser = await this.prisma.user.update({
				where: {
					login: user.login,
				},
				data: user,
			});
			return res.status(200).json(updatedUser);
		} else {
			if (text) user.username = text;
			const updatedUser = await this.prisma.user.update({
				where: {
					login: user.login,
				},
				data: user,
			});
			return res.status(200).json(updatedUser);
		}
	}

	async GetAchievement(
		@Param("username") username: string,
		@Res() res: Response
	) {
		try {
			if (!username) {
				return res.status(204).json({ message: `User not found` });
			}
			const achievements = await this.prisma.user.findUnique({
				where: {
					username,
				},
				select: {
					achievements: true,
				},
			});
			return res.status(200).json(achievements);
		} catch (error) {
			return res.status(204).json({ message: `User has no achievement` });
		}
	}

	async GetFriends(
		@Param("username") username: string,
		@Res() res: Response
	) {
		try {
			if (!username) {
				return res.status(204).json({ message: "User not found" });
			}

			const friends = await this.prisma.user.findUnique({
				where: {
					username,
				},
				include: {
					friendwith: true,
				},
			});

			if (!friends) {
				return res.status(204).json({ message: "friends not found" });
			}

			const friendsList = [];
			let j = 0;
			for (let i = 0; i < friends.friendwith.length; i++) {
				const friend = await this.prisma.user.findUnique({
					where: {
						id: friends.friendwith[i].friendId,
					},
				});
				if (friends.friendwith[i].status === "ACCEPTED") {
					friendsList[j] = friend;
					j++;
				}
			}
			return res.status(200).json({
				friends: friendsList,
			});
		} catch (error) {
			return res.status(204).json({ message: `User has no friends` });
		}
	}

	async GetMatchs(@Param("username") username: string, @Res() res: Response) {
		try {
			if (!username) {
				return res.status(204).json({ message: `User not found` });
			}
			const matchs = await this.prisma.user.findUnique({
				where: {
					username,
				},
				select: {
					GameAsPlayer1: true,
					GameAsPlayer2: true,
					GameAsPlayer3: true,
					GameAsPlayer4: true,
				},
			});
			const promises1 = matchs.GameAsPlayer1.map(async (element) => {
				const user1 = await this.prisma.user.findUnique({
					where: {
						id: element.user1Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				const user2 = await this.prisma.user.findUnique({
					where: {
						id: element.user2Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				let user3 : any;
				let user4 : any;

				if (element.user3Id) {
					user3 = await this.prisma.user.findUnique({
						where: {
							id: element.user3Id,
						},
						select: {
							avatar: true,
							username: true,
							experience: true,
						},
					});
				}

				if (element.user4Id) {
					user4 = await this.prisma.user.findUnique({
						where: {
							id: element.user4Id,
						},
						select: {
							avatar: true,
							username: true,
							experience: true,
						},
					});
				}

				if (user3 && user4 && element.mode !== "ONEVONE")
					element["team"] = [user1, user2, user3, user4];
				else
					element["team"] = [user1, user2];
				let winner : any;
				if (element.mode === "ONEVONE")
					winner = element.winner === element.user1Id ? user1 : user2;
				else if (element.mode === "TWOVTWO")
					winner = element.winner === element.user1Id ? [user1, user2] : [user3, user4];
				else if (element.mode === "FREEFORALL")
					winner = element.winner === element.user1Id ? user1 : element.winner === element.user2Id ? user2 : element.winner === element.user3Id ? user3 : user4;
				element["win"] = winner;
				const diff = element.enddate.getTime() - element.date.getTime();
				const seconds = Math.floor(diff / 1000);
				const minutes = Math.floor(seconds / 60);
				element["duration"] =
					(minutes % 60) + "m" + (seconds % 60) + "s";
				return element;
			});
			const promises2 = matchs.GameAsPlayer2.map(async (element) => {
				const user1 = await this.prisma.user.findUnique({
					where: {
						id: element.user1Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				const user2 = await this.prisma.user.findUnique({
					where: {
						id: element.user2Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});
				let user3 : any;
				let user4 : any;

				if (element.user3Id) {
					user3 = await this.prisma.user.findUnique({
						where: {
							id: element.user3Id,
						},
						select: {
							avatar: true,
							username: true,
							experience: true,
						},
					});
				}

				if (element.user4Id) {
					user4 = await this.prisma.user.findUnique({
						where: {
							id: element.user4Id,
						},
						select: {
							avatar: true,
							username: true,
							experience: true,
						},
					});
				}

				if (user3 && user4 && element.mode !== "ONEVONE")
					element["team"] = [user1, user2, user3, user4];
				else
					element["team"] = [user1, user2];
				let winner : any;
				if (element.mode === "ONEVONE")
					winner = element.winner === element.user1Id ? user1 : user2;
				else if (element.mode === "TWOVTWO")
					winner = element.winner === element.user1Id ? [user1, user2] : [user3, user4];
				else if (element.mode === "FREEFORALL")
					winner = element.winner === element.user1Id ? user1 : element.winner === element.user2Id ? user2 : element.winner === element.user3Id ? user3 : user4;
				element["win"] = winner;
				const diff = element.enddate.getTime() - element.date.getTime();
				const seconds = Math.floor(diff / 1000);
				const minutes = Math.floor(seconds / 60);
				element["duration"] =
					(minutes % 60) + "m" + (seconds % 60) + "s";
				return element;
			});
			const promises3 = matchs.GameAsPlayer3.map(async (element) => {
				if (element.mode === "ONEVONE") return null;
				const user1 = await this.prisma.user.findUnique({
					where: {
						id: element.user1Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				const user2 = await this.prisma.user.findUnique({
					where: {
						id: element.user2Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				const user3 = await this.prisma.user.findUnique({
					where: {
						id: element.user3Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				const user4 = await this.prisma.user.findUnique({
					where: {
						id: element.user4Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				element["team"] = [user1, user2, user3, user4];
				if (element.mode === "TWOVTWO") {
					const winner =
						element.winner === element.user1Id
							? [user1, user2]
							: [user3, user4];
					element["win"] = winner;
				} else if (element.mode === "FREEFORALL") {
					const winner =
						element.winner === element.user1Id
							? user1
							: element.winner === element.user2Id
							? user2
							: element.winner === element.user3Id
							? user3
							: user4;
					element["win"] = winner;
				}
				const diff = element.enddate.getTime() - element.date.getTime();
				const seconds = Math.floor(diff / 1000);
				const minutes = Math.floor(seconds / 60);
				element["duration"] =
					(minutes % 60) + "m" + (seconds % 60) + "s";
				return element;
			});
			const promises4 = matchs.GameAsPlayer4.map(async (element) => {
				if (element.mode === "ONEVONE") return null;
				const user1 = await this.prisma.user.findUnique({
					where: {
						id: element.user1Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				const user2 = await this.prisma.user.findUnique({
					where: {
						id: element.user2Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				const user3 = await this.prisma.user.findUnique({
					where: {
						id: element.user3Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				const user4 = await this.prisma.user.findUnique({
					where: {
						id: element.user4Id,
					},
					select: {
						avatar: true,
						username: true,
						experience: true,
					},
				});

				element["team"] = [user1, user2, user3, user4];
				if (element.mode === "TWOVTWO") {
					const winner =
						element.winner === element.user1Id
							? [user1, user2]
							: [user3, user4];
					element["win"] = winner;
				} else if (element.mode === "FREEFORALL") {
					const winner =
					element.winner === element.user1Id
						? user1
						: element.winner === element.user2Id
						? user2
						: element.winner === element.user3Id
						? user3
						: user4;
					element["win"] = winner;
				}
				const diff = element.enddate.getTime() - element.date.getTime();
				const seconds = Math.floor(diff / 1000);
				const minutes = Math.floor(seconds / 60);
				element["duration"] =
					(minutes % 60) + "m" + (seconds % 60) + "s";
				return element;
			});
			const result1 = await Promise.all(promises1);
			const result2 = await Promise.all(promises2);
			const result3 = await Promise.all(promises3);
			const result4 = await Promise.all(promises4);
			return res.status(200).json(
				result1
					.concat(result2)
					.concat(result3)
					.concat(result4)
					.filter((element) => element !== null).sort((a, b) => {
						return b.date.getTime() - a.date.getTime();
					})
			);
		} catch (error) {
			return res.status(204).json({ message: `User has no matchs` });
		}
	}
}
