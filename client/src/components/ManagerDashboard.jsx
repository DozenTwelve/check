import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function ManagerDashboard({ userId, factories, consumables = [] }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('reviews');
    const [pendingItems, setPendingItems] = useState({ trips: [] });

    const [restockForm, setRestockForm] = useState({ factory_id: '', note: '' });
    const [restockLines, setRestockLines] = useState([{ consumable_id: '', qty: '' }]);

    function mapConsumable(id) {
        const item = consumables.find((c) => Number(c.id) === Number(id));
        return item ? item.code : id;
    }

    useEffect(() => {
        if (activeTab === 'reviews') loadPending();
    }, [activeTab, userId]);

    async function loadPending() {
        try {
            const data = await apiFetch('/manager/pending', { userId });
            setPendingItems(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleApprove(type, id) {
        try {
            await apiFetch('/manager/approve', {
                method: 'POST',
                body: { type, id },
                userId
            });
            loadPending(); // Refresh
        } catch (err) {
            console.error('Approval failed', err);
        }
    }

    function updateLine(index, field, value) {
        setRestockLines((prev) =>
            prev.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line
            )
        );
    }

    function addLine() {
        setRestockLines((prev) => [...prev, { consumable_id: '', qty: '' }]);
    }

    function removeLine(index) {
        setRestockLines((prev) => prev.filter((_, lineIndex) => lineIndex !== index));
    }

    async function handleRestockSubmit(e) {
        e.preventDefault();
        try {
            const payloadLines = restockLines
                .filter((line) => line.consumable_id && line.qty !== '')
                .map((line) => ({
                    consumable_id: Number(line.consumable_id),
                    qty: Number(line.qty)
                }))
                .filter((line) => Number.isInteger(line.consumable_id) && line.qty > 0);

            if (!restockForm.factory_id || payloadLines.length === 0) {
                return;
            }

            await apiFetch('/manager/restock', {
                method: 'POST',
                body: {
                    biz_date: new Date().toISOString().slice(0, 10),
                    factory_id: Number(restockForm.factory_id),
                    lines: payloadLines,
                    note: restockForm.note
                },
                userId
            });
            alert(t('manager_dashboard.distribute.dispatched_notice'));
            setRestockForm({ factory_id: '', note: '' });
            setRestockLines([{ consumable_id: '', qty: '' }]);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div>
            <div className="tabs">
                <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                    {t('manager_dashboard.tabs.approvals')}
                </button>
                <button className={`tab ${activeTab === 'distribute' ? 'active' : ''}`} onClick={() => setActiveTab('distribute')}>
                    {t('manager_dashboard.tabs.distribute')}
                </button>
            </div>

            <div className="divider"></div>

            {activeTab === 'reviews' && (
                <div>
                    <h3>{t('manager_dashboard.reviews.pending_trips')}</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('manager_dashboard.reviews.table.date')}</th>
                                <th>{t('manager_dashboard.reviews.table.driver')}</th>
                                <th>{t('manager_dashboard.reviews.table.factory')}</th>
                                <th>{t('manager_dashboard.reviews.table.lines')}</th>
                                <th>{t('manager_dashboard.reviews.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingItems.trips.map(item => (
                                <tr key={item.id}>
                                    <td>{item.biz_date.slice(0, 10)}</td>
                                    <td>{item.submitter_name}</td>
                                    <td>{item.factory_name}</td>
                                    <td>
                                        {(item.lines || []).map((line) => (
                                            <div key={`${item.id}-${line.consumable_id}`}>
                                                {mapConsumable(line.consumable_id)}: {line.qty}
                                            </div>
                                        ))}
                                    </td>
                                    <td>
                                        <button className="button small" onClick={() => handleApprove('trip', item.id)}>
                                            {t('manager_dashboard.reviews.approve')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pendingItems.trips.length === 0 && (
                                <tr><td colSpan="5">{t('manager_dashboard.reviews.empty_trips')}</td></tr>
                            )}
                        </tbody>
                    </table>

                </div>
            )}

            {activeTab === 'distribute' && (
                <form onSubmit={handleRestockSubmit} className="card">
                    <h3>{t('manager_dashboard.distribute.title')}</h3>
                    <div className="row">
                        <div>
                            <label className="label">{t('manager_dashboard.distribute.factory_label')}</label>
                            <select className="select" value={restockForm.factory_id} onChange={e => setRestockForm({ ...restockForm, factory_id: e.target.value })}>
                                <option value="">{t('manager_dashboard.distribute.select_factory')}</option>
                                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="divider"></div>
                    <h4 className="section-title">{t('manager_dashboard.distribute.lines_title')}</h4>

                    {restockLines.map((line, index) => (
                        <div className="row" key={`restock-line-${index}`}>
                            <div>
                                <label className="label">{t('manager_dashboard.distribute.consumable_label')}</label>
                                <select
                                    className="select"
                                    value={line.consumable_id}
                                    onChange={(event) => updateLine(index, 'consumable_id', event.target.value)}
                                >
                                    <option value="">{t('manager_dashboard.distribute.select_consumable')}</option>
                                    {consumables.map((consumable) => (
                                        <option key={consumable.id} value={consumable.id}>
                                            {consumable.code} - {consumable.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">{t('manager_dashboard.distribute.quantity_label')}</label>
                                <input
                                    className="input"
                                    type="number"
                                    min="0"
                                    value={line.qty}
                                    onChange={(event) => updateLine(index, 'qty', event.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">{t('manager_dashboard.distribute.remove_line')}</label>
                                <button
                                    className="button secondary"
                                    type="button"
                                    onClick={() => removeLine(index)}
                                    disabled={restockLines.length === 1}
                                >
                                    {t('manager_dashboard.distribute.remove_line')}
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="row">
                        <button className="button secondary" type="button" onClick={addLine}>
                            {t('manager_dashboard.distribute.add_line')}
                        </button>
                    </div>

                    <div className="row">
                        <input
                            className="input"
                            placeholder={t('manager_dashboard.distribute.note_placeholder')}
                            value={restockForm.note}
                            onChange={e => setRestockForm({ ...restockForm, note: e.target.value })}
                        />
                        <button className="button" type="submit">{t('manager_dashboard.distribute.dispatch')}</button>
                    </div>
                </form>
            )}
        </div>
    );
}
