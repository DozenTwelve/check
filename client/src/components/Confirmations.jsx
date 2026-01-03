import React from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function Confirmations({ userId, dailyReturns, onRefresh, onNotice }) {
    const { t } = useTranslation();
    const getStatusLabel = (status) => {
        const label = t(`statuses.${status}`);
        return label === `statuses.${status}` ? status : label;
    };

    async function handleConfirm(id) {
        try {
            await apiFetch(`/daily-returns/${id}/confirm`, { method: 'POST', userId });
            onNotice({ type: 'success', text: t('notices.confirm_success', { id }) });
            onRefresh();
        } catch (err) {
            onNotice({ type: 'error', text: t('notices.confirm_error') });
        }
    }

    return (
        <div>
            <p className="subtitle">{t('confirmations.subtitle')}</p>
            <table className="table">
                <thead>
                    <tr>
                        <th>{t('confirmations.table.id')}</th>
                        <th>{t('confirmations.table.biz_date')}</th>
                        <th>{t('confirmations.table.factory')}</th>
                        <th>{t('confirmations.table.status')}</th>
                        <th>{t('confirmations.table.verification')}</th>
                        <th>{t('confirmations.table.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {dailyReturns.map((doc) => (
                        <tr key={doc.id}>
                            <td>{doc.id}</td>
                            <td>{doc.biz_date}</td>
                            <td>{doc.factory_id}</td>
                            <td>{getStatusLabel(doc.status)}</td>
                            <td>{t(`daily_return.v_levels.${doc.v_level}`)}</td>
                            <td>
                                {doc.status !== 'confirmed' && doc.status !== 'voided' && (
                                    <button className="button" type="button" onClick={() => handleConfirm(doc.id)}>
                                        {t('confirmations.confirm_btn')}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {dailyReturns.length === 0 && (
                        <tr>
                            <td colSpan="6">{t('confirmations.empty')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
