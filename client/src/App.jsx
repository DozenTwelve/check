import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './utils/api';

import { useAuth } from './hooks/useAuth';
import { useMasterData } from './hooks/useMasterData';
import { useDailyReturns } from './hooks/useDailyReturns';
import { useTranslation } from './hooks/useTranslation';

import { LanguageProvider } from './contexts/LanguageContext';

import { SessionControl } from './components/SessionControl';
import { MasterDataSummary } from './components/MasterDataSummary';
import { DailyReturnForm } from './components/DailyReturnForm';
import { TripEntryForm } from './components/TripEntryForm';
import { DailyOutboundForm } from './components/DailyOutboundForm';
import { Confirmations } from './components/Confirmations';
import { Adjustments } from './components/Adjustments';
import { Reports } from './components/Reports';
import { AdminPanel } from './components/AdminPanel';

function AppContent() {
  const { userId, setUserId, user, notice, setNotice, loadUser, logout } = useAuth();
  const { factories, consumables, loadMasterData } = useMasterData(user, userId, setNotice);
  const { dailyReturns, loadDailyReturns } = useDailyReturns(user, userId, setNotice);

  const { t, language, setLanguage } = useTranslation();

  const [reportRows, setReportRows] = useState([]);
  const [activeSection, setActiveSection] = useState('daily');

  const sections = useMemo(
    () => [
      { key: 'daily', label: t('nav.daily_returns'), roles: ['driver', 'clerk'] },
      { key: 'confirm', label: t('nav.confirmations'), roles: ['manager'] },
      { key: 'adjust', label: t('nav.adjustments'), roles: ['clerk', 'manager'] },
      { key: 'report', label: t('nav.reports'), roles: ['manager', 'admin'] },
      { key: 'admin', label: t('nav.master_data'), roles: ['admin'] }
    ],
    [t]
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
      if (setNotice) setNotice({ type: 'error', text: t('notices.report_error') });
    }
  }

  const availableSections = user
    ? sections.filter((section) => section.roles.includes(user.role))
    : [];

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">{t('app.title')}</h1>
        <p className="subtitle">
          {t('app.subtitle')}
        </p>
        <div className="status-bar">
          <button
            className="pill button ghost small"
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }}
          >
            <strong>{language === 'en' ? 'EN' : '中文'}</strong>
          </button>

          <span className="pill">
            API <strong>{user ? t('app.api_connected') : t('app.api_offline')}</strong>
          </span>
          {user && (
            <span className="pill">
              {t('app.role')} <strong>{t(`roles.${user.role}`)}</strong>
            </span>
          )}
          {user?.factory_id && (
            <span className="pill">
              {t('app.factory')} <strong>#{user.factory_id}</strong>
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
          <h2 className="section-title">{t('components.role_workspace.title')}</h2>
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

          {activeSection === 'daily' && user.role === 'driver' && (
            <TripEntryForm
              user={user}
              userId={userId}
              factories={factories}
              onNotice={setNotice}
            />
          )}
          {activeSection === 'daily' && user.role === 'clerk' && (
            <DailyOutboundForm
              user={user}
              userId={userId}
              factories={factories}
              onNotice={setNotice}
            />
          )}
          {activeSection === 'daily' && !['driver', 'clerk'].includes(user.role) && (
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

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
