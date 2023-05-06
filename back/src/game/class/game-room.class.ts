import { SocketUser } from "../dto";

const GameRatio = 0.5;

export class PlayerBar {
	x: number;
	y: number;
	size: number;
	speed: number;
	width: number;
	score: number;
	
	constructor(x: number, y: number, size: number, speed: number, width: number) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.speed = speed;
		this.width = width;
		this.score = 0;
	}
}

export class Ball {
	x: number;
	y: number;
	speed_x: number;
	speed_y: number;
	size: number;
	direction: number;

	constructor(x: number, y: number, speed_x: number, speed_y: number,
				size: number, direction: number) {
		this.x = x;
		this.y = y;
		this.speed_x = speed_x;
		this.speed_y = speed_y;
		this.size = size;
		this.direction = direction;
	}
}

export class GameRoom {
	
	ball: Ball;
	player1: PlayerBar;
	player2: PlayerBar;

	constructor(private roomNumber : number, private map: string) {
		this.ball = new Ball(0.5, 0.5, 0.0045 * GameRatio, 0.0045, 0.03, this.getRandomDirection());
		this.player1 = new PlayerBar(0.006, 0.5, 0.2, 0.0125, 0.015);
		this.player2 = new PlayerBar(0.994, 0.5, 0.2, 0.0125, 0.015);
	}
	
	getGameRoomInfo() {
		return ({
			ball_x: this.ball.x,
			ball_y: this.ball.y,
			ball_size: this.ball.size,
			
			player1_x: this.player1.x,
			player1_y: this.player1.y,
			player1_size: this.player1.size,
			player1_score: this.player1.score,

			player2_x: this.player2.x,
			player2_y: this.player2.y,
			player2_size: this.player2.size,
			player2_score: this.player2.score,

			map: this.map,
			board: 1,
		})
	}

	reset() {
		this.ball.x = 0.5;
		this.ball.y = 0.5;
		this.ball.direction = this.getRandomDirection();
		this.ball.speed_x = 0.0045 * GameRatio;
		this.ball.speed_y = 0.0045;
		
		this.player1.size = 0.2;
		this.player2.size = 0.2;
		this.ball.size = 0.03;
	}
	
	getRandomDirection() {
		const range = 0.70;
		let first = (Math.random() * range - range / 2) * Math.PI;
		let second = Math.random() * range - range / 2;
		second = (second + (1 - (range / 2)) * Math.sign(second)) * Math.PI ;
		return Math.random() > 0.5 ? first : second;
	}
	
	accelerate() {
		this.ball.speed_x *= 1.15;
		this.ball.speed_y *= 1.15;
	}

	updatePlayerPosition(player: SocketUser) {
		if (player) {
			let p = (player.state === "player1" ? this.player1 : this.player2);
			if (player.up === 1) {
				p.y -= p.speed;
				if (p.y < 0)
					p.y = 0;
			}
			if (player.down === 1) {
				p.y += p.speed;
				if (p.y > 1)
					p.y = 1;
			}
		}
	}

	incrementBallY(increment_y: number) {
		this.ball.y += increment_y;

		if (this.ball.y < 0 || this.ball.y > 1) {
			this.ball.direction = -this.ball.direction;
			if (this.ball.y < 0)
				this.ball.y = -this.ball.y;
			else
				this.ball.y = 2 - this.ball.y;
		}
	}

	private getY(x: number, y: number, direction: number, x2: number) {
		return y + (x2 - x) * Math.tan(direction);
	}

	private getBallDirectionBounceRight(y: number,) {
		let percent = (y - this.player1.y) / this.player1.size;

		this.accelerate();
		return ((Math.PI / 3) * percent);
	}
	
	private getBallDirectionBounceLeft(y: number) {
		let percent = (y - this.player2.y) / this.player2.size;
		
		this.accelerate();
		return (Math.PI - (Math.PI / 3) * percent)
	}


