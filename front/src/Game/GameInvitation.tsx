import { useEffect, useState } from 'react';
import './GameInvitation.css';
import { selectEnv } from '../utils/redux/selectors';
import { useSelector } from 'react-redux';

const InvitationCard = ({
	login,
	avatar,
	gameInvitation,
	updateGameInvitation,
	socketQueue,
}: any) => {
	const env = useSelector(selectEnv);

	const removeTarget = (e: any) => {
		updateGameInvitation(
			gameInvitation.filter(
				(invitation: any) => invitation.login !== login
			)
		);
	};

	const joinGroup = () => {
		updateGameInvitation([] as { login: string; avatar: string }[]);
		socketQueue.emit('JoinGroup', { groupLogin: login }); // -> appuie sur le bouton plutot
	};

	return (
		<div className="game-invitation-card">
			<button className="game-invitation-close" onClick={removeTarget}>
				x
			</button>
			<div className="game-invitation-card-avatar-underdiv">
				<img
					className="game-invitation-card-avatar"
					src={
						avatar
							? 'http://' +
							  env.host +
							  ':' +
							  env.port +
							  '/' +
							  avatar
							: ''
					}
					alt="Avatar"
				/>
			</div>
			<div className="game-player-card-title">
				<b>{login}</b> invite you !
			</div>
			<button className="game-invitation-button-join" onClick={joinGroup}>
				Join
			</button>
		</div>
	);
};

const GameInvitation = ({ socketQueue }: any) => {
	const [gameInvitation, updateGameInvitation] = useState(
		[] as { login: string; avatar: string }[]
	);

	useEffect(() => {
		if (socketQueue && socketQueue.connected !== undefined) {
			socketQueue.off('InviteGroupReceive');
			socketQueue.on('InviteGroupReceive', (data: any) => {
				let inc = false;
				for (const invitation of gameInvitation) {
					if (invitation.login === data.login) {
						inc = true;
						break;
					}
				}
				if (!inc)
					updateGameInvitation([
						...gameInvitation,
						{ login: data.login, avatar: data.avatar },
					]);
			});
		}
	}, [socketQueue, updateGameInvitation, gameInvitation]);

	return (
		<div className="game-invitation-main-div">
			{gameInvitation.map((invitation: any, index: number) => {
				return (
					<InvitationCard
						key={invitation.login}
						login={invitation.login}
						avatar={invitation.avatar}
						gameInvitation={gameInvitation}
						updateGameInvitation={updateGameInvitation}
						socketQueue={socketQueue}
					/>
				);
			})}
		</div>
	);
};

export default GameInvitation;
