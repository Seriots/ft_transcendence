import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {
	constructor(config: ConfigService) {
		super({
			datasources: {
				db: {
					url: config.get("DATABASE_URL"),
				},
			},
		});
	}

	cleandDb() {
		return this.$transaction([
			this.message.deleteMany(),
			this.channel.deleteMany(),
			this.user.deleteMany(),
		]);
	}
}
