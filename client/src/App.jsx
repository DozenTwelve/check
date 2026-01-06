import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { apiFetch } from './utils/api';

import { useAuth } from './hooks/useAuth';
import { useMasterData } from './hooks/useMasterData';
import { useDailyReturns } from './hooks/useDailyReturns';
import { useTranslation } from './hooks/useTranslation';

import { LanguageProvider } from './contexts/LanguageContext';

import { SessionControl } from './components/SessionControl';
import { MasterDataSummary } from './components/MasterDataSummary';
import { TripEntryForm } from './components/TripEntryForm';
import { ManagerDashboard } from './components/ManagerDashboard';
import { Adjustments } from './components/Adjustments';
import { Reports } from './components/Reports';
import { AdminPanel } from './components/AdminPanel';
import { LoginPage } from './components/LoginPage';
import { BoxCountsPanel } from './components/BoxCountsPanel';

function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = useCallback((nextPath) => {
    if (nextPath === window.location.pathname) {
      return;
    }
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
  }, []);

  return { path, navigate };
}

function NoticeBanner({ notice }) {
  if (!notice) return null;
  return (
    <div className={`notice ${notice.type === 'error' ? 'error' : ''}`}>{notice.text}</div>
  );
}

function AppContent() {
  const {
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
  } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { path, navigate } = useRoute();

  const { factories, consumables, inventorySummary, loadMasterData } = useMasterData(user, userId, setNotice);
  const { dailyReturns, loadDailyReturns } = useDailyReturns(user, userId, setNotice);

  const [reportRows, setReportRows] = useState([]);
  const [activeSection, setActiveSection] = useState('trips');
  const [managerTab, setManagerTab] = useState('approvals');

  const sections = useMemo(
    () => [
      { key: 'trips', label: t('nav.trips'), roles: ['driver'] },
      { key: 'approvals', label: t('nav.approvals'), roles: ['manager', 'admin'] },
      { key: 'adjust', label: t('nav.adjustments'), roles: ['manager', 'admin'] },
      { key: 'report', label: t('nav.reports'), roles: ['manager', 'admin'] },
      { key: 'admin', label: t('nav.master_data'), roles: ['admin'] }
    ],
    [t]
  );

  useEffect(() => {
    const normalized = path === '/' ? '/login' : path;
    let target = normalized;

    if (!authUser) {
      target = '/login';
    } else if (authUser.role === 'admin') {
      target = '/admin';
    } else {
      target = '/ops';
    }

    if (target !== normalized) {
      navigate(target);
    }
  }, [authUser, path, navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const allowed = sections.filter((section) => section.roles.includes(user.role));
    if (allowed.length && !allowed.some((section) => section.key === activeSection)) {
      setActiveSection(allowed[0].key);
    }
  }, [sections, user, activeSection]);

  async function handleReport(asOf, confirmedOnly, locationType) {
    try {
      const data = await apiFetch(
        `/reports/balances?as_of=${encodeURIComponent(asOf)}&confirmed_only=${confirmedOnly}&location_type=${encodeURIComponent(locationType || 'factory')}`,
        { userId }
      );
      setReportRows(data || []);
    } catch (err) {
      if (setNotice) setNotice({ type: 'error', text: t('notices.report_error') });
    }
  }

  async function handleLogin(username, password) {
    const me = await login(username, password);
    if (!me) return;
    navigate(me.role === 'admin' ? '/admin' : '/ops');
  }

  const availableSections = user
    ? sections.filter((section) => section.roles.includes(user.role))
    : [];

  const opsSubtitleKey = user ? `ops.subtitle.${user.role}` : 'ops.subtitle.default';
  const opsSubtitle = t(opsSubtitleKey);
  const opsSubtitleText = opsSubtitle.startsWith('ops.subtitle')
    ? t('ops.subtitle.default')
    : opsSubtitle;

  if (!authUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loading={loading}
        notice={notice}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  if (authUser.role === 'admin') {
    return (
      <div className="app">
        <header className="header">
          <h1 className="title">{t('app.title')}</h1>
          <p className="subtitle">{t('app.subtitle')}</p>
          <div className="status-bar">
            <button
              className="pill button ghost small"
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }}
              type="button"
            >
              <strong>{language === 'en' ? 'EN' : '中文'}</strong>
            </button>

            <span className="pill">
              {t('app.api_label')} <strong>{user ? t('app.api_connected') : t('app.api_offline')}</strong>
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
            <button
              className="pill button ghost small"
              type="button"
              onClick={logout}
            >
              {t('common.logout')}
            </button>
          </div>
        </header>

        <div className="grid">
        <SessionControl
          userIdInput={userIdInput}
          setUserIdInput={setUserIdInput}
          loadUser={loadUser}
          user={user}
          onClear={() => loadUser('')}
          notice={notice}
        />

          <MasterDataSummary
            factories={factories}
            consumables={consumables}
            inventorySummary={inventorySummary}
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

            {activeSection === 'trips' && user.role === 'driver' && (
              <TripEntryForm
                user={user}
                userId={userId}
                factories={factories}
                consumables={consumables}
                onNotice={setNotice}
              />
            )}
            {activeSection === 'trips' && user.role !== 'driver' && (
              <div className="notice">{t('app.select_role_workspace')}</div>
            )}
            {activeSection === 'approvals' && (
              <ManagerDashboard
                user={user}
                userId={userId}
                factories={factories}
                consumables={consumables}
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
                  userId={userId}
                  onRun={handleReport}
                  reportRows={reportRows}
                  factories={factories}
                  consumables={consumables}
                />
            )}
            {activeSection === 'admin' && (
              <AdminPanel
                user={user}
                userId={userId}
                factories={factories}
                consumables={consumables}
                inventorySummary={inventorySummary}
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

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">{t('app.title')}</h1>
        <p className="subtitle">{opsSubtitleText}</p>
        <div className="status-bar">
          <button
            className="pill button ghost small"
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }}
            type="button"
          >
            <strong>{language === 'en' ? 'EN' : '中文'}</strong>
          </button>
          {user && (
            <span className="pill">
              {t('common.signed_in_as')} <strong>{user.display_name}</strong> ({t(`roles.${user.role}`)})
            </span>
          )}
          {user?.factory_id && (
            <span className="pill">
              {t('app.factory')} <strong>#{user.factory_id}</strong>
            </span>
          )}
          <button
            className="pill button ghost small"
            type="button"
            onClick={logout}
          >
            {t('common.logout')}
          </button>
        </div>
      </header>

      <NoticeBanner notice={notice} />

      {user?.role === 'driver' && (
        <TripEntryForm
          user={user}
          userId={userId}
          factories={factories}
          consumables={consumables}
          onNotice={setNotice}
        />
      )}

      {user?.role === 'clerk' && (
        <section className="card" style={{ '--delay': '120ms' }}>
          <div className="notice">{t('app.clerk_disabled')}</div>
        </section>
      )}

      {user?.role === 'manager' && (
        <>
          <BoxCountsPanel
            userId={userId}
            title={t('box_counts.manager_title')}
          />
          <section className="card" style={{ '--delay': '120ms' }}>
            <h2 className="section-title">{t('ops.manager.title')}</h2>
            <div className="tabs">
              <button
                type="button"
                className={`tab ${managerTab === 'approvals' ? 'active' : ''}`}
                onClick={() => setManagerTab('approvals')}
              >
                {t('ops.manager.tabs.approvals')}
              </button>
              <button
                type="button"
                className={`tab ${managerTab === 'adjustments' ? 'active' : ''}`}
                onClick={() => setManagerTab('adjustments')}
              >
                {t('ops.manager.tabs.adjustments')}
              </button>
              <button
                type="button"
                className={`tab ${managerTab === 'reports' ? 'active' : ''}`}
                onClick={() => setManagerTab('reports')}
              >
                {t('ops.manager.tabs.reports')}
              </button>
            </div>

            <div className="divider"></div>

            {managerTab === 'approvals' && (
              <ManagerDashboard
                user={user}
                userId={userId}
                factories={factories}
                consumables={consumables}
              />
            )}
            {managerTab === 'adjustments' && (
              <Adjustments
                userId={userId}
                dailyReturns={dailyReturns}
                consumables={consumables}
                onCreated={loadDailyReturns}
                onNotice={setNotice}
              />
            )}
            {managerTab === 'reports' && (
                <Reports
                  userId={userId}
                  onRun={handleReport}
                  reportRows={reportRows}
                  factories={factories}
                  consumables={consumables}
                />
            )}
          </section>
        </>
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
