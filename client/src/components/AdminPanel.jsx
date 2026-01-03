import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

export function AdminPanel({ userId, factories, consumables, onRefresh, onNotice }) {
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
            onNotice({ type: 'success', text: 'Factory created.' });
            onRefresh();
        } catch (err) {
            onNotice({ type: 'error', text: 'Failed to create factory.' });
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
            onNotice({ type: 'success', text: 'Consumable created.' });
            onRefresh();
        } catch (err) {
            onNotice({ type: 'error', text: 'Failed to create consumable.' });
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
            onNotice({ type: 'success', text: 'User created.' });
        } catch (err) {
            onNotice({ type: 'error', text: 'Failed to create user.' });
        }
    }

    return (
        <div>
            <h3>Create Factory</h3>
            <form onSubmit={createFactory} className="row">
                <input
                    className="input"
                    placeholder="Code"
                    value={factoryForm.code}
                    onChange={(e) => setFactoryForm({ ...factoryForm, code: e.target.value })}
                />
                <input
                    className="input"
                    placeholder="Name"
                    value={factoryForm.name}
                    onChange={(e) => setFactoryForm({ ...factoryForm, name: e.target.value })}
                />
                <button className="button" type="submit">Create</button>
            </form>

            <div className="divider"></div>

            <h3>Create Consumable</h3>
            <form onSubmit={createConsumable} className="row">
                <input
                    className="input"
                    placeholder="Code"
                    value={consumableForm.code}
                    onChange={(e) => setConsumableForm({ ...consumableForm, code: e.target.value })}
                />
                <input
                    className="input"
                    placeholder="Name"
                    value={consumableForm.name}
                    onChange={(e) => setConsumableForm({ ...consumableForm, name: e.target.value })}
                />
                <input
                    className="input"
                    placeholder="Unit"
                    value={consumableForm.unit}
                    onChange={(e) => setConsumableForm({ ...consumableForm, unit: e.target.value })}
                />
                <button className="button" type="submit">Create</button>
            </form>

            <div className="divider"></div>

            <h3>Create User</h3>
            <form onSubmit={createUser} className="row">
                <select
                    className="select"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                    <option value="driver">Driver</option>
                    <option value="clerk">Clerk</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                </select>
                <input
                    className="input"
                    placeholder="Username"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                />
                <input
                    className="input"
                    placeholder="Display Name"
                    value={userForm.display_name}
                    onChange={(e) => setUserForm({ ...userForm, display_name: e.target.value })}
                />
                <select
                    className="select"
                    value={userForm.factory_id}
                    onChange={(e) => setUserForm({ ...userForm, factory_id: e.target.value })}
                >
                    <option value="">No Factory</option>
                    {factories.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button className="button" type="submit">Create</button>
            </form>
        </div>
    );
}
