import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import './Admin.css';
import { createAvatarObject } from './Login/Components/Auth/Carousel/genAvatars';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { selectEnv } from './utils/redux/selectors';

const generatePseudo = () => {
	const chars = 'abcdefghijklmnopqrstuvwxyz';
	let pseudo = '';
	for (let i = 0; i < 8; i++) {
		pseudo += chars[Math.floor(Math.random() * chars.length)];
	}
	return pseudo;
};

const Admin = () => {
	const avatar = createAvatarObject(uuidv4());
	const pseudo = generatePseudo();
	const env = useSelector(selectEnv);

	const handleCLick = () => {
		console.log(generatePseudo());
		try {
			const formData = new FormData();
			formData.append('username', pseudo);
			formData.append('file', avatar.file);
			axios.post(
				'http://' + env.host + ':' + env.port + '/auth/admin/create',
				formData,
				{
					withCredentials: true,
				}
			);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className="admin-wrapper">
			<button onClick={handleCLick}>Send</button>
		</div>
	);
};

export default Admin;