	checkBallBounce(increment_x: number) {
		let y 		: number;
		let ballY	: number;
		let playerY	: number;
		const ballMarge = 0.05;

		if (this.ball.direction > Math.PI / 2 || this.ball.direction < -Math.PI / 2) {
			if (this.ball.x + increment_x > this.player1.x
				&& this.ball.x + increment_x <= this.player1.x + this.player1.width) {
					
					y = this.getY(this.ball.x, this.ball.y, this.ball.direction, this.player1.x + this.player1.width);
					ballY = this.ball.y - (this.ball.size * (this.ball.y - 0.5));
					playerY = this.player1.y - (this.player1.size * (this.player1.y - 0.5));
					
					if ((ballY + ballMarge > playerY - this.player1.size / 2
							&& ballY + ballMarge < playerY + this.player1.size / 2) 
						|| (ballY - ballMarge > playerY - this.player1.size / 2
							&& ballY - ballMarge < playerY + this.player1.size / 2) ) {
						
						this.ball.direction = this.getBallDirectionBounceRight(y);
						increment_x = Math.abs(increment_x) - Math.abs(this.ball.x - this.player1.x - this.player1.width);
				}
			}
		}
		else if (this.ball.direction < Math.PI / 2 && this.ball.direction > -Math.PI / 2) {
			if (this.ball.x + increment_x < this.player2.x
				&& this.ball.x + increment_x >= this.player2.x - this.player2.width) {
				
					y = this.getY(this.ball.x, this.ball.y, this.ball.direction, this.player2.x - this.player2.width);
					ballY = this.ball.y - (this.ball.size * (this.ball.y - 0.5));
					playerY = this.player2.y - (this.player2.size * (this.player2.y - 0.5));
				
					if ((ballY + ballMarge > playerY - this.player2.size / 2
							&& ballY + ballMarge < playerY + this.player2.size / 2) 
						|| (ballY - ballMarge > playerY - this.player2.size / 2
							&& ballY - ballMarge < playerY + this.player2.size / 2)) {
						
						this.ball.direction = this.getBallDirectionBounceLeft(y);
						increment_x = (Math.abs(increment_x) - Math.abs(this.ball.x - this.player2.x + this.player2.width));
				}
			}
		}
		this.ball.x += increment_x;
	}

	checkBallScore() {
		if ((this.ball.x < 0 && (this.ball.direction > Math.PI / 2 || this.ball.direction < -Math.PI / 2))
			|| (this.ball.x > 1 && (this.ball.direction < Math.PI / 2 && this.ball.direction > -Math.PI / 2)))
		{
			if (this.ball.x < 0)
				this.player2.score++;
			else if (this.ball.x > 1)
				this.player1.score++;
			this.reset();
			return (true);
		}
		return (false);
	}

	checkEndGame() {
		if ((this.player1.score >= 10 || this.player2.score >= 10) && Math.abs(this.player1.score - this.player2.score) >= 2)
			return {state: true, mode: "normal"}
		return {state: false, mode: "none"}
	} 
}

export class GameRoom2V2 {
	ball: Ball;
	player1: PlayerBar;
	player2: PlayerBar;
	player3: PlayerBar;
	player4: PlayerBar;

	constructor(private roomNumber : number, private map: string) {
		this.ball = new Ball(0.5, 0.5, 0.0045 * GameRatio, 0.0045, 0.03, this.getRandomDirection());
		this.player1 = new PlayerBar(0.006, 0.5, 0.15, 0.0125, 0.015);
		this.player2 = new PlayerBar(0.02, 0.5, 0.15, 0.0125, 0.015);
		this.player3 = new PlayerBar(0.994, 0.5, 0.15, 0.0125, 0.015);
		this.player4 = new PlayerBar(0.980, 0.5, 0.15, 0.0125, 0.015);
	}
	
	getGameRoomInfo() {
		return ({
			ball_x: this.ball.x,
			ball_y: this.ball.y,
			ball_size: this.ball.size,
			
			player1_x: this.player1.x,
			player1_y: this.player1.y,
			player1_size: this.player1.size,
			player1_score: this.player1.score,

			player2_x: this.player2.x,
			player2_y: this.player2.y,
			player2_size: this.player2.size,
			player2_score: this.player2.score,

			player3_x: this.player3.x,
			player3_y: this.player3.y,
			player3_size: this.player3.size,
			player3_score: this.player3.score,

			player4_x: this.player4.x,
			player4_y: this.player4.y,
			player4_size: this.player4.size,
			player4_score: this.player4.score,

			map: this.map,
			board: 3,
		})
	}

