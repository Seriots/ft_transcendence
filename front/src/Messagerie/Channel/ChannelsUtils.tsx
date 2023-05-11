import { ReactNode, createContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectEnv, selectUserData } from '../../utils/redux/selectors';

export interface ChannelDto {
	id: number;
	name: string;
	state: string;
	ownerId: number;
}

export interface userInfoDto {
	id: number;
	username: string;
	avatar: string;
	role?: string;
}

export interface MessageDto {
	username: string;
	content: string;
	avatar: string;
	createdAt: string;
}

type ChannelsContextType = {
	messages: MessageDto[];
	setMessages: React.Dispatch<React.SetStateAction<MessageDto[]>>;
	SaveChannel: ChannelDto[];
	setSaveChannel: React.Dispatch<React.SetStateAction<ChannelDto[]>>;
	ChannelList: ChannelDto[];
	setChannelList: React.Dispatch<React.SetStateAction<ChannelDto[]>>;
	selectedChannel: ChannelDto;
	setSelectedChannel: React.Dispatch<React.SetStateAction<ChannelDto>>;
	usersList: userInfoDto[];
	setUsersList: React.Dispatch<React.SetStateAction<userInfoDto[]>>;
	isAdmin: boolean;
};

export const ChannelsContext = createContext<ChannelsContextType>({
	messages: [],
	setMessages: () => {},
	SaveChannel: [],
	setSaveChannel: () => {},
	ChannelList: [],
	setChannelList: () => {},
	selectedChannel: { id: 0, name: '', state: '', ownerId: 0 },
	setSelectedChannel: () => {},
	usersList: [],
	setUsersList: () => {},
	isAdmin: false,
});

export const ChannelsProvider = ({ children }: { children: ReactNode }) => {
	const [messages, setMessages] = useState<MessageDto[]>([]);
	const [SaveChannel, setSaveChannel] = useState<ChannelDto[]>([]);
	const [ChannelList, setChannelList] = useState<ChannelDto[]>([]);
	const [selectedChannel, setSelectedChannel] = useState<ChannelDto>({
		id: 0,
		name: '',
		state: '',
		ownerId: 0,
	});
	const [usersList, setUsersList] = useState<userInfoDto[]>([]);
	const [isAdmin, setIsAdmin] = useState(false);
	const userConnected = useSelector(selectUserData);
	const env = useSelector(selectEnv);

	useEffect(() => {
		const fetchChats = async () => {
			try {
				const Channels = await axios.get<ChannelDto[]>(
					'https://' + env.host + ':' + env.port + '/chat/channels',
					{ withCredentials: true }
				);
				setChannelList(Channels.data);
			} catch (error) {
				console.error(error);
			}
		};
		const getUsers = async () => {
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
				setIsAdmin(false);
				if (selectedChannel.ownerId === userConnected.id) {
					setIsAdmin(true);
				} else if (response.data.users) {
					response.data.users.forEach((user: userInfoDto) => {
						if (
							user.id === userConnected.id &&
							user.role === 'admin'
						) {
							setIsAdmin(true);
						}
					});
				}
			} catch (error) {
				console.error(error);
			}
		};
		const fetchAll = async () => {
			await fetchChats();
			await getUsers();
		};
		fetchAll();
		const interval = setInterval(fetchAll, 2500);
		return () => clearInterval(interval);
	}, [
		env.host,
		env.port,
		selectedChannel.name,
		selectedChannel.ownerId,
		setChannelList,
		userConnected.id,
	]);

	return (
		<ChannelsContext.Provider
			value={{
				messages,
				setMessages,
				SaveChannel,
				setSaveChannel,
				ChannelList,
				setChannelList,
				selectedChannel,
				setSelectedChannel,
				usersList,
				setUsersList,
				isAdmin,
			}}>
			{children}
		</ChannelsContext.Provider>
	);
};
