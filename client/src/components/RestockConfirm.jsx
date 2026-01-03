import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function RestockConfirm({ userId }) {
    const { t } = useTranslation();
    const [pending, setPending] = useState([]);

    useEffect(() => {
        loadPending();
    }, [userId]);

    async function loadPending() {
        try {
            const data = await apiFetch('/restocks/pending', { userId });
            setPending(data || []);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleConfirm(id) {
        try {
            await apiFetch(`/restocks/${id}/confirm`, { method: 'POST', userId });
            loadPending();
        } catch (err) {
            console.error(err);
        }
    }

    if (pending.length === 0) return null;

    return (
        <div className="notice" style={{ marginTop: '24px', borderColor: 'var(--accent)', background: 'rgba(59, 130, 246, 0.1)' }}>
            <h4>{t('restock_confirm.title')}</h4>
            <p style={{ marginBottom: '12px' }}>{t('restock_confirm.subtitle')}</p>
            {pending.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    <span>
                        <strong>{t('restock_confirm.quantity', { quantity: item.quantity })}</strong>{' '}
                        {t('restock_confirm.from', {
                            manager: item.manager_name,
                            date: item.biz_date.slice(0, 10)
                        })}
                    </span>
                    <button className="button small" onClick={() => handleConfirm(item.id)}>{t('restock_confirm.confirm_btn')}</button>
                </div>
            ))}
        </div>
    );
}
