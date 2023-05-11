import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

/*	COMPONENTS	*/
import MainPage from './MainPage/MainPage';
import { Social } from './Social/Social';
import { Login, Login2fa, Config, Config2fa } from './Login/Login';
import { Messagerie } from './Messagerie/Messagerie';
import AppLayout from './AppLayout';
import GameRoute from './Game/GameRoute';
import Notification from './Notification/Notification';
import { Profile } from './Profile/Profile';
import { AuthRoutes } from './utils/PrivateRoutes';
import { useSelector } from 'react-redux';
import { UserProfile } from './Profile/UserProfile';
/*	HOOKS	*/
import { useGetUser } from './utils/hooks';
/*	SELECTORS	*/
import { selectEnv, selectUser } from './utils/redux/selectors';
/* SOCKET */
import { io, Socket } from 'socket.io-client';
import GamePopUp from './Game/GamePopUp';
import GameInvitation from './Game/GameInvitation';
import Admin from './Admin'

const NotFound = () => {
	return (
		<div>
			<Navigate to="/" replace />
		</div>
	);
};

function App(this: any) {
	useGetUser();
	const user = useSelector(selectUser);
	const env = useSelector(selectEnv);
	//const currentPath = window.location.pathname;
	const [reload, setReload] = useState(false);
	const [socketQueue, setSocketQueue] = useState<Socket>({} as Socket);
	const [socketGame, setSocketGame] = useState<Socket>({} as Socket);

	useEffect(() => {
		if (user.status === 'resolved' && user.auth) {
			setSocketQueue(
				io('https://' + env.host + ':' + env.port + '/queue', {
					transports: ['websocket'],
					withCredentials: true,
				})
			);
			setSocketGame(
				io('https://' + env.host + ':' + env.port + '/game', {
					transports: ['websocket'],
					withCredentials: true,
				})
			);
		}
	}, [user, env.host, env.port]);

	console.log("user", user)
//	if (user.status !== 'resolved' && user.status !== 'notAuth')
//		return <div></div>;
	return (
		<div>
			<GamePopUp
				socketQueue={socketQueue}
				reload={reload}
				setReload={setReload}
			/>
			<GameInvitation socketQueue={socketQueue} />
			<Routes>
				<Route element={<AuthRoutes />}>
					<Route
						path="/"
						element={
							<AppLayout>
								{' '}
								<MainPage />
							</AppLayout>
						}
					/>
					<Route path="/login/config" element={<Config />} />
					<Route path="/login/2faconfig" element={<Config2fa />} />
					<Route
						path="/social"
						element={
							<AppLayout>
								{' '}
								<Social socketQueue={socketQueue} />
							</AppLayout>
						}
					/>
					<Route
						path="/chat"
						element={
							<AppLayout>
								{' '}
								<Messagerie socketQueue={socketQueue} />
							</AppLayout>
						}
					/>
					<Route
						path="/game"
						element={
							<GameRoute
								socketQueue={socketQueue}
								socketGame={socketGame}
								reload={reload}
								setReload={setReload}
								env={env}
							/>
						}
					/>
					<Route
						path="/Notification"
						element={
							<AppLayout>
								{' '}
								<Notification />
							</AppLayout>
						}
					/>
					<Route
						path="/profile"
						element={
							<AppLayout>
								{' '}
								<Profile socketQueue={socketQueue} />
							</AppLayout>
						}
					/>
					<Route
						path="/profile/:username"
						element={
							<AppLayout>
								{' '}
								<UserProfile />
							</AppLayout>
						}
					/>
				</Route>
				<Route path="/login" element={<Login />} />
				<Route path="/login/2fa/:login" element={<Login2fa />} />
				<Route path="/admin" element={<Admin />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</div>
	);
}

export default App;
