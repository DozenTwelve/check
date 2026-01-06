import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

function formatDateTimeInput(date = new Date()) {
    return date.toISOString().slice(0, 16);
}

function formatDateInput(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

export function Reports({ onRun, reportRows, factories, consumables, userId }) {
    const { t } = useTranslation();
    const [asOf, setAsOf] = useState(formatDateTimeInput());
    const [confirmedOnly, setConfirmedOnly] = useState(true);
    const [locationType, setLocationType] = useState('factory');
    const [rangeStart, setRangeStart] = useState(formatDateInput());
    const [rangeEnd, setRangeEnd] = useState(formatDateInput());
    const [factoryNetRows, setFactoryNetRows] = useState([]);
    const [siteDebtRows, setSiteDebtRows] = useState([]);
    const [debtConsumableId, setDebtConsumableId] = useState('');

    function mapConsumable(id) {
        const consumable = consumables.find((item) => Number(item.id) === Number(id));
        return consumable ? `${consumable.code}` : id;
    }

    function mapLocation(row) {
        if (row.location_type === 'factory') {
            return row.factory_code || row.factory_id;
        }
        if (row.location_type === 'site') {
            return row.site_code || row.site_id;
        }
        return row.location_type;
    }

    async function runFactoryNet() {
        try {
            const data = await apiFetch(
                `/reports/factory-net?start=${encodeURIComponent(rangeStart)}&end=${encodeURIComponent(rangeEnd)}&confirmed_only=${confirmedOnly}`,
                { userId }
            );
            setFactoryNetRows(data || []);
        } catch (err) {
            console.error(err);
            setFactoryNetRows([]);
        }
    }

    async function runSiteDebt() {
        try {
            const query = [
                `start=${encodeURIComponent(rangeStart)}`,
                `end=${encodeURIComponent(rangeEnd)}`,
                `confirmed_only=${confirmedOnly}`
            ];
            if (debtConsumableId) {
                query.push(`consumable_id=${encodeURIComponent(debtConsumableId)}`);
            }
            const data = await apiFetch(`/reports/site-debt?${query.join('&')}`, { userId });
            setSiteDebtRows(data || []);
        } catch (err) {
            console.error(err);
            setSiteDebtRows([]);
        }
    }

    return (
        <div>
            <div className="row">
                <div>
                    <label className="label">{t('reports.as_of')}</label>
                    <input
                        className="input"
                        type="datetime-local"
                        value={asOf}
                        onChange={(event) => setAsOf(event.target.value)}
                    />
                </div>
                <div>
                    <label className="label">{t('reports.confirmed_only')}</label>
                    <select
                        className="select"
                        value={confirmedOnly ? 'true' : 'false'}
                        onChange={(event) => setConfirmedOnly(event.target.value === 'true')}
                    >
                        <option value="true">{t('reports.yes')}</option>
                        <option value="false">{t('reports.include_submitted')}</option>
                    </select>
                </div>
                <div>
                    <label className="label">{t('reports.location_type')}</label>
                    <select
                        className="select"
                        value={locationType}
                        onChange={(event) => setLocationType(event.target.value)}
                    >
                        <option value="factory">{t('reports.location_factory')}</option>
                        <option value="site">{t('reports.location_site')}</option>
                        <option value="global">{t('reports.location_global')}</option>
                        <option value="external">{t('reports.location_external')}</option>
                    </select>
                </div>
                <div>
                    <label className="label">{t('reports.run_btn')}</label>
                    <button
                        className="button"
                        type="button"
                        onClick={() => onRun(new Date(asOf).toISOString(), confirmedOnly, locationType)}
                    >
                        {t('reports.run_btn')}
                    </button>
                </div>
            </div>

            <div className="divider"></div>

            <table className="table">
                <thead>
                    <tr>
                        <th>{t('reports.table.location')}</th>
                        <th>{t('reports.table.consumable')}</th>
                        <th>{t('reports.table.qty')}</th>
                    </tr>
                </thead>
                <tbody>
                    {reportRows.map((row, index) => (
                        <tr key={`${row.location_id}-${row.consumable_id}-${index}`}>
                            <td>{mapLocation(row)}</td>
                            <td>{mapConsumable(row.consumable_id)}</td>
                            <td>{row.as_of_qty}</td>
                        </tr>
                    ))}
                    {reportRows.length === 0 && (
                        <tr>
                            <td colSpan="3">{t('reports.empty')}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="divider"></div>

            <h3 className="section-title">{t('reports.sections.factory_net')}</h3>
            <div className="row">
                <div>
                    <label className="label">{t('reports.range_start')}</label>
                    <input
                        className="input"
                        type="date"
                        value={rangeStart}
                        onChange={(event) => setRangeStart(event.target.value)}
                    />
                </div>
                <div>
                    <label className="label">{t('reports.range_end')}</label>
                    <input
                        className="input"
                        type="date"
                        value={rangeEnd}
                        onChange={(event) => setRangeEnd(event.target.value)}
                    />
                </div>
                <div>
                    <label className="label">{t('reports.run_btn')}</label>
                    <button className="button" type="button" onClick={runFactoryNet}>
                        {t('reports.run_btn')}
                    </button>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>{t('reports.table.factory')}</th>
                        <th>{t('reports.table.consumable')}</th>
                        <th>{t('reports.table.start_qty')}</th>
                        <th>{t('reports.table.end_qty')}</th>
                        <th>{t('reports.table.delta')}</th>
                    </tr>
                </thead>
                <tbody>
                    {factoryNetRows.map((row, index) => (
                        <tr key={`${row.factory_id}-${row.consumable_id}-${index}`}>
                            <td>{row.factory_code || row.factory_id}</td>
                            <td>{row.consumable_code || row.consumable_id}</td>
                            <td>{row.start_qty}</td>
                            <td>{row.end_qty}</td>
                            <td>{row.delta_qty}</td>
                        </tr>
                    ))}
                    {factoryNetRows.length === 0 && (
                        <tr>
                            <td colSpan="5">{t('reports.empty')}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div className="divider"></div>

            <h3 className="section-title">{t('reports.sections.site_debt')}</h3>
            <div className="row">
                <div>
                    <label className="label">{t('reports.range_start')}</label>
                    <input
                        className="input"
                        type="date"
                        value={rangeStart}
                        onChange={(event) => setRangeStart(event.target.value)}
                    />
                </div>
                <div>
                    <label className="label">{t('reports.range_end')}</label>
                    <input
                        className="input"
                        type="date"
                        value={rangeEnd}
                        onChange={(event) => setRangeEnd(event.target.value)}
                    />
                </div>
                <div>
                    <label className="label">{t('reports.consumable_filter')}</label>
                    <select
                        className="select"
                        value={debtConsumableId}
                        onChange={(event) => setDebtConsumableId(event.target.value)}
                    >
                        <option value="">{t('reports.all_consumables')}</option>
                        {consumables.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.code} - {item.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label">{t('reports.run_btn')}</label>
                    <button className="button" type="button" onClick={runSiteDebt}>
                        {t('reports.run_btn')}
                    </button>
                </div>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>{t('reports.table.date')}</th>
                        <th>{t('reports.table.site')}</th>
                        <th>{t('reports.table.consumable')}</th>
                        <th>{t('reports.table.qty')}</th>
                    </tr>
                </thead>
                <tbody>
                    {siteDebtRows.map((row, index) => (
                        <tr key={`${row.site_id}-${row.consumable_id || 'all'}-${row.biz_date}-${index}`}>
                            <td>{row.biz_date}</td>
                            <td>{row.site_code || row.site_id}</td>
                            <td>{row.consumable_code || t('reports.all_consumables')}</td>
                            <td>{row.as_of_qty}</td>
                        </tr>
                    ))}
                    {siteDebtRows.length === 0 && (
                        <tr>
                            <td colSpan="4">{t('reports.empty')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
