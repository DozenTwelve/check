ALTER TABLE daily_returns
ADD COLUMN voided_at timestamptz;

-- 约束：如果状态是 voided，必须有 voided_at
ALTER TABLE daily_returns
ADD CONSTRAINT daily_returns_voided_check
CHECK (
    (status = 'voided' AND voided_at IS NOT NULL)
    OR (status != 'voided')
);

ALTER TABLE daily_returns
DROP CONSTRAINT IF EXISTS confirmed_logic_check;

ALTER TABLE daily_returns
ADD CONSTRAINT daily_returns_confirmed_check
CHECK (
    (status = 'confirmed' AND confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL)
    OR (status != 'confirmed')
);

-- deliveries_in_lines：同一送箱单据中，同一耗材只能出现一次
CREATE UNIQUE INDEX IF NOT EXISTS uq_deliveries_in_lines_doc_consumable
ON deliveries_in_lines (delivery_in_id, consumable_id);

-- deliveries_out_lines：同一发往现场单据中，同一耗材只能出现一次
CREATE UNIQUE INDEX IF NOT EXISTS uq_deliveries_out_lines_doc_consumable
ON deliveries_out_lines (delivery_out_id, consumable_id);

-- daily_return_lines：同一结算凭证中，同一耗材只能出现一次
CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_return_lines_doc_consumable
ON daily_return_lines (daily_return_id, consumable_id);

ALTER TABLE daily_returns
ADD CONSTRAINT daily_returns_parent_not_self
CHECK (
    parent_id IS NULL OR parent_id <> id
);

CREATE INDEX IF NOT EXISTS idx_deliveries_in_date_factory
ON deliveries_in (biz_date, factory_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_out_date_site
ON deliveries_out (biz_date, site_id);

CREATE INDEX IF NOT EXISTS idx_daily_returns_date_factory
ON daily_returns (biz_date, factory_id);

CREATE INDEX IF NOT EXISTS idx_daily_return_lines_doc
ON daily_return_lines (daily_return_id);