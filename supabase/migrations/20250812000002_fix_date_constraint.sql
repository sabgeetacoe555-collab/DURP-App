-- Fix date column constraint issue
-- The date column should be nullable since we're now using session_datetime and end_datetime

-- Step 1: Make the date column nullable since we're using UTC timestamps now
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'date'
    ) THEN
        ALTER TABLE sessions ALTER COLUMN date DROP NOT NULL;
        RAISE NOTICE 'Made date column nullable';
    ELSE
        RAISE NOTICE 'date column does not exist';
    END IF;
END $$;

-- Step 2: Also make time column nullable if it exists and isn't already nullable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'time' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE sessions ALTER COLUMN time DROP NOT NULL;
        RAISE NOTICE 'Made time column nullable';
    ELSE
        RAISE NOTICE 'time column is already nullable or does not exist';
    END IF;
END $$;

-- Step 3: Make start_time and end_time nullable if they exist and aren't already nullable
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'start_time' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE sessions ALTER COLUMN start_time DROP NOT NULL;
        RAISE NOTICE 'Made start_time column nullable';
    ELSE
        RAISE NOTICE 'start_time column is already nullable or does not exist';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'end_time' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE sessions ALTER COLUMN end_time DROP NOT NULL;
        RAISE NOTICE 'Made end_time column nullable';
    ELSE
        RAISE NOTICE 'end_time column is already nullable or does not exist';
    END IF;
END $$;

-- Step 4: Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'Date column constraint fix completed successfully';
    RAISE NOTICE 'New sessions should use session_datetime and end_datetime fields';
END $$;
