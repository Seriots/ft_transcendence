import { useEffect, useState } from 'react';
import AppLayout from '../AppLayout';
import Game from './Game';
import Lobby from './Lobby';
import LobbyCreation from './LobbyCreation';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { selectEnv } from '../utils/redux/selectors';
import { useSelector } from 'react-redux';

const GameRoute = ({
	socketQueue,
	socketGame,
	reload,
	setReload,
}: any) => {
	const [state, updateState] = useState(
		{} as { code: number; login: string; room: number }
	);
	const location = useLocation();
	const room = location.state?.room;
	const env = useSelector(selectEnv);
	useEffect(() => {
		if (!room)
		{
			axios
				.get('https://' + env.host + ':' + env.port +'/queues/joinable', {
					withCredentials: true,
				})
				.then((res) => {
					if (res.data.canJoin || reload === 2)
						updateState({ code: 0, login: res.data.login, room: 0 });
					else if (res.data.reason === 'searching')
						updateState({ code: 1, login: res.data.login, room: 0 });
					else if (res.data.reason === 'playing')
						updateState({
							code: 2,
							login: res.data.login,
							room: res.data.gameId,
						});
				})
				.catch((err) => {
					console.log(err);
				});
		}
		else if (room)
		{
			axios.get('https://' + env.host + ':' + env.port +'/games/progress/' + room, {
				withCredentials: true,
				}).then((res) => {
					if (res.data.spec || reload === 2)
						updateState({ code: 2, login: res.data.login, room: room });
					else if (res.data.reason === 'ended' || res.data.reason === 'notFound')
						updateState({ code: 0, login: res.data.login, room: 0 });
					else if (res.data.reason === 'searching')
						updateState({ code: 1, login: res.data.login, room: 0 });
					else if (res.data.reason === 'playing')
						updateState({
							code: 2,
							login: res.data.login,
							room: res.data.gameId,
						});
				}
			).catch((err) => {
				console.log(err);
			});
		}
	}, [env.host, env.port, reload, room]);

	useEffect(() => {
		if (socketQueue && socketQueue.connected !== undefined) {
			socketQueue.off('stateUpdate');
			socketQueue.on('stateUpdate', (data: any) => {
				setReload(data);
			});
		}
	}, [socketQueue, setReload]);

	if (state.code === undefined) return <div></div>;
	if (state.code === 0) {
		return (
			<AppLayout>
				{' '}
				<LobbyCreation
					socketQueue={socketQueue}
					login={state.login}
					reload={reload}
					setReload={setReload}
				/>
			</AppLayout>
		);
	}
	if (state.code === 1) {
		return (
			<AppLayout>
				{' '}
				<Lobby
					socketQueue={socketQueue}
					login={state.login}
					reload={reload}
					setReload={setReload}
				/>
			</AppLayout>
		);
	}
	if (state.code === 2) {
		return (
			<Game
				socketGame={socketGame}
				room={state.room}
				login={state.login}
			/>
		);
	}
	return <Navigate to="/" replace />;
};

export default GameRoute;
