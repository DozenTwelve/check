import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

export function useAuth() {
    const [userId, setUserId] = useState(() => localStorage.getItem('ledger_user_id') || '');
    const [user, setUser] = useState(null);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (!userId) {
            setUser(null);
            return;
        }

        localStorage.setItem('ledger_user_id', userId);
        loadUser(userId);
    }, [userId]);

    async function loadUser(id) {
        try {
            const me = await apiFetch('/users/me', { userId: id });
            setUser(me);
            setNotice(null);
        } catch (err) {
            setUser(null);
            setNotice({ type: 'error', text: 'User not found. Check the ID header.' });
        }
    }

    const logout = () => {
        setUserId('');
        localStorage.removeItem('ledger_user_id');
        setUser(null);
    };

    return { userId, setUserId, user, notice, setNotice, loadUser, logout };
}
