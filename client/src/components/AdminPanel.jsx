import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export function AdminPanel({ userId, factories, consumables, onRefresh, onNotice }) {
    const [activeTab, setActiveTab] = useState('sites');
    const [sites, setSites] = useState([]);

    // Forms
    const [siteForm, setSiteForm] = useState({ name: '', code: '' });
    const [factoryForm, setFactoryForm] = useState({ name: '', code: '', site_ids: [] }); // site_ids array
    const [userForm, setUserForm] = useState({ username: '', display_name: '', role: 'driver', factory_id: '', site_id: '', password: '' });
    const [consumableForm, setConsumableForm] = useState({ name: '', code: '', unit: '' });

    useEffect(() => {
        loadSites();
    }, []);

    async function loadSites() {
        try {
            const data = await apiFetch('/client-sites', { userId });
            setSites(data || []);
        } catch (err) { console.error(err); }
    }

    async function handleCreateSite(e) {
        e.preventDefault();
        try {
            await apiFetch('/client-sites', {
                method: 'POST',
                body: siteForm,
                userId
            });
            setSiteForm({ name: '', code: '' });
            loadSites();
            onNotice({ type: 'success', text: 'Site created' });
        } catch (err) {
            onNotice({ type: 'error', text: 'Failed to create site' });
        }
    }

    async function handleCreateFactory(e) {
        e.preventDefault();
        try {
            await apiFetch('/factories', {
                method: 'POST',
                // Convert Set or Array to proper JSON array
                body: { ...factoryForm, site_ids: Array.from(factoryForm.site_ids).map(Number) },
                userId
            });
            setFactoryForm({ name: '', code: '', site_ids: [] });
            onRefresh(); // Reload factories in parent
            onNotice({ type: 'success', text: 'Factory created' });
        } catch (err) {
            onNotice({ type: 'error', text: 'Failed to create factory' });
        }
    }

    async function handleCreateUser(e) {
        e.preventDefault();
        try {
            await apiFetch('/users', {
                method: 'POST',
                body: userForm,
                userId
            });
            setUserForm({ ...userForm, username: '' });
            onNotice({ type: 'success', text: 'User created' });
        } catch (err) {
            console.error(err);
            onNotice({ type: 'error', text: 'Failed to create user' });
        }
    }

    // Helper for multi-select
    const toggleSiteSelection = (id) => {
        const current = new Set(factoryForm.site_ids);
        if (current.has(id)) current.delete(id);
        else current.add(id);
        setFactoryForm({ ...factoryForm, site_ids: Array.from(current) });
    };

    return (
        <div>
            <div className="tabs">
                <button className={`tab ${activeTab === 'sites' ? 'active' : ''}`} onClick={() => setActiveTab('sites')}>Sites</button>
                <button className={`tab ${activeTab === 'factories' ? 'active' : ''}`} onClick={() => setActiveTab('factories')}>Factories</button>
                <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
                <button className={`tab ${activeTab === 'consumables' ? 'active' : ''}`} onClick={() => setActiveTab('consumables')}>Consumables</button>
            </div>
            <div className="divider"></div>

            {activeTab === 'sites' && (
                <form onSubmit={handleCreateSite} className="card">
                    <h3>Create Customer Site (Hub)</h3>
                    <div className="row">
                        <input className="input" placeholder="Site Code (e.g. S-01)" value={siteForm.code} onChange={e => setSiteForm({ ...siteForm, code: e.target.value })} />
                        <input className="input" placeholder="Site Name" value={siteForm.name} onChange={e => setSiteForm({ ...siteForm, name: e.target.value })} />
                        <button className="button" type="submit">Create Site</button>
                    </div>
                    <h4>Existing Sites</h4>
                    <ul>{sites.map(s => <li key={s.id}>{s.code} - {s.name}</li>)}</ul>
                </form>
            )}

            {activeTab === 'factories' && (
                <form onSubmit={handleCreateFactory} className="card">
                    <h3>Create Sub-Factory</h3>
                    <div className="stack">
                        <input className="input" placeholder="Factory Code" value={factoryForm.code} onChange={e => setFactoryForm({ ...factoryForm, code: e.target.value })} />
                        <input className="input" placeholder="Factory Name" value={factoryForm.name} onChange={e => setFactoryForm({ ...factoryForm, name: e.target.value })} />

                        <label className="label">Linked Sites (Select multiple)</label>
                        <div className="row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            {sites.map(s => (
                                <label key={s.id} className="pill" style={{
                                    background: factoryForm.site_ids.includes(s.id) ? 'var(--accent)' : '#eee',
                                    color: factoryForm.site_ids.includes(s.id) ? 'white' : 'black',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="checkbox"
                                        style={{ display: 'none' }}
                                        checked={factoryForm.site_ids.includes(s.id)}
                                        onChange={() => toggleSiteSelection(s.id)}
                                    />
                                    {s.name}
                                </label>
                            ))}
                        </div>

                        <button className="button" type="submit">Create Factory</button>
                    </div>
                    <h4>Existing Factories</h4>
                    <ul>{factories.map(f => <li key={f.id}>{f.code} - {f.name}</li>)}</ul>
                </form>
            )}

            {activeTab === 'users' && (
                <form onSubmit={handleCreateUser} className="card">
                    <h3>Create User</h3>
                    <div className="stack">
                        <div className="row">
                            <input className="input" placeholder="Username" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} />
                            <input className="input" placeholder="Display Name" value={userForm.display_name} onChange={e => setUserForm({ ...userForm, display_name: e.target.value })} />
                        </div>
                        <div className="row">
                            <select className="select" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                                <option value="driver">Driver</option>
                                <option value="clerk">Clerk</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                            <input className="input" type="password" placeholder="Password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                        </div>

                        {/* Dynamic Logic: Manager needs Site, Driver/Clerk needs Factory */}
                        {userForm.role === 'manager' && (
                            <div>
                                <label className="label">Assign to Site</label>
                                <select className="select" value={userForm.site_id} onChange={e => setUserForm({ ...userForm, site_id: e.target.value })}>
                                    <option value="">-- Select Site --</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}

                        {['driver', 'clerk'].includes(userForm.role) && (
                            <div>
                                <label className="label">Assign to Factory</label>
                                <select className="select" value={userForm.factory_id} onChange={e => setUserForm({ ...userForm, factory_id: e.target.value })}>
                                    <option value="">-- Select Factory --</option>
                                    {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                        )}

                        <button className="button" type="submit">Create User</button>
                    </div>
                </form>
            )}

            {activeTab === 'consumables' && (
                <div className="notice">Consumable management pending...</div>
            )}
        </div>
    );
}
