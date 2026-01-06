import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function TripEntryForm({ user, userId, factories, consumables = [], onNotice }) {
    const { t } = useTranslation();
    const getStatusLabel = (status) => {
        const label = t(`statuses.${status}`);
        return label === `statuses.${status}` ? status : label;
    };
    const [selectedFactory, setSelectedFactory] = useState(user?.factory_id || '');
    const [factorySites, setFactorySites] = useState([]);
    const [selectedSite, setSelectedSite] = useState('');
    const [trips, setTrips] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const [lines, setLines] = useState([{ consumable_id: '', qty: '' }]);
    const [note, setNote] = useState('');

    useEffect(() => {
        loadMyTrips();
    }, [userId]);

    useEffect(() => {
        setSelectedSite('');
        setFactorySites([]);
        if (selectedFactory) {
            apiFetch(`/factories/${selectedFactory}/sites`, { userId })
                .then((sites) => {
                    setFactorySites(sites || []);
                    if (sites && sites.length === 1) {
                        setSelectedSite(String(sites[0].id));
                    }
                })
                .catch(console.error);
        }
    }, [selectedFactory, userId]);

    function updateLine(index, field, value) {
        setLines((prev) =>
            prev.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line
            )
        );
    }

    function addLine() {
        setLines((prev) => [...prev, { consumable_id: '', qty: '' }]);
    }

    function removeLine(index) {
        setLines((prev) => prev.filter((_, lineIndex) => lineIndex !== index));
    }

    function mapConsumable(id) {
        const item = consumables.find((c) => Number(c.id) === Number(id));
        return item ? `${item.code}` : id;
    }

    async function loadMyTrips() {
        try {
            const data = await apiFetch('/trips', { userId });
            setTrips(data || []);
        } catch (err) {
            console.error(err);
            if (onNotice) onNotice({ type: 'error', text: t('trip_entry.notices.load_error') });
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const payloadLines = lines
            .filter((line) => line.consumable_id && line.qty !== '')
            .map((line) => ({
                consumable_id: Number(line.consumable_id),
                qty: Number(line.qty)
            }))
            .filter((line) => Number.isInteger(line.consumable_id) && line.qty > 0);

        if (!selectedFactory || !selectedSite || payloadLines.length === 0) {
            return;
        }

        setSubmitting(true);
        try {
            await apiFetch('/trips', {
                method: 'POST',
                body: {
                    biz_date: new Date().toISOString().slice(0, 10),
                    factory_id: Number(selectedFactory),
                    site_id: Number(selectedSite),
                    lines: payloadLines,
                    note
                },
                userId
            });

            if (onNotice) onNotice({ type: 'success', text: t('trip_entry.notices.submit_success') });
            setLines([{ consumable_id: '', qty: '' }]);
            setNote('');
            loadMyTrips();
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

            <form className="stack" onSubmit={handleSubmit}>
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

                <div className="divider"></div>
                <h3 className="section-title">{t('trip_entry.lines_title')}</h3>

                {lines.map((line, index) => (
                    <div className="row" key={`trip-line-${index}`}>
                        <div>
                            <label className="label">{t('trip_entry.consumable_label')}</label>
                            <select
                                className="select"
                                value={line.consumable_id}
                                onChange={(event) => updateLine(index, 'consumable_id', event.target.value)}
                            >
                                <option value="">{t('trip_entry.select_consumable')}</option>
                                {consumables.map((consumable) => (
                                    <option key={consumable.id} value={consumable.id}>
                                        {consumable.code} - {consumable.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">{t('trip_entry.qty_label')}</label>
                            <input
                                className="input"
                                type="number"
                                min="0"
                                value={line.qty}
                                onChange={(event) => updateLine(index, 'qty', event.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">{t('trip_entry.remove_line')}</label>
                            <button
                                className="button secondary"
                                type="button"
                                onClick={() => removeLine(index)}
                                disabled={lines.length === 1}
                            >
                                {t('trip_entry.remove_line')}
                            </button>
                        </div>
                    </div>
                ))}

                <div className="row" style={{ alignItems: 'center' }}>
                    <button className="button secondary" type="button" onClick={addLine}>
                        {t('trip_entry.add_line')}
                    </button>
                </div>

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
                    disabled={!selectedFactory || !selectedSite || submitting}
                    type="submit"
                >
                    {submitting ? t('trip_entry.submitting') : t('trip_entry.submit')}
                </button>
            </form>

            <div className="divider"></div>

            <h3>{t('trip_entry.recent_title')}</h3>
            <table className="table">
                <thead>
                    <tr>
                        <th>{t('trip_entry.table.date')}</th>
                        <th>{t('trip_entry.table.factory')}</th>
                        <th>{t('trip_entry.table.site')}</th>
                        <th>{t('trip_entry.table.lines')}</th>
                        <th>{t('trip_entry.table.status')}</th>
                    </tr>
                </thead>
                <tbody>
                    {trips.map((trip) => (
                        <tr key={trip.id}>
                            <td>{trip.biz_date.slice(0, 10)}</td>
                            <td>{trip.factory_name}</td>
                            <td>{trip.site_name || trip.site_id}</td>
                            <td>
                                {(trip.lines || []).map((line) => (
                                    <div key={`${trip.id}-${line.consumable_id}`}>
                                        {mapConsumable(line.consumable_id)}: {line.qty}
                                    </div>
                                ))}
                            </td>
                            <td>{getStatusLabel(trip.status)}</td>
                        </tr>
                    ))}
                    {trips.length === 0 && <tr><td colSpan="5">{t('trip_entry.empty')}</td></tr>}
                </tbody>
            </table>
        </div>
    );
}
