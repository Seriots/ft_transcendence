import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from 'react-redux';
import { fetchOrUpdateUser } from './redux/user';

// Hook to query data from back
export function useAxios(url: string) {
	const [data, setData] = useState({});
	const [isLoading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!url) return;
		setLoading(true);
		async function fetchData() {
			try {
				const response = await axios.get(url, {
					withCredentials: true,
				});
				setData(response.data);
			} catch (err) {
				console.log(err);
				setError(true);
			} finally {
				setLoading(false);
			}
		}
		fetchData();
	}, [url]);
	return { isLoading, data, error };
}

// Hook to update User on Redux
export function useGetUser() {
	const store = useStore();

	useEffect(() => {
		fetchOrUpdateUser(store);
	}, [store]);

	return;
}
