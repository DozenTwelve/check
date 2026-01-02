-- ==========================================
-- 5. Evidence Hardening and As-Of Rules
-- ==========================================

-- Add verification level to inbound/outbound records for uncertainty analysis.
ALTER TABLE deliveries_in
ADD COLUMN v_level verification_level NOT NULL DEFAULT 'verbal_only';

ALTER TABLE deliveries_out
ADD COLUMN v_level verification_level NOT NULL DEFAULT 'verbal_only';

-- Adjustments: voiding must occur at or after creation.
ALTER TABLE daily_return_adjustments
ADD CONSTRAINT daily_return_adjustments_voided_check
CHECK (voided_at IS NULL OR voided_at >= created_at);

-- Rebuild as-of function with confirmed-only default.
DROP VIEW IF EXISTS v_daily_return_balances_current;
DROP FUNCTION IF EXISTS daily_return_balances_as_of(timestamptz);

CREATE OR REPLACE FUNCTION daily_return_balances_as_of(
    p_as_of timestamptz,
    p_confirmed_only boolean DEFAULT true
)
RETURNS TABLE (
    biz_date      date,
    factory_id    bigint,
    consumable_id bigint,
    as_of_qty     integer
) AS $$
WITH valid_returns AS (
    SELECT DISTINCT ON (biz_date, factory_id)
        id, biz_date, factory_id, created_at, confirmed_at, status, voided_at
    FROM daily_returns
    WHERE
        status NOT IN ('draft', 'rejected')
        AND (
            (p_confirmed_only AND confirmed_at IS NOT NULL AND confirmed_at <= p_as_of)
            OR
            (NOT p_confirmed_only AND created_at <= p_as_of)
        )
        AND (status <> 'voided' OR voided_at > p_as_of)
        AND (
            NOT p_confirmed_only
            OR status = 'confirmed'
            OR (status = 'voided' AND confirmed_at IS NOT NULL)
        )
    ORDER BY biz_date, factory_id,
        CASE WHEN p_confirmed_only THEN confirmed_at ELSE created_at END DESC
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

CREATE OR REPLACE VIEW v_daily_return_balances_current AS
SELECT *
FROM daily_return_balances_as_of(now(), true);

-- Prevent changes to daily_returns once confirmed or voided.
CREATE OR REPLACE FUNCTION prevent_final_return_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('confirmed', 'voided') THEN
        RAISE EXCEPTION 'daily_returns is immutable once confirmed or voided';
    END IF;
    IF TG_OP = 'UPDATE' THEN
        RETURN NEW;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_returns_no_final_change ON daily_returns;
CREATE TRIGGER trg_daily_returns_no_final_change
BEFORE UPDATE OR DELETE ON daily_returns
FOR EACH ROW EXECUTE FUNCTION prevent_final_return_changes();

-- Prevent line edits once the parent return is confirmed or voided.
CREATE OR REPLACE FUNCTION prevent_return_line_changes_on_final()
RETURNS TRIGGER AS $$
DECLARE
    v_status doc_status;
BEGIN
    SELECT status INTO v_status
    FROM daily_returns
    WHERE id = COALESCE(NEW.daily_return_id, OLD.daily_return_id);

    IF v_status IN ('confirmed', 'voided') THEN
        RAISE EXCEPTION 'daily_return_lines cannot change once return is confirmed or voided';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.daily_return_id <> OLD.daily_return_id THEN
        RAISE EXCEPTION 'daily_return_lines cannot change parent return';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_return_lines_no_final_change ON daily_return_lines;
CREATE TRIGGER trg_daily_return_lines_no_final_change
BEFORE INSERT OR UPDATE OR DELETE ON daily_return_lines
FOR EACH ROW EXECUTE FUNCTION prevent_return_line_changes_on_final();

-- Prevent adjustments on voided returns.
CREATE OR REPLACE FUNCTION prevent_adjustment_on_voided_return()
RETURNS TRIGGER AS $$
DECLARE
    v_status doc_status;
BEGIN
    SELECT status INTO v_status
    FROM daily_returns
    WHERE id = NEW.daily_return_id;

    IF v_status = 'voided' THEN
        RAISE EXCEPTION 'cannot add adjustment to a voided return';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_adjustments_no_voided_return ON daily_return_adjustments;
CREATE TRIGGER trg_adjustments_no_voided_return
BEFORE INSERT ON daily_return_adjustments
FOR EACH ROW EXECUTE FUNCTION prevent_adjustment_on_voided_return();

-- Adjustments are append-only; only voided_at can change.
CREATE OR REPLACE FUNCTION prevent_adjustment_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'adjustments are append-only; void instead of deleting';
    END IF;

    IF OLD.voided_at IS NOT NULL THEN
        RAISE EXCEPTION 'voided adjustments are immutable';
    END IF;

    IF NEW.voided_at IS NULL THEN
        RAISE EXCEPTION 'adjustments are append-only; void to invalidate';
    END IF;

    IF NEW.daily_return_id <> OLD.daily_return_id
       OR NEW.created_by <> OLD.created_by
       OR NEW.created_at <> OLD.created_at
       OR NEW.note IS DISTINCT FROM OLD.note THEN
        RAISE EXCEPTION 'adjustments are append-only; only voided_at can change';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_adjustments_no_update ON daily_return_adjustments;
CREATE TRIGGER trg_adjustments_no_update
BEFORE UPDATE OR DELETE ON daily_return_adjustments
FOR EACH ROW EXECUTE FUNCTION prevent_adjustment_updates();

-- Adjustment lines are append-only and cannot change once inserted.
CREATE OR REPLACE FUNCTION prevent_adjustment_line_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_voided timestamptz;
BEGIN
    SELECT voided_at INTO v_voided
    FROM daily_return_adjustments
    WHERE id = COALESCE(NEW.adjustment_id, OLD.adjustment_id);

    IF v_voided IS NOT NULL THEN
        RAISE EXCEPTION 'cannot modify lines for a voided adjustment';
    END IF;

    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        RAISE EXCEPTION 'adjustment lines are append-only';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_adjustment_lines_no_change ON daily_return_adjustment_lines;
CREATE TRIGGER trg_adjustment_lines_no_change
BEFORE INSERT OR UPDATE OR DELETE ON daily_return_adjustment_lines
FOR EACH ROW EXECUTE FUNCTION prevent_adjustment_line_changes();
