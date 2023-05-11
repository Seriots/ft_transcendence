import React from 'react';
import { useEffect, useState } from 'react';
import './MatchesInProgress.css';

//Interface
import { DataTable, MatchesInProgressProps, Filters } from '../../types';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { selectEnv } from '../../../utils/redux/selectors';
import { useSelector } from 'react-redux';

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
	//console.log('windowWidth', windowWidth);
	return windowWidth;
};

const MatchesInProgress: React.FC<MatchesInProgressProps> = ({
	filters,
	viewMoreButton,
	resetFilter,
}) => {
	//This specifies that the MatchesInProgress variable is a React component and it expects props of the type
	const header = [
		'Game mode',
		'Team',
		'Date',
		'Hour',
		'Score',
		'Map',
		'State',
		'Watch',
	];
	const headerMobile = ['Game mode', 'Team', 'Score', 'Watch'];
	const headerMobilePart1 = ['Game mode', 'Team', 'Score', 'Map'];
	const headerMobilePart2 = ['Date', 'Hour', 'State', 'Watch'];
	const isMobileView = useWindowWidth() < 767;
	const [data, updateData] = useState<DataTable[]>([]);
	const navigate = useNavigate();
	const env = useSelector(selectEnv);

	useEffect(() => {
		axios
			.get('https://' + env.host + ':' + env.port + '/games/all/playing', {
				withCredentials: true,
			})
			.then((res) => {
				updateData(res.data);
			})
			.catch((err) => {
				console.log(err);
			});
	}, [env.host, env.port, resetFilter]);

	const parseDate = (dataString: string): Date => {
		const [month, day, year] = dataString.split('/').map(Number);
		return new Date(year, month - 1, day); //date is waiting for January to be 0
	};
	const sortByDate = (data: DataTable[]) => {
		return data.sort((a, b) => {
			const dateA = parseDate(a.date); //create data object
			const dateB = parseDate(b.date);
			return dateA.getTime() - dateB.getTime(); //compare the 2 dates
		});
	};
	const sortByMap = (data: DataTable[]): DataTable[] => {
		return data.sort((a, b) => {
			const mapA = a.map.toLowerCase();
			const mapB = b.map.toLowerCase();
			if (mapA < mapB) return -1;
			if (mapA > mapB) return 1;
			return 0;
		});
	};
	const filterAll = (data: DataTable[], filter: Filters): DataTable[] => {
		let filteredData = data.filter((match) => {
			//if it returns false, it is not save. If it returns true, it is save
			for (const filterKey in filters) {
				// console.log('filterKey', filterKey);
				if (filterKey !== 'sortBy') {
					const filterValue = filters[filterKey as keyof Filters]; //used to create a type representing all the keys
					if (
						filterValue !== 'all' &&
						match[filterKey as keyof DataTable] !== filterValue
					)
						//if it FilterValue == all : no option is selected
						return false;
				}
			}
			return true;
		});
		if (filters.sortBy === 'date') {
			filteredData = sortByDate(filteredData);
		}
		if (filters.sortBy === 'map') {
			filteredData = sortByMap(filteredData);
		}
		return filteredData;
	};
	const finalData = filterAll(data, filters);
	//console.log('isMobileView', isMobileView);
	const dataGame = (data: DataTable, index: number) => (
		<tbody key={index}>
			<tr
				className={`${index % 2 === 0 ? 'odd' : 'even'} ${
					viewMoreButton ? 'viewMoreActive' : 'viewMoreInactive'
				}`}>
				<td className="gameModeMatches">{data.gameMode}</td>
				<td className="teamMatch">
					{data.team.map((teamMember, index) => (
						<div className="teamMemberLevel" key={index}>
							<img
								src={
									'https://' +
									env.host +
									':' +
									env.port +
									'/' +
									teamMember.img
								}
								alt={`Team member ${index + 1}`}
							/>
							<p>{teamMember.level}</p>
						</div>
					))}
				</td>
				{!isMobileView && <td className="dateMatch">{data.date}</td>}
				{!isMobileView && <td className="hourMatch">{data.hour}</td>}
				<td className="ScoreMatch">
					<div className="teamScore">
						{data.score.map((scoreMember, index) => (
							<p key={index}>{scoreMember}</p>
						))}
					</div>
				</td>
				{!isMobileView && <td className="mapMatch">{data.map}</td>}
				{viewMoreButton && isMobileView && (
					<td className="mapMatch">{data.map}</td>
				)}
				{!isMobileView && (
					<td className="difficultyMatch">{data.state}</td>
				)}
				{!viewMoreButton && (
					<td className="watchMatch">
						<button
							className="buttonMatch"
							onClick={() => {
								navigate('/game', { state: { room: data.id } });
							}}>
							Watch
						</button>
					</td>
				)}
			</tr>
			{isMobileView && viewMoreButton && (
				<tr
					className={`headerRowMobile ${
						index % 2 === 0 ? 'odd' : 'even'
					} headerPart1`}>
					{headerMobilePart1.map((headerText, index) => (
						<th className={headerText} key={index}>
							{headerText}
						</th>
					))}
				</tr>
			)}
			{isMobileView && viewMoreButton && (
				<tr
					className={`${index % 2 === 0 ? 'odd' : 'even'} ${
						viewMoreButton ? 'viewMoreActive' : 'viewMoreInactive'
					}`}>
					<td className="dateMatch">{data.date}</td>
					<td className="hourMatch">{data.hour}</td>
					<td className="difficultyMatch">{data.state}</td>
					<td className="watchMatch">
						<button
							className="buttonMatch"
							onClick={() => window.open(data.watch)}>
							Watch
						</button>
					</td>
				</tr>
			)}
			{isMobileView && viewMoreButton && (
				<tr
					className={`headerRowMobile ${
						index % 2 === 0 ? 'odd' : 'even'
					} headerPart2`}>
					{headerMobilePart2.map((headerText, index) => (
						<th className={headerText} key={index}>
							{headerText}
						</th>
					))}
				</tr>
			)}
		</tbody>
	);

	return (
		<table
			className={`matchesInProgress ${
				viewMoreButton ? 'viewMoreActive' : 'viewMoreInactive'
			}`}>
			<thead>
				<tr>
					{!isMobileView &&
						header.map((header, index) => (
							<th key={index}>{header}</th>
						))}
					{isMobileView &&
						!viewMoreButton &&
						headerMobile.map((headerMobile, index) => (
							<th className={headerMobile} key={index}>
								{headerMobile}
							</th>
						))}
				</tr>
			</thead>
			{finalData.map(dataGame)}
		</table>
	);
};

export default MatchesInProgress;
