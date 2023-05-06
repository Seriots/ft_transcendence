import React from 'react';
import './BlockedPopUp.css';

interface BlockedPopUpProps {
	BlockFriend: (username: string) => Promise<void>;
	friendBlockedUsername: string;
	setShowBlockModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BlockedPopUp = ({
	BlockFriend,
	friendBlockedUsername,
	setShowBlockModal,
}: BlockedPopUpProps) => {
	return (
		<div className="blockedPopup">
			<div className="blockedPopupTxt">
				<p>Are you sure you want to block this user?</p>
				<p>
					Blocking this user will prevent them from interacting with
					you on this platform. Are you sure you want to proceed with
					blocking them? Please note that this action is irreversible.
				</p>
			</div>
			<div className="blockedPopUpButton">
				<button
					onClick={() => {
						BlockFriend(friendBlockedUsername);
						setShowBlockModal(false);
					}}>
					Confirm
				</button>
				<button onClick={() => setShowBlockModal(false)}>Cancel</button>
			</div>
		</div>
	);
};
