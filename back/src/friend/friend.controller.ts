import { Controller, Get, Param, Patch, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { FriendService } from "./friend.service";
import { GetUser } from "src/auth/decorator";

@Controller("friend")
export class FriendController {
	constructor(private friendService: FriendService) {}

	@Post("add/:username")
	async AddFriend(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.friendService.AddFriend(username, res, user);
	}

	@Post("remove/:username")
	async RemoveFriend(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.friendService.RemoveFriend(username, res, user);
	}

	@Patch("accept/:username")
	async AcceptFriend(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.friendService.AcceptFriend(username, res, user);
	}

	@Patch("decline/:username")
	async DeclineFriend(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.friendService.DeclineFriend(username, res, user);
	}

	@Get("friends")
	async GetFriends(@Res() res: Response, @GetUser() user: any) {
		return await this.friendService.GetFriends(res, user);
	}

	@Post("block/:username")
	async BlockUser(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.friendService.BlockUser(username, res, user);
	}

	@Post("unblock/:username")
	async UnblockUser(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.friendService.UnblockUser(username, res, user);
	}

	@Get("blocked")
	async GetBlocked(@Res() res: Response, @GetUser() user: any) {
		return await this.friendService.GetBlockedUsers(res, user);
	}

	@Get("blockbyme/:username")
	async GetIBlocked(
		@Param("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.friendService.UserBlockThisUser(username, res, user);
	}
}
