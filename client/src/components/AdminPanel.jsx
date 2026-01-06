import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';
import { BoxCountsPanel } from './BoxCountsPanel';

export function AdminPanel({ user, userId, factories, consumables, globalBalances = {}, onRefresh, onNotice }) {
    const { t } = useTranslation();
    const getRoleLabel = (role) => {
        const label = t(`roles.${role}`);
        return label === `roles.${role}` ? role : label;
    };
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
    const [consumableForm, setConsumableForm] = useState({ name: '', code: '', unit: '', is_active: true, initial_qty: '', set_qty: '' });
    const [baselineLines, setBaselineLines] = useState([{ consumable_id: '', qty: '' }]);

    // Associated Users State
    const [currentFactoryStaff, setCurrentFactoryStaff] = useState([]);
    const [currentSiteManagers, setCurrentSiteManagers] = useState([]);

    const isAdmin = user?.role === 'admin';
    const currentConsumable = editingConsumableId
        ? consumables.find((c) => Number(c.id) === Number(editingConsumableId))
        : null;
    const currentConsumableQty = editingConsumableId
        ? (globalBalances[Number(editingConsumableId)] ?? 0)
        : null;

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
            const initialSiteIds = Array.isArray(item.site_ids)
                ? item.site_ids.map((id) => Number(id)).filter(Number.isInteger)
                : [];
            setFactoryForm({
                name: item.name,
                code: item.code,
                is_active: item.is_active,
                site_ids: initialSiteIds
            });
            setBaselineLines([{ consumable_id: '', qty: '' }]);
            apiFetch(`/factories/${item.id}/sites`, { userId }).then((factorySites) => {
                if (Array.isArray(factorySites)) {
                    setFactoryForm((prev) => ({
                        ...prev,
                        site_ids: factorySites.map((site) => site.id)
                    }));
                }
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
            setConsumableForm({ name: item.name, code: item.code, unit: item.unit, is_active: item.is_active, initial_qty: '', set_qty: '' });
        }
    };

    const handleCancel = () => {
        setIsViewMode(false);
        setEditingSiteId(null); setSiteForm({ name: '', code: '', is_active: true, factory_ids: [] }); setCurrentSiteManagers([]);
        setEditingFactoryId(null); setFactoryForm({ name: '', code: '', site_ids: [], is_active: true }); setCurrentFactoryStaff([]);
        setEditingUserId(null); setUserForm({ username: '', display_name: '', role: 'driver', factory_id: '', site_id: '', password: '', is_active: true });
        setEditingConsumableId(null); setConsumableForm({ name: '', code: '', unit: '', is_active: true, initial_qty: '', set_qty: '' });
        setBaselineLines([{ consumable_id: '', qty: '' }]);
    };

    const handleDelete = async (id, endpoint, refresh) => {
        if (!isAdmin) return;
        if (!confirm(t('admin.confirm_delete'))) return;
        try {
            await apiFetch(`${endpoint}/${id}`, { method: 'DELETE', userId });
            refresh();
            onNotice({ type: 'success', text: t('admin.notices.delete_success') });
        } catch (err) {
            onNotice({ type: 'error', text: t('admin.notices.delete_error') });
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
            onNotice({
                type: 'success',
                text: isEdit ? t('admin.notices.site_updated') : t('admin.notices.site_created')
            });
        } catch (err) { onNotice({ type: 'error', text: t('admin.notices.operation_failed') }); }
    }

    async function handleFactorySubmit(e) {
        e.preventDefault();
        const isEdit = !!editingFactoryId;
        const url = isEdit ? `/factories/${editingFactoryId}` : '/factories';
        const method = isEdit ? 'PUT' : 'POST';
        try {
            const payloadSiteIds = (factoryForm.site_ids || [])
                .map((id) => Number(id))
                .filter((id) => Number.isInteger(id));
            const payloadLines = baselineLines
                .filter((line) => line.consumable_id && line.qty !== '')
                .map((line) => ({
                    consumable_id: Number(line.consumable_id),
                    qty: Number(line.qty)
                }))
                .filter((line) => Number.isInteger(line.consumable_id) && line.qty > 0);

            await apiFetch(url, {
                method,
                body: {
                    code: factoryForm.code,
                    name: factoryForm.name,
                    is_active: factoryForm.is_active,
                    site_ids: payloadSiteIds,
                    baseline_lines: isEdit ? undefined : payloadLines
                },
                userId
            });
            handleCancel();
            onRefresh(); // Refresh parent factories list
            onNotice({
                type: 'success',
                text: isEdit ? t('admin.notices.factory_updated') : t('admin.notices.factory_created')
            });
        } catch (err) { onNotice({ type: 'error', text: t('admin.notices.operation_failed') }); }
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
            onNotice({
                type: 'success',
                text: isEdit ? t('admin.notices.user_updated') : t('admin.notices.user_created')
            });
        } catch (err) { onNotice({ type: 'error', text: t('admin.notices.operation_failed') }); }
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
            onNotice({
                type: 'success',
                text: isEdit ? t('admin.notices.consumable_updated') : t('admin.notices.consumable_created')
            });
        } catch (err) { onNotice({ type: 'error', text: t('admin.notices.operation_failed') }); }
    }

    // Helper for multi-select (Factories)
    const toggleSiteFactorySelection = (id) => {
        const current = new Set(siteForm.factory_ids);
        if (current.has(id)) current.delete(id);
        else current.add(id);
        setSiteForm({ ...siteForm, factory_ids: Array.from(current) });
    };

    const toggleFactorySiteSelection = (id) => {
        const current = new Set(factoryForm.site_ids);
        if (current.has(id)) current.delete(id);
        else current.add(id);
        setFactoryForm({ ...factoryForm, site_ids: Array.from(current) });
    };

    function updateBaselineLine(index, field, value) {
        setBaselineLines((prev) =>
            prev.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line
            )
        );
    }

    function addBaselineLine() {
        setBaselineLines((prev) => [...prev, { consumable_id: '', qty: '' }]);
    }

    function removeBaselineLine(index) {
        setBaselineLines((prev) => prev.filter((_, lineIndex) => lineIndex !== index));
    }

    return (
        <div>
            <div className="tabs">
                <button className={`tab ${activeTab === 'sites' ? 'active' : ''}`} onClick={() => setActiveTab('sites')}>
                    {t('admin.tabs.sites')}
                </button>
                <button className={`tab ${activeTab === 'factories' ? 'active' : ''}`} onClick={() => setActiveTab('factories')}>
                    {t('admin.tabs.factories')}
                </button>
                {isAdmin && (
                    <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        {t('admin.tabs.users')}
                    </button>
                )}
                {isAdmin && (
                    <button className={`tab ${activeTab === 'consumables' ? 'active' : ''}`} onClick={() => setActiveTab('consumables')}>
                        {t('admin.tabs.consumables')}
                    </button>
                )}
            </div>
            <div className="divider"></div>

            {activeTab === 'sites' && (
                <>
                    <form onSubmit={handleSiteSubmit} className="card" style={{ borderColor: editingSiteId ? 'var(--accent)' : '' }}>
                        <h3>
                            {isViewMode
                                ? t('admin.titles.view_site')
                                : (editingSiteId ? t('admin.titles.edit_site') : t('admin.titles.create_site'))}
                        </h3>
                        {(!editingSiteId && !isAdmin) ? (
                            <div className="text-muted">{t('admin.permissions.sites_create')}</div>
                        ) : (
                            <div className="stack">
                                <div className="row">
                                    <input
                                        className="input"
                                        placeholder={t('admin.placeholders.code')}
                                        value={siteForm.code}
                                        onChange={e => setSiteForm({ ...siteForm, code: e.target.value })}
                                        required
                                        disabled={isViewMode || !isAdmin}
                                    />
                                    <input
                                        className="input"
                                        placeholder={t('admin.placeholders.name')}
                                        value={siteForm.name}
                                        onChange={e => setSiteForm({ ...siteForm, name: e.target.value })}
                                        required
                                        disabled={isViewMode || !isAdmin}
                                    />
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            checked={siteForm.is_active}
                                            onChange={e => setSiteForm({ ...siteForm, is_active: e.target.checked })}
                                            disabled={isViewMode || !isAdmin}
                                        /> {t('admin.labels.active')}
                                    </label>
                                </div>

                                <label className="label">{t('admin.labels.linked_factories')}</label>
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
                                        <label className="label">{t('admin.labels.assigned_managers')}</label>
                                        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                                            {currentSiteManagers.length > 0 ? currentSiteManagers.map(u => (
                                                <span key={u.id} className="tag">{u.display_name}</span>
                                            )) : <span className="text-muted">{t('admin.labels.no_managers')}</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    {!isViewMode && isAdmin && (
                                        <button className="button" type="submit">
                                            {editingSiteId ? t('admin.actions.update') : t('admin.actions.create')}
                                        </button>
                                    )}
                                    {editingSiteId && (
                                        <button className="button ghost" type="button" onClick={handleCancel}>
                                            {isViewMode ? t('admin.actions.close') : t('admin.actions.cancel')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                    <ul className="list-group">
                        {sites.map(s => (
                            <li key={s.id} className="list-item">
                                <span>
                                    <strong>{s.code}</strong> - {s.name}
                                    {!s.is_active && ` (${t('admin.status.inactive')})`}
                                </span>
                                <div className="actions">
                                    <button className="button small ghost" onClick={() => handleEdit(s, 'site', true)}>
                                        {t('admin.actions.view')}
                                    </button>
                                    {isAdmin && (
                                        <button className="button small ghost" onClick={() => handleEdit(s, 'site', false)}>
                                            {t('admin.actions.edit')}
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button className="button small ghost danger" onClick={() => handleDelete(s.id, '/client-sites', loadSites)}>
                                            {t('admin.actions.delete')}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {activeTab === 'factories' && (
                <>
                    <BoxCountsPanel
                        userId={userId}
                        title={t('box_counts.admin_title')}
                    />
                    <form onSubmit={handleFactorySubmit} className="card" style={{ borderColor: editingFactoryId ? 'var(--accent)' : '' }}>
                        <h3>
                            {isViewMode
                                ? t('admin.titles.view_factory')
                                : (editingFactoryId ? t('admin.titles.edit_factory') : t('admin.titles.create_factory'))}
                        </h3>
                        {(!editingFactoryId && !isAdmin) ? (
                            <div className="text-muted">{t('admin.permissions.factories_create')}</div>
                        ) : (
                            <div className="stack">
                                <div className="row">
                                    <input
                                        className="input"
                                        placeholder={t('admin.placeholders.code')}
                                        value={factoryForm.code}
                                        onChange={e => setFactoryForm({ ...factoryForm, code: e.target.value })}
                                        required
                                        disabled={isViewMode || !isAdmin}
                                    />
                                    <input
                                        className="input"
                                        placeholder={t('admin.placeholders.name')}
                                        value={factoryForm.name}
                                        onChange={e => setFactoryForm({ ...factoryForm, name: e.target.value })}
                                        required
                                        disabled={isViewMode || !isAdmin}
                                    />
                                    <label className="checkbox">
                                        <input
                                            type="checkbox"
                                            checked={factoryForm.is_active}
                                            onChange={e => setFactoryForm({ ...factoryForm, is_active: e.target.checked })}
                                            disabled={isViewMode || !isAdmin}
                                        /> {t('admin.labels.active')}
                                    </label>
                                </div>
                                <div>
                                    <label className="label">{t('admin.labels.linked_sites')}</label>
                                    <div className="row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                                        {sites.map((site) => (
                                            <label
                                                key={site.id}
                                                className="pill"
                                                style={{
                                                    background: factoryForm.site_ids.includes(site.id) ? 'var(--accent)' : '#eee',
                                                    color: factoryForm.site_ids.includes(site.id) ? 'white' : 'black',
                                                    cursor: isViewMode || !isAdmin ? 'default' : 'pointer',
                                                    opacity: isViewMode || !isAdmin ? 0.8 : 1
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    style={{ display: 'none' }}
                                                    checked={factoryForm.site_ids.includes(site.id)}
                                                    onChange={() => !isViewMode && isAdmin && toggleFactorySiteSelection(site.id)}
                                                    disabled={isViewMode || !isAdmin}
                                                />
                                                {site.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {!editingFactoryId && (
                                    <>
                                        <div className="divider"></div>
                                        <h4 className="section-title">{t('admin.labels.baseline_lines')}</h4>
                                        {baselineLines.map((line, index) => (
                                            <div className="row" key={`baseline-${index}`}>
                                                <div>
                                                    <label className="label">{t('admin.labels.consumable')}</label>
                                                    <select
                                                        className="select"
                                                        value={line.consumable_id}
                                                        onChange={(event) => updateBaselineLine(index, 'consumable_id', event.target.value)}
                                                        disabled={isViewMode || !isAdmin}
                                                    >
                                                        <option value="">{t('admin.placeholders.select_consumable')}</option>
                                                        {consumables.map((consumable) => (
                                                            <option key={consumable.id} value={consumable.id}>
                                                                {consumable.code} - {consumable.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="label">{t('admin.labels.qty')}</label>
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        min="0"
                                                        value={line.qty}
                                                        onChange={(event) => updateBaselineLine(index, 'qty', event.target.value)}
                                                        disabled={isViewMode || !isAdmin}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="label">{t('admin.labels.remove_line')}</label>
                                                    <button
                                                        className="button secondary"
                                                        type="button"
                                                        onClick={() => removeBaselineLine(index)}
                                                        disabled={baselineLines.length === 1 || isViewMode || !isAdmin}
                                                    >
                                                        {t('admin.labels.remove_line')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="button secondary" type="button" onClick={addBaselineLine} disabled={isViewMode || !isAdmin}>
                                            {t('admin.labels.add_line')}
                                        </button>
                                    </>
                                )}

                                {editingFactoryId && (
                                    <div>
                                        <label className="label">{t('admin.labels.assigned_staff')}</label>
                                        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                                            {currentFactoryStaff.length > 0 ? currentFactoryStaff.map(u => (
                                                <span key={u.id} className="tag">{u.display_name} ({getRoleLabel(u.role)})</span>
                                            )) : <span className="text-muted">{t('admin.labels.no_staff')}</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="row">
                                    {!isViewMode && isAdmin && (
                                        <button className="button" type="submit">
                                            {editingFactoryId ? t('admin.actions.update') : t('admin.actions.create')}
                                        </button>
                                    )}
                                    {editingFactoryId && (
                                        <button className="button ghost" type="button" onClick={handleCancel}>
                                            {isViewMode ? t('admin.actions.close') : t('admin.actions.cancel')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                    <ul className="list-group">
                        {factories.map(f => (
                            <li key={f.id} className="list-item">
                                <span><strong>{f.code}</strong> - {f.name}</span>
                                <div className="actions">
                                    <button className="button small ghost" onClick={() => handleEdit(f, 'factory', true)}>
                                        {t('admin.actions.view')}
                                    </button>
                                    {isAdmin && (
                                        <button className="button small ghost" onClick={() => handleEdit(f, 'factory', false)}>
                                            {t('admin.actions.edit')}
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button className="button small ghost danger" onClick={() => handleDelete(f.id, '/factories', onRefresh)}>
                                            {t('admin.actions.delete')}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {activeTab === 'users' && (
                <>
                    <form onSubmit={handleUserSubmit} className="card" style={{ borderColor: editingUserId ? 'var(--accent)' : '' }}>
                        <h3>{editingUserId ? t('admin.titles.edit_user') : t('admin.titles.create_user')}</h3>
                        <div className="stack">
                            <div className="row">
                                <input
                                    className="input"
                                    placeholder={t('admin.placeholders.username')}
                                    value={userForm.username}
                                    onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                                    required
                                />
                                <input
                                    className="input"
                                    placeholder={t('admin.placeholders.display_name')}
                                    value={userForm.display_name}
                                    onChange={e => setUserForm({ ...userForm, display_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="row">
                                <select className="select" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                                    <option value="driver">{t('roles.driver')}</option>
                                    <option value="clerk">{t('roles.clerk')}</option>
                                    <option value="manager">{t('roles.manager')}</option>
                                    <option value="admin">{t('roles.admin')}</option>
                                </select>
                                <input
                                    className="input"
                                    type="password"
                                    placeholder={editingUserId ? t('admin.placeholders.new_password_optional') : t('admin.placeholders.password')}
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    required={!editingUserId}
                                />
                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        checked={userForm.is_active}
                                        onChange={e => setUserForm({ ...userForm, is_active: e.target.checked })}
                                    /> {t('admin.labels.active')}
                                </label>
                            </div>

                            {userForm.role === 'manager' && (
                                <div>
                                    <label className="label">{t('admin.labels.assign_site')}</label>
                                    <select className="select" value={userForm.site_id} onChange={e => setUserForm({ ...userForm, site_id: e.target.value })}>
                                        <option value="">{t('admin.placeholders.select_site')}</option>
                                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {['driver', 'clerk'].includes(userForm.role) && (
                                <div>
                                    <label className="label">{t('admin.labels.assign_factory')}</label>
                                    <select className="select" value={userForm.factory_id} onChange={e => setUserForm({ ...userForm, factory_id: e.target.value })}>
                                        <option value="">{t('admin.placeholders.select_factory')}</option>
                                        {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="row">
                                <button className="button" type="submit">
                                    {editingUserId ? t('admin.actions.update') : t('admin.actions.create')}
                                </button>
                                {editingUserId && (
                                    <button className="button ghost" type="button" onClick={handleCancel}>{t('admin.actions.cancel')}</button>
                                )}
                            </div>
                        </div>
                    </form>
                    <ul className="list-group">
                        {users.map(u => (
                            <li key={u.id} className="list-item">
                                <span>
                                    {u.display_name} ({u.username}) <span className="pill small">{getRoleLabel(u.role)}</span>
                                    {!u.is_active && <span className="pill small danger">{t('admin.status.inactive')}</span>}
                                </span>
                                <div className="actions">
                                    <button className="button small ghost" onClick={() => handleEdit(u, 'user')}>{t('admin.actions.edit')}</button>
                                    <button className="button small ghost danger" onClick={() => handleDelete(u.id, '/users', loadUsers)}>{t('admin.actions.delete')}</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {activeTab === 'consumables' && (
                <>
                    <form onSubmit={handleConsumableSubmit} className="card" style={{ borderColor: editingConsumableId ? 'var(--accent)' : '' }}>
                        <h3>{editingConsumableId ? t('admin.titles.edit_consumable') : t('admin.titles.create_consumable')}</h3>
                        <div className="row">
                            <input
                                className="input"
                                placeholder={t('admin.placeholders.code')}
                                value={consumableForm.code}
                                onChange={e => setConsumableForm({ ...consumableForm, code: e.target.value })}
                                required
                            />
                            <input
                                className="input"
                                placeholder={t('admin.placeholders.name')}
                                value={consumableForm.name}
                                onChange={e => setConsumableForm({ ...consumableForm, name: e.target.value })}
                                required
                            />
                            <input
                                className="input"
                                placeholder={t('admin.placeholders.unit')}
                                value={consumableForm.unit}
                                onChange={e => setConsumableForm({ ...consumableForm, unit: e.target.value })}
                                required
                            />
                            {!editingConsumableId && (
                                <input
                                    className="input"
                                    type="number"
                                    min="0"
                                    placeholder={t('admin.placeholders.initial_qty')}
                                    value={consumableForm.initial_qty}
                                    onChange={e => setConsumableForm({ ...consumableForm, initial_qty: e.target.value })}
                                />
                            )}
                            {editingConsumableId && (
                                <input
                                    className="input"
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder={t('admin.placeholders.set_qty')}
                                    value={consumableForm.set_qty}
                                    onChange={e => setConsumableForm({ ...consumableForm, set_qty: e.target.value })}
                                />
                            )}
                            {editingConsumableId && (
                                <span className="tag">
                                    {t('admin.labels.current_qty')}: {currentConsumableQty}{currentConsumable?.unit ? ` ${currentConsumable.unit}` : ''}
                                </span>
                            )}
                            <button className="button" type="submit">
                                {editingConsumableId ? t('admin.actions.update') : t('admin.actions.create')}
                            </button>
                            {editingConsumableId && <button className="button ghost" type="button" onClick={handleCancel}>{t('admin.actions.cancel')}</button>}
                        </div>
                    </form>
                    <ul className="list-group">
                        {consumables.map(c => (
                            <li key={c.id} className="list-item">
                                <span>
                                    <strong>{c.code}</strong> - {c.name} ({c.unit})
                                    <span className="tag" style={{ marginLeft: '8px' }}>
                                        {t('admin.labels.qty')}: {globalBalances[c.id] ?? 0}{c.unit ? ` ${c.unit}` : ''}
                                    </span>
                                </span>
                                <div className="actions">
                                    <button className="button small ghost" onClick={() => handleEdit(c, 'consumable')}>{t('admin.actions.edit')}</button>
                                    <button className="button small ghost danger" onClick={() => handleDelete(c.id, '/consumables', onRefresh)}>{t('admin.actions.delete')}</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
