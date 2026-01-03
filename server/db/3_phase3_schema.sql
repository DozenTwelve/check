-- Phase 3: Manager Workflow

-- 1. Add status to daily_outbound for approval workflow
ALTER TABLE daily_outbound ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. Platform Returns (Hub Receipt)
CREATE TABLE platform_returns (
    id            bigserial PRIMARY KEY,
    biz_date      date NOT NULL,
    manager_id    bigint NOT NULL REFERENCES users(id),
    quantity      integer NOT NULL CHECK (quantity >= 0),
    note          text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_upd_platform_returns BEFORE UPDATE ON platform_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Factory Restocks (Distribution)
CREATE TYPE restock_status AS ENUM ('dispatched', 'received');

CREATE TABLE factory_restocks (
    id            bigserial PRIMARY KEY,
    biz_date      date NOT NULL,
    factory_id    bigint NOT NULL REFERENCES factories(id),
    driver_id     bigint REFERENCES users(id), -- Optional, might just assign to factory generally
    manager_id    bigint NOT NULL REFERENCES users(id), -- Sender
    quantity      integer NOT NULL CHECK (quantity > 0),
    status        restock_status NOT NULL DEFAULT 'dispatched',
    note          text,
    
    receiver_id   bigint REFERENCES users(id), -- Driver or Clerk who confirms
    received_at   timestamptz,
    
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_upd_factory_restocks BEFORE UPDATE ON factory_restocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
