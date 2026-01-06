-- ==========================================
-- 8. Unified Inventory Transfers (Consumable Ledger)
-- ==========================================

-- Ensure each factory has at least one site mapping.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'site_factories'
  ) THEN
    RAISE EXCEPTION 'site_factories table is required for inventory migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM factories f
    LEFT JOIN site_factories sf ON sf.factory_id = f.id
    WHERE sf.factory_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Each factory must be linked to a site before migration';
  END IF;

END $$;

DROP INDEX IF EXISTS uq_site_factories_factory;

-- Location types for inventory balances.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_location_type') THEN
    CREATE TYPE inventory_location_type AS ENUM ('global', 'factory', 'site', 'external');
  END IF;
END $$;

-- Transfer types for ledger events.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_transfer_type') THEN
    CREATE TYPE inventory_transfer_type AS ENUM (
      'initial_inventory',
      'baseline',
      'driver_trip',
      'manager_restock',
      'legacy_inbound',
      'legacy_outbound',
      'legacy_return'
    );
  END IF;
END $$;

-- Inventory locations (global, per-factory, per-site, and external sink).
CREATE TABLE IF NOT EXISTS inventory_locations (
  id bigserial PRIMARY KEY,
  location_type inventory_location_type NOT NULL,
  factory_id bigint REFERENCES factories(id) ON DELETE CASCADE,
  site_id bigint REFERENCES client_sites(id) ON DELETE CASCADE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_locations_type_check CHECK (
    (location_type = 'global' AND factory_id IS NULL AND site_id IS NULL)
    OR (location_type = 'external' AND factory_id IS NULL AND site_id IS NULL)
    OR (location_type = 'factory' AND factory_id IS NOT NULL AND site_id IS NULL)
    OR (location_type = 'site' AND site_id IS NOT NULL AND factory_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_locations_global
ON inventory_locations (location_type)
WHERE location_type = 'global';

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_locations_external
ON inventory_locations (location_type)
WHERE location_type = 'external';

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_locations_factory
ON inventory_locations (location_type, factory_id)
WHERE location_type = 'factory';

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_locations_site
ON inventory_locations (location_type, site_id)
WHERE location_type = 'site';

DROP TRIGGER IF EXISTS trg_upd_inventory_locations ON inventory_locations;
CREATE TRIGGER trg_upd_inventory_locations
BEFORE UPDATE ON inventory_locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed global + external + per-factory + per-site locations.
INSERT INTO inventory_locations (location_type, label)
SELECT 'global', 'Global Warehouse'
WHERE NOT EXISTS (SELECT 1 FROM inventory_locations WHERE location_type = 'global');

INSERT INTO inventory_locations (location_type, label)
SELECT 'external', 'External'
WHERE NOT EXISTS (SELECT 1 FROM inventory_locations WHERE location_type = 'external');

INSERT INTO inventory_locations (location_type, factory_id, label)
SELECT 'factory', f.id, f.name
FROM factories f
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_locations l
  WHERE l.location_type = 'factory' AND l.factory_id = f.id
);

INSERT INTO inventory_locations (location_type, site_id, label)
SELECT 'site', s.id, s.name
FROM client_sites s
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_locations l
  WHERE l.location_type = 'site' AND l.site_id = s.id
);

-- Preserve legacy factory baseline column for reference.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'factories' AND column_name = 'baseline_boxes'
  ) THEN
    ALTER TABLE factories RENAME COLUMN baseline_boxes TO legacy_baseline_boxes;
  END IF;
END $$;

-- Rename daily return tables to unified inventory transfer tables.
ALTER TABLE daily_returns RENAME TO inventory_transfers;
ALTER TABLE daily_return_lines RENAME TO inventory_transfer_lines;
ALTER TABLE daily_return_adjustments RENAME TO inventory_adjustments;
ALTER TABLE daily_return_adjustment_lines RENAME TO inventory_adjustment_lines;

-- Drop daily-return-specific constraints/indexes/triggers.
ALTER TABLE inventory_transfers DROP CONSTRAINT IF EXISTS daily_returns_voided_check;
ALTER TABLE inventory_transfers DROP CONSTRAINT IF EXISTS daily_returns_confirmed_check;
ALTER TABLE inventory_transfers DROP CONSTRAINT IF EXISTS daily_returns_parent_not_self;
DROP INDEX IF EXISTS idx_one_active_return_per_day;
DROP INDEX IF EXISTS idx_daily_returns_date_factory;
DROP INDEX IF EXISTS idx_daily_return_lines_doc;

