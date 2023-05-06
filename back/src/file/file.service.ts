import { Injectable } from "@nestjs/common";
import * as sharp from "sharp";

@Injectable()
export class FileService {
	constructor() {}

	async checkFile(file: Express.Multer.File) {
		const image = sharp(file.buffer);
		const metatada = await image.metadata();
		const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
		const allowedSize = 2 * 1024 * 1024;

		if (metatada.width > 400 || metatada.height > 400)
			return (false);
		if (allowedTypes.includes(file.mimetype) === false || file.size > allowedSize)
			return (false);
		return (true);
	}
}