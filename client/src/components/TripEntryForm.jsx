import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function TripEntryForm({ user, userId, factories, onNotice }) {
    const { t } = useTranslation();
    const getStatusLabel = (status) => {
        const label = t(`statuses.${status}`);
        return label === `statuses.${status}` ? status : label;
    };
    const [selectedFactory, setSelectedFactory] = useState(user?.factory_id || '');
    const [factorySites, setFactorySites] = useState([]);
    const [selectedSite, setSelectedSite] = useState('');
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form inputs
    const [quantity, setQuantity] = useState('');
    const [note, setNote] = useState('');

    // 1) Load recent trips on mount
    useEffect(() => {
        loadMyTrips();
    }, [userId]);

    // 2) When factory changes, fetch allowed sites
    useEffect(() => {
        setSelectedSite('');
        setFactorySites([]);
        if (selectedFactory) {
            apiFetch(`/factories/${selectedFactory}/sites`, { userId })
                .then(sites => {
                    setFactorySites(sites || []);
                    if (sites && sites.length === 1) {
                        setSelectedSite(sites[0].id);
                    }
                })
                .catch(console.error);
        }
    }, [selectedFactory]);

    async function loadMyTrips() {
        setLoading(true);
        try {
            const data = await apiFetch('/trips', { userId });
            setTrips(data || []);
        } catch (err) {
            console.error(err);
            if (onNotice) onNotice({ type: 'error', text: t('trip_entry.notices.load_error') });
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedFactory || !quantity || !selectedSite) return;

        setSubmitting(true);
        try {
            await apiFetch('/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    biz_date: new Date().toISOString().slice(0, 10),
                    factory_id: selectedFactory,
                    site_id: selectedSite,
                    quantity: parseInt(quantity, 10),
                    note
                },
                userId
            });

            if (onNotice) onNotice({ type: 'success', text: t('trip_entry.notices.submit_success') });
            setQuantity('');
            setNote('');
            loadMyTrips(); // Refresh list
        } catch (err) {
            console.error(err);
            if (onNotice) onNotice({ type: 'error', text: t('trip_entry.notices.submit_error') });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card">
            <h2 className="title">{t('trip_entry.title')}</h2>

            <div className="stack">
                <label className="label">{t('trip_entry.select_factory')}</label>
                <select
                    className="select"
                    value={selectedFactory}
                    onChange={(e) => setSelectedFactory(e.target.value)}
                    disabled={!!user?.factory_id}
                >
                    <option value="">{t('trip_entry.select_factory_placeholder')}</option>
                    {factories.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>

                {/* Site Selector (Only if factory is selected) */}
                {selectedFactory && (
                    <div>
                        <label className="label" style={{ marginTop: '0.5rem' }}>{t('trip_entry.select_site')}</label>
                        {factorySites.length === 0 ? (
                            <div className="text-sm text-gray client-site-loader">{t('trip_entry.loading_sites')}</div>
                        ) : (
                            <select
                                className="select"
                                value={selectedSite}
                                onChange={(e) => setSelectedSite(e.target.value)}
                            >
                                <option value="">{t('trip_entry.select_site_placeholder')}</option>
                                {factorySites.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                <label className="label" style={{ marginTop: '0.5rem' }}>{t('trip_entry.quantity_label')}</label>
                <input
                    className="input"
                    type="number"
                    placeholder={t('trip_entry.quantity_placeholder')}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />

                <label className="label" style={{ marginTop: '0.5rem' }}>{t('trip_entry.note_label_optional')}</label>
                <input
                    className="input"
                    type="text"
                    placeholder={t('trip_entry.note_placeholder')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />

                <button
                    className="button"
                    style={{ marginTop: '1rem' }}
                    disabled={!selectedFactory || !quantity || !selectedSite || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? t('trip_entry.submitting') : t('trip_entry.submit')}
                </button>
            </div>

            <div className="divider"></div>

            <h3>{t('trip_entry.recent_title')}</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>{t('trip_entry.table.date')}</th>
                        <th>{t('trip_entry.table.factory')}</th>
                        <th>{t('trip_entry.table.site')}</th>
                        <th>{t('trip_entry.table.qty')}</th>
                        <th>{t('trip_entry.table.status')}</th>
                    </tr>
                </thead>
                <tbody>
                    {trips.map((trip) => (
                        <tr key={trip.id}>
                            <td>{trip.biz_date.slice(0, 10)}</td>
                            <td>{trip.factory_name}</td>
                            <td>{trip.site_id /* In future, join site name in query */}</td>
                            <td>{trip.quantity}</td>
                            <td>{getStatusLabel(trip.status)}</td>
                        </tr>
                    ))}
                    {trips.length === 0 && <tr><td colSpan="5">{t('trip_entry.empty')}</td></tr>}
                </tbody>
            </table>
        </div>
    );
}
