import React from 'react';
import { apiFetch } from '../utils/api';

export function Confirmations({ userId, dailyReturns, onRefresh, onNotice }) {
    async function handleConfirm(id) {
        try {
            await apiFetch(`/daily-returns/${id}/confirm`, { method: 'POST', userId });
            onNotice({ type: 'success', text: `Daily return #${id} confirmed.` });
            onRefresh();
        } catch (err) {
            onNotice({ type: 'error', text: 'Failed to confirm daily return.' });
        }
    }

    return (
        <div>
            <p className="subtitle">Confirm submitted returns to lock the evidence.</p>
            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Biz Date</th>
                        <th>Factory</th>
                        <th>Status</th>
                        <th>Verification</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {dailyReturns.map((doc) => (
                        <tr key={doc.id}>
                            <td>{doc.id}</td>
                            <td>{doc.biz_date}</td>
                            <td>{doc.factory_id}</td>
                            <td>{doc.status}</td>
                            <td>{doc.v_level}</td>
                            <td>
                                {doc.status !== 'confirmed' && doc.status !== 'voided' && (
                                    <button className="button" type="button" onClick={() => handleConfirm(doc.id)}>
                                        Confirm
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {dailyReturns.length === 0 && (
                        <tr>
                            <td colSpan="6">No returns available.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
