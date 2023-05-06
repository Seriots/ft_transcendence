import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Res,
	UseInterceptors,
	UploadedFile,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { Response } from "express";
import { UpdateUserDto } from "./dto";
import { GetUser } from "src/auth/decorator";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("users")
export class UserController {
	constructor(private userService: UserService) {}

	@Get("me")
	async GetUser(@Res() res: Response, @GetUser() user: any) {
		return res.status(200).json(user);
	}

	@Get("login/:login")
	async GetUserByLogin(@Param("login") login: string, @Res() res: Response) {
		return await this.userService.GetUserByLogin(login, res);
	}

	@Get("username/:username")
	async GetUserByUsername(
		@Param("username") username: string,
		@Res() res: Response
	) {
		return await this.userService.GetUserByUsername(username, res);
	}

	@Get("login")
	async GetAllUser(@Res() res: Response) {
		return await this.userService.GetAllUser(res);
	}

	@Put("update")
	async UpdateUser(
		@Res() res: Response,
		@GetUser() user: any,
		@Body("updateUser") updateUserDto: UpdateUserDto
	) {
		return await this.userService.UpdateUser(res, user, updateUserDto);
	}

	@Get("logout")
	Logout(@Res() res: Response) {
		return this.userService.Logout(res);
	}

	@Get("/all/pseudo")
	async GetAllPseudo() {
		return this.userService.GetAllPseudo();
	}

	@Post("config")
	@UseInterceptors(FileInterceptor("file"))
	async ConfigUser(
		@GetUser() user: any,
		@Res() res: Response,
		@UploadedFile() file,
		@Body("username") text: string
	) {
		this.userService.ConfigUser(user, res, file, text);
	}

	@Post("updateconfig")
	@UseInterceptors(FileInterceptor("file"))
	async UpdateUserConfig(
		@GetUser() user: any,
		@Res() res: Response,
		@UploadedFile() file,
		@Body("username") text: string,
		@Body("source") source: string
	) {
		this.userService.UpdateUserConfig(user, res, file, text, source);
	}

	@Get("achievement/:username")
	async GetAchievement(
		@Param("username") username: string,
		@Res() res: Response
	) {
		return this.userService.GetAchievement(username, res);
	}

	@Get("friends/:username")
	async GetFriends(
		@Param("username") username: string,
		@Res() res: Response
	) {
		return this.userService.GetFriends(username, res);
	}

	@Get("matchs/:username")
	async GetMatchs(@Param("username") username: string, @Res() res: Response) {
		return this.userService.GetMatchs(username, res);
	}
}
