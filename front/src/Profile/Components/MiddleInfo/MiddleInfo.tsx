import React from 'react';
import './MiddleInfo.css';
import { DonutLevel } from './Components/DonutLevel/DonutLevel';
import { Achievements } from './Components/Achievements/Achievements';
import { Friends } from './Components/Friends/Friends';

interface BasicFrameProps {
	height?: string;
	width?: string;
	title: string;
	children: React.ReactNode;
}

export const BasicFrame = ({
	height = '100%',
	width = '100%',
	title,
	children,
}: BasicFrameProps) => {
	return (
		<div className="basic-frame" style={{ height: height, width: width }}>
			<div className="title-wrapper">
				<h3>{title}</h3>
			</div>
			<div className="content-wrapper">{children}</div>
		</div>
	);
};

export const MiddleInfo = ({ userData }: { userData: any }) => {
	return (
		<div className="middleinfo-wrapper">
			<Achievements userData={userData} />
			<DonutLevel userData={userData} />
			<Friends userData={userData} />
		</div>
	);
};
