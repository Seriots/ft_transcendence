import React, { useEffect, useState } from 'react';
import './Carousel.css';
/*	Functions	*/
import { generateAvatars } from './genAvatars';

interface CarouselProps {
	currentIndex: number;
	setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
	avatar: any;
	setAvatar: React.Dispatch<React.SetStateAction<any>>;
	refresh: string;
}

const Carousel = ({
	currentIndex,
	setCurrentIndex,
	avatar,
	setAvatar,
	refresh,
}: CarouselProps) => {
	/*	HOOK settings	*/
	const [length, setLenght] = useState(avatar.length);

	useEffect(() => {
		setLenght(avatar.length);
	}, [avatar]);

	const prev = () => {
		if (currentIndex !== 0) setCurrentIndex(currentIndex - 1);
	};

	const next = () => {
		if (currentIndex + 1 < length) setCurrentIndex(currentIndex + 1);
	};

	const renderAvatar = (index: number, setting: string) => {
		if (index < 0 || index >= length) {
			return <div className={`avatar ${setting} empty`}></div>;
		} else {
			return (
				<div
					className={`avatar ${setting}`}
					style={{
						backgroundImage: `url('${avatar[index].url}')`,
						backgroundPosition: 'center',
						backgroundSize: 'contain',
						backgroundRepeat: 'no-repeat',
					}}
					onClick={
						setting === 'left'
							? prev
							: setting === 'right'
							? next
							: undefined
					}></div>
			);
		}
	};

	const handleChange = (event: any) => {
		const file = event.target.files[0];
		if (file) {
			const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
			const allowedSize = 2 * 1024 * 1024;
			if (allowedTypes.includes(file.type) && file.size <= allowedSize) {
				const img = new Image();
				img.src = URL.createObjectURL(file);
				img.onload = () => {
					if (img.width > 400 || img.height > 400)
						alert('Image too big (max 400x400)');
					else {
						let newAvatar = [...avatar];
						newAvatar.splice(currentIndex, 0, {
							file: file,
							url: img.src,
							source: 'imported',
							type: file.type,
						});
						setAvatar(newAvatar);
					}
				};
			} else
				alert('File not supported (png, jpg, jpeg) or too big (> 2Mo)');
		}
	};

	const handleRefresh = () => {
		let newAvatar = generateAvatars(12);
		for (let i = 0; i < avatar.length; i++) {
			if (avatar[i].source === 'imported' || avatar[i].source === 'set')
				newAvatar.splice(i, 0, avatar[i]);
		}
		setAvatar(newAvatar);
	};

	return (
		<div className="carousel-wrapper">
			<div className="carousel-element">
				{renderAvatar(currentIndex - 1, 'left')}
				{renderAvatar(currentIndex, '')}
				{renderAvatar(currentIndex + 1, 'right')}
			</div>
			<div className="carousel-refresh">
				<label htmlFor="inputTag">
					Download your avatar
					<input
						id="inputTag"
						type="file"
						accept=".png, .jpg, .jpeg"
						onChange={handleChange}
					/>
				</label>
				<img src={refresh} alt="refresh logo" onClick={handleRefresh} />
			</div>
		</div>
	);
};

export default Carousel;
