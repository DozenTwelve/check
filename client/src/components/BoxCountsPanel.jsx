import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function BoxCountsPanel({ userId, title, showBaseline = true, autoRefreshMs = 15000 }) {
    const { t } = useTranslation();
    const [counts, setCounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(false);

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

    useEffect(() => {
        loadCounts(false);
        const interval = setInterval(() => {
            loadCounts(true);
        }, autoRefreshMs);
        return () => clearInterval(interval);
    }, [autoRefreshMs, loadCounts]);

    return (
        <section className="card" style={{ '--delay': '80ms' }}>
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
                        </tr>
                    </thead>
                    <tbody>
                        {counts.map((row) => (
                            <tr key={row.id}>
                                <td>{row.code} - {row.name}</td>
                                {showBaseline && <td>{row.baseline_boxes}</td>}
                                <td style={{ fontWeight: 600 }}>{row.current_boxes}</td>
                            </tr>
                        ))}
                        {counts.length === 0 && (
                            <tr>
                                <td colSpan={showBaseline ? 3 : 2}>{t('box_counts.empty')}</td>
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
        </section>
    );
}
