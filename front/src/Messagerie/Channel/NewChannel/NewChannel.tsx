import React, { useState, useEffect, useContext } from 'react';
import './NewChannel.css';
import axios from 'axios';
/* Types */
import { ChannelsContext, ChannelDto } from '../ChannelsUtils';
/* Ressources */
import close from '../../../Profile/Components/MainInfo/Ressources/close.svg';
import {
	inputProtectionChannel,
	inputProtectionPassword,
} from '../../../Login/Components/Auth/Input/inputProtection';
import { selectEnv } from '../../../utils/redux/selectors';
import { useSelector } from 'react-redux';
import { Socket } from 'socket.io-client';
// import search from '../../Ressources/search.svg';

export const InputChannel = ({
	title,
	content,
	entry,
	typeChannel,
	setContent,
}: {
	title: string;
	content: string;
	entry?: string;
	typeChannel?: string;
	setContent?: any;
}) => {
	const [input, setInput] = useState('');

	useEffect(() => {
		setContent(input);
	}, [input, setContent]);

	return (
		<>
			<div
				className="input-channel"
				style={{
					display:
						typeChannel === 'private' || typeChannel === 'public'
							? 'none'
							: 'block',
				}}>
				<h4 className="header-input-channel">{title}</h4>
				<span>
					<input
						type="text"
						placeholder={content}
						value={entry}
						onChange={(e) => setInput(e.target.value)}
					/>
				</span>
			</div>
		</>
	);
};

export const NewChannel = ({
	handleNewDmTrigger,
}: {
	handleNewDmTrigger: () => void;
}) => {
	const me = document.getElementsByClassName('popup');
	const [typeChannel, setTypeChannel] = useState('private');
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const { setChannelList } = useContext(ChannelsContext);
	const env = useSelector(selectEnv);

	useEffect(() => {
		window.onclick = (event: any) => {
			if (event.target === me[0]) {
				handleNewDmTrigger();
			}
		};
	}, [me, handleNewDmTrigger]);

	const handleCreateChannel = async () => {
		if (inputProtectionChannel(name) === false) {
			setName('');
			return;
		}
		if (typeChannel === 'protected' && !inputProtectionPassword(password)) {
			setPassword('');
			return;
		}
		try {
			let state = 'PUBLIC';
			switch (typeChannel) {
				case 'public':
					state = 'PUBLIC';
					break;
				case 'protected':
					state = 'PROTECTED';
					break;
				case 'private':
					state = 'PRIVATE';
					break;
			}
			await axios.post(
				'https://' + env.host + ':' + env.port + '/chat/create/' + name,
				{ state, password },
				{ withCredentials: true }
			);
			setName('');
			setPassword('');
			handleNewDmTrigger();
			const Channels = await axios.get<ChannelDto[]>(
				'https://' + env.host + ':' + env.port + '/chat/channels',
				{ withCredentials: true }
			);
			setChannelList(Channels.data);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div
			className="new-dm"
			style={{
				height:
					typeChannel === 'private' || typeChannel === 'public'
						? '280px'
						: '321px',
			}}>
			<img src={close} alt="close-button" onClick={handleNewDmTrigger} />
			<h3 style={{ height: '24px' }}>Create Channel</h3>
			<InputChannel
				title="Name"
				content="enter the channel name"
				setContent={setName}
			/>
			<div className="channel-select-buttons">
				<button
					className={typeChannel === 'private' ? 'active' : undefined}
					onClick={() => setTypeChannel('private')}>
					Private
				</button>
				<button
					className={typeChannel === 'public' ? 'active' : undefined}
					onClick={() => setTypeChannel('public')}>
					Public
				</button>
				<button
					className={
						typeChannel === 'protected' ? 'active' : undefined
					}
					onClick={() => setTypeChannel('protected')}>
					Protected
				</button>
			</div>
			<InputChannel
				title="Password"
				content="enter the new password"
				typeChannel={typeChannel}
				setContent={setPassword}
			/>
			<div className="new-dm-buttons">
				<button onClick={handleCreateChannel}>Create</button>
				<button onClick={handleNewDmTrigger}>Cancel</button>
			</div>
		</div>
	);
};

export const UpdateChannel = ({
	socket,
	handleNewDmTrigger,
}: {
	socket: Socket;
	handleNewDmTrigger: () => void;
}) => {
	const me = document.getElementsByClassName('popup');
	const [typeChannel, setTypeChannel] = useState('');
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const { selectedChannel, setChannelList } = useContext(ChannelsContext);
	const env = useSelector(selectEnv);

	useEffect(() => {
		window.onclick = (event: any) => {
			if (event.target === me[0]) {
				handleNewDmTrigger();
			}
		};
	}, [me, handleNewDmTrigger]);

	useEffect(() => {
		if (selectedChannel) {
			setName(selectedChannel.name);
			setTypeChannel(selectedChannel.state.toLowerCase());
		}
	}, [selectedChannel]);

	const handleCreateChannel = async () => {
		if (!inputProtectionChannel(name)) {
			setName('');
			return;
		}
		if (typeChannel === 'protected' && !inputProtectionPassword(password)) {
			setPassword('');
			return;
		}
		if (selectedChannel.id === 0) return;
		try {
			let state = 'PUBLIC';
			switch (typeChannel) {
				case 'public':
					state = 'PUBLIC';
					break;
				case 'protected':
					state = 'PROTECTED';
					break;
				case 'private':
					state = 'PRIVATE';
					break;
			}
			await axios.patch(
				'https://' +
					env.host +
					':' +
					env.port +
					'/chat/edit/' +
					selectedChannel.name,
				{ name, state, password },
				{ withCredentials: true }
			);
			socket?.emit('ChannelUpdate', {
				channel: selectedChannel.name,
				newChannelName: name,
				newState: state,
			});
			setName('');
			setPassword('');
			handleNewDmTrigger();
			const Channels = await axios.get<ChannelDto[]>(
				'https://' + env.host + ':' + env.port + '/chat/channels',
				{ withCredentials: true }
			);
			setChannelList(Channels.data);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div
			className="new-dm"
			style={{
				height:
					typeChannel === 'private' || typeChannel === 'public'
						? '280px'
						: '321px',
			}}>
			<img src={close} alt="close-button" onClick={handleNewDmTrigger} />
			<h3 style={{ height: '24px' }}>Settings</h3>
			<InputChannel
				title="Name"
				content="enter the channel name"
				entry={name}
				setContent={setName}
			/>
			<div className="channel-select-buttons">
				<button
					className={typeChannel === 'private' ? 'active' : undefined}
					onClick={() => setTypeChannel('private')}>
					Private
				</button>
				<button
					className={typeChannel === 'public' ? 'active' : undefined}
					onClick={() => setTypeChannel('public')}>
					Public
				</button>
				<button
					className={
						typeChannel === 'protected' ? 'active' : undefined
					}
					onClick={() => setTypeChannel('protected')}>
					Protected
				</button>
			</div>
			<InputChannel
				title="Password"
				content="enter the new password"
				typeChannel={typeChannel}
				setContent={setPassword}
			/>
			<div className="new-dm-buttons">
				<button onClick={handleCreateChannel}>Update</button>
				<button onClick={handleNewDmTrigger}>Cancel</button>
			</div>
		</div>
	);
};
