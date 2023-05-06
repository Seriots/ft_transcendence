import React, { KeyboardEvent, useRef } from 'react';
import send from '../Ressources/send.svg';
import { userInfoDto } from '../Channel/ChannelsUtils';

function MessageInput({
	sendMessage,
	userInfo,
}: {
	sendMessage: (value: { username: string; content: string }) => void;
	userInfo: userInfoDto;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSendMessage = () => {
		if (inputRef.current) {
			sendMessage({
				username: userInfo.username,
				content: inputRef.current.value,
			});
			inputRef.current.value = '';
		}
	};

	const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<div className="chat-write">
			<input
				placeholder="Type your message"
				type="text"
				ref={inputRef}
				onKeyDown={handleKeyPress}
			/>
			<button onClick={() => handleSendMessage()} className="chat-send">
				<img src={send} alt="send" />
			</button>
		</div>
	);
}

export default MessageInput;
