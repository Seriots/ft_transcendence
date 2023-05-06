import React from 'react';
import { User } from '../types';
import { Link } from 'react-router-dom';
import './Received.css';

//Ressources
import cancel_blue from '../Ressources/cancel_blue.svg';
import check_blue from '../Ressources/check_blue.svg';
import { selectEnv } from '../../utils/redux/selectors';
import { useSelector } from 'react-redux';

interface ReceivedProps {
	AcceptFriend: (username: string) => Promise<void>;
	DeclineFriend: (username: string) => Promise<void>;
	pending: User[];
}

export const Received = ({
	AcceptFriend,
	DeclineFriend,
	pending,
}: ReceivedProps) => {
	const env = useSelector(selectEnv);
	return (
		<>
			<ul className="allreceivedFriendsSearch">
				{pending.map((friend, index) => {
					const level = friend.experience / 1000;
					return (
						<div className="receivedFriendsInfoAll" key={index}>
							<div className="receivedFriendsInfo">
								<Link
									to={'/profile/' + friend.username}
									className="customLink">
									<img
										className="receivedImgUser"
										src={`http://${env.host}:${env.port}/${friend.avatar}`}
										alt="avatar"
									/>
									<div className="receivedFriendsInfoTxt">
										<div className="receivedFriendsInfoSpe">
											<p>Pseudo</p>
											<p>{friend.username}</p>
										</div>
										<div className="receivedFriendsInfoSpe">
											<p>Level</p>
											<p>{level}</p>
										</div>
										<div className="receivedFriendsInfoSpe">
											<p>Status</p>
											<p>{friend.state.toLowerCase()}</p>
										</div>
									</div>
								</Link>
							</div>
							<div className="receivedButton">
								<button
									className="receivedFriendsadd"
									onClick={() =>
										AcceptFriend(friend.username)
									}>
									<img src={check_blue} alt="check user" />
								</button>
								<button
									className="receivedFriendsadd"
									onClick={() =>
										DeclineFriend(friend.username)
									}>
									<img src={cancel_blue} alt="cancel user" />
								</button>
							</div>
						</div>
					);
				})}
			</ul>
		</>
	);
};
