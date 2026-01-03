import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

export function SessionControl({ userIdInput, setUserIdInput, loadUser, user, logout, notice }) {
    const { t } = useTranslation();

    return (
        <section className="card" style={{ '--delay': '0ms' }}>
            <h2>{t('components.session.title')}</h2>
            <label className="label" htmlFor="userId">{t('components.session.user_id')}</label>
            <div className="row">
                <input
                    id="userId"
                    className="input"
                    placeholder={t('components.session.placeholder')}
                    value={userIdInput}
                    onChange={(event) => setUserIdInput(event.target.value)}
                />
                <button
                    className="button"
                    type="button"
                    onClick={() => loadUser(userIdInput)}
                >
                    {t('components.session.load_user')}
                </button>
                <button
                    className="button secondary"
                    type="button"
                    onClick={logout}
                >
                    {t('components.session.clear')}
                </button>
            </div>
            {user && (
                <>
                    <div className="divider"></div>
                    <div className="notice">
                        {t('components.session.signed_in_as')} <strong>{user.display_name}</strong> ({t(`roles.${user.role}`)}).
                    </div>
                </>
            )}
            {notice && (
                <div className={`notice ${notice.type === 'error' ? 'error' : ''}`}>{notice.text}</div>
            )}
        </section>
    );
}
