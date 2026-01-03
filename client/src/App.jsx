import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './utils/api';

const roleLabels = {
  driver: 'Driver',
  clerk: 'Clerk',
  manager: 'Manager',
  admin: 'Admin'
};

const verificationLevels = [
  { value: 'verbal_only', label: 'Verbal only' },
  { value: 'visual_estimate', label: 'Visual estimate' },
  { value: 'full_count', label: 'Full count' },
  { value: 'factory_directive', label: 'Factory directive' }
];

function formatDateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatDateTimeInput(date = new Date()) {
  return date.toISOString().slice(0, 16);
}

function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem('ledger_user_id') || '');
  const [user, setUser] = useState(null);
  const [notice, setNotice] = useState(null);
  const [factories, setFactories] = useState([]);
  const [consumables, setConsumables] = useState([]);
  const [dailyReturns, setDailyReturns] = useState([]);
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
    if (!userId) {
      setUser(null);
      return;
    }

    localStorage.setItem('ledger_user_id', userId);
    loadUser(userId);
  }, [userId]);

  useEffect(() => {
    if (!user) {
      return;
    }

    loadMasterData();
    loadDailyReturns();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const allowed = sections.filter((section) => section.roles.includes(user.role));
    if (allowed.length && !allowed.some((section) => section.key === activeSection)) {
      setActiveSection(allowed[0].key);
    }
  }, [sections, user, activeSection]);

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

  async function loadMasterData() {
    try {
      const [factoryData, consumableData] = await Promise.all([
        apiFetch('/factories', { userId }),
        apiFetch('/consumables', { userId })
      ]);
      setFactories(factoryData || []);
      setConsumables(consumableData || []);
    } catch (err) {
      setNotice({ type: 'error', text: 'Failed to load master data.' });
    }
  }

  async function loadDailyReturns() {
    try {
      const query = user?.factory_id ? `?factory_id=${user.factory_id}` : '';
      const data = await apiFetch(`/daily-returns${query}`, { userId });
      setDailyReturns(data || []);
    } catch (err) {
      setNotice({ type: 'error', text: 'Failed to load daily returns.' });
    }
  }

  async function handleReport(asOf, confirmedOnly) {
    try {
      const data = await apiFetch(
        `/reports/balances?as_of=${encodeURIComponent(asOf)}&confirmed_only=${confirmedOnly}`,
        { userId }
      );
      setReportRows(data || []);
    } catch (err) {
      setNotice({ type: 'error', text: 'Failed to load report rows.' });
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
              onClick={() => {
                setUserId('');
                localStorage.removeItem('ledger_user_id');
                setUser(null);
              }}
            >
              Clear
            </button>
          </div>
          {user && (
            <div className="divider"></div>
          )}
          {user && (
            <div className="notice">
              Signed in as <strong>{user.display_name}</strong> ({roleLabels[user.role]}).
            </div>
          )}
          {notice && (
            <div className={`notice ${notice.type === 'error' ? 'error' : ''}`}>{notice.text}</div>
          )}
        </section>

        <section className="card" style={{ '--delay': '120ms' }}>
          <h2>Quick Context</h2>
          <p className="subtitle">
            Master data pulled from the database. Reload after inserting new factories or consumables.
          </p>
          <div className="row">
            <div>
              <div className="tag">Factories</div>
              <p>{factories.length} available</p>
            </div>
            <div>
              <div className="tag">Consumables</div>
              <p>{consumables.length} available</p>
            </div>
          </div>
          <button className="button ghost" type="button" onClick={loadMasterData}>
            Refresh Master Data
          </button>
        </section>
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

function DailyReturnForm({ user, userId, factories, consumables, onCreated, onNotice }) {
  const [bizDate, setBizDate] = useState(formatDateInput());
  const [factoryId, setFactoryId] = useState(user?.factory_id ?? '');
  const [vLevel, setVLevel] = useState('verbal_only');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([
    { consumable_id: '', book_balance: '', declared_qty: '', discrepancy_note: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.factory_id && !factoryId) {
      setFactoryId(user.factory_id);
    }
  }, [user, factoryId]);

  function updateLine(index, field, value) {
    setLines((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { consumable_id: '', book_balance: '', declared_qty: '', discrepancy_note: '' }
    ]);
  }

  function removeLine(index) {
    setLines((prev) => prev.filter((_, lineIndex) => lineIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    onNotice(null);

    try {
      const payload = {
        biz_date: bizDate,
        factory_id: Number(factoryId),
        v_level: vLevel,
        note: note || null,
        lines: lines
          .filter((line) => line.consumable_id && line.declared_qty !== '')
          .map((line) => ({
            consumable_id: Number(line.consumable_id),
            book_balance: line.book_balance === '' ? 0 : Number(line.book_balance),
            declared_qty: Number(line.declared_qty),
            discrepancy_note: line.discrepancy_note || null
          }))
      };

      if (!payload.factory_id || payload.lines.length === 0) {
        throw new Error('Missing factory or lines');
      }

      await apiFetch('/daily-returns', {
        method: 'POST',
        body: payload,
        userId
      });

      onNotice({ type: 'success', text: 'Daily return submitted.' });
      setNote('');
      setLines([{ consumable_id: '', book_balance: '', declared_qty: '', discrepancy_note: '' }]);
      onCreated();
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to submit daily return.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div>
          <label className="label">Business Date</label>
          <input
            className="input"
            type="date"
            value={bizDate}
            onChange={(event) => setBizDate(event.target.value)}
          />
        </div>
        <div>
          <label className="label">Factory</label>
          <select
            className="select"
            value={factoryId}
            onChange={(event) => setFactoryId(event.target.value)}
          >
            <option value="">Select factory</option>
            {factories.map((factory) => (
              <option key={factory.id} value={factory.id}>
                {factory.code} - {factory.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Verification Level</label>
          <select
            className="select"
            value={vLevel}
            onChange={(event) => setVLevel(event.target.value)}
          >
            {verificationLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="divider"></div>
      <h3 className="section-title">Line Items</h3>

      {lines.map((line, index) => (
        <div className="row" key={`line-${index}`}>
          <div>
            <label className="label">Consumable</label>
            <select
              className="select"
              value={line.consumable_id}
              onChange={(event) => updateLine(index, 'consumable_id', event.target.value)}
            >
              <option value="">Select consumable</option>
              {consumables.map((consumable) => (
                <option key={consumable.id} value={consumable.id}>
                  {consumable.code} - {consumable.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Book Balance</label>
            <input
              className="input"
              type="number"
              value={line.book_balance}
              onChange={(event) => updateLine(index, 'book_balance', event.target.value)}
            />
          </div>
          <div>
            <label className="label">Declared Qty</label>
            <input
              className="input"
              type="number"
              min="0"
              value={line.declared_qty}
              onChange={(event) => updateLine(index, 'declared_qty', event.target.value)}
            />
          </div>
          <div>
            <label className="label">Discrepancy Note</label>
            <input
              className="input"
              value={line.discrepancy_note}
              onChange={(event) => updateLine(index, 'discrepancy_note', event.target.value)}
            />
          </div>
          <div>
            <label className="label">Remove</label>
            <button
              className="button secondary"
              type="button"
              onClick={() => removeLine(index)}
              disabled={lines.length === 1}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="row">
        <button className="button ghost" type="button" onClick={addLine}>
          Add Line
        </button>
        <div>
          <label className="label">Note</label>
          <textarea
            className="textarea"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>

      <div className="divider"></div>
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Daily Return'}
      </button>
    </form>
  );
}

function Confirmations({ userId, dailyReturns, onRefresh, onNotice }) {
  async function handleConfirm(id) {
    try {
      await apiFetch(`/daily-returns/${id}/confirm`, { method: 'POST', userId });
      onNotice({ type: 'success', text: `Daily return #${id} confirmed.` });
      onRefresh();
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to confirm daily return.' });
    }
  }

  return (
    <div>
      <p className="subtitle">Confirm submitted returns to lock the evidence.</p>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Biz Date</th>
            <th>Factory</th>
            <th>Status</th>
            <th>Verification</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {dailyReturns.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.id}</td>
              <td>{doc.biz_date}</td>
              <td>{doc.factory_id}</td>
              <td>{doc.status}</td>
              <td>{doc.v_level}</td>
              <td>
                {doc.status !== 'confirmed' && doc.status !== 'voided' && (
                  <button className="button" type="button" onClick={() => handleConfirm(doc.id)}>
                    Confirm
                  </button>
                )}
              </td>
            </tr>
          ))}
          {dailyReturns.length === 0 && (
            <tr>
              <td colSpan="6">No returns available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Adjustments({ userId, dailyReturns, consumables, onCreated, onNotice }) {
  const [dailyReturnId, setDailyReturnId] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([
    { consumable_id: '', delta_qty: '', reason: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  function updateLine(index, field, value) {
    setLines((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      )
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { consumable_id: '', delta_qty: '', reason: '' }]);
  }

  function removeLine(index) {
    setLines((prev) => prev.filter((_, lineIndex) => lineIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    onNotice(null);

    try {
      const payload = {
        note: note || null,
        lines: lines
          .filter((line) => line.consumable_id && line.delta_qty !== '')
          .map((line) => ({
            consumable_id: Number(line.consumable_id),
            delta_qty: Number(line.delta_qty),
            reason: line.reason || null
          }))
      };

      if (!dailyReturnId || payload.lines.length === 0) {
        throw new Error('Missing data');
      }

      await apiFetch(`/daily-returns/${dailyReturnId}/adjustments`, {
        method: 'POST',
        body: payload,
        userId
      });

      onNotice({ type: 'success', text: 'Adjustment recorded.' });
      setNote('');
      setLines([{ consumable_id: '', delta_qty: '', reason: '' }]);
      onCreated();
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to create adjustment.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div>
          <label className="label">Daily Return</label>
          <select
            className="select"
            value={dailyReturnId}
            onChange={(event) => setDailyReturnId(event.target.value)}
          >
            <option value="">Select return</option>
            {dailyReturns.map((doc) => (
              <option key={doc.id} value={doc.id}>
                #{doc.id} — {doc.biz_date} (factory {doc.factory_id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Note</label>
          <input
            className="input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>

      <div className="divider"></div>
      <h3 className="section-title">Adjustment Lines</h3>

      {lines.map((line, index) => (
        <div className="row" key={`adj-${index}`}>
          <div>
            <label className="label">Consumable</label>
            <select
              className="select"
              value={line.consumable_id}
              onChange={(event) => updateLine(index, 'consumable_id', event.target.value)}
            >
              <option value="">Select consumable</option>
              {consumables.map((consumable) => (
                <option key={consumable.id} value={consumable.id}>
                  {consumable.code} - {consumable.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Delta Qty</label>
            <input
              className="input"
              type="number"
              value={line.delta_qty}
              onChange={(event) => updateLine(index, 'delta_qty', event.target.value)}
            />
          </div>
          <div>
            <label className="label">Reason</label>
            <input
              className="input"
              value={line.reason}
              onChange={(event) => updateLine(index, 'reason', event.target.value)}
            />
          </div>
          <div>
            <label className="label">Remove</label>
            <button
              className="button secondary"
              type="button"
              onClick={() => removeLine(index)}
              disabled={lines.length === 1}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="divider"></div>
      <button className="button" type="button" onClick={addLine}>
        Add Line
      </button>
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Submit Adjustment'}
      </button>
    </form>
  );
}

function Reports({ onRun, reportRows, factories, consumables }) {
  const [asOf, setAsOf] = useState(formatDateTimeInput());
  const [confirmedOnly, setConfirmedOnly] = useState(true);

  function mapFactory(id) {
    const factory = factories.find((item) => Number(item.id) === Number(id));
    return factory ? `${factory.code}` : id;
  }

  function mapConsumable(id) {
    const consumable = consumables.find((item) => Number(item.id) === Number(id));
    return consumable ? `${consumable.code}` : id;
  }

  return (
    <div>
      <div className="row">
        <div>
          <label className="label">As-Of Timestamp</label>
          <input
            className="input"
            type="datetime-local"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
          />
        </div>
        <div>
          <label className="label">Confirmed Only</label>
          <select
            className="select"
            value={confirmedOnly ? 'true' : 'false'}
            onChange={(event) => setConfirmedOnly(event.target.value === 'true')}
          >
            <option value="true">Yes</option>
            <option value="false">Include Submitted</option>
          </select>
        </div>
        <div>
          <label className="label">Run Report</label>
          <button
            className="button"
            type="button"
            onClick={() => onRun(new Date(asOf).toISOString(), confirmedOnly)}
          >
            Fetch Balances
          </button>
        </div>
      </div>

      <div className="divider"></div>

      <table className="table">
        <thead>
          <tr>
            <th>Biz Date</th>
            <th>Factory</th>
            <th>Consumable</th>
            <th>As-of Qty</th>
          </tr>
        </thead>
        <tbody>
          {reportRows.map((row, index) => (
            <tr key={`${row.biz_date}-${row.factory_id}-${row.consumable_id}-${index}`}>
              <td>{row.biz_date}</td>
              <td>{mapFactory(row.factory_id)}</td>
              <td>{mapConsumable(row.consumable_id)}</td>
              <td>{row.as_of_qty}</td>
            </tr>
          ))}
          {reportRows.length === 0 && (
            <tr>
              <td colSpan="4">No report rows yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AdminPanel({ userId, factories, consumables, onRefresh, onNotice }) {
  const [factoryForm, setFactoryForm] = useState({ code: '', name: '' });
  const [consumableForm, setConsumableForm] = useState({ code: '', name: '', unit: 'pcs' });
  const [userForm, setUserForm] = useState({
    role: 'driver',
    username: '',
    display_name: '',
    factory_id: ''
  });

  async function createFactory(event) {
    event.preventDefault();
    try {
      await apiFetch('/factories', {
        method: 'POST',
        userId,
        body: {
          code: factoryForm.code,
          name: factoryForm.name
        }
      });
      setFactoryForm({ code: '', name: '' });
      onNotice({ type: 'success', text: 'Factory created.' });
      onRefresh();
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to create factory.' });
    }
  }

  async function createConsumable(event) {
    event.preventDefault();
    try {
      await apiFetch('/consumables', {
        method: 'POST',
        userId,
        body: {
          code: consumableForm.code,
          name: consumableForm.name,
          unit: consumableForm.unit
        }
      });
      setConsumableForm({ code: '', name: '', unit: 'pcs' });
      onNotice({ type: 'success', text: 'Consumable created.' });
      onRefresh();
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to create consumable.' });
    }
  }

  async function createUser(event) {
    event.preventDefault();
    try {
      await apiFetch('/users', {
        method: 'POST',
        userId,
        body: {
          role: userForm.role,
          username: userForm.username,
          display_name: userForm.display_name,
          factory_id: userForm.factory_id ? Number(userForm.factory_id) : null
        }
      });
      setUserForm({ role: 'driver', username: '', display_name: '', factory_id: '' });
      onNotice({ type: 'success', text: 'User created.' });
      onRefresh();
    } catch (err) {
      onNotice({ type: 'error', text: 'Failed to create user.' });
    }
  }

  return (
    <div>
      <div className="grid">
        <div>
          <h3 className="section-title">Create Factory</h3>
          <form onSubmit={createFactory}>
            <label className="label">Code</label>
            <input
              className="input"
              value={factoryForm.code}
              onChange={(event) => setFactoryForm({ ...factoryForm, code: event.target.value })}
            />
            <label className="label">Name</label>
            <input
              className="input"
              value={factoryForm.name}
              onChange={(event) => setFactoryForm({ ...factoryForm, name: event.target.value })}
            />
            <div className="divider"></div>
            <button className="button" type="submit">
              Create Factory
            </button>
          </form>
        </div>

        <div>
          <h3 className="section-title">Create Consumable</h3>
          <form onSubmit={createConsumable}>
            <label className="label">Code</label>
            <input
              className="input"
              value={consumableForm.code}
              onChange={(event) =>
                setConsumableForm({ ...consumableForm, code: event.target.value })
              }
            />
            <label className="label">Name</label>
            <input
              className="input"
              value={consumableForm.name}
              onChange={(event) =>
                setConsumableForm({ ...consumableForm, name: event.target.value })
              }
            />
            <label className="label">Unit</label>
            <input
              className="input"
              value={consumableForm.unit}
              onChange={(event) =>
                setConsumableForm({ ...consumableForm, unit: event.target.value })
              }
            />
            <div className="divider"></div>
            <button className="button" type="submit">
              Create Consumable
            </button>
          </form>
        </div>

        <div>
          <h3 className="section-title">Create User</h3>
          <form onSubmit={createUser}>
            <label className="label">Role</label>
            <select
              className="select"
              value={userForm.role}
              onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
            >
              {Object.keys(roleLabels).map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
            <label className="label">Username</label>
            <input
              className="input"
              value={userForm.username}
              onChange={(event) => setUserForm({ ...userForm, username: event.target.value })}
            />
            <label className="label">Display Name</label>
            <input
              className="input"
              value={userForm.display_name}
              onChange={(event) => setUserForm({ ...userForm, display_name: event.target.value })}
            />
            <label className="label">Factory (optional)</label>
            <select
              className="select"
              value={userForm.factory_id}
              onChange={(event) => setUserForm({ ...userForm, factory_id: event.target.value })}
            >
              <option value="">None</option>
              {factories.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.code} - {factory.name}
                </option>
              ))}
            </select>
            <div className="divider"></div>
            <button className="button" type="submit">
              Create User
            </button>
          </form>
        </div>
      </div>

      <div className="divider"></div>

      <div className="grid">
        <div>
          <h3 className="section-title">Factories</h3>
          <ul>
            {factories.map((factory) => (
              <li key={factory.id}>
                {factory.code} — {factory.name}
              </li>
            ))}
            {factories.length === 0 && <li>No factories yet.</li>}
          </ul>
        </div>
        <div>
          <h3 className="section-title">Consumables</h3>
          <ul>
            {consumables.map((consumable) => (
              <li key={consumable.id}>
                {consumable.code} — {consumable.name}
              </li>
            ))}
            {consumables.length === 0 && <li>No consumables yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
