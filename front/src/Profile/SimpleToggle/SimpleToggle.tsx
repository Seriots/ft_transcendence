import React from 'react';
import './SimpleToggle.css';

interface SimpleToggleProps {
	toggled: boolean;
	handleToggle: () => void;
}

export const SimpleToggle = ({ toggled, handleToggle }: SimpleToggleProps) => {
	return (
		<label className="simpletoggle-wrapper">
			<input
				type="checkbox"
				defaultChecked={toggled}
				onClick={handleToggle}
			/>
			<span />
		</label>
	);
};
