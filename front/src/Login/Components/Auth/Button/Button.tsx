import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

interface ButtonProps {
	onClick?: () => void;
	content: string;
	bottom: boolean;
	href: string;
	absolut: boolean;
	state?: string;
}

const Button = ({ onClick, content, bottom, href, absolut, state }: ButtonProps) => {
	return (
		<div
			className={
				bottom === true ? 'button-wrapper bottom' : 'button-wrapper'
			}
		>
			<Link
				onClick={onClick}
				to={href} 
				relative={absolut === true ? 'path' : undefined}
				state={state ? {prec: state} : undefined}
			>
				<button>{content}</button>
			</Link>
		</div>
	);
};

export default Button;
