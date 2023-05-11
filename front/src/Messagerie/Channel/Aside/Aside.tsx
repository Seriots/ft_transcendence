import React, {
	useState,
	useCallback,
	useContext,
	useEffect,
	useRef,
} from 'react';
import './Aside.css';
import { Socket } from 'socket.io-client';
import axios from 'axios';
/* Interface */
import { ChannelDto, ChannelsContext } from '../ChannelsUtils';
import { userInfoDto } from '../ChannelsUtils';
/* Components */
import { PopUp } from '../../../Profile/Components/MainInfo/MainInfo';
import { ChannelPassword } from '../ChannelPassword';
import { NewChannel, UpdateChannel } from '../NewChannel/NewChannel';
import { BasicFrame } from '../../../Profile/Components/MiddleInfo/MiddleInfo';
/* Ressources */
import controller from '../../Ressources/controller.svg';
import settings from '../../Ressources/settings.svg';
import profile from '../../Ressources/profile.svg';
import invite from '../../Ressources/invite.svg';
import { useSelector } from 'react-redux';
import { selectEnv, selectUserData } from '../../../utils/redux/selectors';
import { Invite, InviteChannel } from '../Invite';
import { useNavigate } from 'react-router-dom';

export const ChannelButton = ({
	icon,
	onClick,
	myRef,
	style,
}: {
	icon: string;
	onClick?: any;
	myRef?: any;
	style?: any;
}) => {
	return (
		<>
			<img
				className="channel-button"
				src={icon}
				alt="icon"
				onClick={onClick}
				ref={myRef}
				style={style}
			/>
		</>
	);
};

