import React, { ReactNode } from 'react';

export interface User {
	avatar: string;
	elo: number;
	experience: number;
	state: string;
	id: number;
	wins: number;
	losses: number;
	status: string;
	twoFactor: boolean;
	username: string;
	login: string;
}

export const MainFrame = ({
	title,
	children,
	showBlockModal,
}: {
	title: string;
	children: ReactNode;
	showBlockModal: boolean;
}) => {
	return (
		<div className="main-frame">
			<div
				className={
					showBlockModal
						? 'showBlockModalActive'
						: 'showBlockModalInactive'
				}>
				<h1>{title}</h1>
			</div>
			<div
				className={`childrenMainFrame ${
					showBlockModal
						? 'showBlockModalActive'
						: 'showBlockModalInactive'
				}`}>
				{children}
			</div>
		</div>
	);
};

interface NavbarProps {
	navbarStatus: string;
	setNavbarStatus: (status: string) => void;
}

export const Navbar = ({ navbarStatus, setNavbarStatus }: NavbarProps) => {
	return (
		<div className="navbar">
			<div className="navbarLeft">
				<button
					className={
						navbarStatus === 'Myfriends' ? 'active' : 'inactive'
					}
					onClick={() => setNavbarStatus('Myfriends')}>
					My friends
				</button>
				<button
					className={
						navbarStatus === 'Received' ? 'active' : 'inactive'
					}
					onClick={() => setNavbarStatus('Received')}>
					Received
				</button>
				<button
					className={
						navbarStatus === 'Demands' ? 'active' : 'inactive'
					}
					onClick={() => setNavbarStatus('Demands')}>
					Demands
				</button>
				<button
					className={
						navbarStatus === 'BlockedUsers' ? 'active' : 'inactive'
					}
					onClick={() => setNavbarStatus('BlockedUsers')}>
					Blocked Users
				</button>
			</div>
			<button
				className={'addFriends'}
				onClick={() => setNavbarStatus('AddFriends')}>
				Add Friends
			</button>
		</div>
	);
};
