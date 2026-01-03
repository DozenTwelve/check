import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from './useTranslation';

export function useAuth() {
    const { t } = useTranslation();
    const [token, setToken] = useState(() => localStorage.getItem('ledger_token') || '');
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('ledger_admin_token') || '');
    const [authUser, setAuthUser] = useState(null);
    const [user, setUser] = useState(null);
    const [userIdInput, setUserIdInput] = useState('');
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(false);

    const userId = user?.id ? String(user.id) : '';

    useEffect(() => {
        localStorage.removeItem('ledger_user_id');
    }, []);

    const fetchMe = useCallback(async (tokenValue) => {
        return apiFetch('/users/me', { token: tokenValue });
    }, []);

    const setSessionUser = useCallback((sessionUser) => {
        setUser(sessionUser);
        const id = sessionUser?.id ? String(sessionUser.id) : '';
        setUserIdInput(id);
    }, []);

    useEffect(() => {
        let isMounted = true;
        if (!token) {
            setUser(null);
            setUserIdInput('');
            return () => {};
        }

        setLoading(true);
        fetchMe(token)
            .then((me) => {
                if (!isMounted) return;
                setSessionUser(me);
                setNotice(null);
            })
            .catch(() => {
                if (!isMounted) return;
                setUser(null);
                setUserIdInput('');
                setToken('');
                localStorage.removeItem('ledger_token');
            })
            .finally(() => {
                if (!isMounted) return;
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [token, fetchMe, setSessionUser]);

    useEffect(() => {
        let isMounted = true;
        if (!adminToken) {
            setAuthUser(user);
            return () => {};
        }

        fetchMe(adminToken)
            .then((me) => {
                if (!isMounted) return;
                setAuthUser(me);
            })
            .catch(() => {
                if (!isMounted) return;
                setAuthUser(null);
                setAdminToken('');
                localStorage.removeItem('ledger_admin_token');
            });

        return () => {
            isMounted = false;
        };
    }, [adminToken, user, fetchMe]);

    async function login(username, password) {
        try {
            setLoading(true);
            setNotice(null);
            const data = await apiFetch('/users/login', {
                method: 'POST',
                body: { username, password }
            });

            if (!data?.token || !data?.user) {
                throw new Error('invalid_login_response');
            }

            const nextToken = data.token;
            const me = data.user;
            setToken(nextToken);
            localStorage.setItem('ledger_token', nextToken);
            setAuthUser(me);
            setSessionUser(me);

            if (me.role === 'admin') {
                setAdminToken(nextToken);
                localStorage.setItem('ledger_admin_token', nextToken);
            } else {
                setAdminToken('');
                localStorage.removeItem('ledger_admin_token');
            }

            return me;
        } catch (err) {
            setNotice({ type: 'error', text: t('login.error') });
            return null;
        } finally {
            setLoading(false);
        }
    }

    async function loadUser(id) {
        if (!authUser || authUser.role !== 'admin' || !adminToken) {
            return;
        }
        if (!id) {
            setToken(adminToken);
            localStorage.setItem('ledger_token', adminToken);
            setSessionUser(authUser);
            return;
        }

        try {
            setLoading(true);
            setNotice(null);
            const data = await apiFetch('/users/impersonate', {
                method: 'POST',
                body: { user_id: Number(id) },
                token: adminToken
            });

            if (!data?.token || !data?.user) {
                throw new Error('invalid_impersonate_response');
            }

            setToken(data.token);
            localStorage.setItem('ledger_token', data.token);
            setSessionUser(data.user);
        } catch (err) {
            setSessionUser(null);
            setNotice({ type: 'error', text: t('notices.user_not_found') });
        } finally {
            setLoading(false);
        }
    }

    const logout = () => {
        setToken('');
        setAdminToken('');
        localStorage.removeItem('ledger_token');
        localStorage.removeItem('ledger_admin_token');
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
