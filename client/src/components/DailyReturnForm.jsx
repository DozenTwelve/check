import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const verificationLevels = [
    { value: 'verbal_only', label: 'Verbal only' },
    { value: 'visual_estimate', label: 'Visual estimate' },
    { value: 'full_count', label: 'Full count' },
    { value: 'factory_directive', label: 'Factory directive' }
];

function formatDateInput(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

export function DailyReturnForm({ user, userId, factories, consumables, onCreated, onNotice }) {
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
