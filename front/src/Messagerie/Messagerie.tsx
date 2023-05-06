import React, { ReactNode, useEffect, useState } from 'react';
import './Messagerie.css';
import { DmElement } from './Dm/DmElement';
import { ChannelElement } from './Channel/ChannelElement';
import { Socket, io } from 'socket.io-client';
import { selectEnv } from '../utils/redux/selectors';
import { useSelector } from 'react-redux';

export const MainFrame = ({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) => {
	return (
		<div className="main-frame">
			<h1>{title}</h1>
			{children}
		</div>
	);
};

interface NavbarProps {
	navbarStatus: string;
	setNavbarStatus: (status: string) => void;
}

const Navbar = ({ navbarStatus, setNavbarStatus }: NavbarProps) => {
	return (
		<div className="navbar">
			<button
				className={
					navbarStatus === 'privateMessage' ? 'active' : 'inactive'
				}
				onClick={() => setNavbarStatus('privateMessage')}>
				Private Message
			</button>
			<button
				className={navbarStatus === 'channel' ? 'active' : 'inactive'}
				onClick={() => setNavbarStatus('channel')}>
				Channel
			</button>
		</div>
	);
};

export const Messagerie = ({ socketQueue }: { socketQueue: Socket }) => {
	const [navbarStatus, setNavbarStatus] = useState('privateMessage');
	const [socket, setSocket] = useState<Socket>();
	const env = useSelector(selectEnv);

	useEffect(() => {
		const newSocket = io('http://' + env.host + ':' + env.port + '/chat', {
			transports: ['websocket'],
			withCredentials: true,
		});
		setSocket(newSocket);

		return () => {
			newSocket.disconnect();
		};
	}, [env.host, env.port]);

	if (!socket) return <div>Loading...</div>;

	return (
		<div className="messagerie">
			<MainFrame title="Messagerie">
				<Navbar
					navbarStatus={navbarStatus}
					setNavbarStatus={setNavbarStatus}
				/>
				{navbarStatus === 'privateMessage' ? (
					<DmElement socket={socket} socketQueue={socketQueue} />
				) : (
					<ChannelElement socket={socket} socketQueue={socketQueue} />
				)}
			</MainFrame>
		</div>
	);
};
