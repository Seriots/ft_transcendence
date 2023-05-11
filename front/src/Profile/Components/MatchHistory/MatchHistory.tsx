import React from 'react';
import './MatchHistory.css';
import { useEffect, useState } from 'react';

import { BasicFrame } from '../MiddleInfo/MiddleInfo';
import { useAxios } from '../../../utils/hooks';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { selectEnv } from '../../../utils/redux/selectors';
import { useSelector } from 'react-redux';

interface TeamMatchProps {
	img: string;
	level: number;
	username: string;
	index: number;
}

interface dataHistoryProps {
	history: any;
	index: number;
}

const TeamMatch = ({ img, level, username, index }: TeamMatchProps) => {
	return (
		<Link to={'/profile/' + username}>
			<div className="teamMatch">
				<img src={img} alt={`Team member ${index + 1}`} />
				<p>{level}</p>
			</div>
		</Link>
	);
};

const useWindowWidth = () => {
	const [windowWidth, setwindowWidth] = useState(window.innerWidth);
	useEffect(() => {
		const handleResize = () => {
			setwindowWidth(window.innerWidth);
		};
		window.addEventListener('resize', handleResize);
		handleResize();
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);
	return windowWidth;
};

export const MatchHistory = ({ userData }: { userData: any }) => {
	const headerMobile = ['Game mode', 'Team', 'Score'];
	const isMobileView = useWindowWidth() < 767;
	const { username } = useParams();
	const env = useSelector(selectEnv);
	if (username) userData.username = username;

	const {
		isLoading,
		data,
		error,
	}: { isLoading: boolean; data: any; error: boolean } = useAxios(
		'https://' + env.host + ':' + env.port + '/users/matchs/' + userData.username
	);

	if (isLoading && !error) return <></>;

	const header: string[] = [
		'Game mode',
		'Players',
		'Date',
		'Hour',
		'Winner',
		'Score',
		'Duration',
		'Map',
	];

	const dataHistory = ({ history, index }: dataHistoryProps) => {
		const date: Date = new Date(history.date);

		return (
			<tbody key={index}>
				<tr key={index} className={index % 2 === 0 ? 'odd' : 'even'}>
					<td>
						{history.mode === 'ONEVONE'
							? '1v1'
							: history.mode === 'TWOVTWO'
							? '2v2'
							: 'FFA'}
					</td>
					<td className="teamMatch">
						{history.team.map((teamMember: any, index: number) => (
							<TeamMatch
								img={'https://' + env.host + ':' + env.port + '/' + teamMember.avatar}
								level={Math.floor(teamMember.experience / 1000)}
								username={teamMember.username}
								index={index}
								key={index}
							/>
						))}
					</td>
					{!isMobileView && (
						<td>
							{date.toLocaleDateString('FR-fr')}
						</td>
					)}
					{!isMobileView && (
						<td>{date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())}</td>
					)}
					{!isMobileView && (
						<td className="teamMatch">
							{history.win[0] && history.mode === 'TWOVTWO' ? (
								history.win.map((winner: any, index: number) => (
									<TeamMatch
										img={
											'https://' + env.host + ':' + env.port + '/' + winner.avatar
										}
										level={Math.floor(winner.experience / 1000)}
										username={winner.username}
										index={index}
										key={index}
									/>
								))
							) : (
								<TeamMatch
									img={
										'https://' + env.host + ':' + env.port + '/' +
										history.win.avatar
									}
									level={Math.floor(
										history.win.experience / 1000
									)}
									username={history.win.username}
									index={0}
									key={0}
								/>
							)}
						</td>
					)}
					<td>
						{history.mode === 'ONEVONE'
							? history.score1 + ' - ' + history.score2
							: history.mode === 'TWOVTWO'
							? history.score1 + ' - ' + history.score3
							: history.score1 +
							' - ' +
							history.score2 +
							' - ' +
							history.score3 +
							' - ' +
							history.score4}
					</td>
					{!isMobileView && <td>{history.duration}</td>}
					{!isMobileView && <td>{history.map}</td>}
				</tr>
			</tbody>
		);
	};

	return (
		<div className="match-history">
			<BasicFrame title="Match History" height="100%">
				<table className="matchesInProgress">
					<thead>
						<tr>
							{!isMobileView &&
								header.map((header, index) => (
									<th key={index}>{header}</th>
								))}
							{isMobileView &&
								headerMobile.map((headerMobile, index) => (
									<th className={headerMobile} key={index}>
										{headerMobile}
									</th>
								))}
						</tr>
					</thead>
					{data &&
						data.map((history: any, index: number) =>
							dataHistory({ history, index })
						)}
				</table>
			</BasicFrame>
		</div>
	);
};
