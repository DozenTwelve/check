import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function ManagerDashboard({ user, userId, factories, consumables = [] }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('reviews');
    const [pendingItems, setPendingItems] = useState({ trips: [] });
    const [siteInventory, setSiteInventory] = useState([]);
    const [siteInventoryLoading, setSiteInventoryLoading] = useState(false);
    const [siteInventoryError, setSiteInventoryError] = useState('');

    const [restockForm, setRestockForm] = useState({ factory_id: '', note: '' });
    const [restockLines, setRestockLines] = useState([{ consumable_id: '', qty: '' }]);

    function mapConsumable(id) {
        const item = consumables.find((c) => Number(c.id) === Number(id));
        return item ? item.code : id;
    }

    useEffect(() => {
        if (activeTab === 'reviews') loadPending();
        if (activeTab === 'site_inventory') loadSiteInventory();
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

    async function loadSiteInventory() {
        setSiteInventoryLoading(true);
        setSiteInventoryError('');
        try {
            const data = await apiFetch('/reports/site-inventory', { userId });
            setSiteInventory(data || []);
        } catch (err) {
            console.error(err);
            setSiteInventory([]);
            if (err?.data?.error === 'manager_site_required') {
                setSiteInventoryError(t('manager_dashboard.site_inventory.no_site'));
            } else if (err?.data?.error === 'site_location_missing') {
                setSiteInventoryError(t('manager_dashboard.site_inventory.missing_location'));
            } else {
                setSiteInventoryError(t('manager_dashboard.site_inventory.error'));
            }
        } finally {
            setSiteInventoryLoading(false);
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
                {user?.role === 'manager' && (
                    <button className={`tab ${activeTab === 'site_inventory' ? 'active' : ''}`} onClick={() => setActiveTab('site_inventory')}>
                        {t('manager_dashboard.tabs.site_inventory')}
                    </button>
                )}
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

            {activeTab === 'site_inventory' && (
                <div className="card">
                    <div className="card-header">
                        <h3>{t('manager_dashboard.site_inventory.title')}</h3>
                        <button className="button ghost small" type="button" onClick={loadSiteInventory}>
                            {t('manager_dashboard.site_inventory.refresh')}
                        </button>
                    </div>
                    {siteInventoryLoading ? (
                        <div className="text-muted">{t('manager_dashboard.site_inventory.loading')}</div>
                    ) : siteInventoryError ? (
                        <div className="text-muted">{siteInventoryError}</div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>{t('manager_dashboard.site_inventory.table.consumable')}</th>
                                    <th>{t('manager_dashboard.site_inventory.table.qty')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {siteInventory.map((row) => (
                                    <tr key={row.consumable_id}>
                                        <td>{row.consumable_code ? `${row.consumable_code} - ${row.consumable_name}` : row.consumable_id}</td>
                                        <td>{row.qty}{row.consumable_unit ? ` ${row.consumable_unit}` : ''}</td>
                                    </tr>
                                ))}
                                {siteInventory.length === 0 && (
                                    <tr>
                                        <td colSpan="2">{t('manager_dashboard.site_inventory.empty')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}
