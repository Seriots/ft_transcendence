import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import eyePNG from './assets/eye.png';
import crownImg from './assets/crown.png';
import beach from './assets/beachImage.jpg';
import space from './assets/spaceImage.jpg';
import jungle from './assets/jungleImage.jpg';
import './Game.css';
import { useSelector } from 'react-redux';
import { selectEnv } from '../utils/redux/selectors';
import axios from 'axios';

function Podium({ color, height, point, avatar, avatar2 = null, crown = null }: any) {
	const env = useSelector(selectEnv);

	return (
		<div className="game-end-podium-div">
			{avatar ? (
				<div>
					{height === '60%' ? (
						<img src={crownImg} alt="Crown" className="game-end-crown" id={crown ? "crown-2" : "crown-1"}/>
					) : null}
					<img
						src={
							'https://' + env.host + ':' + env.port +'/' + avatar
						}
						alt="a"
						className="game-end-podium-avatar"
					/>
					{avatar2 ? (
						<img
							src={
								'https://' + env.host + ':' + env.port +'/' + avatar2
							}
							alt="a"
							className="game-end-podium-avatar"
						/>
					) : null}
				</div>
			) : null}
			<div
				className="game-end-podium-stone"
				style={{ backgroundColor: color, height: height }}>
				<div className="game-end-podium-point">{point}</div>
			</div>
		</div>
	);
}