	reset() {
		this.ball.x = 0.5;
		this.ball.y = 0.5;
		this.ball.direction = this.getRandomDirection();
		this.ball.speed_x = 0.0045 * GameRatio;
		this.ball.speed_y = 0.0045;
		
		// this.player1.size = 0.2;
		// this.player2.size = 0.2;
		// this.ball.size = 0.03;
	}
	
	getRandomDirection() {
		const range = 0.70;
		let first = (Math.random() * range - range / 2) * Math.PI;
		let second = Math.random() * range - range / 2;
		second = (second + (1 - (range / 2)) * Math.sign(second)) * Math.PI ;
		return Math.random() > 0.5 ? first : second;
	}
	
	accelerate() {
		this.ball.speed_x *= 1.15;
		this.ball.speed_y *= 1.15;
	}

	updatePlayerPosition(player: SocketUser) {
		if (player) {
			let p;
			if (player.state === "player1")
				p = this.player1;
			else if (player.state === "player2")
				p = this.player2;
			else if (player.state === "player3")
				p = this.player3;
			else if (player.state === "player4")
				p = this.player4;
			else
				return;
			if (player.up === 1) {
				p.y -= p.speed;
				if (p.y < 0)
					p.y = 0;
			}
			if (player.down === 1) {
				p.y += p.speed;
				if (p.y > 1)
					p.y = 1;
			}
		}
	}

	incrementBallY(increment_y: number) {
		this.ball.y += increment_y;

		if (this.ball.y < 0 || this.ball.y > 1) {
			this.ball.direction = -this.ball.direction;
			if (this.ball.y < 0)
				this.ball.y = -this.ball.y;
			else
				this.ball.y = 2 - this.ball.y;
		}
	}

	private getY(x: number, y: number, direction: number, x2: number) {
		return y + (x2 - x) * Math.tan(direction);
	}

	private getBallDirectionBounceRight(y: number, player: PlayerBar) {
		let percent = (y - player.y) / player.size;

		this.accelerate();
		return ((Math.PI / 3) * percent);
	}
	
	private getBallDirectionBounceLeft(y: number, player: PlayerBar) {
		let percent = (y - player.y) / player.size;
		
		this.accelerate();
		return (Math.PI - (Math.PI / 3) * percent)
	}


