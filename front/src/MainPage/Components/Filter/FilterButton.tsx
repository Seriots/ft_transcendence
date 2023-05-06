import React, { useState, useEffect } from 'react';
import './FilterButton.css';
import arrowDown from '../Ressources/arrow_down_beige.svg';
import close from '../Ressources/close_blue.svg';

//interface
import { FilterButtonProps } from '../../types';

const FilterButton: React.FC<FilterButtonProps> = ({
	label,
	options,
	onFilter,
	isOpen,
	setIsOpen,
	toggleDropdown,
	resetFilter,
}) => {
	const [selectedFilter, setSelectedFilter] = useState(label); //if one filter was selected
	const [isFilterSelected, setIsFilterSelected] = useState(false);

	const handleFilterClick = (option: string) => {
		//when we click on a filter
		setSelectedFilter(`${label}: ${option}`); //update the selected filter
		onFilter(option);
		setIsFilterSelected(true);
		setIsOpen(false);
	};

	useEffect(() => {
		setSelectedFilter(label);
		setIsFilterSelected(false);
	}, [resetFilter, label]);

	const handleButtonClose = () => {
		if (isFilterSelected) {
			setSelectedFilter(label);
			setIsFilterSelected(false);
			onFilter('all');
		}
		toggleDropdown();
	};

	return (
		<div
			className={`filterButton${
				isFilterSelected ? ' filterButtonSelected' : ''
			}`}>
			{/* add filterButtonSelected as a classname if it is selected */}
			<button onClick={toggleDropdown}>
				{selectedFilter}
			</button>
			<button onClick={handleButtonClose}>
				<img
					src={isFilterSelected ? close : arrowDown}
					alt={selectedFilter}
				/>
			</button>
			{/* if it is open : */}
			{isOpen && (
				<div className="filterDropdown">
					{options.map((option) => (
						<button
							key={option}
							onClick={() => handleFilterClick(option)}>
							<div
								className={`rectSubFilter${
									selectedFilter === `${label}: ${option}`
										? ' rectSubFilterSelected'
										: ''
								}`}></div>
							<span
								className={`txtSubFilter${
									selectedFilter === `${label}: ${option}`
										? ' txtSubFilterSelected'
										: ''
								}`}>
								{option}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default FilterButton;
