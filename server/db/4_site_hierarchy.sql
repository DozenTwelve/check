-- Phase 3.5: Site Hierarchy

-- 1. Link Factories to Sites
ALTER TABLE factories ADD COLUMN site_id bigint REFERENCES client_sites(id);

-- 2. Link Users (Managers) to Sites
ALTER TABLE users ADD COLUMN site_id bigint REFERENCES client_sites(id);

-- (Optional) Update constraints if needed in future, but for now allow nulls for backward comp
