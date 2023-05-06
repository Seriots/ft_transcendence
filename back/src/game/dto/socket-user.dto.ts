
export class SocketUser {
	prismaId: number;
	login: string;
	socketId: string;
	roomName: string;
	state: string; 
	up: number;
	down: number;
	left: number;
	right: number;
	surrender: boolean;
}