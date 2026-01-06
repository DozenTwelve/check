import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useMasterData(user, userId, setNotice) {
    const { t } = useTranslation();
    const [factories, setFactories] = useState([]);
    const [consumables, setConsumables] = useState([]);
    const [inventorySummary, setInventorySummary] = useState({});

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
                    const [globalRows, factoryRows, siteRows] = await Promise.all([
                        apiFetch('/reports/balances?location_type=global&confirmed_only=true', { userId }),
                        apiFetch('/reports/balances?location_type=factory&confirmed_only=true', { userId }),
                        apiFetch('/reports/balances?location_type=site&confirmed_only=true', { userId })
                    ]);

                    const sumByConsumable = (rows) => {
                        const map = {};
                        (rows || []).forEach((row) => {
                            const key = String(row.consumable_id);
                            map[key] = (map[key] || 0) + Number(row.as_of_qty || 0);
                        });
                        return map;
                    };

                    const globalMap = sumByConsumable(globalRows);
                    const factoryMap = sumByConsumable(factoryRows);
                    const siteMap = sumByConsumable(siteRows);

                    const idSet = new Set();
                    (consumableData || []).forEach((item) => idSet.add(String(item.id)));
                    Object.keys(globalMap).forEach((key) => idSet.add(key));
                    Object.keys(factoryMap).forEach((key) => idSet.add(key));
                    Object.keys(siteMap).forEach((key) => idSet.add(key));

                    const summaryMap = {};
                    idSet.forEach((key) => {
                        const globalQty = globalMap[key] || 0;
                        const factoryQty = factoryMap[key] || 0;
                        const siteQty = siteMap[key] || 0;
                        summaryMap[key] = {
                            total: globalQty + factoryQty + siteQty,
                            global: globalQty,
                            factory: factoryQty,
                            site: siteQty
                        };
                    });

                    setInventorySummary(summaryMap);
                } catch (err) {
                    setInventorySummary({});
                }
            } else {
                setInventorySummary({});
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

    return { factories, consumables, inventorySummary, loadMasterData };
}
