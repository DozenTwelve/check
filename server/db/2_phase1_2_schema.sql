-- Phase 1: Driver Trips
CREATE TYPE trip_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE return_trips (
    id            bigserial PRIMARY KEY,
    biz_date      date NOT NULL,
    factory_id    bigint NOT NULL REFERENCES factories(id),
    driver_id     bigint NOT NULL REFERENCES users(id),
    quantity      integer NOT NULL CHECK (quantity > 0),
    status        trip_status NOT NULL DEFAULT 'pending',
    note          text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_upd_return_trips BEFORE UPDATE ON return_trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Phase 2: Clerk Daily Outbound
CREATE TABLE daily_outbound (
    id            bigserial PRIMARY KEY,
    biz_date      date NOT NULL,
    factory_id    bigint NOT NULL REFERENCES factories(id),
    clerk_id      bigint NOT NULL REFERENCES users(id),
    quantity      integer NOT NULL CHECK (quantity >= 0),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE(biz_date, factory_id) -- One entry per day per factory
);

CREATE TRIGGER trg_upd_daily_outbound BEFORE UPDATE ON daily_outbound FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
