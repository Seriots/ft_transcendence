import React from 'react';
import './Friends.css';
import { BasicFrame } from '../../MiddleInfo';
import { useAxios } from '../../../../../utils/hooks';
import { useNavigate } from 'react-router-dom';
import { selectEnv } from '../../../../../utils/redux/selectors';
import { useSelector } from 'react-redux';

interface FriendProps {
	avatar: string;
	username: string;
	level: number;
}

const Friend = ({ avatar, username, level }: FriendProps) => {
	const navigate = useNavigate();

	const handleNavigate = () => {
		return navigate('/profile/' + username);
	};

	return (
		<div className="friend" onClick={handleNavigate}>
			<div className="avatar-wrapper">
				<div className="level-wrapper">{level.toString()}</div>
				<img src={avatar} alt="friend-avatar" />
			</div>
			<div className="friend-username">{username}</div>
		</div>
	);
};

export const Friends = ({ userData }: { userData: any }) => {
	const env = useSelector(selectEnv);
	const {
		isLoading,
		data,
		error,
	}: { isLoading: boolean; data: any; error: boolean } = useAxios(
		'http://' + env.host + ':' + env.port + '/users/friends/' + userData.username
	);

	if (isLoading && !error) return <></>;

	return (
		<div className="friends">
			<BasicFrame title="Friends">
				<div className="friends-in-wrapper">
					{data.friends &&
						data.friends.map((friend: any, index: any) => (
							<Friend
								key={index}
								avatar={
									'http://' + env.host + ':' + env.port + '/' + friend.avatar
								}
								username={friend.username}
								level={Math.floor(friend.experience / 1000)}
							/>
						))}
				</div>
			</BasicFrame>
		</div>
	);
};
