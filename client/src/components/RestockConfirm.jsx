import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export function RestockConfirm({ userId }) {
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
            <h4>Incoming Restocks</h4>
            <p style={{ marginBottom: '12px' }}>Please confirm receipt of the following boxes:</p>
            {pending.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                    <span>
                        <strong>{item.quantity} boxes</strong> from {item.manager_name} ({item.biz_date.slice(0, 10)})
                    </span>
                    <button className="button small" onClick={() => handleConfirm(item.id)}>Confirm Receipt</button>
                </div>
            ))}
        </div>
    );
}
