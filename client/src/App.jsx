import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './utils/api';
import { roleLabels } from './constants';

import { useAuth } from './hooks/useAuth';
import { useMasterData } from './hooks/useMasterData';
import { useDailyReturns } from './hooks/useDailyReturns';

import { SessionControl } from './components/SessionControl';
import { MasterDataSummary } from './components/MasterDataSummary';
import { DailyReturnForm } from './components/DailyReturnForm';
import { Confirmations } from './components/Confirmations';
import { Adjustments } from './components/Adjustments';
import { Reports } from './components/Reports';
import { AdminPanel } from './components/AdminPanel';

function App() {
  const { userId, setUserId, user, notice, setNotice, loadUser, logout } = useAuth();
  const { factories, consumables, loadMasterData } = useMasterData(user, userId, setNotice);
  const { dailyReturns, loadDailyReturns } = useDailyReturns(user, userId, setNotice);

  const [reportRows, setReportRows] = useState([]);
  const [activeSection, setActiveSection] = useState('daily');

  const sections = useMemo(
    () => [
      { key: 'daily', label: 'Daily Returns', roles: ['driver', 'clerk'] },
      { key: 'confirm', label: 'Confirmations', roles: ['manager'] },
      { key: 'adjust', label: 'Adjustments', roles: ['clerk', 'manager'] },
      { key: 'report', label: 'As-Of Report', roles: ['manager', 'admin'] },
      { key: 'admin', label: 'Master Data', roles: ['admin'] }
    ],
    []
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    const allowed = sections.filter((section) => section.roles.includes(user.role));
    if (allowed.length && !allowed.some((section) => section.key === activeSection)) {
      setActiveSection(allowed[0].key);
    }
  }, [sections, user, activeSection]);

  async function handleReport(asOf, confirmedOnly) {
    try {
      const data = await apiFetch(
        `/reports/balances?as_of=${encodeURIComponent(asOf)}&confirmed_only=${confirmedOnly}`,
        { userId }
      );
      setReportRows(data || []);
    } catch (err) {
      if (setNotice) setNotice({ type: 'error', text: 'Failed to load report rows.' });
    }
  }

  const availableSections = user
    ? sections.filter((section) => section.roles.includes(user.role))
    : [];

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">CheckingAll Ledger MVP</h1>
        <p className="subtitle">
          Rolling ledger workspace for tracking reusable consumables. Sign in with a user id to
          simulate the driver, clerk, manager, and admin workflows.
        </p>
        <div className="status-bar">
          <span className="pill">
            API <strong>{user ? 'Connected' : 'Offline'}</strong>
          </span>
          {user && (
            <span className="pill">
              Role <strong>{roleLabels[user.role]}</strong>
            </span>
          )}
          {user?.factory_id && (
            <span className="pill">
              Factory <strong>#{user.factory_id}</strong>
            </span>
          )}
        </div>
      </header>

      <div className="grid">
        <SessionControl
          userId={userId}
          setUserId={setUserId}
          loadUser={loadUser}
          user={user}
          logout={logout}
          notice={notice}
        />

        <MasterDataSummary
          factories={factories}
          consumables={consumables}
          loadMasterData={loadMasterData}
        />
      </div>

      {user && (
        <section className="card" style={{ '--delay': '220ms' }}>
          <h2 className="section-title">Role Workspace</h2>
          <div className="tabs">
            {availableSections.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`tab ${activeSection === section.key ? 'active' : ''}`}
                onClick={() => setActiveSection(section.key)}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="divider"></div>

          {activeSection === 'daily' && (
            <DailyReturnForm
              user={user}
              userId={userId}
              factories={factories}
              consumables={consumables}
              onCreated={loadDailyReturns}
              onNotice={setNotice}
            />
          )}
          {activeSection === 'confirm' && (
            <Confirmations
              userId={userId}
              dailyReturns={dailyReturns}
              onRefresh={loadDailyReturns}
              onNotice={setNotice}
            />
          )}
          {activeSection === 'adjust' && (
            <Adjustments
              userId={userId}
              dailyReturns={dailyReturns}
              consumables={consumables}
              onCreated={loadDailyReturns}
              onNotice={setNotice}
            />
          )}
          {activeSection === 'report' && (
            <Reports
              onRun={handleReport}
              reportRows={reportRows}
              factories={factories}
              consumables={consumables}
            />
          )}
          {activeSection === 'admin' && (
            <AdminPanel
              userId={userId}
              factories={factories}
              consumables={consumables}
              onRefresh={() => {
                loadMasterData();
                loadDailyReturns();
              }}
              onNotice={setNotice}
            />
          )}
        </section>
      )}
    </div>
  );
}

export default App;
