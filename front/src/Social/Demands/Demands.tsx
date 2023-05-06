import { User } from '../types';
import { Link } from 'react-router-dom';
import { selectEnv } from '../../utils/redux/selectors';
import { useSelector } from 'react-redux';

interface DemandsProps {
	demands: User[];
}

export const Demands = ({ demands }: DemandsProps) => {
	const env = useSelector(selectEnv);
	return (
		<>
			<ul className="allreceivedFriendsSearch">
				{demands.map((friend, index) => {
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
						</div>
					);
				})}
			</ul>
		</>
	);
};
