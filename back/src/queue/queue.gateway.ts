import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { PrismaService } from "src/prisma/prisma.service";
import { QueueObject, QueueState, GameMatched, QueueGroup } from "./dto";
import * as jwt from "jsonwebtoken";

import { QueueService } from "./queue.service";
import { GameMode } from "@prisma/client";

@WebSocketGateway({namespace:"queue", cors: {origin: "*"}})
export class QueueGateway { 

	@WebSocketServer()
	server: Server;

	groups: QueueGroup[];
	queue1v1: QueueGroup[] 
	queue2v2: QueueGroup[]
	queueFFA: QueueGroup[]
	gameMatched: GameMatched[]

	constructor(private prisma: PrismaService) {
		this.queue1v1 = [];
		this.queue2v2 = [];
		this.queueFFA = [];
		this.gameMatched = [];
		this.groups = [];
		this.runQueue();
	}
	
	async sleep(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	match2v2(mode: GameMode) {
		let allGroup = []
		let count:number;
		for (const group1 of this.queue2v2)
		{
			count = this.groupCount(group1);
			allGroup = [group1];
			for (const group2 of this.queue2v2)
			{
				if (group1 !== group2 && this.groupCount(group2) + count <= 4)
				{
					allGroup.push(group2);
					count += this.groupCount(group2);
				}
				if (count === 4)
				{
					this.gameMatched.push({group1: allGroup[0], group2: allGroup[1], group3: allGroup.length >= 3 ? allGroup[2] : null, group4: allGroup.length >= 4 ? allGroup[3] : null, time: Date.now(), mode: mode});
					for (const group of allGroup)
						this.queue2v2 = this.queue2v2.filter(groupe => groupe !== group); 
					for (const group of allGroup)
					{
						for (const player of [group.player1, group.player2, group.player3, group.player4])
						{
							if (player)
								this.server.to(player.socketId).emit("GamePopUpSetup", {message: "show"});
						}
					}
					return ;
				}
			}
		}
	}

	matchffa(mode: GameMode) {
		let allGroup = []
		let count:number;
		for (const group1 of this.queueFFA)
		{
			count = this.groupCount(group1);
			allGroup = [group1];
			for (const group2 of this.queueFFA)
			{
				if (group1 !== group2 && this.groupCount(group2) + count <= 4)
				{
					allGroup.push(group2);
					count += this.groupCount(group2);
				}
				if (count === 4)
				{
					for (const group of allGroup)
						this.queueFFA = this.queueFFA.filter(groupe => groupe !== group); 
					this.gameMatched.push({group1: allGroup[0], group2: allGroup[1], group3: allGroup.length >= 3 ? allGroup[2] : null, group4: allGroup.length >= 4 ? allGroup[3] : null, time: Date.now(), mode: mode});
					for (const group of allGroup)
					{
						for (const player of [group.player1, group.player2, group.player3, group.player4])
						{
							if (player)
								this.server.to(player.socketId).emit("GamePopUpSetup", {message: "show"});
						}
					}
					return ;
				}
			}
		}
	}

	checkQueue() { 
		if (this.queue1v1.length >= 2)
		{
			const group1 = this.queue1v1.shift();
			const group2 = this.queue1v1.shift();
			this.gameMatched.push({group1, group2, group3: null, group4: null, time: Date.now(), mode: "ONEVONE"});
			this.server.to(group1.player1.socketId).emit("GamePopUpSetup", {message: "show"});
			this.server.to(group2.player1.socketId).emit("GamePopUpSetup", {message: "show"});
		}
		if (this.queue2v2.length >= 2)
		{
			this.match2v2("TWOVTWO");
		}
		if (this.queueFFA.length >= 2)
		{
			this.matchffa("FREEFORALL");
		}
	}

	oneGroupDeclined(group: QueueGroup) {
		if (!group)
			return (false);
		if ((group.player1 && group.player1.state === QueueState.Declined)
			|| (group.player2 && group.player2.state === QueueState.Declined)
			|| (group.player3 && group.player3.state === QueueState.Declined)
			|| (group.player4 && group.player4.state === QueueState.Declined))
			return (true);
		return (false);
	}

	getAllPlayers(match: GameMatched) {
		const players = [];
		for (const group of [match.group1, match.group2, match.group3, match.group4])
		{
			if (group)
			{
				for (const player of [group.player1, group.player2, group.player3, group.player4])
				{
					if (player)
						players.push(player);
				}
			}
		}
		return (players);
	}

	checkOneDeclined(match : GameMatched) {
		let declineState;
		if (this.oneGroupDeclined(match.group1) || this.oneGroupDeclined(match.group2) || this.oneGroupDeclined(match.group3) || this.oneGroupDeclined(match.group4))
		{
			for (const group of [match.group1, match.group2, match.group3, match.group4])
			{
				if (group)
				{
					declineState = this.oneGroupDeclined(group);
					for (const player of [group.player1, group.player2, group.player3, group.player4])
					{
						if (player && declineState)
							player.state = QueueState.Searching;
						if (player && !declineState)
							player.state = QueueState.Searching;
					}
					if (!declineState)
					{
						if (group.mode === "ONEVONE")
							this.queue1v1.push(group);
						else if (group.mode === "TWOVTWO")
							this.queue2v2.push(group);
						else if (group.mode === "FREEFORALL")
							this.queueFFA.push(group);
					}
					else
						this.groups.push(group);
					for (const player of [group.player1, group.player2, group.player3, group.player4])
					{
						if (player && declineState)
						{
							this.server.to(player.socketId).emit("GamePopUpResponse", {message: "KO"});
							// this.server.to(player.socketId).emit("stateUpdate", 242);
						}
						if (player && !declineState)
						{
							// this.server.to(player.socketId).emit("stateUpdate", 642);
							this.server.to(player.socketId).emit("GamePopUpResponse", {message: "KO", reason: "OtherDeclined"});
						}
					}

				}
			}
			return (true);
		}
		return (false); 
	}
 
	oneGroupAccepted(group: QueueGroup) { 
		if (!group)
			return (true);
		if ((!group.player1 || group.player1.state === QueueState.Accepted)
			&& (!group.player2 || group.player2.state === QueueState.Accepted)
			&& (!group.player3 || group.player3.state === QueueState.Accepted)
			&& (!group.player4 || group.player4.state === QueueState.Accepted))
			return (true);
		
		return (false);
	}


	async checkAllAccepted(match : GameMatched) {
		if (this.oneGroupAccepted(match.group1) && this.oneGroupAccepted(match.group2) && this.oneGroupAccepted(match.group3) && this.oneGroupAccepted(match.group4))
		{
			const players = this.getAllPlayers(match);
			await this.prisma.user.updateMany({
				where: {login: {in: players.map(player => player.login)}}, 
				data: {state: "PLAYING"}});
			let score;
			if (match.mode === "ONEVONE" || match.mode === "TWOVTWO") score = 0;
			else score = 4;
			await this.prisma.game.create({ 
				data: {user1Id: players[0].id, user2Id: players[1].id, user3Id: players[2] ? players[2].id : players[0].id, user4Id: players[3] ? players[3].id : players[1].id, mode: match.mode,
				score1: score, score2: score, score3: score, score4: score, map: match.group1.map}
			});

			players[0].state = QueueState.Searching;
			players[1].state = QueueState.Searching;
			if (players[2])
				players[2].state = QueueState.Searching;
			if (players[3])
				players[3].state = QueueState.Searching;
			if (match.group1)
				this.groups.push(match.group1);
			if (match.group2)
				this.groups.push(match.group2);
			if (match.group3)
				this.groups.push(match.group3);
			if (match.group4)
				this.groups.push(match.group4);
			this.server.to(players[0].socketId).emit("GamePopUpResponse", {message: "OK"});
			this.server.to(players[1].socketId).emit("GamePopUpResponse", {message: "OK"});
			if (players[2])
				this.server.to(players[2].socketId).emit("GamePopUpResponse", {message: "OK"});
			if (players[3])
				this.server.to(players[3].socketId).emit("GamePopUpResponse", {message: "OK"});
			// this.server.to(players[0].socketId).emit("stateUpdate", 97461);
			// this.server.to(players[1].socketId).emit("stateUpdate", 652);
			// if (players[2])
			// 	this.server.to(players[2].socketId).emit("stateUpdate", 465389);
			// if (players[3])
			// 	this.server.to(players[3].socketId).emit("stateUpdate", 89746);
			return (true);
		}
		return (false);
	}

	oneGroupWaiting(group: QueueGroup) {
		if (!group)
			return (false);
		if ((group.player1 && group.player1.state === QueueState.Searching)
			|| (group.player2 && group.player2.state === QueueState.Searching)
			|| (group.player3 && group.player3.state === QueueState.Searching)
			|| (group.player4 && group.player4.state === QueueState.Searching))
			return (true);
		return (false);
	}

	async checkTimeOut(match : GameMatched) {
		if (Date.now() - match.time > 20500)
		{
			for (const group of [match.group1, match.group2, match.group3, match.group4])
			{
				if (this.oneGroupWaiting(group))
				{
					for (const player of [group.player1, group.player2, group.player3, group.player4])
					{
						if (player)
						{
							player.state = QueueState.Searching;
							await this.prisma.user.update({where: {login: player.login}, data: {state: "ONLINE"}});
						}
					}
					this.groups.push(group);
					for (const player of [group.player1, group.player2, group.player3, group.player4])
					{
						if (player)
						{
							this.server.to(player.socketId).emit("GamePopUpResponse", {message: "KO", reason: "TimeOut"});
							// this.server.to(player.socketId).emit("stateUpdate", 645364);
						}
					}
				}
				else if (group)
				{
					for (const player of [group.player1, group.player2, group.player3, group.player4])
					{
						if (player)
						{
							player.state = QueueState.Searching;
							this.server.to(player.socketId).emit("GamePopUpResponse", {message: "KO", reason: "OtherDeclined"});
							// this.server.to(player.socketId).emit("stateUpdate", 846326);
						}
					}
					if (group.mode === "ONEVONE")
						this.queue1v1.push(group);
					else if (group.mode === "TWOVTWO")
						this.queue2v2.push(group);
					else if (group.mode === "FREEFORALL")
						this.queueFFA.push(group);
					for (const player of [group.player1, group.player2, group.player3, group.player4])
					{
						if (player)
						{
							this.server.to(player.socketId).emit("GamePopUpResponse", {message: "KO", reason: "OtherDeclined"});
							// this.server.to(player.socketId).emit("stateUpdate", 845236);
						}
					}
				}
			}
			return (true);
		}
		return (false);
	}

	async checkMatch() {
		let match: GameMatched;

		for (let i = 0; i < this.gameMatched.length; i++)
		{
			match = this.gameMatched[i];
			if (this.checkOneDeclined(match) || await this.checkAllAccepted(match) || await this.checkTimeOut(match))
			{
				this.gameMatched.splice(i, 1);
				break ;
			}
		}
	}

	async runQueue() {
		while (1)
		{
			// console.log("This is the queue: ", this.queue1v1);
			// console.log("===Group====")
			// for (const group of this.groups)
			// 	console.log (group.player1.login, (!group.player2 || group.player2.login), (!group.player3 || group.player3.login), (!group.player4 || group.player4.login)) 
			// console.log("=============");
			// console.log("===Queue1v1====")
			// for (const group of this.queue1v1)
			// 	console.log (group.player1.login, (!group.player2 || group.player2.login), (!group.player3 || group.player3.login), (!group.player4 || group.player4.login)) 
			// console.log("=============");
			// console.log("===Queue2v2====")
			// for (const group of this.queue2v2)
			// 	console.log (group.player1.login, (!group.player2 || group.player2.login), (!group.player3 || group.player3.login), (!group.player4 || group.player4.login)) 
			// console.log("=============");
			// console.log("===QueueFFA====")
			// for (const group of this.queueFFA)
			// 	console.log (group.player1.login, (!group.player2 || group.player2.login), (!group.player3 || group.player3.login), (!group.player4 || group.player4.login)) 
			// console.log("=============");
			 
			this.checkQueue();
			
			await this.checkMatch();

			await this.sleep(3000);
		}
	}

	findInQueue(socketId: string) {
		for (const queuer of this.queue1v1)
		{
			if (queuer.player1.socketId === socketId)
				return (queuer.player1);
		}
		for (const queuer of this.queue2v2)
		{
			if (queuer.player1.socketId === socketId)
				return (queuer.player1);
			if (queuer.player2 && queuer.player2.socketId === socketId)
				return (queuer.player2);
			if (queuer.player3 && queuer.player3.socketId === socketId)
				return (queuer.player3);
			if (queuer.player4 && queuer.player4.socketId === socketId)
				return (queuer.player4);
		}
		for (const queuer of this.queueFFA)
		{
			if (queuer.player1.socketId === socketId)
				return (queuer.player1);
			if (queuer.player2 && queuer.player2.socketId === socketId)
				return (queuer.player2);
			if (queuer.player3 && queuer.player3.socketId === socketId)
				return (queuer.player3);
			if (queuer.player4 && queuer.player4.socketId === socketId)
				return (queuer.player4);
		}
		return (null);
	}

	findMe(socketId: string)
	{
		for (const queuer of this.queue1v1)
		{
			if (queuer.player1.socketId === socketId)
				return (queuer.player1);
		}
		for (const queuer of this.queue2v2)
		{
			if (queuer.player1.socketId === socketId)
				return (queuer.player1);
			if (queuer.player2 && queuer.player2.socketId === socketId)
				return (queuer.player2);
			if (queuer.player3 && queuer.player3.socketId === socketId)
				return (queuer.player3);
			if (queuer.player4 && queuer.player4.socketId === socketId)
				return (queuer.player4);
		}
		for (const queuer of this.queueFFA)
		{
			if (queuer.player1.socketId === socketId)
				return (queuer.player1);
			if (queuer.player2 && queuer.player2.socketId === socketId)
				return (queuer.player2);
			if (queuer.player3 && queuer.player3.socketId === socketId)
				return (queuer.player3);
			if (queuer.player4 && queuer.player4.socketId === socketId)
				return (queuer.player4);
		}
		for (const queuer of this.groups)
		{
			if (queuer.player1.socketId === socketId)
				return (queuer.player1);
			if (queuer.player2 && queuer.player2.socketId === socketId)
				return (queuer.player2);
			if (queuer.player3 && queuer.player3.socketId === socketId)
				return (queuer.player3);
			if (queuer.player4 && queuer.player4.socketId === socketId)
				return (queuer.player4);
		}
		return (null);
	}

	findPlayer(login: string)
	{
		for (const queuer of this.groups)
		{
			if (queuer.player1.login === login)
				return (queuer.player1);
			if (queuer.player2 && queuer.player2.login === login)
				return (queuer.player2);
			if (queuer.player3 && queuer.player3.login === login)
				return (queuer.player3);
			if (queuer.player4 && queuer.player4.login === login)
				return (queuer.player4);
		}
		return (null);
	}

	findMyGroup(socketId: string) {
		for (const queuer of this.queue1v1)
		{
			if (queuer.player1.socketId === socketId || (queuer.player2 && queuer.player2.socketId === socketId) || (queuer.player3 && queuer.player3.socketId === socketId) || (queuer.player4 && queuer.player4.socketId === socketId))
				return (queuer);
		}
		for (const queuer of this.queue2v2)
		{
			if (queuer.player1.socketId === socketId || (queuer.player2 && queuer.player2.socketId === socketId) || (queuer.player3 && queuer.player3.socketId === socketId) || (queuer.player4 && queuer.player4.socketId === socketId))
				return (queuer);
		}
		for (const queuer of this.queueFFA)
		{
			if (queuer.player1.socketId === socketId || (queuer.player2 && queuer.player2.socketId === socketId) || (queuer.player3 && queuer.player3.socketId === socketId) || (queuer.player4 && queuer.player4.socketId === socketId))
				return (queuer);
		}
		for (const queuer of this.groups)
		{
			if (queuer.player1.socketId === socketId || (queuer.player2 && queuer.player2.socketId === socketId) || (queuer.player3 && queuer.player3.socketId === socketId) || (queuer.player4 && queuer.player4.socketId === socketId))
				return (queuer);
		}
		return (null);
	}


	groupCount(group: QueueGroup) {
		let count = 0;
		if (group.player1)
			count++;
		if (group.player2)
			count++;
		if (group.player3)
			count++;
		if (group.player4)
			count++;
		return (count);
	}

	add1v1GroupToQueue(group: QueueGroup) {
		if (this.groupCount(group) === 1)
		{
			group.timeData = Date.now();
			this.queue1v1.push(group)
			this.groups = this.groups.filter((groupe) => groupe.player1.socketId !== group.player1.socketId);
		}
		else if (this.groupCount(group) === 2)
		{
			this.gameMatched.push({group1: group, group2: null, group3: null, group4: null, time: Date.now(), mode: group.mode});
			this.server.to(group.player1.socketId).emit("GamePopUpSetup", {message: "show"});
			this.server.to(group.player2.socketId).emit("GamePopUpSetup", {message: "show"});
			this.groups = this.groups.filter((groupe) => groupe.player1.socketId !== group.player1.socketId);
		}
		else
			return (false);
		return (true);
	}

	add2v2GroupToQueue(group: QueueGroup) {
		if (this.groupCount(group) === 1 || this.groupCount(group) === 2)
		{
			group.timeData = Date.now();
			this.queue2v2.push(group);
			this.groups = this.groups.filter((groupe) => groupe.player1.socketId !== group.player1.socketId);
		}
		else if (this.groupCount(group) === 4)
		{
			this.gameMatched.push({group1: group, group2: null, group3: null, group4: null, time: Date.now(), mode: group.mode});
			this.server.to(group.player1.socketId).emit("GamePopUpSetup", {message: "show"});
			this.server.to(group.player2.socketId).emit("GamePopUpSetup", {message: "show"});
			this.server.to(group.player3.socketId).emit("GamePopUpSetup", {message: "show"});
			this.server.to(group.player4.socketId).emit("GamePopUpSetup", {message: "show"});
			this.groups = this.groups.filter((groupe) => groupe.player1.socketId !== group.player1.socketId);

		}
		else 
			return (false);
		return (true);
	}

	addFFAGroupToQueue(group: QueueGroup) {
		if (this.groupCount(group) === 1 || this.groupCount(group) === 2 || this.groupCount(group) === 3)
		{
			group.timeData = Date.now();
			this.queueFFA.push(group);
			this.groups = this.groups.filter((groupe) => groupe.player1.socketId !== group.player1.socketId);
		}
		else if (this.groupCount(group) === 4)
		{
			this.gameMatched.push({group1: group, group2: null, group3: null, group4: null, time: Date.now(), mode: group.mode});
			this.server.to(group.player1.socketId).emit("GamePopUpSetup", {message: "show"});
			this.server.to(group.player2.socketId).emit("GamePopUpSetup", {message: "show"});
			this.server.to(group.player3.socketId).emit("GamePopUpSetup", {message: "show"});
			this.server.to(group.player4.socketId).emit("GamePopUpSetup", {message: "show"});
			this.groups = this.groups.filter((groupe) => groupe.player1.socketId !== group.player1.socketId);
		}
		else
			return (false);
		return (true);
	}

	addGroupToQueue(group: QueueGroup) {
		if (group.mode === "ONEVONE")
			return (this.add1v1GroupToQueue(group));
		if (group.mode === "TWOVTWO")
			return (this.add2v2GroupToQueue(group));
		if (group.mode === "FREEFORALL")
			return (this.addFFAGroupToQueue(group));
		return (false);
	}

	leaveGroup(client: Socket, login: string, update = true) {
		let me: QueueObject;
		
		for (const group of this.groups)
		{
			if (group.player1.socketId === client.id || (login && group.player1.login === login))
			{
				if (login)
					this.groups = this.groups.filter((groupe) => groupe.player1.login !== login);
				else
					this.groups = this.groups.filter((groupe) => groupe.player1.socketId !== client.id);
			
				me = group.player1;
				if (group.player2)
				{
					this.recreateGroup(group.player2);
				}
				if (group.player3)
				{
					this.recreateGroup(group.player3);
				}
				if (group.player4)
				{
					this.recreateGroup(group.player4);
				}

				return me;
			}
			if (group.player2 && ((group.player2.socketId === client.id) || (login && group.player2.login === login)))
			{
				me = group.player2;
				group.player2 = group.player3;
				group.player3 = group.player4;
				group.player4 = null;
			}
			else if (group.player3 && ((group.player3.socketId === client.id) || (login && group.player3.login === login)))
			{
				me = group.player3;
				group.player3 = group.player4;
				group.player4 = null;
			}
			else if (group.player3 && ((group.player3.socketId === client.id) || (login && group.player3.login === login)))
			{
				me = group.player4; 
				group.player4 = null;
			}	
			else
				continue ;
			if (update)
			{
				this.updateGroup(group); 
			}
			return me;
		}
	}

	async joinGroup(client: Socket, me: QueueObject, groupParam: any) {
		for (const group of this.groups)
		{
			if (group.player1.login === groupParam.groupLogin)
			{
				if (group.player2 === null)
					group.player2 = me;
				else if (group.player3 === null)
					group.player3 = me;
				else if (group.player4 === null)
					group.player4 = me;
				else
				{
					this.recreateGroup(me);
					return client.emit("groupFull");
				}

				let count = this.groupCount(group);
				if (count === 3)
					group.mode = "FREEFORALL";
				if (count === 4 && group.mode === "ONEVONE")
					group.mode = "TWOVTWO";

				this.updateGroup(group);
				break ;
			}
		}
	}

	recreateGroup(player: QueueObject) {
		this.groups.push( {player1: player, player2: null, player3: null, player4: null, mode: "ONEVONE", map: "NORMAL", timeData: null});
		this.updateGroup(this.findMyGroup(player.socketId));
	}

	async createGroup(login: string, client: Socket) {
		const prismaUser = await this.prisma.user.findFirst({where: {login: login}});
		if (!prismaUser)
			return client.emit("close");
		this.leaveGroup(client, login);
		this.groups.push( {player1:{
			id: prismaUser.id,
			login: login,
			socketId: client.id,
			state : QueueState.Searching,
			}, player2: null, player3: null, player4: null, mode: "ONEVONE", map: "NORMAL", timeData: null});
		this.updateGroup(this.findMyGroup(client.id));
	}

	async handleConnection(client: Socket) { 
		// console.log("Queue Server Connection", client.id);
		const cookie = client.handshake.headers.cookie;
		if (!cookie)
			return ;
		const parsedCookie = cookie.split("; ").find((cook) => cook.startsWith("jwt="))?.replace("jwt=", "");
		if (!parsedCookie)
			return ;
		let decoded: any;
		try {
			decoded = jwt.verify(parsedCookie, process.env.JWT_SECRET);
		} catch (err) {
			return ;
		}
		this.createGroup(decoded.login, client);
		const prismaUser = await this.prisma.user.findFirst({where: {login: decoded.login}});
		if (!prismaUser)
			return ;
		if (prismaUser.state !== "PLAYING")
			await this.prisma.user.update({where: {id: prismaUser.id}, data: {state: "ONLINE"}});
		client.emit("stateUpdate", 63523);
		return ;
	}

	async setOffline(client: Socket) {
		const me = this.findMe(client.id);
		if (!me)
			return ;
		const prismaUser = await this.prisma.user.findFirst({where: {login: me.login}});
		if (!prismaUser)
			return ;
		if (prismaUser.state !== "PLAYING")
			await this.prisma.user.update({where: {id: prismaUser.id}, data: {state: "OFFLINE"}});
		return ;
	}
 
	async handleDisconnect(client: Socket) { 
		this.setOffline(client);
		this.leaveGroup(client, undefined);
		const group = this.findMyGroup(client.id);
		if (!group)
			return ;
		this.queue1v1 = this.queue1v1.filter((queuer) => queuer.player1.socketId !== group.player1.socketId);
		this.queue2v2 = this.queue2v2.filter((queuer) => queuer.player1.socketId !== group.player1.socketId);
		this.queueFFA = this.queueFFA.filter((queuer) => queuer.player1.socketId !== group.player1.socketId);
		
		if (this.groupCount(group) > 1)
		{
			if (group.player1 && group.player1.socketId !== client.id)
			{
				await this.prisma.user.update({where: {login: group.player1.login},
					data: {state: "ONLINE"}});
				this.recreateGroup(group.player1);
			}
			if (group.player2 && group.player2.socketId !== client.id)
			{
				await this.prisma.user.update({where: {login: group.player2.login},
					data: {state: "ONLINE"}});
				this.recreateGroup(group.player2);
			}
			if (group.player3 && group.player3.socketId !== client.id)
			{
				await this.prisma.user.update({where: {login: group.player3.login},
					data: {state: "ONLINE"}});
				this.recreateGroup(group.player3);
			}	
			if (group.player4 && group.player4.socketId !== client.id)
			{
				await this.prisma.user.update({where: {login: group.player4.login},
					data: {state: "ONLINE"}});
				this.recreateGroup(group.player4);
			}
		}
		this.server.to(group.player1.socketId).emit("DisconnectFromQueueResponse", {message: "OK"});
		if (group.player2)
			this.server.to(group.player2.socketId).emit("DisconnectFromQueueResponse", {message: "OK"});
		if (group.player3)
			this.server.to(group.player3.socketId).emit("DisconnectFromQueueResponse", {message: "OK"});
		if (group.player4)
			this.server.to(group.player4.socketId).emit("DisconnectFromQueueResponse", {message: "OK"});
	}

	@SubscribeMessage("ConnectToQueue")
	async connectToQueue(@ConnectedSocket() client: Socket) {
		const groupUser = this.groups.find((group) => group.player1.socketId === client.id);
		if (!groupUser)
			return ;
		
		let ret = this.addGroupToQueue(groupUser);
		if (!ret)
			return client.emit("notPossible");

		await this.prisma.user.update({
			where: {login: groupUser.player1.login},
			data: {state: "SEARCHING"}
		});
		if (groupUser.player2)
			await this.prisma.user.update({
				where: {login: groupUser.player2.login},
				data: {state: "SEARCHING"}
			});
		if (groupUser.player3)
			await this.prisma.user.update({
				where: {login: groupUser.player3.login},
				data: {state: "SEARCHING"}
			});
		if (groupUser.player4)
			await this.prisma.user.update({
				where: {login: groupUser.player4.login},
				data: {state: "SEARCHING"}
			});

		//const user = this.queue1v1.find((queuer) => queuer.socketId === client.id);
		//if (!user)
		//	return ;
		// console.log("groupUser: ", groupUser);
		this.server.to(groupUser.player1.socketId).emit("ConnectToQueueResponse", {message: "OK", user: groupUser});
		if (groupUser.player2)
			this.server.to(groupUser.player2.socketId).emit("ConnectToQueueResponse", {message: "OK", user: groupUser});
		if (groupUser.player3)
			this.server.to(groupUser.player3.socketId).emit("ConnectToQueueResponse", {message: "OK", user: groupUser});
		if (groupUser.player4)
			this.server.to(groupUser.player4.socketId).emit("ConnectToQueueResponse", {message: "OK", user: groupUser});
	}

	@SubscribeMessage("DisconnectFromQueue")
	async disconnectFromQueue(@ConnectedSocket() client: Socket) {
		const group = this.findMyGroup(client.id);
		if (!group)
			return ;
		

		this.queue1v1 = this.queue1v1.filter((queuer) => queuer.player1.socketId !== group.player1.socketId);  
		this.queue2v2 = this.queue2v2.filter((queuer) => queuer.player1.socketId !== group.player1.socketId);
		this.queueFFA = this.queueFFA.filter((queuer) => queuer.player1.socketId !== group.player1.socketId);
		if (this.groups.includes(group) === false)
			this.groups.push(group);

		await this.prisma.user.update({
			where: {login: group.player1.login},
			data: {state: "ONLINE"}
		});
		if (group.player2)
			await this.prisma.user.update({
				where: {login: group.player2.login},
				data: {state: "ONLINE"}
			});
		if (group.player3)
			await this.prisma.user.update({
				where: {login: group.player3.login},
				data: {state: "ONLINE"}
			});
		if (group.player4)
			await this.prisma.user.update({
				where: {login: group.player4.login},
				data: {state: "ONLINE"}
			}); 
		
		this.server.to(group.player1.socketId).emit("DisconnectFromQueueResponse", {message: "OK"});
		if (group.player2)
			this.server.to(group.player2.socketId).emit("DisconnectFromQueueResponse", {message: "OK"});
		if (group.player3)
			this.server.to(group.player3.socketId).emit("DisconnectFromQueueResponse", {message: "OK"});
		if (group.player4)
			this.server.to(group.player4.socketId).emit("DisconnectFromQueueResponse", {message: "OK"});
	}

	@SubscribeMessage("LeaveGroup")
	async handleLeaveGroup(@ConnectedSocket() client: Socket) {
		const me: QueueObject = this.leaveGroup(client, undefined);
		const prismaUser = await this.prisma.user.findFirst({where: {login: me.login}});
		if (!prismaUser)
			return client.emit("close");
		this.groups.push( {player1:{
			id: prismaUser.id,
			login: me.login,
			socketId: client.id,
			state : QueueState.Searching,
			}, player2: null, player3: null, player4: null, mode: "ONEVONE", map: "NORMAL", timeData: null});
		this.updateGroup(this.findMyGroup(client.id));
		
	}

	@SubscribeMessage("JoinGroup")
	async handleJoinGroup(@ConnectedSocket() client: Socket, @MessageBody() groupParam: any) {
		const groupLeader = await this.prisma.user.findUnique({where: {login: groupParam.groupLogin}});
		if (!groupLeader)
			return ;
		if (groupLeader.state !== "ONLINE")
			return ;
		const me: QueueObject = this.leaveGroup(client, undefined, true);
		if (me.login === groupParam.groupLogin)
			this.recreateGroup(me);
		else
		{
			this.joinGroup(client, me, groupParam);
		}
	}

	@SubscribeMessage("InviteGroup")
	async handleInviteGroup(@ConnectedSocket() client: Socket, @MessageBody() invitedPlayer: any) {
		const prismaInvited = await this.prisma.user.findUnique({where: {id: invitedPlayer.id}});
		if (!prismaInvited)
			return ;
		if (prismaInvited.state !== "ONLINE")
			return ;
		const invited = this.findPlayer(prismaInvited.login);
		if (!invited)
		return ;
		const me = this.findMe(client.id);
		// console.log(me)
		if (!me)
			return ;
		if (me.login === prismaInvited.login)
			return ;
		const prismaMe = await this.prisma.user.findUnique({where: {login: me.login}});
		if (!prismaMe)
			return ;
		
		this.server.to(invited.socketId).emit("InviteGroupReceive", {login: prismaMe.login, avatar: prismaMe.avatar});
	}

	@SubscribeMessage("AcceptGame")
	acceptGame(@ConnectedSocket() client: Socket) {
		let groups = [];
		for (const gameMatch of this.gameMatched) {
			groups.push(gameMatch.group1);
			if (gameMatch.group2)
				groups.push(gameMatch.group2);
			if (gameMatch.group3)
				groups.push(gameMatch.group3);
			if (gameMatch.group4)
				groups.push(gameMatch.group4);
			for (const group of groups) {
				if (group.player1 && group.player1.socketId === client.id && group.player1.state === QueueState.Searching)
					group.player1.state = QueueState.Accepted;
				if (group.player2 && group.player2.socketId === client.id && group.player2.state === QueueState.Searching)
					group.player2.state = QueueState.Accepted;
				if (group.player3 && group.player3.socketId === client.id && group.player3.state === QueueState.Searching)
					group.player3.state = QueueState.Accepted;
				if (group.player4 && group.player4.socketId === client.id && group.player4.state === QueueState.Searching)
					group.player4.state = QueueState.Accepted;
			}
		}
	}
 
	@SubscribeMessage("DeclineGame")
	async declineGame(@ConnectedSocket() client: Socket) {
		let groups = [];
		for (const gameMatch of this.gameMatched) {
			groups.push(gameMatch.group1);
			if (gameMatch.group2)
				groups.push(gameMatch.group2);
			if (gameMatch.group3)
				groups.push(gameMatch.group3);
			if (gameMatch.group4)
				groups.push(gameMatch.group4);
			for (const group of groups) {
				if (group.player1 && group.player1.socketId === client.id && group.player1.state === QueueState.Searching)
				{
					group.player1.state = QueueState.Declined;
					await this.prisma.user.update({
						where: {login: group.player1.login},
						data: {state: "ONLINE"}
					});
					this.server.to(group.player1.socketId).emit("DeclineGameResponse", {message: "Declined"});
				}
				if (group.player2 && group.player2.socketId === client.id && group.player2.state === QueueState.Searching)
				{
					group.player2.state = QueueState.Declined;
					await this.prisma.user.update({
						where: {login: group.player2.login},
						data: {state: "ONLINE"}
					});
					this.server.to(group.player2.socketId).emit("DeclineGameResponse", {message: "Declined"});
				}	
				if (group.player3 && group.player3.socketId === client.id && group.player3.state === QueueState.Searching)
				{
					group.player3.state = QueueState.Declined;
					await this.prisma.user.update({
						where: {login: group.player3.login},
						data: {state: "ONLINE"}
					});
					this.server.to(group.player3.socketId).emit("DeclineGameResponse", {message: "Declined"});
				}	
				if (group.player4 && group.player4.socketId === client.id && group.player4.state === QueueState.Searching)
				{
					group.player4.state = QueueState.Declined;
					await this.prisma.user.update({
						where: {login: group.player4.login},
						data: {state: "ONLINE"}
					});
					this.server.to(group.player4.socketId).emit("DeclineGameResponse", {message: "Declined"});
				}	
			}
		}
	}

	@SubscribeMessage("Timer")
	timer(@ConnectedSocket() client: Socket) {

		const group = this.findMyGroup(client.id);
		if (!group)
			return ;
		client.emit("TimerResponse", {message: (Date.now() - group.timeData) / 1000});
	}

	@SubscribeMessage("ChatWithGroup")
	chatWithGroup(@ConnectedSocket() client: Socket, @MessageBody() message: any) {
		const group = this.findMyGroup(client.id);
		if (!group)
			return ;
		let me: QueueObject;
		if (group.player1 && group.player1.socketId === client.id)
			me = group.player1;
		else if (group.player2 && group.player2.socketId === client.id)
			me = group.player2;
		else if (group.player3 && group.player3.socketId === client.id)
			me = group.player3;
		else if (group.player4 && group.player4.socketId === client.id)
			me = group.player4;
		group.player1 && this.server.to(group.player1.socketId).emit("GetNewMessage", {message: message.message, login: me.login});
		group.player2 && this.server.to(group.player2.socketId).emit("GetNewMessage", {message: message.message, login: me.login});
		group.player3 && this.server.to(group.player3.socketId).emit("GetNewMessage", {message: message.message, login: me.login});
		group.player4 && this.server.to(group.player4.socketId).emit("GetNewMessage", {message: message.message, login: me.login});
	} 

	@SubscribeMessage("imInQueue")
	async imInQueue(@ConnectedSocket() client: Socket) {
		const user = this.findInQueue(client.id);
		if (!user)
		{
			const cookie = client.handshake.headers.cookie;
			if (!cookie)
				return ;
			const parsedCookie = cookie.split("; ").find((cook) => cook.startsWith("jwt=")).replace("jwt=", "");
			const decoded: any = jwt.verify(parsedCookie, process.env.JWT_SECRET);
			await this.prisma.user.update({
				where: {login: decoded.login},
				data: {state: "ONLINE"}
			});
			client.emit("imInQueueResponse", {in: false});
			return ;
		}

		const group = this.findMyGroup(client.id);
		let allPlayer = []

		for (const player of [group.player1, group.player2, group.player3, group.player4])
		{
			if (player)
			{
				const prismaUser = await this.prisma.user.findUnique({
					where: {login: player.login}
				});
				if (!prismaUser)
					break ;
				allPlayer.push({elo: prismaUser.elo, login: prismaUser.login, avatar: prismaUser.avatar, socketId: player.socketId});
			}
		}
		client.emit("imInQueueResponse", {player1: {elo: allPlayer[0].elo, login: allPlayer[0].login, avatar: allPlayer[0].avatar},
			player2: allPlayer.length >= 2 ? {elo: allPlayer[1].elo, login: allPlayer[1].login, avatar: allPlayer[1].avatar} : null,
			player3: allPlayer.length >= 3 ? {elo: allPlayer[2].elo, login: allPlayer[2].login, avatar: allPlayer[2].avatar} : null,
			player4: allPlayer.length >= 4 ? {elo: allPlayer[3].elo, login: allPlayer[3].login, avatar: allPlayer[3].avatar} : null,
			in: true});
	}

	async updateGroup(group: QueueGroup) {
		const allPlayers = [];
		let prismaUser;
		for (const player of [group.player1, group.player2, group.player3, group.player4])
		{
			if (player)
			{
				prismaUser =  await this.prisma.user.findUnique({
					where: {login: player.login}
				});
				if (!prismaUser)
					continue ;
				
				allPlayers.push({level: prismaUser.experience, pseudo: prismaUser.username, avatar: prismaUser.avatar, status: prismaUser.state});
			}
		}
		this.server.to(group.player1.socketId).emit("UpdateGroupResponse", {players: allPlayers, mode: group.mode, map: group.map});
		if (group.player2)
			this.server.to(group.player2.socketId).emit("UpdateGroupResponse", {players: allPlayers, mode: group.mode, map: group.map});
		if (group.player3)
			this.server.to(group.player3.socketId).emit("UpdateGroupResponse", {players: allPlayers, mode: group.mode, map: group.map});
		if (group.player4)
			this.server.to(group.player4.socketId).emit("UpdateGroupResponse", {players: allPlayers, mode: group.mode, map: group.map});
	}

	@SubscribeMessage("UpdateGroup")
	async handleUpdateGroup(@ConnectedSocket() client: Socket, @MessageBody() message: any) {
		const group = this.findMyGroup(client.id);
		if (!group)
			return ;
		if (!group.player1 || group.player1.socketId !== client.id)
			return ;
		if (message.type === "MODE")
		{
			if (this.groupCount(group) <= 2 || (this.groupCount(group) === 3 && message.value !== "ONEVONE" && message.value !== "TWOVTWO") || (this.groupCount(group) === 4 && message.value !== "ONEVONE") )
				group.mode = message.value;
		}
		if (message.type === "MAP")
			group.map = message.value;
		this.updateGroup(group);
	}

	@SubscribeMessage("GetMyGroup")
	async handleGetMyGroup(@ConnectedSocket() client: Socket) {
		const group = this.findMyGroup(client.id);
		if (!group)
			return ;
		const allPlayers = [];
		let prismaUser;
		for (const player of [group.player1, group.player2, group.player3, group.player4])
		{
			if (player)
			{
				prismaUser =  await this.prisma.user.findUnique({
					where: {login: player.login}
				});
				if (!prismaUser)
					continue ;
				
				allPlayers.push({level: prismaUser.experience, pseudo: prismaUser.username, avatar: prismaUser.avatar, status: prismaUser.state});
			}
		}
		client.emit("UpdateGroupResponse", {players: allPlayers, mode: group.mode, map: group.map});
	}

	@SubscribeMessage("updateMyState")
	async handleUpdateMyState(@ConnectedSocket() client: Socket) {
		const me = this.findMe(client.id);
		if (!me)
			return ;
		const prismaMe = await this.prisma.user.findFirst({
			where: {login: me.login},
		});
		if (!prismaMe)
			return ;
		if (prismaMe.state !== "OFFLINE")
			client.emit("updateMyStateResponse", {state: prismaMe.state});
		else
		{
			this.prisma.user.update({
				where: {login: me.login},
				data: {state: "ONLINE"}
			});
			client.emit("updateMyStateResponse", {state: "ONLINE"});
		}
	}
}