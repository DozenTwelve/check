import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function TripEntryForm({ user, userId, factories, onNotice }) {
    const { t } = useTranslation();
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
            if (onNotice) onNotice({ type: 'error', text: 'Failed to load trips' });
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

            if (onNotice) onNotice({ type: 'success', text: 'Trip submitted for approval' });
            setQuantity('');
            setNote('');
            loadMyTrips(); // Refresh list
        } catch (err) {
            console.error(err);
            if (onNotice) onNotice({ type: 'error', text: 'Submission failed' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="card">
            <h2 className="title">Daily Trip Entry</h2>

            <div className="stack">
                <label className="label">Select Factory</label>
                <select
                    className="select"
                    value={selectedFactory}
                    onChange={(e) => setSelectedFactory(e.target.value)}
                    disabled={!!user?.factory_id}
                >
                    <option value="">-- Choose Factory --</option>
                    {factories.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>

                {/* Site Selector (Only if factory is selected) */}
                {selectedFactory && (
                    <div>
                        <label className="label" style={{ marginTop: '0.5rem' }}>Select Destination Site</label>
                        {factorySites.length === 0 ? (
                            <div className="text-sm text-gray client-site-loader">Loading sites...</div>
                        ) : (
                            <select
                                className="select"
                                value={selectedSite}
                                onChange={(e) => setSelectedSite(e.target.value)}
                            >
                                <option value="">-- Choose Site --</option>
                                {factorySites.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                <label className="label" style={{ marginTop: '0.5rem' }}>Quantity Delivered (Boxes)</label>
                <input
                    className="input"
                    type="number"
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                />

                <label className="label" style={{ marginTop: '0.5rem' }}>Note (Optional)</label>
                <input
                    className="input"
                    type="text"
                    placeholder="e.g. Morning delivery"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />

                <button
                    className="button"
                    style={{ marginTop: '1rem' }}
                    disabled={!selectedFactory || !quantity || !selectedSite || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? 'Submitting...' : 'Submit Trip'}
                </button>
            </div>

            <div className="divider"></div>

            <h3>My Recent Trips</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Factory</th>
                        <th>Site</th>
                        <th>Qty</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {trips.map(t => (
                        <tr key={t.id}>
                            <td>{t.biz_date.slice(0, 10)}</td>
                            <td>{t.factory_name}</td>
                            <td>{t.site_id /* In future, join site name in query */}</td>
                            <td>{t.quantity}</td>
                            <td>{t.status}</td>
                        </tr>
                    ))}
                    {trips.length === 0 && <tr><td colSpan="5">No trips found.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}