	checkBallBounce(increment_x: number) {
		let y 		: number;
		let ballY	: number;
		let playerY	: number;
		const ballMarge = 0.05;

		if (this.ball.direction > Math.PI / 2 || this.ball.direction < -Math.PI / 2) {
			if (this.ball.x + increment_x > this.player1.x
				&& this.ball.x + increment_x <= this.player1.x + this.player1.width) {
					
					y = this.getY(this.ball.x, this.ball.y, this.ball.direction, this.player1.x + this.player1.width);
					ballY = this.ball.y - (this.ball.size * (this.ball.y - 0.5));
					playerY = this.player1.y - (this.player1.size * (this.player1.y - 0.5));
					
					if ((ballY + ballMarge > playerY - this.player1.size / 2
							&& ballY + ballMarge < playerY + this.player1.size / 2) 
						|| (ballY - ballMarge > playerY - this.player1.size / 2
							&& ballY - ballMarge < playerY + this.player1.size / 2) ) {
						
						this.ball.direction = this.getBallDirectionBounceRight(y, this.player1);
						increment_x = Math.abs(increment_x) - Math.abs(this.ball.x - this.player1.x - this.player1.width);
				}
			}
			else if (this.ball.x + increment_x > this.player2.x
				&& this.ball.x + increment_x <= this.player2.x + this.player2.width) {
					
					y = this.getY(this.ball.x, this.ball.y, this.ball.direction, this.player2.x + this.player2.width);
					ballY = this.ball.y - (this.ball.size * (this.ball.y - 0.5));
					playerY = this.player2.y - (this.player2.size * (this.player2.y - 0.5));
					
					if ((ballY + ballMarge > playerY - this.player2.size / 2
							&& ballY + ballMarge < playerY + this.player2.size / 2) 
						|| (ballY - ballMarge > playerY - this.player2.size / 2
							&& ballY - ballMarge < playerY + this.player2.size / 2) ) {
						
						this.ball.direction = this.getBallDirectionBounceRight(y, this.player2);
						increment_x = Math.abs(increment_x) - Math.abs(this.ball.x - this.player2.x - this.player2.width);
				}
			}
		}
		else if (this.ball.direction < Math.PI / 2 && this.ball.direction > -Math.PI / 2) {
			if (this.ball.x + increment_x < this.player3.x
				&& this.ball.x + increment_x >= this.player3.x - this.player3.width) {
				
					y = this.getY(this.ball.x, this.ball.y, this.ball.direction, this.player3.x - this.player3.width);
					ballY = this.ball.y - (this.ball.size * (this.ball.y - 0.5));
					playerY = this.player3.y - (this.player3.size * (this.player3.y - 0.5));
				
					if ((ballY + ballMarge > playerY - this.player3.size / 2
							&& ballY + ballMarge < playerY + this.player3.size / 2) 
						|| (ballY - ballMarge > playerY - this.player3.size / 2
							&& ballY - ballMarge < playerY + this.player3.size / 2)) {
						
						this.ball.direction = this.getBallDirectionBounceLeft(y, this.player3);
						increment_x = (Math.abs(increment_x) - Math.abs(this.ball.x - this.player3.x + this.player3.width));
				}
			}
			else if (this.ball.x + increment_x < this.player4.x
				&& this.ball.x + increment_x >= this.player4.x - this.player4.width) {
				
					y = this.getY(this.ball.x, this.ball.y, this.ball.direction, this.player4.x - this.player4.width);
					ballY = this.ball.y - (this.ball.size * (this.ball.y - 0.5));
					playerY = this.player4.y - (this.player4.size * (this.player4.y - 0.5));
				
					if ((ballY + ballMarge > playerY - this.player4.size / 2
							&& ballY + ballMarge < playerY + this.player4.size / 2) 
						|| (ballY - ballMarge > playerY - this.player4.size / 2
							&& ballY - ballMarge < playerY + this.player4.size / 2)) {
						
						this.ball.direction = this.getBallDirectionBounceLeft(y, this.player4);
						increment_x = (Math.abs(increment_x) - Math.abs(this.ball.x - this.player4.x + this.player4.width));
				}
			}
		}
		this.ball.x += increment_x;
	}

	checkBallScore() {
		if ((this.ball.x < 0 && (this.ball.direction > Math.PI / 2 || this.ball.direction < -Math.PI / 2))
			|| (this.ball.x > 1 && (this.ball.direction < Math.PI / 2 && this.ball.direction > -Math.PI / 2)))
		{
			if (this.ball.x < 0)
			{
				this.player3.score++;
				this.player4.score++;

			}
			else if (this.ball.x > 1)
			{
				this.player1.score++;
				this.player2.score++;
			}
			this.reset();
			return (true);
		}
		return (false);
	}

	checkEndGame() {
		if ((this.player1.score >= 10 || this.player3.score >= 10) && Math.abs(this.player1.score - this.player3.score) >= 2)
			return {state: true, mode: "normal"}
		return {state: false, mode: "none"}
	} 
}

export class GameRoomFFA {
	
	ball: Ball;
	player1: PlayerBar;
	player2: PlayerBar;
	player3: PlayerBar;
	player4: PlayerBar;

	constructor(private roomNumber : number, private map: string) {
		this.ball = new Ball(0.5, 0.5, 0.0045, 0.0045, 0.03, this.getRandomDirection());
		this.player1 = new PlayerBar(0.006, 0.5, 0.2, 0.0125, 0.015);
		this.player2 = new PlayerBar(0.994, 0.5, 0.2, 0.0125, 0.015);
		this.player3 = new PlayerBar(0.5, 0.006, 0.015, 0.0125, 0.2);
		this.player4 = new PlayerBar(0.5, 0.994, 0.015, 0.0125, 0.2);
		this.player1.score = 4;
		this.player2.score = 4;
		this.player3.score = 4;
		this.player4.score = 4;
	}
	
