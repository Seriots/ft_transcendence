import { User } from '../types';
import { Link } from 'react-router-dom';
//Ressources
import cancel_blue from '../Ressources/cancel_blue.svg';
import { selectEnv } from '../../utils/redux/selectors';
import { useSelector } from 'react-redux';

interface BlockedUserProps {
	blocked: User[];
	users: User[];
	UnBlockFriend: (username: string) => Promise<void>;
}

export const BlockedUser = ({
	blocked,
	users,
	UnBlockFriend,
}: BlockedUserProps) => {
	const env = useSelector(selectEnv);
	return (
		<>
			<ul className="allreceivedFriendsSearch">
				{blocked.map((blocked, index) => {
					const userBlockedInfo = users.find(
						(user) => user.username === blocked.username
					);
					const level = (userBlockedInfo?.experience ?? 0) / 1000;
					return (
						<div className="receivedFriendsInfoAll" key={index}>
							<div className="receivedFriendsInfo">
								<Link
									to={'/profile/' + blocked.username}
									className="customLink">
									<img
										className="receivedImgUser"
										src={`https://${env.host}:${env.port}/${userBlockedInfo?.avatar}`}
										alt="avatar"
									/>
									<div className="receivedFriendsInfoTxt">
										<div className="receivedFriendsInfoSpe">
											<p>Pseudo</p>
											<p>{blocked.username}</p>
										</div>
										<div className="receivedFriendsInfoSpe">
											<p>Level</p>
											<p>{level}</p>
										</div>
										<div className="receivedFriendsInfoSpe">
											<p>Status</p>
											<p>
												{userBlockedInfo?.state.toLowerCase()}
											</p>
										</div>
									</div>
								</Link>
							</div>
							<div className="receivedButton">
								<button
									className="receivedFriendsadd"
									onClick={() =>
										UnBlockFriend(blocked.username)
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
