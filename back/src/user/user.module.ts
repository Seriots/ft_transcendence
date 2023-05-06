import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { AuthService } from "src/auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { FileService } from "src/file/file.service";

@Module({
	controllers: [UserController],
	providers: [UserService, AuthService, JwtService, FileService],
})
export class UserModule {}
