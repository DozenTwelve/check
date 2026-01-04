import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useDailyReturns(user, userId, setNotice) {
    const { t } = useTranslation();
    const [dailyReturns, setDailyReturns] = useState([]);

    const loadDailyReturns = useCallback(async () => {
        try {
            const query = user?.factory_id ? `?factory_id=${user.factory_id}` : '';
            const data = await apiFetch(`/daily-returns${query}`, { userId });
            setDailyReturns(data || []);
        } catch (err) {
            if (setNotice) {
                setNotice({ type: 'error', text: t('notices.daily_returns_error') });
            }
        }
    }, [user?.factory_id, userId, setNotice, t]);

    useEffect(() => {
        if (!user) {
            return;
        }
        loadDailyReturns();
    }, [user, loadDailyReturns]);

    return { dailyReturns, loadDailyReturns };
}