	getGameRoomInfo() {
		return ({
			ball_x: this.ball.x,
			ball_y: this.ball.y,
			ball_size: this.ball.size,
			
			player1_x: this.player1.x,
			player1_y: this.player1.y,
			player1_size: this.player1.size,
			player1_score: this.player1.score,

			player2_x: this.player2.x,
			player2_y: this.player2.y,
			player2_size: this.player2.size,
			player2_score: this.player2.score,

			player3_x: this.player3.x,
			player3_y: this.player3.y,
			player3_size: this.player3.width,
			player3_score: this.player3.score,

			player4_x: this.player4.x,
			player4_y: this.player4.y,
			player4_size: this.player4.width,
			player4_score: this.player4.score,

			map: this.map,

			board: 2,
		})
	}

	reset() {
		this.ball.x = 0.5;
		this.ball.y = 0.5;
		this.ball.direction = this.getRandomDirection();
		this.ball.speed_x = 0.0045;
		this.ball.speed_y = 0.0045;
		
		// this.player1.size = 0.2;
		// this.player2.size = 0.2;
		// this.player3.width = 0.2;
		// this.player4.width = 0.2;
		// this.ball.size = 0.03;
	}
	
	getRandomDirection() {
		return (Math.random() * (Math.PI * 2) - Math.PI);
	}
	
	accelerate() {
		this.ball.speed_x *= 1.02;
		this.ball.speed_y *= 1.02;
	}

	updatePlayerPosition(player: SocketUser) {
		if (player) {
			let p;
			if (player.state === "player1")
				p = this.player1;
			else if (player.state === "player2")
				p = this.player2;
			else if (player.state === "player3")
				p = this.player3;
			else if (player.state === "player4")
				p = this.player4;
			else
				return;
			if (player.state === "player1" || player.state === "player2") {
				if (player.up === 1) {
					p.y -= p.speed;
					if (p.y < 0)
						p.y = 0;
				}
				if (player.down === 1) {
					p.y += p.speed;
					if (p.y > 1)
						p.y = 1;
				}
			}
			else if (player.state === "player3" || player.state === "player4") {
				if (player.left === 1) {
					p.x -= p.speed;
					if (p.x < 0)
						p.x = 0;
				}
				if (player.right === 1) {
					p.x += p.speed;
					if (p.x > 1)
						p.x = 1;
				}
			}
		}
	}

	incrementBallY(increment_y: number) {
		this.ball.y += increment_y;

		// if (this.ball.y < 0 || this.ball.y > 1) {
		// 	this.ball.direction = -this.ball.direction;
		// 	if (this.ball.y < 0)
		// 		this.ball.y = -this.ball.y;
		// 	else
		// 		this.ball.y = 2 - this.ball.y;
		// }
	}

	private getY(x: number, y: number, direction: number, x2: number) {
		return y + (x2 - x) * Math.tan(direction);
	}

	private getX(y: number, x: number, direction: number, y2: number) {
		return x + (y2 - y) / Math.tan(direction);
	}

	private getBallDirectionBounceRight(y: number) {
		let percent = (y - this.player1.y) / this.player1.size;

		this.accelerate();
		let angle = (1 * Math.PI / 2) * percent;
		if (angle > Math.PI)
			angle -= 2 * Math.PI;
		else if (angle < -Math.PI)
			angle += 2 * Math.PI;
		return (angle);
	}
	
	private getBallDirectionBounceLeft(y: number) {
		let percent = (y - this.player2.y) / this.player2.size;
		
		this.accelerate();
		let angle = (Math.PI - (1 * Math.PI / 2) * percent);
		if (angle > Math.PI)
			angle -= 2 * Math.PI;
		else if (angle < -Math.PI)
			angle += 2 * Math.PI;
		return (angle)
	}