DROP TRIGGER IF EXISTS trg_daily_returns_no_final_change ON inventory_transfers;
DROP TRIGGER IF EXISTS trg_daily_return_lines_no_final_change ON inventory_transfer_lines;
DROP TRIGGER IF EXISTS trg_adjustments_no_voided_return ON inventory_adjustments;
DROP TRIGGER IF EXISTS trg_adjustments_no_update ON inventory_adjustments;
DROP TRIGGER IF EXISTS trg_adjustment_lines_no_change ON inventory_adjustment_lines;

-- Rename confirmation columns for transfer approval semantics.
ALTER TABLE inventory_transfers RENAME COLUMN confirmed_by TO approved_by;
ALTER TABLE inventory_transfers RENAME COLUMN confirmed_at TO approved_at;

-- Add transfer-specific columns.
ALTER TABLE inventory_transfers
  ADD COLUMN IF NOT EXISTS from_location_id bigint REFERENCES inventory_locations(id),
  ADD COLUMN IF NOT EXISTS to_location_id bigint REFERENCES inventory_locations(id),
  ADD COLUMN IF NOT EXISTS transfer_type inventory_transfer_type,
  ADD COLUMN IF NOT EXISTS legacy_source text,
  ADD COLUMN IF NOT EXISTS legacy_source_id bigint;

-- Update existing (legacy daily_return) rows to use locations.
-- Legacy rows lack site_id; pick a deterministic site per factory.
UPDATE inventory_transfers t
SET
  from_location_id = ls.id,
  to_location_id = lf.id,
  transfer_type = 'legacy_return',
  legacy_source = COALESCE(legacy_source, 'daily_returns'),
  legacy_source_id = COALESCE(legacy_source_id, t.id)
FROM inventory_locations lf
JOIN (
  SELECT factory_id, MIN(site_id) AS site_id
  FROM site_factories
  GROUP BY factory_id
) sf ON sf.factory_id = lf.factory_id
JOIN inventory_locations ls ON ls.location_type = 'site' AND ls.site_id = sf.site_id
WHERE lf.location_type = 'factory'
  AND lf.factory_id = t.factory_id
  AND t.from_location_id IS NULL
  AND t.to_location_id IS NULL;

-- Rename transfer line columns.
ALTER TABLE inventory_transfer_lines RENAME COLUMN daily_return_id TO transfer_id;
ALTER TABLE inventory_transfer_lines RENAME COLUMN declared_qty TO qty;

-- Rename adjustment columns.
ALTER TABLE inventory_adjustments RENAME COLUMN daily_return_id TO transfer_id;

-- Remove obsolete indexes on transfer lines.
DROP INDEX IF EXISTS uq_daily_return_lines_doc_consumable;
DROP INDEX IF EXISTS uq_daily_return_adjustment_lines_adj_consumable;

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_adjustment_lines_adj_consumable
ON inventory_adjustment_lines (adjustment_id, consumable_id);

-- Enforce transfer constraints.
ALTER TABLE inventory_transfers
  ADD CONSTRAINT inventory_transfers_location_check
  CHECK (from_location_id IS NOT NULL OR to_location_id IS NOT NULL);

ALTER TABLE inventory_transfers
  ADD CONSTRAINT inventory_transfers_voided_check
  CHECK (
    (status = 'voided' AND voided_at IS NOT NULL)
    OR (status <> 'voided')
  );

