import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import { v4 as uuidv4 } from 'uuid';

export interface AvatarProps {
	file: any;
	url: any;
	source: string;
	type: string;
}

const generateSeed = () => {
	return uuidv4();
};

const generateAvatarFile = (avatar: any, seed: string): File => {
	const svgBlob = new Blob([avatar], { type: 'image/svg+xml' });
	const file = new File([svgBlob], `${seed}.svg`, { type: 'image/svg+xml' });
	return file;
};

export const createAvatarObject = (seed: string): AvatarProps => {
	const avatar = createAvatar(adventurer, {
		seed: seed,
		size: 32,
		randomizeIds: true,
	});
	const file: File = generateAvatarFile(avatar, seed);
	const url = URL.createObjectURL(file);
	return {
		file: file,
		url: url,
		source: 'default',
		type: 'image/svg+xml',
	};
};

export const generateAvatars = (number: number): AvatarProps[] => {
	let AvatarData: AvatarProps[] = [];
	for (let i = 0; i < number; i++) {
		let seed = generateSeed();
		AvatarData.push(createAvatarObject(seed));
	}
	return AvatarData;
};