const ChannelListElement = ({
	Channel,
	socket,
}: {
	Channel: ChannelDto;
	socket: Socket;
}) => {
	const [ChannelPasswordTrigger, setChannelPasswordTrigger] = useState(false);
	const [ChannelSettingsTrigger, setChannelSettingsTrigger] = useState(false);
	const [ChannelInviteTrigger, setChannelInviteTrigger] = useState(false);
	const {
		setMessages,
		SaveChannel,
		selectedChannel,
		setSelectedChannel,
		setUsersList,
	} = useContext(ChannelsContext);
	const connectedUser = useSelector(selectUserData);
	const env = useSelector(selectEnv);

	const getMessages = async () => {
		if (Channel.id === 0) return;
		try {
			const response = await axios.get(
				'https://' +
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

	const getUsersList = async () => {
		if (!selectedChannel.name) return;
		try {
			const response = await axios.get(
				'https://' +
					env.host +
					':' +
					env.port +
					'/chat/channel/' +
					selectedChannel.name,
				{ withCredentials: true }
			);
			setUsersList(response.data.users);
		} catch (error) {
			console.log(error);
		}
	};

	const handleSelectChannel = async (channel: ChannelDto) => {
		try {
			const response = await axios.get(
				'https://' +
					env.host +
					':' +
					env.port +
					'/chat/ban/' +
					connectedUser.username,
				{ withCredentials: true }
			);
			if (response.data.find((ban: any) => ban.name === channel.name)) {
				//console.log('You are banned from this channel');
				return;
			} else if (channel?.state === 'PUBLIC') {
				setSelectedChannel(channel);
				getMessages();
				getUsersList();
				socket?.emit('join', {
					channel: channel.name,
					username: connectedUser.username,
				});
			} else if (channel?.state === 'PROTECTED') {
				if (
					SaveChannel.find(
						(savechannel) => savechannel.name === channel.name
					) ||
					connectedUser.id === channel.ownerId
				) {
					setSelectedChannel(channel);
					getMessages();
					getUsersList();
					socket?.emit('join', {
						channel: channel.name,
						username: connectedUser.username,
					});
				} else {
					handleChannelPasswordTrigger();
				}
			} else if (channel.state === 'PRIVATE') {
				if (!channel.ownerId) return;
				if (channel.ownerId === connectedUser.id) {
					setSelectedChannel(channel);
					getMessages();
					getUsersList();
					socket?.emit('join', {
						channel: channel.name,
						username: connectedUser.username,
					});
				} else if (
					SaveChannel.find(
						(savechannel) => savechannel.name === channel.name
					)
				) {
					setSelectedChannel(channel);
					getMessages();
					getUsersList();
					socket?.emit('join', {
						channel: channel.name,
						username: connectedUser.username,
					});
				} else {
					//console.log("You don't have access to this channel");
				}
			}
		} catch (error) {
			//console.log(error);
		}
	};

	const handleLeave = () => {
		window.location.reload();
	};

	const handleChannelPasswordTrigger = useCallback(() => {
		setChannelPasswordTrigger(!ChannelPasswordTrigger);
	}, [ChannelPasswordTrigger, setChannelPasswordTrigger]);

	const handleChannelSettingsTrigger = useCallback(() => {
		setChannelSettingsTrigger(!ChannelSettingsTrigger);
	}, [ChannelSettingsTrigger, setChannelSettingsTrigger]);

	const handleChannelInviteTrigger = useCallback(() => {
		setChannelInviteTrigger(!ChannelInviteTrigger);
	}, [ChannelInviteTrigger, setChannelInviteTrigger]);

	return (
		<>
			<div
				className={`dm-list-element ${
					Channel.id === selectedChannel?.id && 'active'
				}`}
				onClick={() => handleSelectChannel(Channel)}>
				<h4>{Channel.name}</h4>
				{Channel.id === selectedChannel?.id && (
					<button
						className="button-disconnect-channel"
						onClick={handleLeave}>
						Leave
					</button>
				)}
				{connectedUser.id === Channel.ownerId &&
					Channel.state === 'PRIVATE' && (
						<ChannelButton
							icon={invite}
							onClick={handleChannelInviteTrigger}
							style={{ marginLeft: 'auto', marginRight: '2px' }}
						/>
					)}
				{connectedUser.id === Channel.ownerId && (
					<ChannelButton
						icon={settings}
						onClick={handleChannelSettingsTrigger}
						style={{
							marginLeft:
								connectedUser.id === Channel.ownerId &&
								Channel.state === 'PRIVATE'
									? '0px'
									: 'auto',
						}}
					/>
				)}
			</div>
			<PopUp trigger={ChannelSettingsTrigger}>
				<UpdateChannel
					socket={socket}
					handleNewDmTrigger={handleChannelSettingsTrigger}
				/>
			</PopUp>
			<PopUp trigger={ChannelPasswordTrigger}>
				<ChannelPassword
					handleChannelPasswordTrigger={handleChannelPasswordTrigger}
					Channel={Channel}
				/>
			</PopUp>
			<PopUp trigger={ChannelInviteTrigger}>
				<InviteChannel
					handleChannelInviteTrigger={handleChannelInviteTrigger}
					Channel={Channel}
				/>
			</PopUp>
		</>
	);
};

const ChannelLists = ({ socket }: { socket: Socket }) => {
	const { ChannelList } = useContext(ChannelsContext);

	return (
		<div className="dm-list">
			{ChannelList.map((Channel, index) => {
				return (
					<ChannelListElement
						Channel={Channel}
						socket={socket}
						key={index}
					/>
				);
			})}
		</div>
	);
};

const UserChannelElement = ({
	user,
	channel,
	isAdmin,
	socket,
	socketQueue,
}: {
	user: userInfoDto;
	channel: ChannelDto;
	isAdmin: boolean;
	socket: Socket;
	socketQueue: Socket;
}) => {
	const userConnected = useSelector(selectUserData);
	const userIsAdmin = channel.ownerId === user.id || user.role === 'admin';
	const [userSettingsTrigger, setUserSettingsTrigger] = useState(false);
	const dropdown = useRef<HTMLDivElement>(null);
	const settingButton = useRef<HTMLDivElement>(null);
	const [isMute, setIsMute] = useState<boolean>(false);
	const [isBlocked, setIsBlocked] = useState<boolean>(false);
	const { selectedChannel, setUsersList } = useContext(ChannelsContext);
	const navigate = useNavigate();
	const env = useSelector(selectEnv);

	const handleUserSettingsTrigger = useCallback(() => {
		setUserSettingsTrigger(!userSettingsTrigger);
	}, [userSettingsTrigger, setUserSettingsTrigger]);

	useEffect(() => {
		window.onclick = (event: any) => {
			if (userSettingsTrigger) {
				if (
					!dropdown.current?.contains(event.target) &&
					!settingButton.current?.contains(event.target)
				) {
					setUserSettingsTrigger(false);
				}
			}
		};
	}, [userSettingsTrigger]);

	useEffect(() => {
		const getMute = async () => {
			if (!channel.name)
				try {
					const response = await axios.get(
						'https://' +
							env.host +
							':' +
							env.port +
							'/chat/mutes/' +
							channel.name,
						{ withCredentials: true }
					);
					const mute = response.data;
					mute.forEach((mutedUser: any) => {
						if (mutedUser.username === user.username) {
							setIsMute(true);
						}
					});
				} catch (error) {
					console.log(error);
				}
		};
		const getBlock = async () => {
			if (!user.username)
				try {
					const response = await axios.get(
						'https://' +
							env.host +
							':' +
							env.port +
							'/friend/blockbyme/' +
							user.username,
						{ withCredentials: true }
					);
					setIsBlocked(response.data.isBlocked);
				} catch (error) {
					console.error(error);
				}
		};
		const fetchAll = async () => {
			getMute();
			getBlock();
		};

		fetchAll();
		const interval = setInterval(fetchAll, 2500);
		return () => clearInterval(interval);
	}, [channel.name, env.host, env.port, user.username]);

	if (user.id === userConnected.id) return <></>;

	const getUsersList = async () => {
		if (!selectedChannel.name) return;
		try {
			const response = await axios.get(
				'https://' +
					env.host +
					':' +
					env.port +
					'/chat/channel/' +
					selectedChannel.name,
				{ withCredentials: true }
			);
			setUsersList(response.data.users);
		} catch (error) {
			console.log(error);
		}
	};

	const handlePromote = async () => {
		if (!channel.name) return;
		try {
			await axios.post(
				'https://' +
					env.host +
					':' +
					env.port +
					'/chat/admin/promote/' +
					channel.name,
				{
					username: user.username,
				},
				{ withCredentials: true }
			);
			getUsersList();
			//console.log(user.username + ' has been promoted');
		} catch (error) {
			console.error(error);
		}
	};

	const handleDemote = async () => {
		if (!channel.name) return;
		try {
			await axios.post(
				'https://' +
					env.host +
					':' +
					env.port +
					'/chat/admin/demote/' +
					channel.name,
				{
					username: user.username,
				},
				{ withCredentials: true }
			);
			getUsersList();
			//console.log(user.username + ' has been demoted');
		} catch (error) {
			console.error(error);
		}
	};

	const handleKick = async () => {
		socket?.emit('ToKick', {
			username: userConnected.username,
			channel: channel.name,
			login: user.username,
		});
		getUsersList();
		//console.log(user.username + ' has been kicked');
	};

	const handleBan = async () => {
		socket?.emit('ToBan', {
			username: userConnected.username,
			channel: channel.name,
			login: user.username,
		});
		getUsersList();
		//console.log(user.username + ' has been banned');
	};

	const handleMute = async () => {
		socket?.emit('ToMute', {
			username: userConnected.username,
			channel: channel.name,
			login: user.username,
		});
		setIsMute(true);
		//console.log(user.username + ' has been muted');
	};

	const handleUnmute = async () => {
		socket?.emit('ToUnmute', {
			username: userConnected.username,
			channel: channel.name,
			login: user.username,
		});
		setIsMute(false);
		//console.log(user.username + ' has been unmuted');
	};

	const handleBlock = async () => {
		if (!user.username) return;
		try {
			await axios.post(
				'https://' +
					env.host +
					':' +
					env.port +
					'/friend/block/' +
					user.username,
				{},
				{ withCredentials: true }
			);
			setIsBlocked(true);
			//console.log(user.username + ' has been blocked');
		} catch (error) {
			console.error(error);
		}
	};

	const handleUnblock = async () => {
		if (!user.username) return;
		try {
			await axios.post(
				'https://' +
					env.host +
					':' +
					env.port +
					'/friend/unblock/' +
					user.username,
				{},
				{ withCredentials: true }
			);
			setIsBlocked(false);
			//console.log(user.username + ' has been unblocked');
		} catch (error) {
			console.error(error);
		}
	};

	const handleNavigateProfile = () => {
		navigate('/profile/' + user.username);
	};

	const handleInviteGame = () => {
		socketQueue?.emit('InviteGroup', { id: user.id });
	};

	return (
		<div className="user-channel-list-element">
			<img
				className={
					userIsAdmin
						? 'dm-list-element-avatar admin-avatar'
						: 'dm-list-element-avatar'
				}
				src={'https://' + env.host + ':' + env.port + '/' + user.avatar}
				alt=""
			/>
			<h4 className={userIsAdmin ? 'admin' : undefined}>
				{user.username}{' '}
			</h4>
			<div className="user-channel-list-buttons">
				<ChannelButton icon={controller} onClick={handleInviteGame} />
				<ChannelButton icon={profile} onClick={handleNavigateProfile} />
				{(channel.ownerId === userConnected.id ||
					(user.role === 'user' && isAdmin === true)) && (
					<ChannelButton
						icon={settings}
						onClick={handleUserSettingsTrigger}
						myRef={settingButton}
					/>
				)}
				<div
					className="dropdown-settings-user-channel"
					style={{ display: userSettingsTrigger ? 'block' : 'none' }}
					ref={dropdown}>
					{channel.ownerId === userConnected.id &&
						user.role === 'user' && (
							<p onClick={handlePromote}>Op this user</p>
						)}
					{channel.ownerId === userConnected.id &&
						user.role === 'admin' && (
							<p onClick={handleDemote}>Demote this user</p>
						)}
					{!isMute ? (
						<p onClick={handleMute}>Mute this user</p>
					) : (
						<p onClick={handleUnmute}>Unmute this user</p>
					)}
					<p onClick={handleKick}>Kick this user</p>
					<p onClick={handleBan}>Ban this user</p>
					{!isBlocked ? (
						<p onClick={handleBlock}>Block this user</p>
					) : (
						<p onClick={handleUnblock}>UnBlock this user</p>
					)}
				</div>
			</div>
		</div>
	);
};

const UserChannelList = ({
	channel,
	socket,
	socketQueue,
}: {
	channel: ChannelDto;
	socket: Socket;
	socketQueue: Socket;
}) => {
	const [bansList, setBansList] = useState<userInfoDto[]>([]);
	const [selectedUser, setSelectedUser] = useState<string>();
	const { isAdmin, usersList } = useContext(ChannelsContext);
	const userConnected = useSelector(selectUserData);
	const env = useSelector(selectEnv);

	useEffect(() => {
		const getBans = async () => {
			if (!channel.name) return;
			const response = await axios.get(
				'https://' +
					env.host +
					':' +
					env.port +
					'/chat/bans/' +
					channel.name,
				{ withCredentials: true }
			);
			setBansList(response.data);
			if (response.data.length > 0)
				setSelectedUser(response.data[0].username);
		};

		getBans();
		const interval = setInterval(getBans, 5000);
		return () => clearInterval(interval);
	}, [channel, env.host, env.port, userConnected]);

	const handleUnban = async () => {
		if (!selectedUser) return;
		socket?.emit('ToUnban', {
			username: userConnected.username,
			channel: channel.name,
			login: selectedUser,
		});
		//console.log(selectedUser + ' has been unbanned');
	};

	return (
		<div className="user-channel-list">
			<BasicFrame title="In this channel" height="94%">
				{usersList ? (
					usersList.map((user, index) => (
						<UserChannelElement
							socket={socket}
							socketQueue={socketQueue}
							user={user}
							key={index}
							channel={channel}
							isAdmin={isAdmin}
						/>
					))
				) : (
					<></>
				)}
			</BasicFrame>
			{(isAdmin || channel.ownerId === userConnected.id) &&
				bansList.length > 0 && (
					<div className="ban-list-dropdown-channel">
						<select
							onChange={(e) => setSelectedUser(e.target.value)}>
							{bansList.map((bannedUser, index) => (
								<option value={bannedUser.username} key={index}>
									{bannedUser.username}
								</option>
							))}
						</select>
						<button onClick={handleUnban}>Unban</button>
					</div>
				)}
		</div>
	);
};

export const Aside = ({
	buttonContent,
	socket,
	socketQueue,
}: {
	buttonContent: string;
	socket: Socket;
	socketQueue: Socket;
}) => {
	const [newDmTrigger, setNewDmTrigger] = useState(false);
	const { selectedChannel } = useContext(ChannelsContext);

	const handleNewDmTrigger = useCallback(() => {
		setNewDmTrigger(!newDmTrigger);
	}, [newDmTrigger, setNewDmTrigger]);

	return (
		<div className="aside-channel">
			<div className="dm-aside" style={{ width: '100%', height: '48%' }}>
				<button className="new-input" onClick={handleNewDmTrigger}>
					{buttonContent}
				</button>
				<div className="content-dm-aside">
					<ChannelLists socket={socket} />
					<Invite socket={socket} />
					<PopUp trigger={newDmTrigger}>
						<NewChannel handleNewDmTrigger={handleNewDmTrigger} />
					</PopUp>
				</div>
			</div>
			<UserChannelList
				channel={selectedChannel}
				socket={socket}
				socketQueue={socketQueue}
			/>{' '}
		</div>
	);
};
