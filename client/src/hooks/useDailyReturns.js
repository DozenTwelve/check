import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useDailyReturns(user, userId, setNotice) {
    const { t } = useTranslation();
    const [dailyReturns, setDailyReturns] = useState([]);

    const loadDailyReturns = useCallback(async () => {
        try {
            const query = '?status=approved';
            const data = await apiFetch(`/transfers${query}`, { userId });
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
