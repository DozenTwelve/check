import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useMasterData(user, userId, setNotice) {
    const { t } = useTranslation();
    const [factories, setFactories] = useState([]);
    const [consumables, setConsumables] = useState([]);

    useEffect(() => {
        if (!user) {
            return;
        }
        loadMasterData();
    }, [user]);

    async function loadMasterData() {
        try {
            const [factoryData, consumableData] = await Promise.all([
                apiFetch('/factories', { userId }),
                apiFetch('/consumables', { userId })
            ]);
            setFactories(factoryData || []);
            setConsumables(consumableData || []);
        } catch (err) {
            if (setNotice) {
                setNotice({ type: 'error', text: t('notices.master_data_error') });
            }
        }
    }

    return { factories, consumables, loadMasterData };
}
