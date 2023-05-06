import { Injectable, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { GetUser } from "src/auth/decorator";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class FriendService {
	constructor(private prisma: PrismaService) {}

	async AddFriend(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		const friend = await this.prisma.user.findUnique({
			where: {
				username: username,
			},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		if (!friend) {
			return res.status(204).json({ message: "Friend not found" });
		}
		if (user.id === friend.id) {
			return res.status(400).json({ message: "You can't add yourself" });
		}
		try {
			await this.prisma.friendsRelation.create({
				data: {
					friendId: user.id,
					friendwithId: friend.id,
				},
			});
			await this.prisma.friendsRelation.create({
				data: {
					friendId: friend.id,
					friendwithId: user.id,
					status: "DEMAND",
				},
			});
		} catch (e) {
			return res.status(400).json({ message: "Friend already added" });
		}

		return res.status(200).json({ message: "Friend added" });
	}

	async RemoveFriend(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
		) {
			const friend = await this.prisma.user.findUnique({
				where: {
					username: username,
				},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		if (!friend) {
			return res.status(204).json({ message: "Friend not found" });
		}
		
		try {
			await this.prisma.friendsRelation.delete({
				where: {
					friendId_friendwithId: {
						friendId: user.id,
						friendwithId: friend.id,
					},
				},
			});
			await this.prisma.friendsRelation.delete({
				where: {
					friendId_friendwithId: {
						friendId: friend.id,
						friendwithId: user.id,
					},
				},
			});
		} catch (e) {
			return res.status(400).json({ message: "Friend not found" });
		}

		return res.status(200).json({ message: "Friend removed" });
	}

	async AcceptFriend(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		const friend = await this.prisma.user.findUnique({
			where: {
				username: username,
			},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		if (!friend) {
			return res.status(204).json({ message: "Friend not found" });
		}

		try {
			const friendRelation = await this.prisma.friendsRelation.findUnique(
				{
					where: {
						friendId_friendwithId: {
							friendId: user.id,
							friendwithId: friend.id,
						},
					},
				}
			);

			if (
				friendRelation.friendId === user.id &&
				friendRelation.status === "PENDING"
			) {
				return res
					.status(400)
					.json({ message: "You can't accept your own request" });
			}

			await this.prisma.friendsRelation.update({
				where: {
					friendId_friendwithId: {
						friendId: user.id,
						friendwithId: friend.id,
					},
				},
				data: {
					status: "ACCEPTED",
				},
			});
			await this.prisma.friendsRelation.update({
				where: {
					friendId_friendwithId: {
						friendId: friend.id,
						friendwithId: user.id,
					},
				},
				data: {
					status: "ACCEPTED",
				},
			});
		} catch (e) {
			return res
				.status(400)
				.json({ message: "Friend relation not found" });
		}

		return res.status(200).json({ message: "Friend relation accepted" });
	}

	async DeclineFriend(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		const friend = await this.prisma.user.findUnique({
			where: {
				username: username,
			},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		if (!friend) {
			return res.status(204).json({ message: "Friend not found" });
		}

		try {
			await this.prisma.friendsRelation.delete({
				where: {
					friendId_friendwithId: {
						friendId: user.id,
						friendwithId: friend.id,
					},
				},
			});
			await this.prisma.friendsRelation.delete({
				where: {
					friendId_friendwithId: {
						friendId: friend.id,
						friendwithId: user.id,
					},
				},
			});
		} catch (e) {
			return res
				.status(400)
				.json({ message: "Friend relation not found" });
		}

		return res.status(200).json({ message: "Friend relation rejected" });
	}

	async GetFriends(@Res() res: Response, @GetUser() user: any) {
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}

		const friends = await this.prisma.user.findUnique({
			where: {
				login: user.login,
			},
			include: {
				friendwith: true,
			},
		});

		if (!friends) {
			return res.status(204).json({ message: "friends not found" });
		}

		const friendsList = [];
		const pendingList = [];
		const demandList = [];
		let j = 0;
		let k = 0;
		let l = 0;
		for (let i = 0; i < friends.friendwith.length; i++) {
			const friend = await this.prisma.user.findUnique({
				where: {
					id: friends.friendwith[i].friendId,
				},
			});
			if (friends.friendwith[i].status === "ACCEPTED") {
				friendsList[j] = friend;
				j++;
			} else if (friends.friendwith[i].status === "PENDING") {
				pendingList[k] = friend;
				k++;
			} else if (friends.friendwith[i].status === "DEMAND") {
				demandList[l] = friend;
				l++;
			}
		}
		return res.status(200).json({ friendsList, pendingList, demandList });
	}

	async BlockUser(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		const friend = await this.prisma.user.findUnique({
			where: {
				username: username,
			},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		if (!friend) {
			return res.status(204).json({ message: "Friend not found" });
		}

		try {
			await this.prisma.friendsRelation.update({
				where: {
					friendId_friendwithId: {
						friendId: user.id,
						friendwithId: friend.id,
					},
				},
				data: {
					status: "BLOCKED",
					fromId: user.id,
				},
			});
			await this.prisma.friendsRelation.update({
				where: {
					friendId_friendwithId: {
						friendId: friend.id,
						friendwithId: user.id,
					},
				},
				data: {
					status: "BLOCKED",
					fromId: user.id,
				},
			});
			await this.prisma.directMessage.deleteMany({
				where: {
					OR: [
						{
							senderId: user.id,
							receiverId: friend.id,
						},
						{
							senderId: friend.id,
							receiverId: user.id,
						},
					],
				},
			});
		} catch (e) {
			await this.prisma.friendsRelation.create({
				data: {
					friendId: user.id,
					friendwithId: friend.id,
					status: "BLOCKED",
					fromId: user.id,
				},
			});
			await this.prisma.friendsRelation.create({
				data: {
					friendId: friend.id,

					friendwithId: user.id,
					status: "BLOCKED",
					fromId: user.id,
				},
			});
			await this.prisma.directMessage.deleteMany({
				where: {
					OR: [
						{
							senderId: user.id,
							receiverId: friend.id,
						},
						{
							senderId: friend.id,
							receiverId: user.id,
						},
					],
				},
			});
			return res.status(200).json({ message: "Friend relation blocked" });
		}
		return res.status(200).json({ message: "Friend relation blocked" });
	}

	async UnblockUser(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		const friend = await this.prisma.user.findUnique({
			where: {
				username: username,
			},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		if (!friend) {
			return res.status(204).json({ message: "Friend not found" });
		}

		try {
			const relation = await this.prisma.friendsRelation.findUnique({
				where: {
					friendId_friendwithId: {
						friendId: user.id,
						friendwithId: friend.id,
					},
				},
			});
			if (relation.status !== "BLOCKED" || relation.fromId !== user.id) {
				return res
					.status(400)
					.json({ message: "You can't unblock this user" });
			}
			await this.prisma.friendsRelation.delete({
				where: {
					friendId_friendwithId: {
						friendId: user.id,
						friendwithId: friend.id,
					},
				},
			});
			await this.prisma.friendsRelation.delete({
				where: {
					friendId_friendwithId: {
						friendId: friend.id,
						friendwithId: user.id,
					},
				},
			});
		} catch (e) {
			return res
				.status(400)
				.json({ message: "Friend relation not found" });
		}
		return res.status(200).json({ message: "Friend relation unblocked" });
	}

	async GetBlockedUsers(@Res() res: Response, @GetUser() user: any) {
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}

		const friends = await this.prisma.user.findUnique({
			where: {
				login: user.login,
			},
			include: {
				friendwith: true,
			},
		});

		if (!friends) {
			return res.status(204).json({ message: "friends not found" });
		}

		const blockedList = [];
		let j = 0;
		for (let i = 0; i < friends.friendwith.length; i++) {
			const friend = await this.prisma.user.findUnique({
				where: {
					id: friends.friendwith[i].friendId,
				},
				select: {
					username: true,
					id: true,
				},
			});
			if (
				friends.friendwith[i].status === "BLOCKED" &&
				friends.friendwith[i].fromId === user.id
			) {
				blockedList[j] = friend;
				j++;
			}
		}
		return res.status(200).json({ blockedList });
	}

	async UserBlockThisUser(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		const friend = await this.prisma.user.findUnique({
			where: {
				username: username,
			},
		});
		if (!user) {
			return res.status(204).json({ message: "User not found" });
		}
		if (!friend) {
			return res.status(204).json({ message: "Friend not found" });
		}
		try {
			const relation = await this.prisma.friendsRelation.findUnique({
				where: {
					friendId_friendwithId: {
						friendId: user.id,
						friendwithId: friend.id,
					},
				},
			});
			if (relation.status === "BLOCKED") {
				return res.status(200).json({
					message: "User blocked this user",
					isBlocked: true,
				});
			}
		} catch (e) {
			return res
				.status(200)
				.json({ message: "Relation not found", isBlocked: false });
		}
		return res
			.status(200)
			.json({ message: "User not blocked this user", isBlocked: false });
	}
}
