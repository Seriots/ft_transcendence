import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	Query,
	Req,
	UseInterceptors,
	UploadedFile,
	Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { GetCookie, GetUser } from "./decorator";
import { CookieDto } from "./decorator/cookie.dto";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("auth")
export class AuthController {
	constructor(
		private authService: AuthService,
		private config: ConfigService
	) {}

	@Get("callback")
	async auth42Callback(@Res() res: Response, @Query("code") code: string) {
		await this.authService.Auth42Callback(res, code);
		return;
	}

	@Get("verify")
	async verify(@Req() req: Request, @Res() res: Response) {
		const token = req.cookies.jwt;
		if (!token) {
			res.status(401).send("Unauthorized: No token provided");
			return { valid: false };
		}
		try {
			jwt.verify(token, process.env.JWT_SECRET);
			res.status(200).send("OK");
			return { valid: true };
		} catch (err) {
			res.status(401).send("Unauthorized: Invalid token");
			return { valid: false };
		}
	}

	@Post("2fa/setup")
	async setup2fa(@Res() res: Response, @GetUser() user: any) {
		return await this.authService.setup2fa(res, user);
	}

	@Post("2fa/verify")
	async verify2fa(
		@Res() res: Response,
		@GetUser() user: any,
		@Body("inputKey") key: string
	) {
		return await this.authService.verify2fa(res, user, key);
	}

	@Post("2fa/verifylogin")
	async verify2falogin(
		@Res() res: Response,
		@Body("login") login: string,
		@Body("inputKey") key: string
	) {
		return await this.authService.verify2falogin(res, login, key);
	}

	@Delete("2fa/disable")
	async remove2fa(@Res() res: Response, @GetCookie() cookie: CookieDto) {
		return await this.authService.remove2fa(res, cookie);
	}

	@Post("admin/create")
	@UseInterceptors(FileInterceptor("file"))
	async createUser(
		@Res() res: Response,
		@Body("username") username: string,
		@UploadedFile() file
	) {
		return await this.authService.adminCreateUser(res, username, file);
	}
}
