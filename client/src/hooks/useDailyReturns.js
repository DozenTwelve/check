import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export function useDailyReturns(user, userId, setNotice) {
    const [dailyReturns, setDailyReturns] = useState([]);

    useEffect(() => {
        if (!user) {
            return;
        }
        loadDailyReturns();
    }, [user]);

    async function loadDailyReturns() {
        try {
            const query = user?.factory_id ? `?factory_id=${user.factory_id}` : '';
            const data = await apiFetch(`/daily-returns${query}`, { userId });
            setDailyReturns(data || []);
        } catch (err) {
            if (setNotice) {
                setNotice({ type: 'error', text: 'Failed to load daily returns.' });
            }
        }
    }

    return { dailyReturns, loadDailyReturns };
}
