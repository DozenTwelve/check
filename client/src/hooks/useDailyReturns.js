import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useDailyReturns(user, userId, setNotice) {
    const { t } = useTranslation();
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
                setNotice({ type: 'error', text: t('notices.daily_returns_error') });
            }
        }
    }

    return { dailyReturns, loadDailyReturns };
}
