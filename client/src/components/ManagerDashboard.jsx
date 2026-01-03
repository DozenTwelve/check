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
            alert('Restock dispatched!');
            setRestockForm({ factory_id: '', quantity: '', note: '' });
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div>
            <div className="tabs">
                <button className={`tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
                    Approvals
                </button>
                <button className={`tab ${activeTab === 'platform' ? 'active' : ''}`} onClick={() => setActiveTab('platform')}>
                    Hub Receipt (Platform)
                </button>
                <button className={`tab ${activeTab === 'distribute' ? 'active' : ''}`} onClick={() => setActiveTab('distribute')}>
                    Distribution (Restock)
                </button>
            </div>

            <div className="divider"></div>

            {activeTab === 'reviews' && (
                <div>
                    <h3>Pending Driver Trips</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th><th>Driver</th><th>Factory</th><th>Qty</th><th>Action</th>
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
                                        <button className="button small" onClick={() => handleApprove('trip', item.id)}>Approve</button>
                                    </td>
                                </tr>
                            ))}
                            {pendingItems.trips.length === 0 && <tr><td colSpan="5">No pending trips.</td></tr>}
                        </tbody>
                    </table>

                    <h3 style={{ marginTop: '24px' }}>Pending Clerk Reports</h3>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th><th>Clerk</th><th>Factory</th><th>Qty</th><th>Action</th>
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
                                        <button className="button small" onClick={() => handleApprove('outbound', item.id)}>Approve</button>
                                    </td>
                                </tr>
                            ))}
                            {pendingItems.outbound.length === 0 && <tr><td colSpan="5">No pending reports.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'platform' && (
                <div>
                    <form onSubmit={handlePlatformSubmit} className="card" style={{ marginBottom: '24px' }}>
                        <h3>Record Platform Return</h3>
                        <div className="row">
                            <input className="input" type="number" placeholder="Qty Received" value={platformForm.quantity} onChange={e => setPlatformForm({ ...platformForm, quantity: e.target.value })} />
                            <input className="input" placeholder="Note (Optional)" value={platformForm.note} onChange={e => setPlatformForm({ ...platformForm, note: e.target.value })} />
                            <button className="button" type="submit">Submit</button>
                        </div>
                    </form>

                    <h4>Recent History</h4>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th><th>Qty</th><th>Note</th>
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
                    <h3>Dispatch to Sub-Factory</h3>
                    <div className="row">
                        <div>
                            <label className="label">Factory</label>
                            <select className="select" value={restockForm.factory_id} onChange={e => setRestockForm({ ...restockForm, factory_id: e.target.value })}>
                                <option value="">Select Factory</option>
                                {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Quantity</label>
                            <input className="input" type="number" value={restockForm.quantity} onChange={e => setRestockForm({ ...restockForm, quantity: e.target.value })} />
                        </div>
                    </div>
                    <div className="row">
                        <input className="input" placeholder="Note (Driver name, etc.)" value={restockForm.note} onChange={e => setRestockForm({ ...restockForm, note: e.target.value })} />
                        <button className="button" type="submit">Dispatch Restock</button>
                    </div>
                </form>
            )}
        </div>
    );
}
