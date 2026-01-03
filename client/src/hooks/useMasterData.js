import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export function useMasterData(user, userId, setNotice) {
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
                setNotice({ type: 'error', text: 'Failed to load master data.' });
            }
        }
    }

    return { factories, consumables, loadMasterData };
}
