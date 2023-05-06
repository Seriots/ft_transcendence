import React from 'react';
import { useState, useEffect } from 'react';
import './MainPage.css';
/*	SELECTORS	*/

// Components
import FilterButton from './Components/Filter/FilterButton';
import MatchesInProgress from './Components/Matches/MatchesInProgress';

//Ressources
import refresh from './Components/Ressources/refresh.svg';
import personSad from './Components/Ressources/personSad.svg';
import filterButtonSVG from './Components/Ressources/filter_blue.svg';

//Interface
import { DataTable, Filters } from './types';

const MainPage = () => {
	//filter
	const handleFilter = (key: keyof Filters, option: string) => {
		setFilters({ ...filters, [key]: option }); //...filters => create a new object (a copy) but with the new option for
	};
	const [resetFilter, setResetFilter] = useState(false);
	const [openFilter, setOpenFilter] = useState<string | null>(null); //can be a string or null
	//open or close the filter
	const toggleDropdown = (filterName: string) => {
		if (openFilter === filterName) {
			setOpenFilter(null);
		} else {
			setOpenFilter(filterName);
		}
	};
	const clearAllFilter = () => {
		setOpenFilter(null);
		setFilters({
			sortBy: 'all',
			gameMode: 'all',
			friends: 'all',
			map: 'all',
			difficulty: 'all',
		});
		setResetFilter(!resetFilter); // Toggle resetFilter state -> what triggers the UseEffect
	};

	const [filters, setFilters] = useState({
		sortBy: 'all',
		gameMode: 'all',
		friends: 'all',
		map: 'all',
		difficulty: 'all',
	});
	const data: DataTable[] = [];
	const hasManyMatches = data.length > 4;
	// Mobile design
	const [mobileFilterVisible, setmobileFilterVisible] = useState(false);
	const [mobileViewMoreVisible, setmobileViewMoreVisible] = useState(false);

	//Verification rectangle size for the image
	const [mainRectangleMobile, setMainRectangleMobile] = useState(false);
	useEffect(() => {
		const handleResize = () => {
			const gameDivElement = document.querySelector(
				'.gameDiv'
			) as HTMLElement;
			if (gameDivElement) {
				setMainRectangleMobile(!hasManyMatches);
			}
		};
		window.addEventListener('resize', handleResize);
		handleResize();
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [hasManyMatches, data.length]);

	return (
		<div className="rectNoMsg">
			<p className="mainTitle">Games in progress</p>
			<div className="containerFilterMobile">
				<button
					className={`viewMore ${
						mobileFilterVisible ? 'FilterActive' : 'FilterInactive'
					}`}
					onClick={() =>
						setmobileViewMoreVisible(!mobileViewMoreVisible)
					}>
					{mobileViewMoreVisible
						? 'View less details'
						: 'View more details'}
				</button>
				<button
					className="buttonFilterMobile"
					onClick={() =>
						setmobileFilterVisible(!mobileFilterVisible)
					}>
					<img src={filterButtonSVG} alt="filter button" />
				</button>
			</div>
			<div
				className={`filter ${
					mobileFilterVisible ? 'mobileVisible' : ''
				}`}>
				<div className="filterMobileUp">
					<button
						className="refreshButtonviewMoreActive"
						onClick={clearAllFilter}>
						Reset
					</button>
					<p className="FilterTxtMobile">Filter</p>
				</div>
				<hr className="filterDivider" />
				{/* <FilterGlobal/> */}
				<button className="refreshButton" onClick={clearAllFilter}>
					<img className="refreshImg" src={refresh} alt="refresh" />
				</button>
				<FilterButton
					label="Sort By"
					options={['date', 'map', 'difficulty']}
					onFilter={(option) => handleFilter('sortBy', option)} //only called when there is an option
					isOpen={openFilter === 'Sort By'}
					//If another button is clicked, openFilter will have a different value and isOpen will be false
					setIsOpen={() => setOpenFilter(null)}
					toggleDropdown={() => toggleDropdown('Sort By')}
					//update the state openFilter
					resetFilter={resetFilter}
				/>
				<hr className="filterDivider" />
				<FilterButton
					label="Game Mode"
					options={['1v1', '2v2', 'FFA']}
					onFilter={(option) => handleFilter('gameMode', option)}
					isOpen={openFilter === 'Game Mode'}
					setIsOpen={() => setOpenFilter(null)}
					toggleDropdown={() => toggleDropdown('Game Mode')}
					resetFilter={resetFilter}
				/>
				{/* <hr className="filterDivider" />
				<FilterButton
					label="Friends"
					options={['Only my friends', 'Everyone']}
					onFilter={(option) => handleFilter('friends', option)}
					isOpen={openFilter === 'Friends'}
					setIsOpen={() => setOpenFilter(null)}
					toggleDropdown={() => toggleDropdown('Friends')}
					resetFilter={resetFilter}
				/> */}
				<hr className="filterDivider" />
				<FilterButton
					label="Map"
					options={['NORMAL', 'BEACH', 'JUNGLE', 'SPACE']}
					onFilter={(option) => handleFilter('map', option)}
					isOpen={openFilter === 'Map'}
					setIsOpen={() => setOpenFilter(null)}
					toggleDropdown={() => toggleDropdown('Map')}
					resetFilter={resetFilter}
				/>
			</div>
			<div
				className={`gameDiv ${
					mobileFilterVisible ? 'FilterActive' : 'FilterInactive'
				}`}>
				<MatchesInProgress
					filters={filters}
					viewMoreButton={mobileViewMoreVisible}
					resetFilter={resetFilter}
				/>
				{!hasManyMatches && mainRectangleMobile && (
					<div className="illustrationGamingActivity">
						<p>
							The gaming activity is <br /> relatively low right
							now
						</p>
						<img src={personSad} alt="personsad" />
					</div>
				)}
			</div>
		</div>
	);
};

export default MainPage;
