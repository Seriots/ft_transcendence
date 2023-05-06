import React, { useState } from 'react';
import { FilteredUsers } from '../FilteredUsers/FilteredUsers';
import { User } from '../types';

//Ressources
import search_white from '../Ressources/search_white.svg';

import './AddFriends.css';

interface AddFriendsProps {
	AddFriendFunction: (username: string) => Promise<void>;
	users: User[];
	friends: User[];
	userInfo: User | undefined;
	pending: User[];
	demands: User[];
	blocked: User[];
	setNavbarStatus: (status: string) => void;
}

export const AddFriends = ({
	AddFriendFunction,
	setNavbarStatus,
	users,
	friends,
	userInfo,
	pending,
	demands,
	blocked,
}: AddFriendsProps) => {
	const [searchQuery, setSearchQuery] = useState('');
	const handleInputChange = (event: any) => {
		setSearchQuery(event.target.value);
	};
	return (
		<>
			<div className="searchBarFilteredUsers">
				<div className="searchBarImgInput">
					<img src={search_white} alt="search img" />
					<input
						className="searchBar"
						type="text"
						placeholder="Search"
						value={searchQuery}
						onChange={handleInputChange}
					/>
				</div>
				{searchQuery.length > 0 && (
					<p className="nameSearched">You searched "{searchQuery}"</p>
				)}
				<FilteredUsers
					AddFriendFunction={AddFriendFunction}
					searchQuery={searchQuery}
					users={users}
					blocked={blocked}
					friends={friends}
					userInfo={userInfo}
					pending={pending}
					demands={demands}
				/>
			</div>
			<button
				className="buttonViewMyFriends"
				onClick={() => setNavbarStatus('Myfriends')}>
				View my friends
			</button>
		</>
	);
};
