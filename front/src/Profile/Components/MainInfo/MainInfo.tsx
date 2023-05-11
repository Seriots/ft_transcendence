import React, { useCallback, useState } from 'react';
import axios from 'axios';
import './MainInfo.css';
/*	Components	*/
import { ProfileConfig } from './ProfileConfig';
import { ProfileQR } from './ProfileQR';
/*	Redux	*/
import { useSelector } from 'react-redux';
import { selectEnv } from '../../../utils/redux/selectors';
import { SimpleToggle } from '../../SimpleToggle/SimpleToggle';
/*	Ressources	*/
import paint_brush from './Ressources/paint-brush.svg';

interface MainInfoProps {
	avatar: string;
	username: string;
	handleTrigger: () => void;
	userProfile: boolean;
}

interface InfoElementProps {
	title: string;
	content: string;
	isToggle?: boolean;
	border?: boolean;
	toggle?: boolean;
	handleToggle?: () => void;
}

interface PopUpProps {
	trigger: boolean;
	children: any;
}

export const PopUp = ({ trigger, children }: PopUpProps) => {
	return trigger ? <div className="popup">{children}</div> : <div></div>;
};

const MainElement = ({
	avatar,
	username,
	handleTrigger,
	userProfile,
}: MainInfoProps) => {
	return (
		<div className="main-element">
			<div className="banner">
				<div
					className="edit"
					onClick={handleTrigger}
					style={{ display: userProfile ? 'none' : 'flex' }}>
					<img src={paint_brush} alt="button-edit" />
				</div>
				<img src={avatar} alt="avatar" />
			</div>
			<h2>{username}</h2>
		</div>
	);
};

const InfoElement = ({
	title,
	content,
	isToggle,
	border,
	toggle,
	handleToggle,
}: InfoElementProps) => {
	return (
		<div className={border ? 'info-element border' : 'info-element'}>
			<h3>{title}</h3>
			{isToggle && toggle !== undefined && handleToggle !== undefined ? (
				<SimpleToggle toggled={toggle} handleToggle={handleToggle} />
			) : (
				<p>{content}</p>
			)}
		</div>
	);
};

export const MainInfo = ({
	userProfile,
	userData,
}: {
	userProfile: boolean;
	userData: any;
}) => {
	const [trigger, setTrigger] = useState(false);
	const [triggerQR, setTriggerQR] = useState(false);
	const [defaultToggle, setDefaultToggle] = useState(userData.twoFactor);
	const totalGames: number = userData.wins + userData.losses;
	const winRate: any = totalGames !== 0 ? ((userData.wins / totalGames) * 100).toFixed(2) : 0;
	const env = useSelector(selectEnv);

	const handleTrigger = useCallback(() => {
		setTrigger(!trigger);
	}, [trigger, setTrigger]);

	const handleTriggerQR = useCallback(() => {
		setTriggerQR(!triggerQR);
	}, [triggerQR, setTriggerQR]);

	const handleToggle = useCallback(async () => {
		if (defaultToggle === false) {
			setTriggerQR(true);
		} else {
			try {
				await axios.delete('https://' + env.host + ':' + env.port +'/auth/2fa/disable', {
					withCredentials: true,
				});
				setDefaultToggle(false);
			} catch (error) {
				console.log(error);
			}
		}
	}, [defaultToggle, env.host, env.port]);

	return (
		<div className="maininfo-wrapper">
			<div className="infoMainLeft">
				<InfoElement
					title="Status"
					content={userData.state}
					border={true}
				/>
				<InfoElement
					title="Total game"
					content={totalGames.toString()}
					border={true}
				/>
				<InfoElement
					title="WinRate"
					content={
						Number.isNaN(winRate) ? '0%' : winRate.toString() + '%'
					}
				/>
			</div>
			<MainElement
				avatar={userData.avatar}
				username={userData.username}
				handleTrigger={handleTrigger}
				userProfile={userProfile}
			/>
			<PopUp trigger={trigger}>
				<ProfileConfig handleTrigger={handleTrigger} />
			</PopUp>
			<div className="infoMainRight">
				<InfoElement
					title="42login"
					content={userData.login}
					border={true}
				/>
				<InfoElement
					title="Registration date"
					content={new Date(userData.configAt).toLocaleDateString('FR-fr')}
					border={userProfile ? false : true}
				/>
				{!userProfile && (
					<InfoElement
						title="2FA Status"
						content=""
						isToggle={true}
						toggle={defaultToggle}
						handleToggle={handleToggle}
					/>
				)}
			</div>
			<PopUp trigger={triggerQR}>
				<ProfileQR handleTrigger={handleTriggerQR} />
			</PopUp>
		</div>
	);
};
