import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
/*	SELECTORS	*/
import { useSelector } from 'react-redux';
import { selectUserAuth } from './redux/selectors';

export function AuthRoutes() {
	const isAuth = useSelector(selectUserAuth);
	
	return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}