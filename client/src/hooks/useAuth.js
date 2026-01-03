import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useAuth() {
    const { t } = useTranslation();
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
            setNotice({ type: 'error', text: t('notices.user_not_found') });
        }
    }

    const logout = () => {
        setUserId('');
        localStorage.removeItem('ledger_user_id');
        setUser(null);
    };

    return { userId, setUserId, user, notice, setNotice, loadUser, logout };
}
