import React, { useState } from 'react';

function formatDateTimeInput(date = new Date()) {
    return date.toISOString().slice(0, 16);
}

export function Reports({ onRun, reportRows, factories, consumables }) {
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