	private getBallDirectionBounceBottom(x: number) {
		let percent = (x - this.player3.x) / this.player3.width;

		this.accelerate();
		let angle = (Math.PI - (1 * Math.PI / 2) * percent) - (Math.PI / 2);
		if (angle > Math.PI)
			angle -= 2 * Math.PI;
		else if (angle < -Math.PI)
			angle += 2 * Math.PI;
		console.log(angle)
		return angle;
	}
	
	private getBallDirectionBounceTop(x: number) {
		let percent = (x - this.player4.x) / this.player4.width;
		
		this.accelerate();
		let angle = ((1 * Math.PI / 2) * percent) - (Math.PI / 2)
		if (angle > Math.PI)
			angle -= 2 * Math.PI;
		else if (angle < -Math.PI)
			angle += 2 * Math.PI;
		console.log(angle)
		return angle;
	}


	checkBallBounce(increment_x: number) {
		let y 		: number;
		let ballY	: number;
		let playerY	: number;
		const ballMarge = 0.05;

		if (this.ball.direction > Math.PI / 2 || this.ball.direction < -Math.PI / 2) {
			if (this.ball.x + increment_x > this.player1.x
				&& this.ball.x + increment_x <= this.player1.x + this.player1.width) {
					
					y = this.getY(this.ball.x, this.ball.y, this.ball.direction, this.player1.x + this.player1.width);
					ballY = this.ball.y - (this.ball.size * (this.ball.y - 0.5));
					playerY = this.player1.y - (this.player1.size * (this.player1.y - 0.5));
					
					if ((ballY + ballMarge > playerY - this.player1.size / 2
							&& ballY + ballMarge < playerY + this.player1.size / 2) 
						|| (ballY - ballMarge > playerY - this.player1.size / 2
							&& ballY - ballMarge < playerY + this.player1.size / 2) ) {
						
						this.ball.direction = this.getBallDirectionBounceRight(y);
						increment_x = Math.abs(increment_x) - Math.abs(this.ball.x - this.player1.x - this.player1.width);
					}
			}
			else if (this.ball.x + increment_x < 0 && this.player1.score <= 0)
			{
				if (this.ball.direction > 0)
					this.ball.direction = Math.PI - this.ball.direction;
				else
					this.ball.direction = -Math.PI - this.ball.direction;
				increment_x = 0;
			}

		}
		else if (this.ball.direction < Math.PI / 2 && this.ball.direction > -Math.PI / 2) {
			if ((this.ball.x + increment_x < this.player2.x
				&& this.ball.x + increment_x >= this.player2.x - this.player2.width)) {
				
					y = this.getY(this.ball.x, this.ball.y, this.ball.direction, this.player2.x - this.player2.width);
					ballY = this.ball.y - (this.ball.size * (this.ball.y - 0.5));
					playerY = this.player2.y - (this.player2.size * (this.player2.y - 0.5));
				
					if ((ballY + ballMarge > playerY - this.player2.size / 2
							&& ballY + ballMarge < playerY + this.player2.size / 2) 
						|| (ballY - ballMarge > playerY - this.player2.size / 2
							&& ballY - ballMarge < playerY + this.player2.size / 2)) {
						
						this.ball.direction = this.getBallDirectionBounceLeft(y);
						increment_x = (Math.abs(increment_x) - Math.abs(this.ball.x - this.player2.x + this.player2.width));
					}
				} 
			else if (this.ball.x + increment_x > 1 && this.player2.score <= 0)
			{
				if (this.ball.direction > 0)
					this.ball.direction = Math.PI - this.ball.direction;
				else
					this.ball.direction = -Math.PI - this.ball.direction;
				increment_x = 0;
			}
		}
		this.ball.x += increment_x;
	}

