import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useMasterData(user, userId, setNotice) {
    const { t } = useTranslation();
    const [factories, setFactories] = useState([]);
    const [consumables, setConsumables] = useState([]);
    const [globalBalances, setGlobalBalances] = useState({});

    const loadMasterData = useCallback(async () => {
        try {
            const [factoryData, consumableData] = await Promise.all([
                apiFetch('/factories', { userId }),
                apiFetch('/consumables', { userId })
            ]);
            setFactories(factoryData || []);
            setConsumables(consumableData || []);

            if (user && ['admin', 'manager'].includes(user.role)) {
                try {
                    const balanceRows = await apiFetch(
                        '/reports/balances?location_type=global&confirmed_only=true',
                        { userId }
                    );
                    const balanceMap = {};
                    (balanceRows || []).forEach((row) => {
                        balanceMap[row.consumable_id] = row.as_of_qty;
                    });
                    setGlobalBalances(balanceMap);
                } catch (err) {
                    setGlobalBalances({});
                }
            } else {
                setGlobalBalances({});
            }
        } catch (err) {
            if (setNotice) {
                setNotice({ type: 'error', text: t('notices.master_data_error') });
            }
        }
    }, [user, userId, setNotice, t]);

    useEffect(() => {
        if (!user) {
            return;
        }
        loadMasterData();
    }, [user, loadMasterData]);

    return { factories, consumables, globalBalances, loadMasterData };
}
