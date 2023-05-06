import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { UserModule } from "./user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { ChatGateway } from "./chat/chat.gateway";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { GameModule } from "./game/game.module";
import { QueueModule } from "./queue/queue.module";
import { FriendModule } from "./friend/friend.module";
import { ChatModule } from "./chat/chat.module";

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		AuthModule,
		PrismaModule,
		UserModule,
		GameModule,
		QueueModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: "120min" },
		}),
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, "..", "public"),
			serveRoot: "/public",
		}),
		FriendModule,
		ChatModule,
	],
	providers: [ChatGateway],
})
export class AppModule {}