	checkBallBounceY(increment_y: number) {
		let x 		: number;
		let ballX	: number;
		let playerX	: number;
		const ballMarge = 0.05;
 
		if (this.ball.direction < 0 && this.ball.direction > -Math.PI) {
			if ((this.ball.y + increment_y > this.player3.y
				&& this.ball.y + increment_y <= this.player3.y + this.player3.size)
				|| (this.ball.y > this.player3.y + this.player3.size && this.ball.y + increment_y < this.player3.y + this.player3.size)) {
					x = this.getX(this.ball.y, this.ball.x, this.ball.direction, this.player3.y + this.player3.size);
					ballX = this.ball.x - (this.ball.size * (this.ball.x - 0.5));
					playerX = this.player3.x - (this.player3.width * (this.player3.x - 0.5));
					
					if ((ballX + ballMarge > playerX - this.player3.width / 2
							&& ballX + ballMarge < playerX + this.player3.width / 2) 
						|| (ballX - ballMarge > playerX - this.player3.width / 2
							&& ballX - ballMarge < playerX + this.player3.width / 2) ) {
						this.ball.direction = this.getBallDirectionBounceBottom(x);
						increment_y = Math.abs(increment_y) - Math.abs(this.ball.y - this.player3.y - this.player3.size);
					}
			}
			else if (this.ball.y + increment_y < 0 && this.player3.score <= 0)
			{
				this.ball.direction = -this.ball.direction;
				increment_y = 0;
			}

		}
		else if (this.ball.direction > 0 && this.ball.direction < Math.PI) {
			if ((this.ball.y + increment_y < this.player4.y
				&& this.ball.y + increment_y >= this.player4.y - this.player4.size)
				|| (this.ball.y < this.player4.y - this.player4.size && this.ball.y + increment_y > this.player4.y - this.player4.size)) {
				
					x = this.getX(this.ball.y, this.ball.x, this.ball.direction, this.player4.y - this.player4.size);
					ballX = this.ball.x - (this.ball.size * (this.ball.x - 0.5));
					playerX = this.player4.x - (this.player4.width * (this.player4.x - 0.5));
				
					if ((ballX + ballMarge > playerX - this.player4.width / 2
							&& ballX + ballMarge < playerX + this.player4.width / 2) 
						|| (ballX - ballMarge > playerX - this.player4.width / 2
							&& ballX - ballMarge < playerX + this.player4.width / 2)) {
						this.ball.direction = this.getBallDirectionBounceTop(x);
						increment_y = (Math.abs(increment_y) - Math.abs(this.ball.y - this.player4.y + this.player4.size));
					}
				}
			else if (this.ball.y + increment_y > 1 && this.player4.score <= 0)
			{
				this.ball.direction = -this.ball.direction;
				increment_y = 0;
			}
		}
		this.ball.y += increment_y; 
	}


	checkBallScore() {
		if ((this.ball.x < 0 && this.player1.score > 0) || (this.ball.x > 1 && this.player2.score > 0)
			|| (this.ball.y < 0 && this.player3.score > 0) || (this.ball.y > 1 && this.player4.score > 0))
		{
			if (this.ball.x < 0 && this.player1.score > 0)
				this.player1.score--;
			else if (this.ball.x > 1 && this.player2.score > 0)
				this.player2.score--;
			else if (this.ball.y < 0 && this.player3.score > 0)
				this.player3.score--;
			else if (this.ball.y > 1 && this.player4.score > 0)
				this.player4.score--;
			if (this.player1.score === 0)
			{
				this.player1.width = 0;
				this.player1.size = 0;
			}
			if (this.player2.score === 0)
			{
				this.player2.width = 0;
				this.player2.size = 0;
			}
			if (this.player3.score === 0)
			{
				this.player3.width = 0;
				this.player3.size = 0;
			}
			if (this.player4.score === 0)
			{
				this.player4.width = 0;
				this.player4.size = 0;
			}

			this.reset();
			return (true);
		}
		else if ((this.ball.x < -0.1) || (this.ball.x > 1.1)
			|| (this.ball.y < -0.1) || (this.ball.y > 1.1))
		{
			this.reset();
			return (true);
		}
		return (false);
	}

	checkEndGame() {
		let count = 0;
		if (this.player1.score <= 0)
			count++;
		if (this.player2.score <= 0)
			count++;
		if (this.player3.score <= 0)
			count++;
		if (this.player4.score <= 0)
			count++;
		if (count >= 3)
			return {state: true, mode: "normal"}
		return {state: false, mode: "none"}
	} 
}