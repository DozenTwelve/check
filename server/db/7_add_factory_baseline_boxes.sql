-- Add baseline boxes to factories for initial inventory counts
ALTER TABLE factories
ADD COLUMN IF NOT EXISTS baseline_boxes integer NOT NULL DEFAULT 0;
