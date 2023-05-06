import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useParams } from 'react-router';
import { useAxios } from '../utils/hooks';
import './UserProfile.css';
/*	Components	*/
import { MainFrame } from '../Messagerie/Messagerie';
import { MainInfo } from './Components/MainInfo/MainInfo';
import { MiddleInfo } from './Components/MiddleInfo/MiddleInfo';
import { MatchHistory } from './Components/MatchHistory/MatchHistory';
import { selectEnv, selectUserData } from '../utils/redux/selectors';
import { useSelector } from 'react-redux';

export const UserProfile = () => {
	const { username } = useParams();
	const [user, setUser] = useState({});
	const env = useSelector(selectEnv);
	const me = useSelector(selectUserData);

	if (username === me.username) {
		window.location.href = '/profile';
	}
	const {
		isLoading,
		data,
		error,
	}: { isLoading: boolean; data: any; error: boolean } = useAxios(
		'http://' + env.host + ':' + env.port + '/users/username/' + username
	);

	useEffect(() => {
		if (data)
			data.avatar =
				'http://' + env.host + ':' + env.port + '/' + data.avatar;
		setUser(data);
	}, [data, env.host, env.port]);

	if (!data) return <Navigate to="/" replace />;

	if (isLoading && !error) return <div></div>;

	return (
		<>
			<MainFrame title={username + "'s Profile"}>
				<MainInfo userProfile={true} userData={user} />
				<MiddleInfo userData={user} />
				<MatchHistory userData={user} />
			</MainFrame>
		</>
	);
};
