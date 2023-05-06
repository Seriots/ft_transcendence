import {
	ExecutionContext,
	ForbiddenException,
	createParamDecorator,
} from "@nestjs/common";
import { CookieDto } from "./cookie.dto";
import * as jwt from "jsonwebtoken";
import axios from "axios";
import { ConfigService } from "@nestjs/config";

export const GetCookie = createParamDecorator(
	(data: string | undefined, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest();
		const token = request.cookies.jwt;
		const userCookie: CookieDto = JSON.parse(atob(token.split(".")[1]));
		try {
			if (jwt.verify(token, process.env.JWT_SECRET)) {
				if (data) return userCookie[data];
				return userCookie;
			}
		} catch (err) {
			throw new ForbiddenException("Invalid token");
		}
	}
);

export const GetUser = createParamDecorator(
	async (data: string | undefined, ctx: ExecutionContext) => {
		const config = new ConfigService();
		const request = ctx.switchToHttp().getRequest();
		const token = request.cookies.jwt;
		if (!token) return null;
		const userCookie: CookieDto = JSON.parse(atob(token.split(".")[1]));
		try {
			if (jwt.verify(token, process.env.JWT_SECRET)) {
				const user = await axios.get(
					"http://" +
						config.get("HOST_T") +
						":" +
						config.get("PORT_BACK") +
						"/users/login/" +
						userCookie.login,
					{
						withCredentials: true,
						headers: { Cookie: "jwt=" + token },
					}
				);
				if (data) return user.data[data];
				return user.data;
			}
		} catch (err) {
			throw new ForbiddenException("Invalid token");
		}
	}
);
