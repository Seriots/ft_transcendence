import { selectUser } from './selectors';
import axios from 'axios';
import { createAction, createReducer } from '@reduxjs/toolkit';

// First State
const initialState = {
	auth: false,
	status: 'void',
	data: null,
	error: null,
};

// Actions Creators
const userAuth = createAction<any>('user/auth');
const userStatus = createAction<any>('user/status');
const userFetching = createAction('user/fetching');
const userResolved = createAction<any>('user/resolved');
const userRejected = createAction<any>('user/rejected');
const env = {
	host: process.env.REACT_APP_BACK_HOST,
	port: process.env.REACT_APP_BACK_PORT,
}

export async function fetchOrUpdateUser(store: any) {
	try {
		const response = await axios.get('http://' + env.host + ':' + env.port +'/auth/verify', {
			withCredentials: true,
		});
		const data = response.data;
		if (data === 'OK') {
			store.dispatch(userStatus('void'));
			store.dispatch(userAuth(true));
		}
	} catch (error) {
		store.dispatch(userStatus('notAuth'));
		store.dispatch(userAuth(false));
		return;
	}
	const status = selectUser(store.getState()).status;
	if (status === 'pending' || status === 'updating') {
		return;
	}
	store.dispatch(userFetching());
	try {
		const response = await axios.get('http://' + env.host + ':' + env.port +'/users/me', {
			withCredentials: true,
		});
		response.data.avatar = `http://${env.host}:${env.port}/${response.data.avatar}`;
		const data = response.data;
		store.dispatch(userResolved(data));
	} catch (error) {
		store.dispatch(userRejected(error));
	}
}

// Reducer
export default createReducer(initialState, (builder) =>
	builder
		.addCase(userAuth, (draft, action) => {
			draft.auth = action.payload;
			return;
		})
		.addCase(userStatus, (draft, action) => {
			draft.status = action.payload;
			return;
		})
		.addCase(userFetching, (draft, action) => {
			if (draft.status === 'void') {
				draft.status = 'pending';
				return;
			}
			if (draft.status === 'rejected') {
				draft.error = null;
				draft.status = 'pending';
				return;
			}
			if (draft.status === 'resolved') {
				draft.status = 'updating';
				return;
			}
			return;
		})
		.addCase(userResolved, (draft, action) => {
			if (draft.status === 'pending' || draft.status === 'updating') {
				draft.data = action.payload;
				draft.status = 'resolved';
				return;
			}
			return;
		})
		.addCase(userRejected, (draft, action) => {
			if (draft.status === 'pending' || draft.status === 'updating') {
				draft.error = action.payload;
				draft.data = null;
				draft.status = 'rejected';
				return;
			}
			return;
		})
);
