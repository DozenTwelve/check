import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

function formatDateTimeInput(date = new Date()) {
    return date.toISOString().slice(0, 16);
}

export function Reports({ onRun, reportRows, factories, consumables }) {
    const { t } = useTranslation();
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
                    <label className="label">{t('reports.run_btn')}</label>
                    <button
                        className="button"
                        type="button"
                        onClick={() => onRun(new Date(asOf).toISOString(), confirmedOnly)}
                    >
                        {t('reports.run_btn')}
                    </button>
                </div>
            </div>

            <div className="divider"></div>

            <table className="table">
                <thead>
                    <tr>
                        <th>{t('reports.table.biz_date')}</th>
                        <th>{t('reports.table.factory')}</th>
                        <th>{t('reports.table.consumable')}</th>
                        <th>{t('reports.table.qty')}</th>
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
                            <td colSpan="4">{t('reports.empty')}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
