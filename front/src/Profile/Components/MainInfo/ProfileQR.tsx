import React, { useEffect, useState } from 'react';
import QRCodeSVG from 'qrcode.react';
import axios from 'axios';
import { useSelector, useStore } from 'react-redux';
import './ProfileQR.css';
/* Components */
import Input from '../../../Login/Components/Auth/Input/Input';
import Button from '../../../Login/Components/Auth/Button/Button';
/* Functions */
import { fetchOrUpdateUser } from '../../../utils/redux/user';
import { inputProtectionQR } from '../../../Login/Components/Auth/Input/inputProtection';
/* Ressources */
import closeQR from './Ressources/closeQR.svg';
import padlock from './Ressources/padlock.svg';
import { selectEnv } from '../../../utils/redux/selectors';

interface ProfileQRProps {
	handleTrigger: () => void;
}

export const ProfileQR = ({ handleTrigger }: ProfileQRProps) => {
	const me = document.getElementsByClassName('popup');
	const toggleState = document.querySelector<HTMLInputElement>(
		'.simpletoggle-wrapper input[type="checkbox"]'
	);
	const [qrCodeUrl, setQrCodeUrl] = useState('');
	const [secretKey, setSecretKey] = useState('');
	const [inputError, setInputError] = useState('');
	const [code, setCode] = useState(false);
	const store = useStore();
	const env = useSelector(selectEnv);

	useEffect(() => {
		window.onclick = (event: any) => {
			if (event.target === me[0]) {
				handleTrigger();
				toggleState!.checked = false;
			}
		};
	}, [me, handleTrigger, toggleState]);

	useEffect(() => {
		async function fetchQR() {
			try {
				const { data } = await axios.post(
					'https://' + env.host + ':' + env.port +'/auth/2fa/setup',
					{},
					{
						withCredentials: true,
					}
				);
				setSecretKey(data.secret);
				setQrCodeUrl(data.otpAuthUrl);
			} catch (error) {
				alert('2FA already enabled');
			}
		}
		fetchQR();
	}, [env.host, env.port]);

	const handleClick = async () => {
		const inputKey: string | undefined =
			document.querySelector<HTMLInputElement>(
				'.input-wrapper input'
			)?.value;
		if (inputKey) {
			const error: string = inputProtectionQR(inputKey);
			if (error === '') {
				try {
					await axios.post(
						'https://' + env.host + ':' + env.port +'/auth/2fa/verify',
						{
							inputKey,
						},
						{
							withCredentials: true,
						}
					);
					await fetchOrUpdateUser(store);
					window.location.reload();
				} catch (error) {
					setInputError('Wrong key');
				}
			} else setInputError(error);
		} else setInputError('Please enter a key');
	};

	const handleCode = (event: any) => {
		const parent = event.currentTarget.parentElement;
		parent.style.height = '488px';
		setCode(!code);
	};

	const resetTrigger = () => {
		handleTrigger();
		toggleState!.checked = false; // Point d'exclamation permet de garantir que l'élément existe
	};

	return (
		<div className="profileqr-wrapper">
			<img src={closeQR} alt="close-button" onClick={resetTrigger} />
			<h2>2FA Status</h2>
			<QRCodeSVG value={qrCodeUrl} bgColor="#F9DA49" size={68} />
			<p>
				<span style={{ fontWeight: 600 }}>Scan the Qr Code</span>
				<br />
				This will generate a code that you will have to fill bellow
				<br />
			</p>
			{code ? (
				<p>
					<span style={{ fontStyle: 'italic' }}>
						If you're unable to scan the code, you can still enable
						2FA by manually entering the code{' '}
						<span style={{ fontWeight: 600 }}>{secretKey}</span>
					</span>
					<br />
					<br />
					Please note that this method takes longer and is less secure
					than scanning the QR code. Keep your account safe by
					choosing the QR code option whenever possible.
				</p>
			) : (
				<button className="code-button" onClick={handleCode}>
					I cant scan the QR Code
				</button>
			)}
			<Input
				input_title="Generated Code"
				placeholder="enter the generated code"
				icon={padlock}
				error={inputError}
			/>
			<Button
				content="Enable 2FA"
				href=""
				absolut={true}
				bottom={false}
				onClick={handleClick}
			/>
		</div>
	);
};
