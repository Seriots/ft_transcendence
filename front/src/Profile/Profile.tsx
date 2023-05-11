import { useSelector } from 'react-redux';
import axios from 'axios';
import './Profile.css';
/*	Components	*/
import { MainInfo } from './Components/MainInfo/MainInfo';
import { MiddleInfo } from './Components/MiddleInfo/MiddleInfo';
import { MatchHistory } from './Components/MatchHistory/MatchHistory';
import { selectUserData } from '../utils/redux/selectors';

import { selectEnv } from '../utils/redux/selectors';
import { useAxios } from '../utils/hooks';
import { useEffect, useState } from 'react';

export const Profile = ({ socketQueue }: any) => {
	const userConnected = useSelector(selectUserData);
	const env = useSelector(selectEnv);
	const [user, setUser] = useState({} as any);
	const handleLogout = async () => {
		await axios.get(
			'https://' + env.host + ':' + env.port + '/users/logout',
			{
				withCredentials: true,
			}
		);
		window.location.reload();
	};

	const {
		isLoading,
		data,
		error,
	}: { isLoading: boolean; data: any; error: boolean } = useAxios(
		'https://' +
			env.host +
			':' +
			env.port +
			'/users/username/' +
			userConnected.username
	);

	useEffect(() => {
		if (data) data.avatar = userConnected.avatar;
		if (data) data.state = 'ONLINE';
		if (data) data.twoFactor = userConnected.twoFactor;
		setUser(data);
	}, [data, env.host, env.port]);

	const updateMyStateResponse = (response: any) => {
		if (data && response) {
			setUser((user: any) => ({ ...user, state: response.state }));
		}
	};

	useEffect(() => {
		if (socketQueue && socketQueue.connected !== undefined) {
			socketQueue.off('updateMyStateResponse');
			socketQueue.on('updateMyStateResponse', updateMyStateResponse);
			socketQueue.emit('updateMyState');
		}
	}, [socketQueue]);

	if (isLoading && !error) return <div></div>;

	return (
		<div className="profile-wrapper">
			<h1>My Profile</h1>
			<button className="profile-logout" onClick={handleLogout}>
				Logout
			</button>
			<div className="main-wrapper">
				<MainInfo userProfile={false} userData={user} />
				<MiddleInfo userData={user} />
				<MatchHistory userData={user} />
			</div>
		</div>
	);
};