function Game({ socketGame, room, login }: any) {
	const [here, updateHere] = useState(true);
	const [gameEnd, updateGameEnd] = useState({} as any);
	const navigate = useNavigate();
	const [spectator, updateSpectator] = useState(0);
	const [board, updateBoard] = useState(1);
	const [isSpec, updateIsSPec] = useState(true);
	const env = useSelector(selectEnv);

	useEffect(() => {
		axios.get('https://' + env.host + ':' + env.port + '/games/spec/' + room, {
			withCredentials: true,
			}).then((res) => {
				if (res.data.isSpec !== undefined) {
					updateIsSPec(res.data.isSpec);
				}
			}
		);
	}, [updateIsSPec, isSpec, room]);

	useEffect(() => {

		const updateSpectatorFonc = (data: any) => {
			// console.log('spectatorJoin', data.spectator);
			updateSpectator(data.spectator);
		};


		socketGame.off('updateSpectator');
		socketGame.on('updateSpectator', updateSpectatorFonc);
		socketGame.emit('gameConnection', { room: room });
		// console.log('gameConection', room);
		localStorage.removeItem('lobby-chat-storage');

		const chatUl = document.querySelector('#game-playing-chat');
		const preMsg = localStorage.getItem('game-chat-storage-room-' + room);

		if (chatUl !== null && preMsg !== null) {
			chatUl.innerHTML = preMsg;
		}
		if (chatUl) chatUl.scrollTop = chatUl.scrollHeight;
	}, [room, socketGame]);

	useEffect(() => {
		if (!socketGame || socketGame.connected === undefined) return;
		const updateGameState = (gameState: any) => {
			let ball =
				document.querySelector<HTMLElement>('.game-playing-ball');
			let player1 = document.querySelector<HTMLElement>(
				'#game-playing-player1'
			);
			let player2 = document.querySelector<HTMLElement>(
				'#game-playing-player2'
			);
			let player3 = undefined;
			let player4 = undefined;
			let score3 = undefined;
			let score4 = undefined;
			let gameDiv = document.querySelector<HTMLElement>('#game-board');
			if (gameDiv) {
				if (gameState.map) {
					if (gameState.map === 'NORMAL')
						gameDiv.style.backgroundImage = 'none';
					else if (gameState.map === 'BEACH')
						gameDiv.style.backgroundImage = 'url(' + beach + ')';
					else if (gameState.map === 'SPACE')
						gameDiv.style.backgroundImage = 'url(' + space + ')';
					else if (gameState.map === 'JUNGLE')
						gameDiv.style.backgroundImage = 'url(' + jungle + ')';
				}
				if (gameState.board) {
					updateBoard(gameState.board);
					if (gameState.board === 1) {
						if (ball && player1 && player2) {
							if (gameState.map === 'JUNGLE' || gameState.map === 'SPACE') {
								ball.style.backgroundColor = '#F9DA49'
								player1.style.backgroundColor = '#F9DA49'
								player2.style.backgroundColor = '#F9DA49'
							}
						}
					}
					else if (gameState.board === 2) {
						player3 = document.querySelector<HTMLElement>(
							'#game-playing-player3'
						);
						player4 = document.querySelector<HTMLElement>(
							'#game-playing-player4'
						);
						score3 = document.querySelector<HTMLElement>(
							'#game-playing-score3'
						);
						score4 = document.querySelector<HTMLElement>(
							'#game-playing-score4'
						);
						
					}
					else if (gameState.board === 3) {
						player1 = document.querySelector<HTMLElement>(
							'#game-playing-player5'
						);
						player2 = document.querySelector<HTMLElement>(
							'#game-playing-player6'
						);
						player3 = document.querySelector<HTMLElement>(
							'#game-playing-player7'
						);
						player4 = document.querySelector<HTMLElement>(
							'#game-playing-player8'
						);
					}
					if (gameState.board !== 1) {
						if (ball && player1 && player2 && player3 && player4) {
							if (gameState.map === 'JUNGLE' || gameState.map === 'SPACE') {
								ball.style.backgroundColor = '#F9DA49'
								player1.style.backgroundColor = '#F9DA49'
								player2.style.backgroundColor = '#F9DA49'
								player3.style.backgroundColor = '#F9DA49'
								player4.style.backgroundColor = '#F9DA49'
							}
						}
					}
				}
				if (ball) {
					ball.style.width =
						gameDiv.offsetWidth * gameState.ball_size + 'px';
					ball.style.height =
						gameDiv.offsetWidth * gameState.ball_size + 'px';
					ball.style.left =
						(gameDiv.offsetWidth - ball.offsetWidth - 3) *
							gameState.ball_x +
						'px';
					ball.style.top =
						(gameDiv.offsetHeight - ball.offsetWidth - 3) *
							gameState.ball_y +
						'px';
				}
				if (gameState.board === 3) {
					if (player1) {
						player1.style.height =
							gameDiv.offsetHeight * gameState.player1_size +
							'px';
						player1.style.width =
							gameDiv.offsetWidth * gameState.player_width + 'px';
						player1.style.top =
							(gameDiv.offsetHeight - 3 - player1.offsetHeight) *
								gameState.player1_y +
							'px';
						player1.style.left =
							(gameDiv.offsetWidth - player1.offsetWidth) *
								gameState.player1_x +
							'px';
					}
					if (player2) {
						player2.style.height =
							gameDiv.offsetHeight * gameState.player2_size +
							'px';
						player2.style.width =
							gameDiv.offsetWidth * gameState.player_width + 'px';
						player2.style.top =
							(gameDiv.offsetHeight - 3 - player2.offsetHeight) *
								gameState.player2_y +
							'px';
						player2.style.left =
							(gameDiv.offsetWidth - player2.offsetWidth) *
								gameState.player2_x +
							'px';
					}
					if (player3) {
						player3.style.height =
							gameDiv.offsetHeight * gameState.player3_size +
							'px';
						player3.style.width =
							gameDiv.offsetWidth * gameState.player_width + 'px';
						player3.style.top =
							(gameDiv.offsetHeight - 3 - player3.offsetHeight) *
								gameState.player3_y +
							'px';
						player3.style.right =
							(gameDiv.offsetWidth - player3.offsetWidth) *
								(1 - gameState.player3_x) +
							'px';
					}
					if (player4) {
						player4.style.height =
							gameDiv.offsetHeight * gameState.player4_size +
							'px';
						player4.style.width =
							gameDiv.offsetWidth * gameState.player_width + 'px';
						player4.style.top =
							(gameDiv.offsetHeight - 3 - player4.offsetHeight) *
								gameState.player4_y +
							'px';
						player4.style.right =
							(gameDiv.offsetWidth - player4.offsetWidth) *
								(1 - gameState.player4_x) +
							'px';
					}
				} else {
					if (player1) {
						player1.style.height =
							gameDiv.offsetHeight * gameState.player1_size +
							'px';
						player1.style.width =
							gameDiv.offsetWidth * gameState.player_width + 'px';
						player1.style.top =
							(gameDiv.offsetHeight - 3 - player1.offsetHeight) *
								gameState.player1_y +
							'px';
						player1.style.left =
							(gameDiv.offsetWidth - player1.offsetWidth) *
								gameState.player1_x +
							'px';
					}
					if (player2) {
						player2.style.height =
							gameDiv.offsetHeight * gameState.player2_size +
							'px';
						player2.style.width =
							gameDiv.offsetWidth * gameState.player_width + 'px';
						player2.style.top =
							(gameDiv.offsetHeight - 3 - player2.offsetHeight) *
								gameState.player2_y +
							'px';
						player2.style.right =
							(gameDiv.offsetWidth - player2.offsetWidth) *
								(1 - gameState.player2_x) +
							'px';
					}
					if (player3) {
						player3.style.height =
							gameDiv.offsetHeight * gameState.player_width +
							'px';
						player3.style.width =
							gameDiv.offsetWidth * gameState.player3_size + 'px';
						player3.style.top =
							(gameDiv.offsetHeight - player3.offsetHeight) *
								gameState.player3_y +
							'px';
						player3.style.left =
							(gameDiv.offsetWidth - 3 - player3.offsetWidth) *
								gameState.player3_x +
							'px';
					}
					if (player4) {
						player4.style.height =
							gameDiv.offsetHeight * gameState.player_width +
							'px';
						player4.style.width =
							gameDiv.offsetWidth * gameState.player4_size + 'px';
						player4.style.bottom =
							(gameDiv.offsetHeight - player4.offsetHeight) *
								(1 - gameState.player4_y) +
							'px';
						player4.style.left =
							(gameDiv.offsetWidth - 3 - player4.offsetWidth) *
								gameState.player4_x +
							'px';
					}
				}

				let score1 = document.querySelector<HTMLElement>(
					'#game-playing-score1'
				);
				let score2 = document.querySelector<HTMLElement>(
					'#game-playing-score2'
				);
				if (score1) score1.innerHTML = gameState.player1_score;
				if (score2 && gameState.board !== 3)
					score2.innerHTML = gameState.player2_score;
				if (score2 && gameState.board === 3)
					score2.innerHTML = gameState.player3_score;
				if (score3) score3.innerHTML = gameState.player3_score;
				if (score4) score4.innerHTML = gameState.player4_score;
			}
		};

		const endGame = (data: any) => {
			socketGame.emit('endGameStatus', { room: room });
			socketGame.emit('gameDisconnection');
			updateHere(false);
		};

		const errorGame = (data: any) => {
			updateGameEnd(data);
		};

		const quickChatMessageResponse = (data: any) => {
			const tab = [
				'gg !',
				'Nice One',
				'Woohh',
				"It's my time",
				'Easy',
				'Close one!',
				'Savage',
				'You are so good',
				"I'm a wall !!",
				'OMG',
			];

			const chatUl =
				document.querySelector<HTMLElement>('#game-playing-chat');
			const li = document.createElement('li');

			if (chatUl) {
				li.innerHTML = `<b>${data.login}:</b> ${tab[data.message]}`;
				chatUl.appendChild(li);
				localStorage.setItem(
					'game-chat-storage-room-' + room,
					chatUl.innerHTML
				);
				chatUl.scrollTop = chatUl.scrollHeight;
			}
		};



		const getEndStatus = (data: any) => {
			// console.log('getEndStatus', data);
			updateGameEnd(data);
			socketGame.off('getEndStatus');
		};

		if (here === false) {
			socketGame.off('gameState');
			socketGame.off('endGame');
			socketGame.off('error');
			socketGame.off('quickChatMessageResponse');
			localStorage.removeItem('game-chat-storage-room-' + room);
		}
		if (here === true) {
			socketGame.off('gameState');
			socketGame.off('endGame');
			socketGame.off('error');
			socketGame.off('quickChatMessageResponse');
			socketGame.off('getEndStatus');
			socketGame.on('gameState', updateGameState);
			socketGame.on('endGame', endGame);
			socketGame.on('error', errorGame);
			socketGame.on('quickChatMessageResponse', quickChatMessageResponse);
			socketGame.on('getEndStatus', getEndStatus);
			socketGame.emit('getSpectator', { room: room });
		}
	}, [here, room, socketGame]);

	useEffect(() => {
		if (!socketGame || socketGame.connected === undefined) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'ArrowUp') {
				event.preventDefault();
				socketGame.emit('keyPress', 'UP');
			} else if (event.key === 'ArrowDown') {
				event.preventDefault();
				socketGame.emit('keyPress', 'DOWN');
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				socketGame.emit('keyPress', 'LEFT');
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				socketGame.emit('keyPress', 'RIGHT');
			} else if (event.key >= '0' && event.key <= '9') {
				socketGame.emit('quickChatMessage', {
					key: event.key,
					room: room,
				});
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			if (event.key === 'ArrowUp') {
				event.preventDefault();
				socketGame.emit('keyRelease', 'UP');
			} else if (event.key === 'ArrowDown') {
				event.preventDefault();
				socketGame.emit('keyRelease', 'DOWN');
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				socketGame.emit('keyRelease', 'LEFT');
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				socketGame.emit('keyRelease', 'RIGHT');
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
		};
	}, [room, socketGame]);

	const surrend = () => {
		socketGame.emit('surrender', { login: login, room: room });
	};

	const returnToHome = () => {
		navigate('/');
	};

	return (
		<div className="game-playing-parent">
			<div className="game-playing-top">
				<div className="game-playing-quick-chat">
					<ul id="game-playing-chat"></ul>
				</div>
				<div className="game-playing-viewer">
					<img src={eyePNG} alt="Spec" className="game-playing-eye" />
					: {spectator}
				</div>
			</div>
			{!here ? (
				board === 1 || board === 2 ? (
					<div className="game-end">
						<div className="game-end-podium">
							<Podium
								color="#C0C0C0"
								height="45%"
								point={gameEnd.score2}
								avatar={gameEnd.avatar2}
							/>
							<Podium
								color="#FFD700"
								height="60%"
								point={gameEnd.score1}
								avatar={gameEnd.avatar1}
							/>
							<Podium
								color="#CD7F32"
								height="30%"
								point={gameEnd.score3}
								avatar={gameEnd.avatar3}
							/>
						</div>
						{/* <img src={crown} className="game-end-crown" /> */}
						{/* <div className="game-end-elo"></div>
				<div className="game-end-recap"></div> */}
					</div>
				) : (
					<div className="game-end">
						<div className="game-end-podium">
							<Podium
								color="#C0C0C0"
								height="45%"
								point={gameEnd.score2}
								avatar={gameEnd.avatar3}
								avatar2={gameEnd.avatar4}
							/>
							<Podium
								color="#FFD700"
								height="60%"
								point={gameEnd.score1}
								avatar={gameEnd.avatar1}
								avatar2={gameEnd.avatar2}
								crown={true}
							/>
							<Podium
								color="#CD7F32"
								height="30%"
								point={gameEnd.score3}
								avatar={null}
							/>
						</div>
						{/* <div className="game-end-elo"></div>
				<div className="game-end-recap"></div> */}
					</div>
				)
			) : board === 1 ? (
				<div className="game-playing-board" id="game-board">
					<span className="game-playing-ball"></span>
					<span
						className="game-playing-player"
						id="game-playing-player1"></span>
					<span
						className="game-playing-player"
						id="game-playing-player2"></span>
					<div className="game-playing-score-div">
						<span
							className="game-playing-score"
							id="game-playing-score1">
							0
						</span>
						<span
							className="game-playing-score"
							id="game-playing-score2">
							0
						</span>
					</div>
				</div>
			) : board === 2 ? (
				<div className="game-playing-big-board" id="game-board">
					<span className="game-playing-ball"></span>
					<span
						className="game-playing-player"
						id="game-playing-player1"></span>
					<span
						className="game-playing-player"
						id="game-playing-player2"></span>
					<span
						className="game-playing-player-hor"
						id="game-playing-player3"></span>
					<span
						className="game-playing-player-hor"
						id="game-playing-player4"></span>
					<div className="game-playing-score-div">
						<span
							className="game-playing-score"
							id="game-playing-score1">
							4
						</span>
						<span
							className="game-playing-score"
							id="game-playing-score2">
							4
						</span>
						<span
							className="game-playing-score"
							id="game-playing-score3">
							4
						</span>
						<span
							className="game-playing-score"
							id="game-playing-score4">
							4
						</span>
					</div>
				</div>
			) : (
				<div className="game-playing-board" id="game-board">
					<span className="game-playing-ball"></span>
					<span
						className="game-playing-player-little"
						id="game-playing-player5"></span>
					<span
						className="game-playing-player-little"
						id="game-playing-player6"></span>
					<span
						className="game-playing-player-little"
						id="game-playing-player7"></span>
					<span
						className="game-playing-player-little"
						id="game-playing-player8"></span>
					<div className="game-playing-score-div">
						<span
							className="game-playing-score"
							id="game-playing-score1">
							0
						</span>
						<span
							className="game-playing-score"
							id="game-playing-score2">
							0
						</span>
					</div>
				</div>
			)}
			{here && isSpec === false ? (
				<button
					className="game-playing-button-surrend"
					onClick={surrend}>
					{' '}
					Surrend{' '}
				</button>
			) : (
				<button
					className="game-playing-button-surrend"
					onClick={returnToHome}>
					{' '}
					Return to Home{' '}
				</button>
			)}
		</div>
	);
}

export default Game;
