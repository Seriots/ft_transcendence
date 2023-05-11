import { ForbiddenException, Injectable, Res, Body } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import { PrismaService } from "src/prisma/prisma.service";
import axios from "axios";
import { UserDto } from "./dto";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { GetCookie, GetUser } from "./decorator";
import { CookieDto } from "./decorator/cookie.dto";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private config: ConfigService
	) {}

	async Auth42Callback(@Res() res: Response, code: string) {
		const payload = {
			grant_type: "authorization_code",
			client_id: this.config.get("CLIENT_ID"),
			client_secret: this.config.get("CLIENT_SECRET"),
			redirect_uri: this.config.get("REDIRECT_URI"),
			code,
		};
		console.log("payload: ", payload);
		try {
			const response = await axios.post(
				"https://api.intra.42.fr/oauth/token",
				payload,
				{ 
					headers: { "Content-Type": "application/json" },
					timeout: 5000
				}
			);
			console.log("response: ", response);
			return this.getUserInfo(res, response.data.access_token);
		} catch (error) {
			console.log("errorAuth42callback", error);
			throw new ForbiddenException("callback error");
		}
	}

	async getUserInfo(@Res() res: Response, token: string) {
		try {
			const response = await axios.get("https://api.intra.42.fr/v2/me", {
				headers: {
					Authorization: "Bearer " + token,
				},
			});
			const user = new UserDto();
			user.login = response.data.login;
			user.avatar = response.data.image_url;
			return this.createUser(res, user);
		} catch (error) {
			console.log("userCreateError");
			throw new ForbiddenException("user create error");
		}
	}

	async createUser(@Res() res: Response, user: UserDto) {
		try {
			const existingUser = await this.prisma.user.findUnique({
				where: {
					login: user.login,
				},
			});
			if (existingUser && existingUser.twoFactor === true) {
				// User deja log avec 2fa true
				return res.redirect(
					"https://" +
						this.config.get("HOST_T") +
						":" +
						this.config.get("PORT_GLOBAL") +
						"/login/2fa/" +
						user.login
				);
			}
			if (existingUser) {
				this.signToken(res, existingUser);
				if (existingUser.config)
					return res.redirect(
						"https://" +
							this.config.get("HOST_T") +
							":" +
							this.config.get("PORT_GLOBAL")
					);
				return res.redirect(
					"https://" +
						this.config.get("HOST_T") +
						":" +
						this.config.get("PORT_GLOBAL") +
						"/login/config"
				);
			}
			const createdUser = await this.prisma.user.create({
				data: {
					login: user.login,
					username: user.login,
				},
			});
			this.signToken(res, createdUser);
			return res.redirect(
				"https://" +
					this.config.get("HOST_T") +
					":" +
					this.config.get("PORT_GLOBAL") +
					"/login/config"
			);
		} catch (error) {
			// if (error instanceof PrismaClientKnownRequestError) {
			// 		if (error.code === "P2002") {
			// 		const existingUser = await this.prisma.user.findUnique({
			// 			where: {
			// 				login: user.login,
			// 			},
			// 		});
			// 		return this.signToken(res, existingUser);
			// 	}
			// }
			throw new ForbiddenException("prisma error");
		}
	}

	async signToken(@Res() res: Response, user: UserDto) {
		const payload = { sub: user.id, login: user.login };
		const secret = this.config.get("JWT_SECRET");
		const token = this.jwt.sign(payload, { secret });
		console.log(user.login + ": " + token);
		try {
			res.cookie("jwt", token, {
				httpOnly: false,
				secure: true,
				sameSite: "lax",
			});
		} catch (error) {
			throw new ForbiddenException("Sign token error");
		}
		return { access_token: token };
	}

	async setup2fa(@Res() res: Response, @GetUser() user: any) {
		if (!user || user.twoFactor) {
			return res.status(400).json({
				message: "2FA already setup",
			});
		}
		try {
			const secret = authenticator.generateSecret();

			const otpAuthUrl = authenticator.keyuri(
				user.login,
				"NetBlitz",
				secret
			);
			const qrCode = await QRCode.toDataURL(otpAuthUrl);
			await this.prisma.user.update({
				where: {
					login: user.login,
				},
				data: {
					secret: secret,
				},
			});
			return res.status(200).json({ otpAuthUrl, qrCode, secret });
		} catch (error) {
			throw new ForbiddenException("2FA setup error");
		}
	}

	async verify2fa(@Res() res: Response, @GetUser() user: any, code: string) {
		try {
			const verified = authenticator.verify({
				secret: user.secret,
				token: code,
			});

			if (verified) {
				const token = await this.signToken(res, user);
				if (user.twoFactor === false) {
					await this.prisma.user.update({
						where: {
							login: user.login,
						},
						data: {
							twoFactor: true,
						},
					});
				}
				return res.status(200).json(token);
			} else {
				return res.status(403).json({ message: "UNVALID" });
			}
		} catch (error) {
			throw new ForbiddenException("2FA verify error");
		}
	}

	async verify2falogin(@Res() res: Response, login: string, key: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				login: login,
			},
		});
		if (!user) {
			return res.status(400).json({ message: "UNVALID" });
		}
		const verified = authenticator.verify({
			secret: user.secret,
			token: key,
		});
		if (verified) {
			const token = await this.signToken(res, user);
			return res.status(200).json(token);
		} else {
			return res.status(400).json({ message: "UNVALID" });
		}
	}

	async remove2fa(@Res() res: Response, @GetCookie() cookie: CookieDto) {
		await this.prisma.user.update({
			where: {
				login: cookie.login,
			},
			data: {
				twoFactor: false,
				secret: null,
			},
		});
		return res.status(200).json({ message: "OK" });
	}

	async adminCreateUser(
		@Res() res: Response,
		@Body("username") username: string,
		file: any
	) {
		try {
			const createdUser = await this.prisma.user.create({
				data: {
					login: username,
					username: username,
				},
			});
			const extension = path.extname(file.originalname);
			const filepath: string = path.join(
				"public",
				"uploads",
				createdUser.id + "-" + uuidv4() + extension
			);
			console.log(filepath);
			try {
				await fs.promises.writeFile(filepath, file.buffer);
			} catch (error) {
				console.log(error);
				return res.status(400).json({ message: "Write File error" });
			}
			await this.prisma.user.update({
				where: {
					login: username,
				},
				data: {
					avatar: filepath,
				},
			});
			this.signToken(res, createdUser);
			return res.status(200).json({ message: "OK" });
		} catch (error) {
			console.log(error);
		}
	}
}
