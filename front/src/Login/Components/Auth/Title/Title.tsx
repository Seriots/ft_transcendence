import React from 'react';
import './Title.css';

interface TitleProps {
	title: string;
	subtitle: string;
}

const Title = ({ title, subtitle }: TitleProps) => {
	return (
		<div className="title-wrapper">
			<h1>{title}</h1>
			{subtitle.length !== 0 ? <p>{subtitle}</p> : null}
		</div>
	);
};

export default Title;
