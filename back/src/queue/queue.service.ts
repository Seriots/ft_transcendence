import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddQueueDto, QueueObject } from './dto';

@Injectable()
export class QueueService {

	constructor(private prisma: PrismaService) {}

	async checkPermission(userLogin: string) {
		if (!userLogin)
			return ({canJoin: false, reason: "User not found or not online"});
		const user = await this.prisma.user.findUnique({
			where: {login: userLogin,}});
		if (!user || user.state === "OFFLINE")
			return ({canJoin: false, reason: "User not found or not online"});
		if (user.state === "PLAYING")
		{
			const game = await this.prisma.game.findFirst({
				where: {OR: [{state: "CREATING", user1Id: user.id}, {state: "PLAYING", user1Id: user.id},
					{state: "CREATING", user2Id: user.id}, {state: "PLAYING", user2Id: user.id},
					{state: "CREATING", user3Id: user.id}, {state: "PLAYING", user3Id: user.id},
					{state: "CREATING", user4Id: user.id}, {state: "PLAYING", user4Id: user.id}]}
			});
			if (game)
				return ({canJoin: false, reason: "playing", gameId: game.id, login: userLogin});

		}
		if (user.state === "SEARCHING")
			return ({canJoin: false, reason: "searching", login: userLogin});
		return ({canJoin: true, login: userLogin});
	}

	//async addToQueue(userLogin: string, dto: AddQueueDto) {
	//	const user = await this.prisma.user.findUnique({
	//		where: {login: userLogin,}});
	//	if (!user || user.state !== "ONLINE")
	//		return ;

	//	if (!this.getUserInQueue(userLogin))
	//		this.queue1v1.push({id:user.id, login: userLogin,
	//			socketId: undefined,
	//			mode: dto.mode,elo: user.elo,
	//			bonus1: (dto.bonus1 == undefined) ? false : true,
	//			bonus2: (dto.bonus2 == undefined) ? false : true,
	//			timeData: Date.now()
	//			});
	//	return await this.prisma.user.update({
	//		where: {login: userLogin,},
	//		data: {state: "SEARCHING",}
	//	});
	//}

	//async removeFromQueue(userLogin: string) {
	//	const user = await this.prisma.user.findUnique({
	//		where: {login: userLogin,}});
	//	console.log("remove: ", this.queue1v1)
	//	if (!user || user.state === "PLAYING")
	//		return ;
		
	//	if (this.getUserInQueue(userLogin))
	//		this.queue1v1.splice(this.queue1v1.indexOf(this.getUserInQueue(userLogin)), 1);
	//	return await this.prisma.user.update({
	//		where: {login: userLogin,},
	//		data: {state: "ONLINE",}
	//	});
	//}
}