import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSelector, useStore } from 'react-redux';
import { selectEnv, selectUserData } from '../../../utils/redux/selectors';
import './ProfileConfig.css';
/*	Components	*/
import Input from '../../../Login/Components/Auth/Input/Input';
import Carousel from '../../../Login/Components/Auth/Carousel/Carousel';
import Button from '../../../Login/Components/Auth/Button/Button';
/*	Functions	*/
import { generateAvatars } from '../../../Login/Components/Auth/Carousel/genAvatars';
import { inputProtectionPseudo } from '../../../Login/Components/Auth/Input/inputProtection';
import { fetchOrUpdateUser } from '../../../utils/redux/user';
/*	Ressources	*/
import close from './Ressources/close.svg';
import id from './Ressources/id.svg';
import refresh from './Ressources/refresh.svg';
import { AvatarProps } from '../../../Login/Components/Auth/Carousel/genAvatars';

interface ProfileConfigProps {
	handleTrigger: () => void;
}

export const ProfileConfig = ({ handleTrigger }: ProfileConfigProps) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [avatar, setAvatar] = useState<AvatarProps[]>([]);
	const [usernames, setUsernames] = useState<string[]>([]);
	const [inputError, setInputError] = useState('');
	const me = document.getElementsByClassName('popup');
	const store = useStore();
	const userConnected = useSelector(selectUserData);
	const env = useSelector(selectEnv);

	useEffect(() => {
		async function fetchData() {
			try {
				const response = await axios.get(
					'https://' + env.host + ':' + env.port + '/users/all/pseudo',
					{
						withCredentials: true,
					}
				);
				const usernames = response.data;
				for (let i = 0; i < usernames.length; i++) {
					if (usernames[i].username === userConnected.username) {
						usernames.splice(i, 1);
						break;
					}
				}
				setUsernames(usernames);
			} catch (error) {
				console.error(error);
			}
		}
		fetchData();
		const avatars: AvatarProps[] = generateAvatars(7);
		const myAvatar: AvatarProps = {
			file: undefined,
			url: userConnected.avatar,
			source: 'set',
			type: '',
		};
		avatars.unshift(myAvatar);
		setAvatar(avatars);
		const inputPseudo = document.querySelector<HTMLInputElement>(
			'.profileconfig-wrapper .input-wrapper input'
		);
		if (inputPseudo) {
			inputPseudo.value = userConnected.username;
		}
	}, [env.host, env.port, userConnected]);

	const handleClick = useCallback(async () => {
		const inputPseudo: string | undefined =
			document.querySelector<HTMLInputElement>(
				'.profileconfig-wrapper .input-wrapper input'
			)?.value;
		if (inputPseudo) {
			const error: string = inputProtectionPseudo(inputPseudo, usernames);
			if (error === '') {
				const formData = new FormData();
				formData.append('username', inputPseudo);
				formData.append('file', avatar[currentIndex].file);
				formData.append('source', avatar[currentIndex].source);
				try {
					await axios.post(
						'https://' +
							env.host +
							':' +
							env.port +
							'/users/updateconfig',
						formData,
						{
							withCredentials: true,
						}
					);
					await fetchOrUpdateUser(store);
					window.location.reload();
				} catch (error) {
					console.error(error);
					window.location.reload();
				}
			} else setInputError(error);
		} else setInputError('Please enter a pseudo');
	}, [usernames, avatar, currentIndex, env.host, env.port, store]);

	useEffect(() => {
		window.onclick = (event: any) => {
			if (event.target === me[0]) {
				handleTrigger();
			}
		};
	}, [me, handleTrigger]);

	return (
		<div className="profileconfig-wrapper">
			<img src={close} alt="close-button" onClick={handleTrigger} />
			<h2>My profile</h2>
			<Input
				input_title="Pseudo"
				placeholder="Enter your pseudo"
				icon={id}
				error={inputError}
			/>
			<Carousel
				currentIndex={currentIndex}
				setCurrentIndex={setCurrentIndex}
				avatar={avatar}
				setAvatar={setAvatar}
				refresh={refresh}
			/>
			<Button
				content="Save"
				bottom={true}
				href=""
				absolut={true}
				onClick={handleClick}
			/>
		</div>
	);
};
