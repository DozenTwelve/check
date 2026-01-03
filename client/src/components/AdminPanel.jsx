import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export function AdminPanel({ user, userId, factories, consumables, onRefresh, onNotice }) {
    const [activeTab, setActiveTab] = useState('sites');
    const [sites, setSites] = useState([]);
    const [users, setUsers] = useState([]);

    // Edit Mode States
    const [editingSiteId, setEditingSiteId] = useState(null);
    const [editingFactoryId, setEditingFactoryId] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editingConsumableId, setEditingConsumableId] = useState(null);

    // View Mode State
    const [isViewMode, setIsViewMode] = useState(false);

    // Forms
    const [siteForm, setSiteForm] = useState({ name: '', code: '', is_active: true, factory_ids: [] });
    const [factoryForm, setFactoryForm] = useState({ name: '', code: '', site_ids: [], is_active: true });
    const [userForm, setUserForm] = useState({ username: '', display_name: '', role: 'driver', factory_id: '', site_id: '', password: '', is_active: true });
    const [consumableForm, setConsumableForm] = useState({ name: '', code: '', unit: '', is_active: true });

    // Associated Users State
    const [currentFactoryStaff, setCurrentFactoryStaff] = useState([]);
    const [currentSiteManagers, setCurrentSiteManagers] = useState([]);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadSites();
        if (activeTab === 'users') loadUsers();
    }, [activeTab]);

    async function loadSites() {
        try {
            const data = await apiFetch('/client-sites', { userId });
            setSites(data || []);
        } catch (err) { console.error(err); }
    }

    async function loadUsers() {
        try {
            const data = await apiFetch('/users', { userId });
            setUsers(data || []);
        } catch (err) { console.error(err); }
    }

    // --- GENERIC CRUD HELPERS ---
    const handleEdit = (item, type, viewOnly = false) => {
        setIsViewMode(viewOnly);
        // Populate form based on type
        if (type === 'site') {
            setEditingSiteId(item.id);
            setSiteForm({ name: item.name, code: item.code, is_active: item.is_active, factory_ids: [] });
            // Fetch factories
            apiFetch(`/client-sites/${item.id}/factories`, { userId }).then(facts => {
                setSiteForm(prev => ({ ...prev, factory_ids: facts.map(f => f.id) }));
            });
            // Fetch managers
            apiFetch(`/client-sites/${item.id}/managers`, { userId }).then(mgrs => {
                setCurrentSiteManagers(mgrs || []);
            });
        } else if (type === 'factory') {
            setEditingFactoryId(item.id);
            setFactoryForm({ name: item.name, code: item.code, is_active: item.is_active, site_ids: [] });
            // Fetch sites
            apiFetch(`/factories/${item.id}/sites`, { userId }).then(sites => {
                setFactoryForm(prev => ({ ...prev, site_ids: sites.map(s => s.id) }));
            });
            // Fetch staff
            apiFetch(`/factories/${item.id}/staff`, { userId }).then(staff => {
                setCurrentFactoryStaff(staff || []);
            });
        } else if (type === 'user') {
            setEditingUserId(item.id);
            setUserForm({
                username: item.username, display_name: item.display_name,
                role: item.role, factory_id: item.factory_id || '', site_id: item.site_id || '',
                password: '', // Don't show hash
                is_active: item.is_active
            });
        } else if (type === 'consumable') {
            setEditingConsumableId(item.id);
            setConsumableForm({ name: item.name, code: item.code, unit: item.unit, is_active: item.is_active });
        }
    };

    const handleCancel = () => {
        setIsViewMode(false);
        setEditingSiteId(null); setSiteForm({ name: '', code: '', is_active: true, factory_ids: [] }); setCurrentSiteManagers([]);
        setEditingFactoryId(null); setFactoryForm({ name: '', code: '', site_ids: [], is_active: true }); setCurrentFactoryStaff([]);
        setEditingUserId(null); setUserForm({ username: '', display_name: '', role: 'driver', factory_id: '', site_id: '', password: '', is_active: true });
        setEditingConsumableId(null); setConsumableForm({ name: '', code: '', unit: '', is_active: true });
    };

    const handleDelete = async (id, endpoint, refresh) => {
        if (!isAdmin) return;
        if (!confirm('Are you sure? This action cannot be undone.')) return;
        try {
            await apiFetch(`${endpoint}/${id}`, { method: 'DELETE', userId });
            refresh();
            onNotice({ type: 'success', text: 'Deleted successfully' });
        } catch (err) {
            onNotice({ type: 'error', text: 'Delete failed (Item might be in use)' });
        }
    };

    // --- SUBMIT HANDLERS ---

    async function handleSiteSubmit(e) {
        e.preventDefault();
        const isEdit = !!editingSiteId;
        const url = isEdit ? `/client-sites/${editingSiteId}` : '/client-sites';
        const method = isEdit ? 'PUT' : 'POST';
        try {
            await apiFetch(url, {
                method,
                body: { ...siteForm, factory_ids: Array.from(siteForm.factory_ids).map(Number) },
                userId
            });
            handleCancel();
            loadSites();
            onRefresh(); // Refresh factories too as links changed
            onNotice({ type: 'success', text: isEdit ? 'Site updated' : 'Site created' });
        } catch (err) { onNotice({ type: 'error', text: 'Operation failed' }); }
    }

    async function handleFactorySubmit(e) {
        e.preventDefault();
        const isEdit = !!editingFactoryId;
        const url = isEdit ? `/factories/${editingFactoryId}` : '/factories';
        const method = isEdit ? 'PUT' : 'POST';
        try {
            await apiFetch(url, {
                method,
                body: { ...factoryForm, site_ids: Array.from(factoryForm.site_ids).map(Number) },
                userId
            });
            handleCancel();
            onRefresh(); // Refresh parent factories list
            onNotice({ type: 'success', text: isEdit ? 'Factory updated' : 'Factory created' });
        } catch (err) { onNotice({ type: 'error', text: 'Operation failed' }); }
    }

    async function handleUserSubmit(e) {
        e.preventDefault();
        const isEdit = !!editingUserId;
        const url = isEdit ? `/users/${editingUserId}` : '/users';
        const method = isEdit ? 'PUT' : 'POST';
        try {
            await apiFetch(url, { method, body: userForm, userId });
            handleCancel();
            loadUsers();
            onNotice({ type: 'success', text: isEdit ? 'User updated' : 'User created' });
        } catch (err) { onNotice({ type: 'error', text: 'Operation failed' }); }
    }

    async function handleConsumableSubmit(e) {
        e.preventDefault();
        const isEdit = !!editingConsumableId;
        const url = isEdit ? `/consumables/${editingConsumableId}` : '/consumables';
        const method = isEdit ? 'PUT' : 'POST';
        try {
            await apiFetch(url, { method, body: consumableForm, userId });
            handleCancel();
            onRefresh();
            onNotice({ type: 'success', text: isEdit ? 'Consumable updated' : 'Consumable created' });
        } catch (err) { onNotice({ type: 'error', text: 'Operation failed' }); }
    }

    // Helper for multi-select (Factories)
    const toggleSiteFactorySelection = (id) => {
        const current = new Set(siteForm.factory_ids);
        if (current.has(id)) current.delete(id);
        else current.add(id);
        setSiteForm({ ...siteForm, factory_ids: Array.from(current) });
    };

    // Helper for multi-select (Sites)
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
                {isAdmin && <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>}
                {isAdmin && <button className={`tab ${activeTab === 'consumables' ? 'active' : ''}`} onClick={() => setActiveTab('consumables')}>Consumables</button>}
            </div>
            <div className="divider"></div>

            {activeTab === 'sites' && (
                <>
                    <form onSubmit={handleSiteSubmit} className="card" style={{ borderColor: editingSiteId ? 'var(--accent)' : '' }}>
                        <h3>{isViewMode ? 'View Site' : (editingSiteId ? 'Edit Site' : 'Create Site')}</h3>
                        {(!editingSiteId && !isAdmin) ? (
                            <div className="text-muted">You do not have permission to create sites.</div>
                        ) : (
                            <div className="stack">
                                <div className="row">
                                    <input className="input" placeholder="Code" value={siteForm.code} onChange={e => setSiteForm({ ...siteForm, code: e.target.value })} required disabled={isViewMode || !isAdmin} />
                                    <input className="input" placeholder="Name" value={siteForm.name} onChange={e => setSiteForm({ ...siteForm, name: e.target.value })} required disabled={isViewMode || !isAdmin} />
                                    <label className="row"><input type="checkbox" checked={siteForm.is_active} onChange={e => setSiteForm({ ...siteForm, is_active: e.target.checked })} disabled={isViewMode || !isAdmin} /> Active</label>
                                </div>

                                <label className="label">Linked Sub-Factories</label>
                                <div className="row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                    {factories.map(f => (
                                        <label key={f.id} className="pill" style={{
                                            background: siteForm.factory_ids.includes(f.id) ? 'var(--accent)' : '#eee',
                                            color: siteForm.factory_ids.includes(f.id) ? 'white' : 'black',
                                            cursor: isViewMode || !isAdmin ? 'default' : 'pointer',
                                            opacity: isViewMode || !isAdmin ? 0.8 : 1
                                        }}>
                                            <input type="checkbox" style={{ display: 'none' }} checked={siteForm.factory_ids.includes(f.id)} onChange={() => !isViewMode && isAdmin && toggleSiteFactorySelection(f.id)} disabled={isViewMode || !isAdmin} />
                                            {f.name}
                                        </label>
                                    ))}
                                </div>

                                {editingSiteId && (
                                    <div>
                                        <label className="label">Assigned Managers</label>
                                        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                                            {currentSiteManagers.length > 0 ? currentSiteManagers.map(u => (
                                                <span key={u.id} className="tag">{u.display_name}</span>
                                            )) : <span className="text-muted">No managers assigned</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    {!isViewMode && isAdmin && <button className="button" type="submit">{editingSiteId ? 'Update' : 'Create'}</button>}
                                    {editingSiteId && <button className="button ghost" onClick={handleCancel}>{isViewMode ? 'Close' : 'Cancel'}</button>}
                                </div>
                            </div>
                        )}
                    </form>
                    <ul className="list-group">
                        {sites.map(s => (
                            <li key={s.id} className="list-item">
                                <span><strong>{s.code}</strong> - {s.name} {!s.is_active && '(Inactive)'}</span>
                                <div className="actions">
                                    <button className="button small ghost" onClick={() => handleEdit(s, 'site', true)}>View</button>
                                    {isAdmin && <button className="button small ghost" onClick={() => handleEdit(s, 'site', false)}>Edit</button>}
                                    {isAdmin && <button className="button small ghost danger" onClick={() => handleDelete(s.id, '/client-sites', loadSites)}>Delete</button>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {activeTab === 'factories' && (
                <>
                    <form onSubmit={handleFactorySubmit} className="card" style={{ borderColor: editingFactoryId ? 'var(--accent)' : '' }}>
                        <h3>{isViewMode ? 'View Factory' : (editingFactoryId ? 'Edit Factory' : 'Create Factory')}</h3>
                        {(!editingFactoryId && !isAdmin) ? (
                            <div className="text-muted">You do not have permission to create factories.</div>
                        ) : (
                            <div className="stack">
                                <div className="row">
                                    <input className="input" placeholder="Code" value={factoryForm.code} onChange={e => setFactoryForm({ ...factoryForm, code: e.target.value })} required disabled={isViewMode || !isAdmin} />
                                    <input className="input" placeholder="Name" value={factoryForm.name} onChange={e => setFactoryForm({ ...factoryForm, name: e.target.value })} required disabled={isViewMode || !isAdmin} />
                                    <label className="row"><input type="checkbox" checked={factoryForm.is_active} onChange={e => setFactoryForm({ ...factoryForm, is_active: e.target.checked })} disabled={isViewMode || !isAdmin} /> Active</label>
                                </div>

                                <label className="label">Linked Sites</label>
                                <div className="row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                    {sites.map(s => (
                                        <label key={s.id} className="pill" style={{
                                            background: factoryForm.site_ids.includes(s.id) ? 'var(--accent)' : '#eee',
                                            color: factoryForm.site_ids.includes(s.id) ? 'white' : 'black',
                                            cursor: isViewMode || !isAdmin ? 'default' : 'pointer',
                                            opacity: isViewMode || !isAdmin ? 0.8 : 1
                                        }}>
                                            <input type="checkbox" style={{ display: 'none' }} checked={factoryForm.site_ids.includes(s.id)} onChange={() => !isViewMode && isAdmin && toggleSiteSelection(s.id)} disabled={isViewMode || !isAdmin} />
                                            {s.name}
                                        </label>
                                    ))}
                                </div>

                                {editingFactoryId && (
                                    <div>
                                        <label className="label">Assigned Staff</label>
                                        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                                            {currentFactoryStaff.length > 0 ? currentFactoryStaff.map(u => (
                                                <span key={u.id} className="tag">{u.display_name} ({u.role})</span>
                                            )) : <span className="text-muted">No staff assigned</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    {!isViewMode && isAdmin && <button className="button" type="submit">{editingFactoryId ? 'Update' : 'Create'}</button>}
                                    {editingFactoryId && <button className="button ghost" onClick={handleCancel}>{isViewMode ? 'Close' : 'Cancel'}</button>}
                                </div>
                            </div>
                        )}
                    </form>
                    <ul className="list-group">
                        {factories.map(f => (
                            <li key={f.id} className="list-item">
                                <span><strong>{f.code}</strong> - {f.name}</span>
                                <div className="actions">
                                    <button className="button small ghost" onClick={() => handleEdit(f, 'factory', true)}>View</button>
                                    {isAdmin && <button className="button small ghost" onClick={() => handleEdit(f, 'factory', false)}>Edit</button>}
                                    {isAdmin && <button className="button small ghost danger" onClick={() => handleDelete(f.id, '/factories', onRefresh)}>Delete</button>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {activeTab === 'users' && (
                <>
                    <form onSubmit={handleUserSubmit} className="card" style={{ borderColor: editingUserId ? 'var(--accent)' : '' }}>
                        <h3>{editingUserId ? 'Edit User' : 'Create User'}</h3>
                        <div className="stack">
                            <div className="row">
                                <input className="input" placeholder="Username" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} required />
                                <input className="input" placeholder="Display Name" value={userForm.display_name} onChange={e => setUserForm({ ...userForm, display_name: e.target.value })} required />
                            </div>
                            <div className="row">
                                <select className="select" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                                    <option value="driver">Driver</option>
                                    <option value="clerk">Clerk</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <input className="input" type="password" placeholder={editingUserId ? "New Password (Optional)" : "Password"} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required={!editingUserId} />
                                <label className="row"><input type="checkbox" checked={userForm.is_active} onChange={e => setUserForm({ ...userForm, is_active: e.target.checked })} /> Active</label>
                            </div>

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

                            <div className="row">
                                <button className="button" type="submit">{editingUserId ? 'Update' : 'Create'}</button>
                                {editingUserId && <button className="button ghost" onClick={handleCancel}>Cancel</button>}
                            </div>
                        </div>
                    </form>
                    <ul className="list-group">
                        {users.map(u => (
                            <li key={u.id} className="list-item">
                                <span>
                                    {u.display_name} ({u.username}) <span className="pill small">{u.role}</span>
                                    {!u.is_active && <span className="pill small danger">Inactive</span>}
                                </span>
                                <div className="actions">
                                    <button className="button small ghost" onClick={() => handleEdit(u, 'user')}>Edit</button>
                                    <button className="button small ghost danger" onClick={() => handleDelete(u.id, '/users', loadUsers)}>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {activeTab === 'consumables' && (
                <>
                    <form onSubmit={handleConsumableSubmit} className="card" style={{ borderColor: editingConsumableId ? 'var(--accent)' : '' }}>
                        <h3>{editingConsumableId ? 'Edit Consumable' : 'Create Consumable'}</h3>
                        <div className="row">
                            <input className="input" placeholder="Code" value={consumableForm.code} onChange={e => setConsumableForm({ ...consumableForm, code: e.target.value })} required />
                            <input className="input" placeholder="Name" value={consumableForm.name} onChange={e => setConsumableForm({ ...consumableForm, name: e.target.value })} required />
                            <input className="input" placeholder="Unit" value={consumableForm.unit} onChange={e => setConsumableForm({ ...consumableForm, unit: e.target.value })} required />
                            <button className="button" type="submit">{editingConsumableId ? 'Update' : 'Create'}</button>
                            {editingConsumableId && <button className="button ghost" onClick={handleCancel}>Cancel</button>}
                        </div>
                    </form>
                    <ul className="list-group">
                        {consumables.map(c => (
                            <li key={c.id} className="list-item">
                                <span><strong>{c.code}</strong> - {c.name} ({c.unit})</span>
                                <div className="actions">
                                    <button className="button small ghost" onClick={() => handleEdit(c, 'consumable')}>Edit</button>
                                    <button className="button small ghost danger" onClick={() => handleDelete(c.id, '/consumables', onRefresh)}>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
