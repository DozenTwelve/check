-- ==========================================
-- 3. Incremental Adjustments for Rolling Ledger
-- ==========================================

-- Adjustments: append-only corrections to a daily return
CREATE TABLE daily_return_adjustments (
    id              bigserial PRIMARY KEY,
    daily_return_id bigint NOT NULL REFERENCES daily_returns(id) ON DELETE RESTRICT,
    created_by      bigint NOT NULL REFERENCES users(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    note            text,
    voided_at       timestamptz
);

-- Adjustment lines: deltas (can be negative)
CREATE TABLE daily_return_adjustment_lines (
    id            bigserial PRIMARY KEY,
    adjustment_id bigint NOT NULL REFERENCES daily_return_adjustments(id) ON DELETE RESTRICT,
    consumable_id bigint NOT NULL REFERENCES consumables(id),
    delta_qty     integer NOT NULL CHECK (delta_qty <> 0),
    reason        text
);

-- One consumable per adjustment
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_return_adjustment_lines_adj_consumable
ON daily_return_adjustment_lines (adjustment_id, consumable_id);

-- Query support
CREATE INDEX IF NOT EXISTS idx_daily_return_adjustments_doc_created
ON daily_return_adjustments (daily_return_id, created_at);

CREATE INDEX IF NOT EXISTS idx_daily_return_adjustment_lines_adj
ON daily_return_adjustment_lines (adjustment_id);
