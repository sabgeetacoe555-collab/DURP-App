-- Fix end_time column to be nullable for backward compatibility
-- This allows PrePlay sessions to work without requiring end_time

ALTER TABLE sessions ALTER COLUMN end_time DROP NOT NULL;
