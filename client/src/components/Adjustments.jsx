import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

export function Adjustments({ userId, dailyReturns, consumables, onCreated, onNotice }) {
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
