export const inputProtectionPseudo = (
	input: string,
	usernames: any[]
): string => {
	const regexLetters = /^[a-zA-Z0-9_]+$/;
	if (!regexLetters.test(input)) return 'Bad characters';
	const regexLenght = /^.{1,7}$/;
	if (!regexLenght.test(input)) return 'Bad length';
	for (let i = 0; i < usernames.length; i++) {
		if (usernames[i].username === input) return 'Username already taken';
	}
	return '';
};

export const inputProtectionQR = (input: string): string => {
	const regexQR = /^\d*(?:\s?\d\s?)*$/; // 0-9, space, max 3 spaces
	if (!regexQR.test(input)) return 'Bad input';
	return '';
};

export const inputProtectionChannel = (input: string): boolean => {
	const regexChannel = /^[a-zA-Z]+$/;
	if (!regexChannel.test(input)) return false;
	const regexLenght = /^.{1,8}$/;
	if (!regexLenght.test(input)) return false;
	return true;
};

export const inputProtectionPassword = (input: string): boolean => {
	const regexChannel = /^[a-zA-Z0-9_]+$/;
	if (!regexChannel.test(input)) return false;
	const regexLenght = /^.{1,20}$/;
	if (!regexLenght.test(input)) return false;
	return true;
};
