import userReducer from './user';
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
	reducer: {
		user: userReducer,
		env: (state = {
			host: process.env.REACT_APP_BACK_HOST,
			port: process.env.REACT_APP_BACK_PORT,
		}) => state,
	},
});

export default store;
