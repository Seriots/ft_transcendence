import React from 'react';
import './Login.css';
/*	COMPONENTS	*/
import Background from './Components/Background/Background';
import {
	AuthStart,
	Auth2fa,
	AuthConfig,
	Auth2faConfig,
} from './Components/Auth/Auth';

export const Login = () => {
	return (
		<div>
			<AuthStart />
			<div className="login-background">
				<Background />
			</div>
		</div>
	);
};

export const Login2fa = () => {
	return (
		<div>
			<Auth2fa />
			<div className="login-background">
				<Background />
			</div>
		</div>
	);
};

export const Config = () => {
	return (
		<div>
			<AuthConfig />
			<div className="login-background">
				<Background />
			</div>
		</div>
	);
};

export const Config2fa = () => {
	return (
		<div>
			<Auth2faConfig />
			<div className="login-background">
				<Background />
			</div>
		</div>
	);
};
