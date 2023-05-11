import React, { useEffect, useState, useCallback } from 'react';
import './FilteredUsers.css';
import { Link } from 'react-router-dom';
import { User } from '../types';

//Ressources
import add_blue from '../Ressources/add_blue.svg';
import { selectEnv } from '../../utils/redux/selectors';
import { useSelector } from 'react-redux';
import axios from 'axios';

interface FilteredUsersProps {
	AddFriendFunction: (username: string) => Promise<void>;
	searchQuery: string;
	users: User[];
	friends: User[];
	userInfo: User | undefined;
	pending: User[];
	blocked: User[];
	demands: User[];
}

export const FilteredUsers: React.FC<FilteredUsersProps> = ({
	AddFriendFunction,
	searchQuery,
	users,
	friends,
	userInfo,
	pending,
	demands,
	blocked,
}) => {
	const env = useSelector(selectEnv);
	const [isBlocked, setIsBlocked] = useState<Map<number, boolean>>(new Map());

	const checkBlockedStatus = useCallback(
		async (username: string, userId: number) => {
			try {
				const response = await axios.get(
					'https://' +
						env.host +
						':' +
						env.port +
						'/friend/blockbyme/' +
						username,
					{
						withCredentials: true,
					}
				);
				setIsBlocked((prevIsBlocked) =>
					new Map(prevIsBlocked).set(userId, response.data.isBlocked)
				);
			} catch (error) {
				console.log(error);
			}
		},
		[env.host, env.port]
	);
	useEffect(() => {
		users.forEach((user) => {
			if (!isBlocked.has(user.id)) {
				// console.log(user.username, checkBlockedStatus(user.username, user.id));
				checkBlockedStatus(user.username, user.id);
			}
		});
	}, [users, checkBlockedStatus, isBlocked]);
	const filteredUsers = users.filter((user) => {
		return (
			user.id !== userInfo?.id &&
			!friends.some((friend) => friend.id === user.id) &&
			!pending.some((pending) => pending.id === user.id) &&
			!demands.some((demand) => demand.id === user.id) &&
			!blocked.some((block) => block.id === user.id) &&
			!isBlocked.get(user.id) &&
			user.username.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});
	return (
		<>
			<div>
				{searchQuery.length > 0 && (
					<ul className="allFriendsSearch">
						{filteredUsers.map((user, index) => {
							const level = user.experience / 1000;
							return (
								<div className="friendsInfoAll" key={index}>
									<div className="friendsInfoNomsg">
										<Link
											className="customLink"
											to={'/profile/' + user.username}>
											<img
												className="imgUser"
												src={`https://${env.host}:${env.port}/${user.avatar}`}
												alt="username avatar"
											/>
											<div className="friendsInfoTxt">
												<div className="friendsInfoSpe">
													<p>Pseudo</p>
													<p>{user.username}</p>
												</div>
												<div className="friendsInfoSpe">
													<p>Level</p>
													<p>{level}</p>
												</div>
												<div className="friendsInfoSpe">
													<p>Status</p>
													<p>
														{user.state.toLowerCase()}
													</p>
												</div>
											</div>
										</Link>
										<button
											className="addUser"
											onClick={() =>
												AddFriendFunction(user.username)
											}>
											<img
												src={add_blue}
												alt="all user"
											/>
										</button>
									</div>
								</div>
							);
						})}
					</ul>
				)}
			</div>
		</>
	);
};
