-- ==========================================
-- 4. As-of Balances (Rolling Ledger Query)
-- ==========================================

-- Computes balances per day/factory/consumable as of a timestamp.
-- Uses the latest valid daily_return for each day/factory and applies
-- all non-voided adjustments recorded at or before the timestamp.
CREATE OR REPLACE FUNCTION daily_return_balances_as_of(p_as_of timestamptz)
RETURNS TABLE (
    biz_date      date,
    factory_id    bigint,
    consumable_id bigint,
    as_of_qty     integer
) AS $$
WITH valid_returns AS (
    SELECT DISTINCT ON (biz_date, factory_id)
        id, biz_date, factory_id
    FROM daily_returns
    WHERE created_at <= p_as_of
      AND status NOT IN ('draft', 'rejected')
      AND (status <> 'voided' OR voided_at > p_as_of)
    ORDER BY biz_date, factory_id, created_at DESC
),
rollup AS (
    SELECT
        vr.biz_date,
        vr.factory_id,
        l.consumable_id,
        l.declared_qty::integer AS qty
    FROM valid_returns vr
    JOIN daily_return_lines l ON l.daily_return_id = vr.id
    UNION ALL
    SELECT
        vr.biz_date,
        vr.factory_id,
        l.consumable_id,
        l.delta_qty::integer AS qty
    FROM valid_returns vr
    JOIN daily_return_adjustments a
      ON a.daily_return_id = vr.id
     AND a.created_at <= p_as_of
     AND (a.voided_at IS NULL OR a.voided_at > p_as_of)
    JOIN daily_return_adjustment_lines l ON l.adjustment_id = a.id
)
SELECT
    biz_date,
    factory_id,
    consumable_id,
    SUM(qty)::integer AS as_of_qty
FROM rollup
GROUP BY biz_date, factory_id, consumable_id
ORDER BY biz_date, factory_id, consumable_id;
$$ LANGUAGE sql STABLE;

-- Convenience view for "current" balances.
CREATE OR REPLACE VIEW v_daily_return_balances_current AS
SELECT *
FROM daily_return_balances_as_of(now());
