import { selectUser } from './selectors';
import axios from 'axios';
//import { createAction, createReducer } from '@reduxjs/toolkit';

// First State
const initialState = {
	host: process.env.REACT_APP_BACK_HOST,
	port: process.env.REACT_APP_BACK_PORT,
};

