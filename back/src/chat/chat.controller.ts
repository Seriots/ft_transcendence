import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Res,
} from "@nestjs/common";
import { Response } from "express";
import { ChatService } from "./chat.service";
import { GetUser } from "src/auth/decorator";

@Controller("chat")
export class ChatController {
	constructor(private chatService: ChatService) {}

	@Post("create/:channel")
	async CreateChannel(
		@Param("channel") channel: string,
		@Body("state") state: string,
		@Body("password") password: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		if (state === "PUBLIC" || state === "PRIVATE")
			return await this.chatService.CreateChannel(
				channel,
				state,
				res,
				user
			);
		else if (state === "PROTECTED")
			return await this.chatService.CreateProtectedChannel(
				channel,
				password,
				res,
				user
			);
		else return res.status(400).json({ message: "Invalid channel state" });
	}

	@Patch("edit/:channel")
	async EditChannel(
		@Param("channel") channel: string,
		@Body("name") name: string,
		@Body("state") state: string,
		@Body("password") password: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		if (state === "PUBLIC" || state === "PRIVATE")
			return await this.chatService.EditChannel(
				channel,
				name,
				state,
				res,
				user
			);
		else if (state === "PROTECTED")
			return await this.chatService.EditProtectedChannel(
				channel,
				name,
				password,
				res,
				user
			);
		else return res.status(400).json({ message: "Invalid channel state" });
	}

	@Post("join/:channel")
	async JoinChannel(
		@Param("channel") channel: string,
		@Body("state") state: string,
		@Body("password") password: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		console.log({ password });
		console.log({ state });
		if (password && state === "PROTECTED") {
			return await this.chatService.JoinProtectedChannel(
				channel,
				password,
				res,
				user
			);
		} else if (state === "PRIVATE") {
			return await this.chatService.JoinPrivateChannel(
				channel,
				res,
				user
			);
		} else if (state === "PUBLIC") {
			return await this.chatService.JoinChannel(channel, res, user);
		} else {
			return res.status(400).json({ message: "Invalid channel state" });
		}
	}

	@Post("invite/:channel")
	async InviteUser(
		@Param("channel") channel: string,
		@Body("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.chatService.InviteToChannel(
			channel,
			username,
			res,
			user
		);
	}

	@Delete("decline/:channel")
	async DeclineInvite(
		@Param("channel") channel: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.chatService.DeclineInvite(channel, res, user);
	}

	@Get("invites")
	async GetInvites(@Res() res: Response, @GetUser() user: any) {
		return await this.chatService.GetInvites(res, user);
	}

	@Post("admin/promote/:channel")
	async AddAdminUser(
		@Param("channel") channel: string,
		@Body("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.chatService.AddAdminUser(
			channel,
			username,
			res,
			user
		);
	}

	@Post("admin/demote/:channel")
	async RemoveAdminUser(
		@Param("channel") channel: string,
		@Body("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.chatService.RemoveAdminUser(
			channel,
			username,
			res,
			user
		);
	}

	@Get("admin/:channel")
	async GetAdmins(@Param("channel") channel: string, @Res() res: Response) {
		return await this.chatService.GetAdmins(channel, res);
	}

	@Delete("leave/:channel")
	async LeaveChannel(
		@Param("channel") channel: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.chatService.LeaveChannel(channel, res, user);
	}

	@Get("channels")
	async getChannels(@Res() res: Response) {
		return await this.chatService.getChannels(res);
	}

	@Get("channel/:channel")
	async getChannel(@Param("channel") channel: string, @Res() res: Response) {
		return await this.chatService.getChannel(channel, res);
	}

	@Get("ban/:username")
	async getBan(@Param("username") username: string, @Res() res: Response) {
		return await this.chatService.getBan(username, res);
	}
	@Get("mute/:username")
	async getMute(@Param("username") username: string, @Res() res: Response) {
		return await this.chatService.getMute(username, res);
	}
	@Get("bans/:channel")
	async getBans(@Param("channel") channel: string, @Res() res: Response) {
		return await this.chatService.getBans(channel, res);
	}
	@Get("mutes/:channel")
	async getMutes(@Param("channel") channel: string, @Res() res: Response) {
		return await this.chatService.getMutes(channel, res);
	}

	@Get("dm")
	async getDM(@Res() res: Response, @GetUser() user: any) {
		return await this.chatService.getDMs(res, user);
	}

	@Post("dm/create")
	async CreateDM(
		@Body("username") username: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.chatService.CreateDM(username, res, user);
	}

	@Get("dm/messages/:id")
	async getDMMessages(
		@Param("id") id: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.chatService.getDMMessages(id, res, user);
	}

	@Get("channel/messages/:id")
	async getChannelMessages(
		@Param("id") id: string,
		@Res() res: Response,
		@GetUser() user: any
	) {
		return await this.chatService.getChannelMessages(id, res, user);
	}
}
