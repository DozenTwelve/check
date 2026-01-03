import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

export function LoginPage({ onLogin, loading, notice, language, setLanguage }) {
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();
        await onLogin(username.trim(), password);
    }

    return (
        <div className="auth-shell">
            <div className="card auth-card">
                <h1 className="title auth-title">{t('app.title')}</h1>
                <p className="subtitle">{t('app.subtitle')}</p>
                <div className="divider"></div>
                <div className="card-header">
                    <h2>{t('login.title')}</h2>
                    <button
                        className="pill button ghost small"
                        onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                        style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }}
                        type="button"
                    >
                        <strong>{language === 'en' ? 'EN' : '中文'}</strong>
                    </button>
                </div>
                <p className="subtitle">{t('login.subtitle')}</p>
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div>
                            <label className="label" htmlFor="login-username">{t('login.username')}</label>
                            <input
                                id="login-username"
                                className="input"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder={t('login.username_placeholder')}
                                autoComplete="username"
                                autoFocus
                                required
                            />
                        </div>
                        <div>
                            <label className="label" htmlFor="login-password">{t('login.password')}</label>
                            <input
                                id="login-password"
                                className="input"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder={t('login.password_placeholder')}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                    </div>
                    <div className="auth-actions">
                        <button className="button" type="submit" disabled={loading}>
                            {loading ? t('login.submitting') : t('login.submit')}
                        </button>
                        <span className="text-muted">{t('login.helper')}</span>
                    </div>
                </form>
                {notice && (
                    <div className={`notice ${notice.type === 'error' ? 'error' : ''}`}>{notice.text}</div>
                )}
            </div>
        </div>
    );
}
