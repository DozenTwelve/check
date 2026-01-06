-- Add admin_adjustment transfer type for inventory corrections.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_transfer_type') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'inventory_transfer_type'
        AND e.enumlabel = 'admin_adjustment'
    ) THEN
      ALTER TYPE inventory_transfer_type ADD VALUE 'admin_adjustment';
    END IF;
  END IF;
END $$;
