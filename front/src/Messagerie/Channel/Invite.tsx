import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { ChannelDto, ChannelsContext, userInfoDto } from './ChannelsUtils';
import { Socket } from 'socket.io-client';
import close from '../../Profile/Components/MainInfo/Ressources/close.svg';
import search from '../Ressources/search.svg';
import { useSelector } from 'react-redux';
/* Ressources */
import check from '../Ressources/check.svg';
import { selectEnv, selectUserData } from '../../utils/redux/selectors';

export const Invite = ({ socket }: { socket: Socket }) => {
	const [Invites, setInvites] = useState<any[]>([]);
	const { SaveChannel, setSaveChannel, setMessages, setSelectedChannel } =
		useContext(ChannelsContext);
	const connectedUser = useSelector(selectUserData);
	const env = useSelector(selectEnv);

	useEffect(() => {
		const fetchInvites = async () => {
			try {
				const response = await axios.get(
					'http://' + env.host + ':' + env.port + '/chat/invites',
					{ withCredentials: true }
				);
				setInvites(response.data);
			} catch (error) {
				console.error(error);
			}
		};
		fetchInvites();
		const interval = setInterval(fetchInvites, 2500);
		return () => clearInterval(interval);
	}, [env.host, env.port]);

	const getMessages = async (Channel: ChannelDto) => {
		if (Channel.id === 0) return;
		try {
			const response = await axios.get(
				'http://' +
					env.host +
					':' +
					env.port +
					'/chat/channel/messages/' +
					Channel.id,
				{ withCredentials: true }
			);
			response.data.map((message: any) => {
				return (
					message.userId === connectedUser.id
						? (message.username = connectedUser.username)
						: (message.username = ''),
					(message.content = message.message)
				);
			});
			setMessages(response.data.reverse());
		} catch (error) {
			console.log(error);
		}
	};

	const JoinPrivateChannel = async (Channel: ChannelDto) => {
		try {
			await axios.post(
				'http://' +
					env.host +
					':' +
					env.port +
					'/chat/join/' +
					Channel.name,
				{ state: 'PRIVATE' },
				{ withCredentials: true }
			);
			setSelectedChannel(Channel);
			getMessages(Channel);
			socket?.emit('join', {
				channel: Channel.name,
				username: connectedUser.username,
			});
			setSaveChannel([...SaveChannel, Channel]);
		} catch (error) {
			console.log(error);
		}
	};

	const DeclineInvite = async (Channel: ChannelDto) => {
		try {
			axios.delete(
				'http://' +
					env.host +
					':' +
					env.port +
					'/chat/decline/' +
					Channel.name,
				{
					withCredentials: true,
				}
			);
		} catch (error) {
			console.error(error);
		}
		setInvites(Invites.filter((channel) => channel.name !== Channel.name));
	};

	return (
		<>
			{Invites.map((invite, index) => (
				<div
					className="dm-list-element"
					style={{ justifyContent: 'space-around' }}
					key={index}>
					<h4>Join {invite.channels.name} ?</h4>
					<div>
						<img
							src={check}
							alt="accept invite"
							onClick={() =>
								JoinPrivateChannel(invite.channels)
							}></img>
						<img
							src={close}
							alt="decline invite"
							onClick={() =>
								DeclineInvite(invite.channels)
							}></img>
					</div>
				</div>
			))}
		</>
	);
};

const InputFlat = ({
	icon,
	content,
	selectedUser,
	setSelectedUser,
}: {
	icon: string;
	content: string;
	selectedUser: string;
	setSelectedUser: React.Dispatch<React.SetStateAction<string>>;
}) => {
	const [searchTerm, setSearchTerm] = useState('');
	const [searchResults, setSearchResults] = useState<userInfoDto[]>([]);
	const [users, setUsers] = useState<userInfoDto[]>([]);
	const connectedUser = useSelector(selectUserData);
	const env = useSelector(selectEnv);

	useEffect(() => {
		const FetchUsers = async () => {
			try {
				const response = await axios.get(
					'http://' + env.host + ':' + env.port + '/users/login',
					{ withCredentials: true }
				);
				const users = response.data.filter(
					(user: userInfoDto) =>
						user.username !== connectedUser?.username
				);
				setUsers(users);
				setSelectedUser(users[0].username);
			} catch (error) {
				console.log(error);
			}
		};

		FetchUsers();
	}, [connectedUser, env.host, env.port, setSelectedUser]);

	useEffect(() => {
		const searchUsers = (searchTerm: string) => {
			const results = users.filter((user) =>
				user.username.toLowerCase().includes(searchTerm.toLowerCase())
			);
			setSearchResults(results);
		};

		searchUsers(searchTerm);
	}, [searchTerm, users]);

	return (
		<>
			<div className="input-flat">
				<img src={icon} alt="search icon" />
				<input
					type="text"
					placeholder={content}
					value={searchTerm}
					onChange={(e) => {
						setSearchTerm(e.target.value);
					}}
				/>
			</div>
			<div className="input-select">
				<select
					value={selectedUser}
					onChange={(e) => setSelectedUser(e.target.value)}>
					{searchResults.length > 0
						? searchResults.map((user, index) => (
								<option key={index} value={user.username}>
									{user.username}
								</option>
						  ))
						: users.map((user, index) => (
								<option key={index} value={user.username}>
									{user.username}
								</option>
						  ))}
				</select>
			</div>
		</>
	);
};

export const InviteChannel = ({
	handleChannelInviteTrigger,
	Channel,
}: {
	handleChannelInviteTrigger: () => void;
	Channel: ChannelDto;
}) => {
	const me = document.getElementsByClassName('popup');
	const [selectedUser, setSelectedUser] = useState('');
	const env = useSelector(selectEnv);

	useEffect(() => {
		window.onclick = (event: any) => {
			if (event.target === me[0]) {
				handleChannelInviteTrigger();
			}
		};
	}, [me, handleChannelInviteTrigger]);

	const handleInviteUser = async () => {
		if (!Channel) return;
		try {
			await axios.post(
				'http://' +
					env.host +
					':' +
					env.port +
					'/chat/invite/' +
					Channel.name,
				{ username: selectedUser },
				{ withCredentials: true }
			);
			handleChannelInviteTrigger();
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="new-dm">
			<img
				src={close}
				alt="close-button"
				onClick={handleChannelInviteTrigger}
			/>
			<h3>Invite {Channel.name}</h3>
			<InputFlat
				icon={search}
				content="Search a user"
				selectedUser={selectedUser}
				setSelectedUser={setSelectedUser}
			/>
			<div className="new-dm-buttons">
				<button onClick={handleInviteUser}>Invite</button>
				<button onClick={handleChannelInviteTrigger}>Cancel</button>
			</div>
		</div>
	);
};
