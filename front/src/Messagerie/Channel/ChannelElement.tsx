import React, { useEffect, useContext } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import '../Dm/DmElement.css';
/*	Components	*/
import MessageInput from '../Dm/MessageInput';
import { BasicFrame } from '../../Profile/Components/MiddleInfo/MiddleInfo';
import { Aside } from './Aside/Aside';
/* Interfaces */
import { ChannelsContext, ChannelsProvider } from './ChannelsUtils';
import { useSelector } from 'react-redux';
import { selectEnv, selectUserData } from '../../utils/redux/selectors';

const Beside = ({ socket }: { socket: Socket }) => {
	const {
		messages,
		setMessages,
		selectedChannel,
		setSelectedChannel,
		setUsersList,
	} = useContext(ChannelsContext);
	const connectedUser = useSelector(selectUserData);
	const env = useSelector(selectEnv);

	useEffect(() => {
		const handleMessage = async (message: any) => {
			const reponse = await axios.get(
				'https://' +
					env.host +
					':' +
					env.port +
					'/friend/blockbyme/' +
					message.username,
				{ withCredentials: true }
			);
			if (reponse.data.isBlocked === true) return;
			setMessages((messages) => [message, ...messages]);
		};

		socket?.on('ChannelUpdate', (data: any) => {
			if (data?.channel === selectedChannel.name) {
				let newChannel = selectedChannel;
				newChannel.name = data.newChannelName;
				setSelectedChannel(newChannel);
				socket?.emit('join', {
					channel: newChannel.name,
					username: connectedUser.username,
				});
			}
		});
		socket?.on('chat', handleMessage);
		socket?.on('kick', (data: any) => {
			if (data?.username === connectedUser.username) {
				setSelectedChannel({
					id: 0,
					name: '',
					state: '',
					ownerId: 0,
				});
				setMessages([]);
				setUsersList([]);
			}
		});
		socket?.on('ban', (data: any) => {
			if (data?.username === connectedUser.username) {
				setSelectedChannel({
					id: 0,
					name: '',
					state: '',
					ownerId: 0,
				});
				setMessages([]);
				setUsersList([]);
				socket?.emit('leave', {
					channel: selectedChannel.name,
				});
			}
		});
		return () => {
			socket?.off('ChannelUpdate');
			socket?.off('chat', handleMessage);
			socket?.off('kick');
			socket?.off('ban');
		};
	}, [
		selectedChannel,
		messages,
		setMessages,
		setSelectedChannel,
		socket,
		connectedUser.username,
		setUsersList,
		env.host,
		env.port,
	]);

	const sendMessage = (message: any) => {
		if (!message.content || selectedChannel.id === 0) return;
		socket?.emit('chat', { ...message, channel: selectedChannel.name });
	};

	return (
		<div className="dm-beside">
			<BasicFrame
				height="91%"
				title={
					selectedChannel.id === 0
						? 'No Chat selected'
						: selectedChannel.name
				}>
				{messages.map((message, index) => (
					<div
						key={index}
						className={`chat-bubble ${
							connectedUser.username === message.username
								? 'chat-me'
								: 'chat-you'
						}`}>
						{(connectedUser.username === message.username && (
							<>
								<p>{message.content}</p>
								<img
									className="chat-avatar"
									src={message.avatar}
									alt="avatar"
								/>
								<p>
									{new Date(message.createdAt).getHours() +
										':' +
										new Date(message.createdAt)
											.getMinutes()
											.toString()
											.padStart(2, '0')}
								</p>
							</>
						)) || (
							<>
								<p>
									{new Date(message.createdAt).getHours() +
										':' +
										new Date(message.createdAt)
											.getMinutes()
											.toString()
											.padStart(2, '0')}
								</p>
								<img
									className="chat-avatar"
									src={message.avatar}
									alt="avatar"
								/>
								<p>{message.content}</p>
							</>
						)}
					</div>
				))}
			</BasicFrame>
			<MessageInput sendMessage={sendMessage} userInfo={connectedUser} />
		</div>
	);
};

export const ChannelElement = ({
	socket,
	socketQueue,
}: {
	socket: Socket;
	socketQueue: Socket;
}) => {
	return (
		<div className="dm-element">
			<ChannelsProvider>
				<Aside
					buttonContent="New Channel"
					socket={socket}
					socketQueue={socketQueue}
				/>
				<Beside socket={socket} />
			</ChannelsProvider>
		</div>
	);
};