ALTER TABLE inventory_transfers
  ADD CONSTRAINT inventory_transfers_approved_check
  CHECK (
    (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
    OR (status <> 'approved')
  );

-- Rebuild transfer line constraints/indexes.
ALTER TABLE inventory_transfer_lines
  DROP CONSTRAINT IF EXISTS daily_return_lines_declared_qty_check;
ALTER TABLE inventory_transfer_lines
  ADD CONSTRAINT inventory_transfer_lines_qty_check CHECK (qty >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_transfer_lines_doc_consumable
ON inventory_transfer_lines (transfer_id, consumable_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transfers_date
ON inventory_transfers (biz_date, created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_transfers_locations
ON inventory_transfers (from_location_id, to_location_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transfer_lines_doc
ON inventory_transfer_lines (transfer_id);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_doc_created
ON inventory_adjustments (transfer_id, created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_lines_adj
ON inventory_adjustment_lines (adjustment_id);

-- Migrate deliveries_in into unified transfers (legacy rows lack site_id).
INSERT INTO inventory_transfers (
  biz_date,
  from_location_id,
  to_location_id,
  created_by,
  created_at,
  status,
  approved_by,
  approved_at,
  v_level,
  note,
  transfer_type,
  legacy_source,
  legacy_source_id
)
SELECT
  d.biz_date,
  lf.id AS from_location_id,
  ls.id AS to_location_id,
  d.submitted_by AS created_by,
  d.submitted_at AS created_at,
  d.status,
  d.approved_by,
  d.approved_at,
  COALESCE(d.v_level, 'verbal_only') AS v_level,
  d.note,
  'driver_trip'::inventory_transfer_type,
  'deliveries_in',
  d.id
FROM deliveries_in d
JOIN inventory_locations lf
  ON lf.location_type = 'factory' AND lf.factory_id = d.factory_id
JOIN (
  SELECT factory_id, MIN(site_id) AS site_id
  FROM site_factories
  GROUP BY factory_id
) sf ON sf.factory_id = d.factory_id
JOIN inventory_locations ls
  ON ls.location_type = 'site' AND ls.site_id = sf.site_id;

INSERT INTO inventory_transfer_lines (transfer_id, consumable_id, qty, book_balance, discrepancy_note)
SELECT
  t.id,
  l.consumable_id,
  l.qty,
  0,
  NULL
FROM deliveries_in_lines l
JOIN inventory_transfers t
  ON t.legacy_source = 'deliveries_in'
 AND t.legacy_source_id = l.delivery_in_id;

-- Migrate deliveries_out into unified transfers (platform -> external).
INSERT INTO inventory_transfers (
  biz_date,
  from_location_id,
  to_location_id,
  created_by,
  created_at,
  status,
  approved_by,
  approved_at,
  v_level,
  note,
  transfer_type,
  legacy_source,
  legacy_source_id
)
SELECT
  d.biz_date,
  ls.id AS from_location_id,
  le.id AS to_location_id,
  d.recorded_by AS created_by,
  d.recorded_at AS created_at,
  'approved'::doc_status,
  d.recorded_by,
  d.recorded_at,
  COALESCE(d.v_level, 'verbal_only') AS v_level,
  d.note,
  'legacy_outbound'::inventory_transfer_type,
  'deliveries_out',
  d.id
FROM deliveries_out d
JOIN inventory_locations ls
  ON ls.location_type = 'site' AND ls.site_id = d.site_id
JOIN inventory_locations le
  ON le.location_type = 'external';

INSERT INTO inventory_transfer_lines (transfer_id, consumable_id, qty, book_balance, discrepancy_note)
SELECT
  t.id,
  l.consumable_id,
  l.qty,
  0,
  NULL
FROM deliveries_out_lines l
JOIN inventory_transfers t
  ON t.legacy_source = 'deliveries_out'
 AND t.legacy_source_id = l.delivery_out_id;

-- Remove legacy delivery tables.
DROP TABLE IF EXISTS deliveries_in_lines;
DROP TABLE IF EXISTS deliveries_in;
DROP TABLE IF EXISTS deliveries_out_lines;
DROP TABLE IF EXISTS deliveries_out;

-- Drop factory_id from transfers now that locations are set.
ALTER TABLE inventory_transfers DROP COLUMN factory_id;

-- Inventory transfer immutability rules (approved/voided).
CREATE OR REPLACE FUNCTION prevent_final_transfer_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('approved', 'voided') THEN
    RAISE EXCEPTION 'inventory_transfers is immutable once approved or voided';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_transfers_no_final_change ON inventory_transfers;
CREATE TRIGGER trg_inventory_transfers_no_final_change
BEFORE UPDATE OR DELETE ON inventory_transfers
FOR EACH ROW EXECUTE FUNCTION prevent_final_transfer_changes();

CREATE OR REPLACE FUNCTION prevent_transfer_line_changes_on_final()
RETURNS TRIGGER AS $$
DECLARE
  v_status doc_status;
BEGIN
  SELECT status INTO v_status
  FROM inventory_transfers
  WHERE id = COALESCE(NEW.transfer_id, OLD.transfer_id);

  IF v_status IN ('approved', 'voided') THEN
    RAISE EXCEPTION 'inventory_transfer_lines cannot change once transfer is approved or voided';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.transfer_id <> OLD.transfer_id THEN
    RAISE EXCEPTION 'inventory_transfer_lines cannot change parent transfer';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_transfer_lines_no_final_change ON inventory_transfer_lines;
CREATE TRIGGER trg_inventory_transfer_lines_no_final_change
BEFORE INSERT OR UPDATE OR DELETE ON inventory_transfer_lines
FOR EACH ROW EXECUTE FUNCTION prevent_transfer_line_changes_on_final();

CREATE OR REPLACE FUNCTION prevent_adjustment_on_voided_transfer()
RETURNS TRIGGER AS $$
DECLARE
  v_status doc_status;
BEGIN
  SELECT status INTO v_status
  FROM inventory_transfers
  WHERE id = NEW.transfer_id;

  IF v_status = 'voided' THEN
    RAISE EXCEPTION 'cannot add adjustment to a voided transfer';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_adjustments_no_voided_transfer ON inventory_adjustments;
CREATE TRIGGER trg_inventory_adjustments_no_voided_transfer
BEFORE INSERT ON inventory_adjustments
FOR EACH ROW EXECUTE FUNCTION prevent_adjustment_on_voided_transfer();

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

  IF NEW.transfer_id <> OLD.transfer_id
     OR NEW.created_by <> OLD.created_by
     OR NEW.created_at <> OLD.created_at
     OR NEW.note IS DISTINCT FROM OLD.note THEN
    RAISE EXCEPTION 'adjustments are append-only; only voided_at can change';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_adjustments_no_update ON inventory_adjustments;
CREATE TRIGGER trg_inventory_adjustments_no_update
BEFORE UPDATE OR DELETE ON inventory_adjustments
FOR EACH ROW EXECUTE FUNCTION prevent_adjustment_updates();

CREATE OR REPLACE FUNCTION prevent_adjustment_line_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_voided timestamptz;
BEGIN
  SELECT voided_at INTO v_voided
  FROM inventory_adjustments
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

DROP TRIGGER IF EXISTS trg_inventory_adjustment_lines_no_change ON inventory_adjustment_lines;
CREATE TRIGGER trg_inventory_adjustment_lines_no_change
BEFORE INSERT OR UPDATE OR DELETE ON inventory_adjustment_lines
FOR EACH ROW EXECUTE FUNCTION prevent_adjustment_line_changes();

-- Replace daily_return balance views with inventory balances.
DROP VIEW IF EXISTS v_daily_return_balances_current;
DROP FUNCTION IF EXISTS daily_return_balances_as_of(timestamptz, boolean);
DROP FUNCTION IF EXISTS daily_return_balances_as_of(timestamptz);

CREATE OR REPLACE FUNCTION inventory_balances_as_of(
  p_as_of timestamptz,
  p_approved_only boolean DEFAULT true
)
RETURNS TABLE (
  location_id bigint,
  consumable_id bigint,
  as_of_qty integer
) AS $$
WITH valid_transfers AS (
  SELECT id, from_location_id, to_location_id, created_at, approved_at, status, voided_at
  FROM inventory_transfers
  WHERE
    status NOT IN ('draft', 'rejected')
    AND (
      (p_approved_only AND approved_at IS NOT NULL AND approved_at <= p_as_of)
      OR
      (NOT p_approved_only AND created_at <= p_as_of)
    )
    AND (status <> 'voided' OR voided_at > p_as_of)
),
base_lines AS (
  SELECT
    t.from_location_id,
    t.to_location_id,
    l.consumable_id,
    l.qty::integer AS qty
  FROM valid_transfers t
  JOIN inventory_transfer_lines l ON l.transfer_id = t.id
),
adjust_lines AS (
  SELECT
    t.from_location_id,
    t.to_location_id,
    l.consumable_id,
    l.delta_qty::integer AS qty
  FROM valid_transfers t
  JOIN inventory_adjustments a
    ON a.transfer_id = t.id
   AND a.created_at <= p_as_of
   AND (a.voided_at IS NULL OR a.voided_at > p_as_of)
  JOIN inventory_adjustment_lines l ON l.adjustment_id = a.id
),
rollup AS (
  SELECT from_location_id AS location_id, consumable_id, -qty AS delta
  FROM base_lines
  WHERE from_location_id IS NOT NULL
  UNION ALL
  SELECT to_location_id AS location_id, consumable_id, qty AS delta
  FROM base_lines
  WHERE to_location_id IS NOT NULL
  UNION ALL
  SELECT from_location_id AS location_id, consumable_id, -qty AS delta
  FROM adjust_lines
  WHERE from_location_id IS NOT NULL
  UNION ALL
  SELECT to_location_id AS location_id, consumable_id, qty AS delta
  FROM adjust_lines
  WHERE to_location_id IS NOT NULL
)
SELECT location_id, consumable_id, SUM(delta)::integer AS as_of_qty
FROM rollup
GROUP BY location_id, consumable_id
ORDER BY location_id, consumable_id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE VIEW v_inventory_balances_current AS
SELECT * FROM inventory_balances_as_of(now(), true);
