import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

function formatDateInput(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

export function TripEntryForm({ user, userId, factories, onNotice }) {
    const { t } = useTranslation();
    const [bizDate, setBizDate] = useState(formatDateInput());
    const [factoryId, setFactoryId] = useState(user?.factory_id ?? '');
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');
    const [trips, setTrips] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadTrips();
    }, [userId]);

    async function loadTrips() {
        try {
            const data = await apiFetch('/trips', { userId });
            setTrips(data || []);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        onNotice(null);

        try {
            await apiFetch('/trips', {
                method: 'POST',
                body: {
                    biz_date: bizDate,
                    factory_id: Number(factoryId),
                    quantity: Number(quantity),
                    note: note || null
                },
                userId
            });

            onNotice({ type: 'success', text: t('notices.daily_return_success') }); // Reuse success message
            setQuantity('');
            setNote('');
            loadTrips();
        } catch (err) {
            onNotice({ type: 'error', text: t('notices.daily_return_submit_error') });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <h3>Submit Trip Return</h3>
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
                    <div>
                        <label className="label">{t('daily_return.form.declared_qty')}</label>
                        <input
                            className="input"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            placeholder="Qty"
                        />
                    </div>
                </div>
                <div className="row">
                    <div style={{ flex: '2 1 300px' }}>
                        <label className="label">{t('daily_return.form.note')}</label>
                        <input
                            className="input"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Optional trip details..."
                        />
                    </div>
                    <div style={{ alignSelf: 'flex-end' }}>
                        <button className="button" type="submit" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Trip'}
                        </button>
                    </div>
                </div>
            </form>

            <div className="divider"></div>

            <h3>My Recent Trips</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Factory</th>
                        <th>Qty</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {trips.map((trip) => (
                        <tr key={trip.id}>
                            <td>{trip.biz_date.slice(0, 10)}</td>
                            <td>{trip.factory_name}</td>
                            <td style={{ fontWeight: 600 }}>{trip.quantity}</td>
                            <td>
                                <span className={`tag ${trip.status === 'approved' ? 'success' : ''}`}>
                                    {trip.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {trips.length === 0 && (
                        <tr><td colSpan="4">No trips recorded.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
