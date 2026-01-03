-- Phase 3.6: M:N Site Hierarchy

-- 1. Create Junction Table
CREATE TABLE site_factories (
    site_id bigint NOT NULL REFERENCES client_sites(id),
    factory_id bigint NOT NULL REFERENCES factories(id),
    PRIMARY KEY (site_id, factory_id)
);

-- 2. Migrate existing 1:1 data (if any) to N:N (best effort)
INSERT INTO site_factories (site_id, factory_id)
SELECT site_id, id FROM factories WHERE site_id IS NOT NULL;

-- 3. Remove column from factories (Clean up)
ALTER TABLE factories DROP COLUMN site_id;

-- 4. Add site_id to trips (Drivers must specify destination)
ALTER TABLE return_trips ADD COLUMN site_id bigint REFERENCES client_sites(id);

-- 5. Note: Drivers will need to select the site if their factory has multiple.
