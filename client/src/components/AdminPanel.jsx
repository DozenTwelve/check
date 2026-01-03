import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function AdminPanel({ userId, factories, consumables, onRefresh, onNotice }) {
    const { t } = useTranslation();

    const [factoryForm, setFactoryForm] = useState({ code: '', name: '' });
    const [consumableForm, setConsumableForm] = useState({ code: '', name: '', unit: 'pcs' });
    const [userForm, setUserForm] = useState({
        role: 'driver',
        username: '',
        display_name: '',
        factory_id: ''
    });

    async function createFactory(event) {
        event.preventDefault();
        try {
            await apiFetch('/factories', {
                method: 'POST',
                userId,
                body: {
                    code: factoryForm.code,
                    name: factoryForm.name
                }
            });
            setFactoryForm({ code: '', name: '' });
            onNotice({ type: 'success', text: t('notices.factory_created') });
            onRefresh();
        } catch (err) {
            onNotice({ type: 'error', text: t('notices.factory_error') });
        }
    }

    async function createConsumable(event) {
        event.preventDefault();
        try {
            await apiFetch('/consumables', {
                method: 'POST',
                userId,
                body: {
                    code: consumableForm.code,
                    name: consumableForm.name,
                    unit: consumableForm.unit
                }
            });
            setConsumableForm({ code: '', name: '', unit: 'pcs' });
            onNotice({ type: 'success', text: t('notices.consumable_created') });
            onRefresh();
        } catch (err) {
            onNotice({ type: 'error', text: t('notices.consumable_error') });
        }
    }

    async function createUser(event) {
        event.preventDefault();
        try {
            await apiFetch('/users', {
                method: 'POST',
                userId,
                body: {
                    role: userForm.role,
                    username: userForm.username,
                    display_name: userForm.display_name,
                    factory_id: userForm.factory_id ? Number(userForm.factory_id) : null
                }
            });
            setUserForm({ role: 'driver', username: '', display_name: '', factory_id: '' });
            onNotice({ type: 'success', text: t('notices.user_created') });
        } catch (err) {
            onNotice({ type: 'error', text: t('notices.user_error') });
        }
    }

    return (
        <div>
            <h3>{t('admin.create_factory')}</h3>
            <form onSubmit={createFactory} className="row">
                <input
                    className="input"
                    placeholder={t('admin.placeholders.code')}
                    value={factoryForm.code}
                    onChange={(e) => setFactoryForm({ ...factoryForm, code: e.target.value })}
                />
                <input
                    className="input"
                    placeholder={t('admin.placeholders.name')}
                    value={factoryForm.name}
                    onChange={(e) => setFactoryForm({ ...factoryForm, name: e.target.value })}
                />
                <button className="button" type="submit">{t('admin.buttons.create')}</button>
            </form>

            <div className="divider"></div>

            <h3>{t('admin.create_consumable')}</h3>
            <form onSubmit={createConsumable} className="row">
                <input
                    className="input"
                    placeholder={t('admin.placeholders.code')}
                    value={consumableForm.code}
                    onChange={(e) => setConsumableForm({ ...consumableForm, code: e.target.value })}
                />
                <input
                    className="input"
                    placeholder={t('admin.placeholders.name')}
                    value={consumableForm.name}
                    onChange={(e) => setConsumableForm({ ...consumableForm, name: e.target.value })}
                />
                <input
                    className="input"
                    placeholder={t('admin.placeholders.unit')}
                    value={consumableForm.unit}
                    onChange={(e) => setConsumableForm({ ...consumableForm, unit: e.target.value })}
                />
                <button className="button" type="submit">{t('admin.buttons.create')}</button>
            </form>

            <div className="divider"></div>

            <h3>{t('admin.create_user')}</h3>
            <form onSubmit={createUser} className="row">
                <select
                    className="select"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                    <option value="driver">{t('admin.roles.driver')}</option>
                    <option value="clerk">{t('admin.roles.clerk')}</option>
                    <option value="manager">{t('admin.roles.manager')}</option>
                    <option value="admin">{t('admin.roles.admin')}</option>
                </select>
                <input
                    className="input"
                    placeholder={t('admin.placeholders.username')}
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                />
                <input
                    className="input"
                    placeholder={t('admin.placeholders.display_name')}
                    value={userForm.display_name}
                    onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })}
                />
                <select
                    className="select"
                    value={userForm.factory_id}
                    onChange={(e) => setUserForm({ ...userForm, factory_id: e.target.value })}
                >
                    <option value="">{t('admin.placeholders.no_factory')}</option>
                    {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button className="button" type="submit">{t('admin.buttons.create')}</button>
            </form>
        </div>
    );
}
