import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useAuth() {
    const { t } = useTranslation();
    const [authUserId, setAuthUserId] = useState(() =>
        localStorage.getItem('ledger_auth_user_id') || ''
    );
    const [authUser, setAuthUser] = useState(null);
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState('');
    const [userIdInput, setUserIdInput] = useState('');
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        localStorage.removeItem('ledger_user_id');
    }, []);

    useEffect(() => {
        if (!authUserId) {
            setAuthUser(null);
            setUser(null);
            setUserId('');
            setUserIdInput('');
            return;
        }

        loadAuthUser(authUserId);
    }, [authUserId]);

    const setSessionUser = useCallback((sessionUser) => {
        setUser(sessionUser);
        const id = sessionUser?.id ? String(sessionUser.id) : '';
        setUserId(id);
        setUserIdInput(id);
    }, []);

    async function loadAuthUser(id) {
        try {
            setLoading(true);
            const me = await apiFetch('/users/me', { userId: id });
            setAuthUser(me);
            setSessionUser(me);
            setNotice(null);
        } catch (err) {
            setAuthUser(null);
            setSessionUser(null);
            setNotice(null);
        } finally {
            setLoading(false);
        }
    }

    async function loadUser(id) {
        if (!authUser || authUser.role !== 'admin') {
            return;
        }
        if (!id) {
            setSessionUser(authUser);
            return;
        }

        try {
            setLoading(true);
            const me = await apiFetch('/users/me', { userId: id });
            setSessionUser(me);
            setNotice(null);
        } catch (err) {
            setSessionUser(null);
            setNotice({ type: 'error', text: t('notices.user_not_found') });
        } finally {
            setLoading(false);
        }
    }

    async function login(username, password) {
        try {
            setLoading(true);
            setNotice(null);
            const me = await apiFetch('/users/login', {
                method: 'POST',
                body: { username, password }
            });
            setAuthUserId(String(me.id));
            localStorage.setItem('ledger_auth_user_id', String(me.id));
            localStorage.removeItem('ledger_user_id');
            setAuthUser(me);
            setSessionUser(me);
            setNotice(null);
            return me;
        } catch (err) {
            setNotice({ type: 'error', text: t('login.error') });
            return null;
        } finally {
            setLoading(false);
        }
    }

    const logout = () => {
        setAuthUserId('');
        localStorage.removeItem('ledger_auth_user_id');
        localStorage.removeItem('ledger_user_id');
        setAuthUser(null);
        setSessionUser(null);
        setNotice(null);
    };

    return {
        authUser,
        user,
        userId,
        userIdInput,
        setUserIdInput,
        notice,
        setNotice,
        loadUser,
        login,
        logout,
        loading
    };
}
