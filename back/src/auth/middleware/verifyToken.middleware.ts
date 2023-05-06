import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

export function verifyToken(req: Request, res: Response, next: NextFunction) {
	if (req.path === "/auth/callback" || req.path === "/auth/2fa/verifylogin") {
		next();
		return;
	}
	const token = req.cookies["jwt"];
	if (!token) {
		return res.status(401).json({ message: "No token provided" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req["user"] = decoded;
		next();
	} catch (err) {
		return res.status(403).json({ message: "Invalid token" });
	}
}
