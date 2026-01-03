import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function ManagerDashboard({ userId, factories }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('reviews');
    const [pendingItems, setPendingItems] = useState({ trips: [], outbound: [] });
    const [platformReturns, setPlatformReturns] = useState([]);

    // Form States
    const [restockForm, setRestockForm] = useState({ factory_id: '', quantity: '', note: '' });
    const [platformForm, setPlatformForm] = useState({ quantity: '', note: '' });

    useEffect(() => {
        if (activeTab === 'reviews') loadPending();
        if (activeTab === 'platform') loadPlatformHistory();
    }, [activeTab]);

    async function loadPending() {
        try {
            const data = await apiFetch('/manager/pending', { userId });
            setPendingItems(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function loadPlatformHistory() {
        try {
            const data = await apiFetch('/manager/platform-returns', { userId });
            setPlatformReturns(data || []);
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

    async function handlePlatformSubmit(e) {
        e.preventDefault();
        try {
            await apiFetch('/manager/platform-returns', {
                method: 'POST',
                body: {
                    biz_date: new Date().toISOString().slice(0, 10),
                    quantity: Number(platformForm.quantity),
                    note: platformForm.note
                },
                userId
            });
            setPlatformForm({ quantity: '', note: '' });
            loadPlatformHistory();
        } catch (err) {
            console.error(err);
        }
    }

    async function handleRestockSubmit(e) {
        e.preventDefault();
        try {
            await apiFetch('/manager/restock', {
                method: 'POST',
                body: {
                    biz_date: new Date().toISOString().slice(0, 10),
                    factory_id: Number(restockForm.factory_id),
                    quantity: Number(restockForm.quantity),
                    driver_id: null, // Simplified for now, just to factory
                    note: restockForm.note
                },
                userId
            });
            alert(t('manager_dashboard.distribute.dispatched_notice'));
            setRestockForm({ factory_id: '', quantity: '', note: '' });
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
                <button className={`tab ${activeTab === 'platform' ? 'active' : ''}`} onClick={() => setActiveTab('platform')}>
                    {t('manager_dashboard.tabs.platform')}
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
                                <th>{t('manager_dashboard.reviews.table.qty')}</th>
                                <th>{t('manager_dashboard.reviews.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingItems.trips.map(item => (
                                <tr key={item.id}>
                                    <td>{item.biz_date.slice(0, 10)}</td>
                                    <td>{item.submitter_name}</td>
                                    <td>{item.factory_name}</td>
                                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
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

                    <h3 style={{ marginTop: '24px' }}>{t('manager_dashboard.reviews.pending_reports')}</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('manager_dashboard.reviews.table.date')}</th>
                                <th>{t('manager_dashboard.reviews.table.clerk')}</th>
                                <th>{t('manager_dashboard.reviews.table.factory')}</th>
                                <th>{t('manager_dashboard.reviews.table.qty')}</th>
                                <th>{t('manager_dashboard.reviews.table.action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingItems.outbound.map(item => (
                                <tr key={item.id}>
                                    <td>{item.biz_date.slice(0, 10)}</td>
                                    <td>{item.submitter_name}</td>
                                    <td>{item.factory_name}</td>
                                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                                    <td>
                                        <button className="button small" onClick={() => handleApprove('outbound', item.id)}>
                                            {t('manager_dashboard.reviews.approve')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pendingItems.outbound.length === 0 && (
                                <tr><td colSpan="5">{t('manager_dashboard.reviews.empty_reports')}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'platform' && (
                <div>
                    <form onSubmit={handlePlatformSubmit} className="card" style={{ marginBottom: '24px' }}>
                        <h3>{t('manager_dashboard.platform.title')}</h3>
                        <div className="row">
                            <input
                                className="input"
                                type="number"
                                placeholder={t('manager_dashboard.platform.qty_placeholder')}
                                value={platformForm.quantity}
                                onChange={e => setPlatformForm({ ...platformForm, quantity: e.target.value })}
                            />
                            <input
                                className="input"
                                placeholder={t('manager_dashboard.platform.note_placeholder')}
                                value={platformForm.note}
                                onChange={e => setPlatformForm({ ...platformForm, note: e.target.value })}
                            />
                            <button className="button" type="submit">{t('manager_dashboard.platform.submit')}</button>
                        </div>
                    </form>

                    <h4>{t('manager_dashboard.platform.history_title')}</h4>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('manager_dashboard.platform.table.date')}</th>
                                <th>{t('manager_dashboard.platform.table.qty')}</th>
                                <th>{t('manager_dashboard.platform.table.note')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {platformReturns.map(item => (
                                <tr key={item.id}>
                                    <td>{item.biz_date.slice(0, 10)}</td>
                                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                                    <td>{item.note}</td>
                                </tr>
                            ))}
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
                        <div>
                            <label className="label">{t('manager_dashboard.distribute.quantity_label')}</label>
                            <input className="input" type="number" value={restockForm.quantity} onChange={e => setRestockForm({ ...restockForm, quantity: e.target.value })} />
                        </div>
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
