import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function BoxCountsPanel({ userId, title, showBaseline = true, autoRefreshMs = 15000 }) {
    const { t } = useTranslation();
    const [counts, setCounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(false);
    const [selectedFactory, setSelectedFactory] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(false);

    const loadCounts = useCallback(async (silent = false) => {
        if (!silent) {
            setLoading(true);
        }
        setError(false);
        try {
            const data = await apiFetch('/factories/box-counts', { userId });
            setCounts(data || []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [userId]);

    const openHistory = useCallback(async (factory) => {
        setSelectedFactory(factory);
        setHistory([]);
        setHistoryError(false);
        setHistoryLoading(true);
        try {
            const data = await apiFetch(`/factories/${factory.id}/box-history`, { userId });
            setHistory(data?.events || []);
        } catch (err) {
            console.error(err);
            setHistoryError(true);
        } finally {
            setHistoryLoading(false);
        }
    }, [userId]);

    const closeHistory = () => {
        setSelectedFactory(null);
        setHistory([]);
        setHistoryError(false);
    };

    const formatEventTime = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString();
    };

    const getEventLabel = (type) => {
        const label = t(`box_counts.events.${type}`);
        return label.startsWith('box_counts.events') ? type : label;
    };

    const formatDelta = (delta) => {
        if (delta > 0) return `+${delta}`;
        return String(delta);
    };

    useEffect(() => {
        loadCounts(false);
        const interval = setInterval(() => {
            loadCounts(true);
        }, autoRefreshMs);
        return () => clearInterval(interval);
    }, [autoRefreshMs, loadCounts]);

    return (
        <section className="card" style={{ '--delay': '80ms', marginBottom: '24px' }}>
            <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>{title}</h3>
                <button className="button small ghost" type="button" onClick={() => loadCounts(false)}>
                    {t('box_counts.refresh')}
                </button>
            </div>

            {loading ? (
                <div className="text-muted">{t('box_counts.loading')}</div>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>{t('box_counts.table.factory')}</th>
                            {showBaseline && <th>{t('box_counts.table.baseline')}</th>}
                            <th>{t('box_counts.table.current')}</th>
                            <th>{t('box_counts.table.history')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {counts.map((row) => (
                            <tr key={row.id}>
                                <td>{row.code} - {row.name}</td>
                                {showBaseline && <td>{row.baseline_boxes}</td>}
                                <td style={{ fontWeight: 600 }}>{row.current_boxes}</td>
                                <td>
                                    <button
                                        className="button small ghost"
                                        type="button"
                                        onClick={() => openHistory(row)}
                                    >
                                        {t('box_counts.view_history')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {counts.length === 0 && (
                            <tr>
                                <td colSpan={showBaseline ? 4 : 3}>{t('box_counts.empty')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {error && (
                <div className="text-muted" style={{ marginTop: '8px' }}>
                    {t('box_counts.load_error')}
                </div>
            )}
            {lastUpdated && (
                <div className="text-muted" style={{ marginTop: '8px' }}>
                    {t('box_counts.last_updated', { time: lastUpdated.toLocaleTimeString() })}
                </div>
            )}

            {selectedFactory && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>
                                {t('box_counts.history_title', {
                                    factory: `${selectedFactory.code} - ${selectedFactory.name}`
                                })}
                            </h3>
                            <button className="button ghost small" type="button" onClick={closeHistory}>
                                {t('common.close')}
                            </button>
                        </div>

                        {historyLoading ? (
                            <div className="text-muted">{t('box_counts.history_loading')}</div>
                        ) : historyError ? (
                            <div className="text-muted">{t('box_counts.history_error')}</div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>{t('box_counts.history.time')}</th>
                                        <th>{t('box_counts.history.type')}</th>
                                        <th>{t('box_counts.history.change')}</th>
                                        <th>{t('box_counts.history.total')}</th>
                                        <th>{t('box_counts.history.actor')}</th>
                                        <th>{t('box_counts.history.note')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((event, index) => (
                                        <tr key={`${event.event_type}-${event.ref_id ?? 'base'}-${index}`}>
                                            <td>{formatEventTime(event.event_time)}</td>
                                            <td>{getEventLabel(event.event_type)}</td>
                                            <td className={event.delta >= 0 ? 'delta-positive' : 'delta-negative'}>
                                                {formatDelta(event.delta)}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{event.running_total}</td>
                                            <td>{event.actor || t('box_counts.history.system')}</td>
                                            <td>{event.note || '-'}</td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan="6">{t('box_counts.history_empty')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
