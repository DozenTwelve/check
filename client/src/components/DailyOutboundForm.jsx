import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

function formatDateInput(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

export function DailyOutboundForm({ user, userId, factories, onNotice }) {
    const { t } = useTranslation();
    const [bizDate, setBizDate] = useState(formatDateInput());
    const [factoryId, setFactoryId] = useState(user?.factory_id ?? '');
    const [quantity, setQuantity] = useState('');
    const [savedData, setSavedData] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (factoryId && bizDate) {
            loadData();
        }
    }, [factoryId, bizDate, userId]);

    async function loadData() {
        try {
            const data = await apiFetch(`/outbound?factory_id=${factoryId}&biz_date=${bizDate}`, { userId });
            setSavedData(data);
            if (data) {
                setQuantity(data.quantity);
            } else {
                setQuantity('');
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        onNotice(null);

        try {
            const res = await apiFetch('/outbound', {
                method: 'POST',
                body: {
                    biz_date: bizDate,
                    factory_id: Number(factoryId),
                    quantity: Number(quantity)
                },
                userId
            });

            onNotice({ type: 'success', text: 'Daily outbound report saved.' });
            setSavedData(res);
        } catch (err) {
            onNotice({ type: 'error', text: 'Failed to save report.' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h3>Daily Outbound Report</h3>
                <p className="subtitle">Report the total number of boxes sent out from the factory today.</p>

                <div className="row">
                    <div>
                        <label className="label">{t('daily_return.form.biz_date')}</label>
                        <input
                            className="input"
                            type="date"
                            value={bizDate}
                            onChange={(event) => setBizDate(event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">{t('daily_return.form.factory')}</label>
                        <select
                            className="select"
                            value={factoryId}
                            onChange={(event) => setFactoryId(event.target.value)}
                            disabled={user?.factory_id}
                        >
                            <option value="">{t('daily_return.form.select_factory')}</option>
                            {factories.map((factory) => (
                                <option key={factory.id} value={factory.id}>
                                    {factory.code} - {factory.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="row" style={{ alignItems: 'flex-end' }}>
                    <div>
                        <label className="label">Total Outbound Quantity</label>
                        <input
                            className="input"
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            placeholder="e.g. 500"
                            style={{ fontSize: '1.2rem', fontWeight: '600' }}
                        />
                    </div>
                    <div>
                        <button className="button" type="submit" disabled={submitting}>
                            {submitting ? 'Saving...' : (savedData ? 'Update Report' : 'Submit Report')}
                        </button>
                    </div>
                </div>
            </form>

            {savedData && (
                <div className="notice" style={{ marginTop: '24px' }}>
                    Current saved total for <strong>{savedData.biz_date.slice(0, 10)}</strong> is <strong>{savedData.quantity}</strong> boxes.
                </div>
            )}
        </div>
    );
}
