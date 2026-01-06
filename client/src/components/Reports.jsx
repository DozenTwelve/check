import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

function formatDateTimeInput(date = new Date()) {
    return date.toISOString().slice(0, 16);
}

export function Reports({ onRun, reportRows, factories, consumables }) {
    const { t } = useTranslation();
    const [asOf, setAsOf] = useState(formatDateTimeInput());
    const [confirmedOnly, setConfirmedOnly] = useState(true);
    const [locationType, setLocationType] = useState('factory');

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
        </div>
    );
}
