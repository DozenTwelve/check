import React from 'react';

const roleLabels = {
    driver: 'Driver',
    clerk: 'Clerk',
    manager: 'Manager',
    admin: 'Admin'
};

export function SessionControl({ userId, setUserId, loadUser, user, logout, notice }) {
    return (
        <section className="card" style={{ '--delay': '0ms' }}>
            <h2>Session Control</h2>
            <label className="label" htmlFor="userId">User ID</label>
            <div className="row">
                <input
                    id="userId"
                    className="input"
                    placeholder="Enter user id"
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                />
                <button
                    className="button"
                    type="button"
                    onClick={() => loadUser(userId)}
                >
                    Load User
                </button>
                <button
                    className="button secondary"
                    type="button"
                    onClick={logout}
                >
                    Clear
                </button>
            </div>
            {user && (
                <>
                    <div className="divider"></div>
                    <div className="notice">
                        Signed in as <strong>{user.display_name}</strong> ({roleLabels[user.role]}).
                    </div>
                </>
            )}
            {notice && (
                <div className={`notice ${notice.type === 'error' ? 'error' : ''}`}>{notice.text}</div>
            )}
        </section>
    );
}
