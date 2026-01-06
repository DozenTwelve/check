import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';

export function Adjustments({ userId, dailyReturns, consumables, onCreated, onNotice }) {
    const { t } = useTranslation();
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

            await apiFetch(`/transfers/${dailyReturnId}/adjustments`, {
                method: 'POST',
                body: payload,
                userId
            });

            onNotice({ type: 'success', text: t('notices.adjustment_success') });
            setNote('');
            setLines([{ consumable_id: '', delta_qty: '', reason: '' }]);
            onCreated();
        } catch (err) {
            onNotice({ type: 'error', text: t('notices.adjustment_error') });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                <div>
                    <label className="label">{t('adjustments.daily_return')}</label>
                    <select
                        className="select"
                        value={dailyReturnId}
                        onChange={(event) => setDailyReturnId(event.target.value)}
                    >
                        <option value="">{t('adjustments.select_return')}</option>
                        {dailyReturns.map((doc) => (
                            <option key={doc.id} value={doc.id}>
                                #{doc.id} — {doc.biz_date} ({doc.transfer_type})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="label">{t('adjustments.note')}</label>
                    <input
                        className="input"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                    />
                </div>
            </div>

            <div className="divider"></div>
            <h3 className="section-title">{t('adjustments.lines_title')}</h3>

            {lines.map((line, index) => (
                <div className="row" key={`adj-${index}`}>
                    <div>
                        <label className="label">{t('adjustments.consumable')}</label>
                        <select
                            className="select"
                            value={line.consumable_id}
                            onChange={(event) => updateLine(index, 'consumable_id', event.target.value)}
                        >
                            <option value="">{t('daily_return.form.select_consumable')}</option>
                            {consumables.map((consumable) => (
                                <option key={consumable.id} value={consumable.id}>
                                    {consumable.code} - {consumable.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">{t('adjustments.delta_qty')}</label>
                        <input
                            className="input"
                            type="number"
                            value={line.delta_qty}
                            onChange={(event) => updateLine(index, 'delta_qty', event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">{t('adjustments.reason')}</label>
                        <input
                            className="input"
                            value={line.reason}
                            onChange={(event) => updateLine(index, 'reason', event.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">{t('adjustments.remove')}</label>
                        <button
                            className="button secondary"
                            type="button"
                            onClick={() => removeLine(index)}
                            disabled={lines.length === 1}
                        >
                            {t('adjustments.remove')}
                        </button>
                    </div>
                </div>
            ))}

            <div className="divider"></div>
            <button className="button" type="button" onClick={addLine}>
                {t('adjustments.add_line')}
            </button>
            <button className="button" type="submit" disabled={submitting}>
                {submitting ? t('adjustments.saving') : t('adjustments.submit')}
            </button>
        </form>
    );
}
